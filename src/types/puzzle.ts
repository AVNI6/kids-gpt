export interface PuzzlePiece {
  id: string;
  correctIndex: number;
  currentIndex: number;
}

export type Difficulty = 2 | 3 | 4 | 5;
