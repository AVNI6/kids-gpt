import { EdgeDir, PieceEdges, PuzzlePiece, TabVariant, PieceTabVariants } from "@/types/puzzle";

// ─── Edge & Geometry Assignment ───────────────────────────────────────────

/**
 * Generates a seeded pseudo-random number in the range [0, 1) using a
 * deterministic sin-hash on the piece index and a salt.  This ensures pieces
 * always get the same geometry regardless of render order.
 */
function seededRandom(index: number, salt: number): number {
  const x = Math.sin(index * 127.1 + salt * 311.7) * 43758.5453123;
  return x - Math.floor(x);
}

/**
 * Generates a TabVariant for a given boundary.
 * Variation ranges are kept tight so pieces are visually distinct but still
 * interlock correctly.
 */
function makeTabVariant(pieceIndex: number, side: number): TabVariant {
  const r = (salt: number, lo: number, hi: number) =>
    lo + seededRandom(pieceIndex, side * 10 + salt) * (hi - lo);

  return {
    bulge: r(1, 0.82, 1.15), // head reach: 82–115 % of TAB_RATIO
    neck: r(2, 0.46, 0.62), // neck width ratio
    shift: 0, // perfectly centered shift for maximum layout symmetry
  };
}

/**
 * Deterministically assigns edge directions to every piece in the grid.
 *
 * Rules:
 *  - Outer edges (board perimeter) are always 0 (flat).
 *  - For every inner-horizontal boundary (between rows r and r+1):
 *      piece(r, c).bottom and piece(r+1, c).top are forced to be opposites.
 *  - For every inner-vertical boundary (between cols c and c+1):
 *      piece(r, c).right and piece(r, c+1).left are forced to be opposites.
 *  - The "source" edge for each boundary is randomly 1 or -1 using seededRandom.
 */
function buildEdgesMap(gridSize: number): Map<number, PieceEdges> {
  const map = new Map<number, PieceEdges>();
  const total = gridSize * gridSize;

  // Initialise all edges as flat
  for (let i = 0; i < total; i++) {
    map.set(i, { top: 0, right: 0, bottom: 0, left: 0 });
  }

  const idx = (r: number, c: number) => r * gridSize + c;

  // Assign horizontal boundaries (bottom of row r ↔ top of row r+1)
  for (let r = 0; r < gridSize - 1; r++) {
    for (let c = 0; c < gridSize; c++) {
      const topIdx = idx(r, c);
      const botIdx = idx(r + 1, c);
      const dir = seededRandom(topIdx, 17) > 0.5 ? 1 : -1;

      map.set(topIdx, { ...map.get(topIdx)!, bottom: dir as EdgeDir });
      map.set(botIdx, { ...map.get(botIdx)!, top: -dir as EdgeDir });
    }
  }

  // Assign vertical boundaries (right of col c ↔ left of col c+1)
  for (let r = 0; r < gridSize; r++) {
    for (let c = 0; c < gridSize - 1; c++) {
      const leftIdx = idx(r, c);
      const rightIdx = idx(r, c + 1);
      const dir = seededRandom(leftIdx, 31) > 0.5 ? 1 : -1;

      map.set(leftIdx, { ...map.get(leftIdx)!, right: dir as EdgeDir });
      map.set(rightIdx, { ...map.get(rightIdx)!, left: -dir as EdgeDir });
    }
  }

  return map;
}

/**
 * Deterministically assigns matching geometric TabVariants to adjacent pieces.
 *
 * Just like edge profiles, neighboring interlocking pieces must share the exact
 * same random tab bulge and neck width variant settings on their mutual boundary,
 * otherwise visual mismatches and circular gaps will occur when locked.
 */
function buildTabVariantsMap(gridSize: number): Map<number, PieceTabVariants> {
  const map = new Map<number, PieceTabVariants>();
  const total = gridSize * gridSize;

  const defaultFlat: TabVariant = { bulge: 1.0, neck: 0.5, shift: 0 };

  // Initialize all sides with flat variants
  for (let i = 0; i < total; i++) {
    map.set(i, {
      top: { ...defaultFlat },
      right: { ...defaultFlat },
      bottom: { ...defaultFlat },
      left: { ...defaultFlat },
    });
  }

  const idx = (r: number, c: number) => r * gridSize + c;

  // Horizontal boundaries (bottom of row r ↔ top of row r+1)
  for (let r = 0; r < gridSize - 1; r++) {
    for (let c = 0; c < gridSize; c++) {
      const topIdx = idx(r, c);
      const botIdx = idx(r + 1, c);

      // Shared deterministic variant based on top piece's horizontal boundary
      const boundaryVariant = makeTabVariant(topIdx, 100);

      map.set(topIdx, { ...map.get(topIdx)!, bottom: boundaryVariant });
      map.set(botIdx, { ...map.get(botIdx)!, top: boundaryVariant });
    }
  }

  // Vertical boundaries (right of col c ↔ left of col c+1)
  for (let r = 0; r < gridSize; r++) {
    for (let c = 0; c < gridSize - 1; c++) {
      const leftIdx = idx(r, c);
      const rightIdx = idx(r, c + 1);

      // Shared deterministic variant based on left piece's vertical boundary
      const boundaryVariant = makeTabVariant(leftIdx, 200);

      map.set(leftIdx, { ...map.get(leftIdx)!, right: boundaryVariant });
      map.set(rightIdx, { ...map.get(rightIdx)!, left: boundaryVariant });
    }
  }

  return map;
}

// ─── Main Export ─────────────────────────────────────────────────────────

/**
 * Deterministically generates grid pieces with true interlocking edge
 * geometry and perfectly matched adjacent curves, then Fisher-Yates shuffles them.
 */
export function generateAndShufflePieces(gridSize: number): PuzzlePiece[] {
  const totalPieces = gridSize * gridSize;
  const edgesMap = buildEdgesMap(gridSize);
  const variantsMap = buildTabVariantsMap(gridSize);

  // 1. Build pieces in correct order with geometry
  const pieces: PuzzlePiece[] = [];
  for (let i = 0; i < totalPieces; i++) {
    pieces.push({
      id: `tile-${gridSize}-${i}`,
      correctIndex: i,
      currentIndex: i,
      edges: edgesMap.get(i)!,
      tabVariants: variantsMap.get(i)!,
      isPlaced: false,
      // Random coordinates within the tray (represented as percentages 0 to 100)
      startX: Math.random() * 70 + 15,
      startY: Math.random() * 70 + 15,
    });
  }

  // 2. Fisher-Yates shuffle on currentIndex values (anti-instant-win loop)
  let shuffled = [...pieces];
  let isSolved = true;

  while (isSolved && totalPieces > 1) {
    const indices = shuffled.map((p) => p.currentIndex);

    for (let i = totalPieces - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [indices[i], indices[j]] = [indices[j], indices[i]];
    }

    shuffled = shuffled.map((p, idx) => ({ ...p, currentIndex: indices[idx] }));
    isSolved = shuffled.every((p) => p.currentIndex === p.correctIndex);
  }

  return shuffled;
}
