import { PuzzlePiece } from "@/types/puzzle";

/**
 * Deterministically generates grid pieces and shuffles them.
 * Performs a robust Fisher-Yates shuffle on the currentIndex values.
 * If the shuffled board is fully solved by chance, it automatically reshuffles to prevent an instant win.
 */
export function generateAndShufflePieces(gridSize: number): PuzzlePiece[] {
  const totalPieces = gridSize * gridSize;
  const pieces: PuzzlePiece[] = [];

  // 1. Initialize the pieces in correct order
  for (let i = 0; i < totalPieces; i++) {
    pieces.push({
      id: `tile-${i}`,
      correctIndex: i,
      currentIndex: i,
    });
  }

  // 2. Fisher-Yates Shuffling loop
  let shuffled = [...pieces];
  let isSolved = true;

  // Prevent endless loop for 1x1 grids (though gridSize is always >= 2)
  while (isSolved && totalPieces > 1) {
    const indices = shuffled.map((p) => p.currentIndex);

    // Shuffle index values
    for (let i = totalPieces - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const temp = indices[i];
      indices[i] = indices[j];
      indices[j] = temp;
    }

    // Assign shuffled indices back
    shuffled = shuffled.map((p, idx) => ({
      ...p,
      currentIndex: indices[idx],
    }));

    // Verify if the board is solved
    isSolved = shuffled.every((p) => p.currentIndex === p.correctIndex);
  }

  return shuffled;
}
