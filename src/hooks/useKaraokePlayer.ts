import { useState, useEffect, useRef, useCallback } from 'react';

// Define the structure of the alignment data from ElevenLabs
interface AlignmentData {
  characters: string[];
  character_start_times_seconds: number[];
  character_end_times_seconds: number[];
}

// Define the state returned by the hook
interface KaraokePlayerState {
  isPlaying: boolean;
  isLoading: boolean;
  error: string | null;
  words: string[];
  activeWordIndex: number;
  play: () => void;
  pause: () => void;
  togglePlay: () => void;
}

// Utility function to process the raw alignment data
const processAlignmentData = (data: AlignmentData): { words: string[]; boundaries: { start: number; end: number }[] } => {
  if (!data || !data.characters || data.characters.length === 0) {
    return { words: [], boundaries: [] };
  }

  const words: string[] = [];
  const boundaries: { start: number; end: number }[] = [];
  let currentWord = '';
  let wordStartTime = 0;

  data.characters.forEach((char, index) => {
    if (currentWord === '' && char !== ' ') {
      // Start of a new word
      wordStartTime = data.character_start_times_seconds[index];
    }

    currentWord += char;

    if (char === ' ') {
      // End of a word
      if (currentWord.trim() !== '') {
        words.push(currentWord.trim());
        const wordEndTime = data.character_end_times_seconds[index - 1]; // End time of the last char before space
        boundaries.push({ start: wordStartTime, end: wordEndTime });
      }
      currentWord = '';
    }
  });

  // Add the last word if the transcript doesn't end with a space
  if (currentWord.trim() !== '') {
    words.push(currentWord.trim());
    const lastCharIndex = data.characters.length - 1;
    const wordEndTime = data.character_end_times_seconds[lastCharIndex];
    boundaries.push({ start: wordStartTime, end: wordEndTime });
  }

  return { words, boundaries };
};


// The custom hook
export const useKaraokePlayer = (
  audioSrc?: string,
  alignmentSrc?: string,
  { onEnded }: { onEnded?: () => void } = {}
): KaraokePlayerState => {
  const [words, setWords] = useState<string[]>([]);
  const [wordBoundaries, setWordBoundaries] = useState<{ start: number; end: number }[]>([]);
  const [activeWordIndex, setActiveWordIndex] = useState(-1);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  // 1. Fetch and Parse Alignment Data
  useEffect(() => {
    if (!alignmentSrc) {
        setIsLoading(false);
        return;
    };

    setIsLoading(true);
    setError(null);

    fetch(alignmentSrc)
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch alignment data');
        return res.json();
      })
      .then((data: AlignmentData) => {
        const { words: processedWords, boundaries } = processAlignmentData(data);
        setWords(processedWords);
        setWordBoundaries(boundaries);
      })
      .catch(err => {
        console.error("Alignment Error:", err);
        setError("Could not load story alignment.");
      })
      .finally(() => setIsLoading(false));
  }, [alignmentSrc]);

  // 2. Setup Audio Element and Listeners
  useEffect(() => {
    if (!audioSrc) return;

    // Create or update the audio element
    if (!audioRef.current) {
      audioRef.current = new Audio(audioSrc);
    } else if (audioRef.current.src !== audioSrc) {
      audioRef.current.src = audioSrc;
    }
    const audio = audioRef.current;

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleEnded = () => {
      setIsPlaying(false);
      setActiveWordIndex(-1);
      onEnded?.(); // Call the provided onEnded callback
    };
    const handleError = () => setError('Failed to play audio.');
    const handleTimeUpdate = () => {
      const currentTime = audio.currentTime;

      const currentIndex = wordBoundaries.findIndex(
        boundary => currentTime >= boundary.start && currentTime < boundary.end
      );

      setActiveWordIndex(currentIndex);
    };

    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);
    audio.addEventListener('timeupdate', handleTimeUpdate);

    // Cleanup function
    return () => {
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.pause();
    };
  }, [audioSrc, wordBoundaries, onEnded]);

  // 3. Playback Controls
  const play = useCallback(() => {
    audioRef.current?.play().catch(() => setError("Playback was interrupted."));
  }, []);

  const pause = useCallback(() => {
    audioRef.current?.pause();
  }, []);

  const togglePlay = useCallback(() => {
    if (isPlaying) {
      pause();
    } else {
      play();
    }
  }, [isPlaying, play, pause]);


  return {
    isPlaying,
    isLoading: isLoading || (isPlaying && !audioRef.current?.duration),
    error,
    words,
    activeWordIndex,
    play,
    pause,
    togglePlay,
  };
};
