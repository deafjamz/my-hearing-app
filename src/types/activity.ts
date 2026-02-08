export interface Choice {
  id: string;
  text: string;
  isCorrect: boolean;
}

export interface Question {
  id: string;
  text: string;
  choices: Choice[];
  feedback?: string; // Optional educational feedback
}

// Updated to match the actual API response we are seeing
export interface AlignmentData {
  characters: string[];
  character_start_times_seconds: number[];
  character_end_times_seconds: number[];
}

export interface ActivityData {
  id: string;
  title: string;
  audioSrc: string;
  noiseSrc?: string;
  transcript?: string;
  questions: Question[];
  tier?: 'free' | 'standard' | 'premium';
}

export interface ScenarioItem {
  id: string;
  speaker: string;
  text: string;
  difficulty: string;
  audio_path?: string;
}

export interface Scenario {
  id: string;
  title: string;
  difficulty: string;
  description: string;
  items: ScenarioItem[];
  ambience_path?: string;
  tier?: 'free' | 'standard' | 'premium';
}

export type content_tier = 'free' | 'standard' | 'premium';