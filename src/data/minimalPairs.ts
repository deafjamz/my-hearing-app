import { ActivityData } from '@/types/activity';

export interface MinimalPair {
  id: string;
  word1: string;
  word2: string;
  contrast: string; // e.g., 'P/B' (Voicing), 'S/Sh' (Fricatives)
}

export const minimalPairs: MinimalPair[] = [
  { id: 'mp-1', word1: 'Pear', word2: 'Bear', contrast: 'Voicing (P/B)' },
  { id: 'mp-2', word1: 'Pie', word2: 'Buy', contrast: 'Voicing (P/B)' },
  { id: 'mp-3', word1: 'Pat', word2: 'Bat', contrast: 'Voicing (P/B)' },
  { id: 'mp-4', word1: 'Time', word2: 'Dime', contrast: 'Voicing (T/D)' },
  { id: 'mp-5', word1: 'Toe', word2: 'Doe', contrast: 'Voicing (T/D)' },
  { id: 'mp-6', word1: 'Coat', word2: 'Goat', contrast: 'Voicing (K/G)' },
  { id: 'mp-7', word1: 'Class', word2: 'Glass', contrast: 'Voicing (K/G)' },
  { id: 'mp-8', word1: 'Fan', word2: 'Van', contrast: 'Voicing (F/V)' },
  { id: 'mp-9', word1: 'Safe', word2: 'Save', contrast: 'Voicing (F/V)' },
  { id: 'mp-10', word1: 'Sip', word2: 'Zip', contrast: 'Voicing (S/Z)' },
];

// Helper to generate ActivityData from a minimal pair
export function createMinimalPairActivity(pair: MinimalPair, voiceId: string = 'sarah'): ActivityData {
  // Randomly choose which word is the "target"
  const isWord1Target = Math.random() > 0.5;
  const targetWord = isWord1Target ? pair.word1 : pair.word2;
  const distractorWord = isWord1Target ? pair.word2 : pair.word1;
  
  const filename = targetWord.toLowerCase() + '.mp3';
  
  // Map voiceId to folder. Default to 'sarah_audio' if uncertain, as it has the most complete set.
  let folder = 'sarah_audio';
  if (voiceId === 'marcus') folder = 'marcus_audio';
  if (voiceId === 'david') folder = 'male_audio'; // Fallback mapping, verify if files exist here
  if (voiceId === 'emma') folder = 'female_audio'; // Fallback mapping

  // Note: Based on file check, 'sarah_audio' and 'marcus_audio' definitely have the files.
  // 'male_audio' and 'female_audio' might not. For safety, force sarah/marcus for now if assets missing.
  if (voiceId !== 'marcus' && voiceId !== 'sarah') {
      // For now, default to Sarah for safety to prevent 404s until other voices are generated
      folder = 'sarah_audio'; 
  }

  const choices = [
    { id: 'c1', text: targetWord, isCorrect: true },
    { id: 'c2', text: distractorWord, isCorrect: false }
  ];

  // Shuffle choices
  for (let i = choices.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [choices[i], choices[j]] = [choices[j], choices[i]];
  }

  return {
    id: `activity-${pair.id}-${targetWord}`,
    title: `Minimal Pair: ${pair.word1} vs ${pair.word2}`,
    audioSrc: `/hearing-rehab-audio/${folder}/${filename}`,
    transcript: `Listen carefully. Which word do you hear?`,
    questions: [
      {
        id: 'q1',
        text: 'Which word did you hear?',
        choices: choices,
        feedback: `The difference is in the ${pair.contrast}.`
      }
    ]
  };
}