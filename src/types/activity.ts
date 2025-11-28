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

export interface ActivityData {
  id: string;
  title: string;
  audioSrc: string;
  noiseSrc?: string;
  transcript?: string;
  questions: Question[];
}