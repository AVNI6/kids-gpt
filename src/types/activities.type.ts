import { type LucideIcon } from "lucide-react";

export type ActivitySlug =
  | "flashcards"
  | "quizzes"
  | "logic-puzzles"
  | "word-scrambles"
  | "math-challenges"
  | "science-lab"
  | "memory-match"
  | "match-following";

export interface KidActivity {
  id: number;
  slug: ActivitySlug;
  href: string;
  title: string;
  description: string;
  icon: LucideIcon;
  color: "sky" | "green" | "orange" | "purple" | "pink" | "slate";
  badge?: string;
  xp?: string;
  duration?: string;
  stars?: number;
  users?: string[];
  steps: string[];
}

// Flashcard Item Content
export interface FlashcardItem {
  question: string;
  answer: string;
  fact: string;
}

export interface FlashcardActivityContent {
  flashcards: FlashcardItem[];
}

// Quiz Question Content
export interface QuizOptionItem {
  label: string;
  correct: boolean;
}

export interface QuizQuestionItem {
  question: string;
  options: QuizOptionItem[];
  feedback: string;
  tip: string;
}

export interface QuizActivityContent {
  questions: QuizQuestionItem[];
}

// Word Scramble Content
export interface WordScrambleItem {
  answer: string;
  scrambled: string;
  hint: string;
}

export interface WordScrambleActivityContent {
  words: WordScrambleItem[];
}

// Math Challenge Content
export interface MathChallengeItem {
  question: string;
  answer: number;
  options: number[];
}

export interface MathChallengeContent {
  equations: MathChallengeItem[];
}

// Science Lab Content
export interface ScienceLabOptionItem {
  label: string;
  correct: boolean;
}

export interface ScienceLabItem {
  title: string;
  setup: string;
  options: ScienceLabOptionItem[];
  explanation: string;
}

export interface ScienceLabActivityContent {
  experiments: ScienceLabItem[];
}

// Logic Puzzle Content
export interface LogicPuzzleOptionItem {
  label: string;
  correct: boolean;
}

export interface LogicPuzzleItem {
  sequence: string[];
  options: LogicPuzzleOptionItem[];
  hint: string;
}

export interface LogicPuzzleActivityContent {
  puzzles: LogicPuzzleItem[];
}
