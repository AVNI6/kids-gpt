/**
 * Jigsaw Puzzle — Core Type Definitions
 *
 * EdgeDir describes the shape of a piece edge:
 *   0  → flat (border of the full puzzle board)
 *   1  → outward tab (convex bump)
 *  -1  → inward socket (concave recess)
 *
 * Adjacency law: if piece A has right=1, its right neighbour B has left=-1.
 */

export type EdgeDir = 0 | 1 | -1;

/** The four edge directions of a single puzzle piece. */
export interface PieceEdges {
  top: EdgeDir;
  right: EdgeDir;
  bottom: EdgeDir;
  left: EdgeDir;
}

/**
 * Per-edge tab geometry variant — subtle randomisation so tabs don't look
 * cloned.  Values are unitless ratios relative to the logical tile size.
 *   bulge  — how far the tab head extends from the edge (default ≈ 0.30)
 *   neck   — width of the tab neck relative to the tab head (default ≈ 0.50)
 *   shift  — lateral offset of the tab centre along the edge (−0.10 … +0.10)
 */
export interface TabVariant {
  bulge: number;
  neck: number;
  shift: number;
}

/** One entry for all four sides of a piece. */
export type PieceTabVariants = {
  top: TabVariant;
  right: TabVariant;
  bottom: TabVariant;
  left: TabVariant;
};

/** A single puzzle tile. */
export interface PuzzlePiece {
  /** Stable unique identifier — never changes on reshuffle. */
  id: string;
  /** Logical index of where this piece belongs (0 … gridSize²-1). */
  correctIndex: number;
  /** Logical index of where this piece currently sits. */
  currentIndex: number;
  /** Interlocking edge profile. */
  edges: PieceEdges;
  /** Randomised geometry per edge for visual variety. */
  tabVariants: PieceTabVariants;
  /** True if the piece is correctly placed/locked on the board. */
  isPlaced: boolean;
  /** Initial relative X coordinate in the Piece Tray (percentage or pixels). */
  startX: number;
  /** Initial relative Y coordinate in the Piece Tray (percentage or pixels). */
  startY: number;
}

export type Difficulty = 2 | 3 | 4 | 5;
