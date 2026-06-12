import { PuzzlePiece } from "@/types/puzzle";

/**
 * Checks if the puzzle pieces are placed in their correct positions.
 */
export function isSolved(pieces: PuzzlePiece[]): boolean {
  if (pieces.length === 0) return false;
  return pieces.every((p) => p.currentIndex === p.correctIndex);
}

/**
 * Validates a file to ensure it's a valid image and is under the 5MB size limit.
 * Returns an error string if invalid, or null if valid.
 */
export function validateImageFile(file: File): string | null {
  const MAX_SIZE_MB = 5;
  const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;

  if (!file.type.startsWith("image/")) {
    return "Whoops! That doesn't look like an image file. Please upload a picture!";
  }

  if (file.size > MAX_SIZE_BYTES) {
    return `Oh no! That picture is too big. Please upload a picture smaller than ${MAX_SIZE_MB}MB.`;
  }

  return null;
}
