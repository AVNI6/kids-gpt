export type GameType = "WhoAmI" | "BrainTeaser" | "FactFusion" | "Riddle";

export interface WhoAmIData {
  clues: string[];
  options: string[];
  answer: string;
}

export interface BrainTeaserData {
  question: string;
  hint: string;
  options: string[];
  answer: string;
}

export interface FactFusionData {
  clue: string;
  options: string[];
  answer: string;
}

export interface RiddleData {
  question: string;
  hint: string;
  options: string[];
  answer: string;
}
