import { useState, useEffect } from 'react';
import { useSNRMixer } from '@/hooks/useSNRMixer';
import { supabase } from '@/lib/supabase';
import { Play, Square, Volume2 } from 'lucide-react';

/**
 * SNR Mixer Test Page
 *
 * Demonstrates the Web Audio API mixer with:
 * - Speech audio (word pair)
 * - Background noise (babble/restaurant)
 * - Dynamic SNR slider
 *
 * Clinical Context:
 * - Easy: +15 dB (speech much louder than noise)
 * - Moderate: +5 dB (typical conversation)
 * - Hard: 0 dB (speech and noise equal)
 * - Very Hard: -5 dB (noise louder than speech)
 */

export function SNRMixerTest() {
  const [speechUrl, setSpeechUrl] = useState<string>('');
  const [noiseUrl, setNoiseUrl] = useState<string>('');
  const [targetSNR, setTargetSNR] = useState(10);

  const { isPlaying, isLoading, error, snr, play, stop, setSNR } = useSNRMixer({
    speechUrl,
    noiseUrl,
    initialSNR: 10,
    loopSpeech: true, // Loop for continuous testing
  });

  // Fetch a sample word and clinical babble from database
  useEffect(() => {
    const fetchAudio = async () => {
      // Get first word pair
      const { data: wordPairs } = await supabase
        .from('word_pairs')
        .select('audio_1_path_sarah')
        .limit(1);

      if (wordPairs && wordPairs[0]) {
        setSpeechUrl(wordPairs[0].audio_1_path_sarah);
      }

      // Get clinical babble from noise_assets
      const { data: noiseAssets } = await supabase
        .from('noise_assets')
        .select('storage_url, name')
        .eq('name', 'babble_6talker_clinical')
        .single();

      if (noiseAssets) {
        setNoiseUrl(noiseAssets.storage_url);
      }
    };

    fetchAudio();
  }, []);

  const handlePlay = () => {
    if (isPlaying) {
      stop();
    } else {
      play();
    }
  };

  const handleSNRChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newSNR = parseFloat(e.target.value);
    setTargetSNR(newSNR);
    setSNR(newSNR);
  };

  const getDifficultyLabel = (snrValue: number): string => {
    if (snrValue >= 15) return 'Very Easy';
    if (snrValue >= 10) return 'Easy';
    if (snrValue >= 5) return 'Moderate';
    if (snrValue >= 0) return 'Hard';
    return 'Very Hard';
  };

  const getDifficultyColor = (snrValue: number): string => {
    if (snrValue >= 15) return 'text-green-600';
    if (snrValue >= 10) return 'text-blue-600';
    if (snrValue >= 5) return 'text-yellow-600';
    if (snrValue >= 0) return 'text-orange-600';
    return 'text-red-600';
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
            SNR Mixer Test
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Test the Signal-to-Noise Ratio mixing with speech + background noise
          </p>
        </div>

        {/* Status Card */}
        <div className="bg-white dark:bg-slate-900 rounded-lg shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Volume2 className="text-purple-500" size={24} />
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Current SNR</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">
                  {snr.toFixed(1)} dB
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-slate-600 dark:text-slate-400">Difficulty</p>
              <p className={`text-lg font-semibold ${getDifficultyColor(snr)}`}>
                {getDifficultyLabel(snr)}
              </p>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded mb-4">
              {error}
            </div>
          )}

          {/* Play Button */}
          <button
            onClick={handlePlay}
            disabled={isLoading || !speechUrl}
            className={`w-full py-4 rounded-lg font-semibold text-white transition-all flex items-center justify-center gap-2 ${
              isPlaying
                ? 'bg-red-500 hover:bg-red-600'
                : 'bg-purple-500 hover:bg-purple-600'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {isLoading ? (
              'Loading...'
            ) : isPlaying ? (
              <>
                <Square size={20} fill="currentColor" />
                Stop
              </>
            ) : (
              <>
                <Play size={20} fill="currentColor" />
                Play with Background Noise
              </>
            )}
          </button>
        </div>

        {/* SNR Slider */}
        <div className="bg-white dark:bg-slate-900 rounded-lg shadow-lg p-6">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
            Adjust Difficulty (SNR)
          </h2>

          <div className="space-y-4">
            <input
              type="range"
              min="-5"
              max="20"
              step="1"
              value={targetSNR}
              onChange={handleSNRChange}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-purple-500"
            />

            <div className="flex justify-between text-xs text-slate-600 dark:text-slate-400">
              <span>-5 dB<br/>(Very Hard)</span>
              <span>0 dB<br/>(Hard)</span>
              <span>+5 dB<br/>(Moderate)</span>
              <span>+10 dB<br/>(Easy)</span>
              <span>+15 dB<br/>(Very Easy)</span>
            </div>
          </div>

          {/* Clinical Context */}
          <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <p className="text-sm text-blue-900 dark:text-blue-300">
              <strong>Clinical Note:</strong> Cochlear implant users typically need +5 to +15 dB SNR
              for 80% comprehension in noise. As performance improves, the Smart Coach will gradually
              reduce SNR to build real-world listening skills.
            </p>
          </div>
        </div>

        {/* Technical Info */}
        <div className="mt-6 p-4 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs font-mono">
          <p className="text-slate-600 dark:text-slate-400 mb-2">Debug Info:</p>
          <p className="text-slate-700 dark:text-slate-300">Speech: {speechUrl ? '✓ Loaded from database' : '✗ Missing'}</p>
          <p className="text-slate-700 dark:text-slate-300">Noise: {noiseUrl ? '✓ Clinical babble (6-talker)' : '✗ Missing'}</p>
          <p className="text-slate-700 dark:text-slate-300">Web Audio API: {window.AudioContext ? '✓ Supported' : '✗ Not Supported'}</p>
          <p className="text-slate-700 dark:text-slate-300 mt-2">Mixing: Real-time SNR adjustment</p>
          <p className="text-slate-700 dark:text-slate-300">Method: Speech Synthesis (not SFX)</p>
        </div>
      </div>
    </div>
  );
}
