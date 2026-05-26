/**
 * geometry.ts — True Interlocking Jigsaw SVG Path Generator
 *
 * Produces a scalable SVG <path d="…"> string for one puzzle piece using
 * smooth cubic Bézier curves.  The path's bounding box is larger than the
 * logical tile square: tabs extend outward by TAB_RATIO × tileSize on each
 * side, so adjacent pieces' tabs slot cleanly into each other's sockets.
 *
 * Coordinate system
 * ─────────────────
 *   Origin (0, 0) is the TOP-LEFT corner of the *bounding box* (not the
 *   logical tile square).  The logical square starts at (pad, pad) and ends
 *   at (pad + w, pad + h), where:
 *     pad = TAB_RATIO * w   (same proportion for height, assuming square tiles)
 *
 * Edge orientation convention (all edges travel left→right or top→bottom so
 * they join seamlessly when you trace the path clockwise):
 *   TOP    : left  → right
 *   RIGHT  : top   → bottom
 *   BOTTOM : right → left   (reverse)
 *   LEFT   : bottom → top   (reverse)
 */

import { EdgeDir, PieceEdges, PieceTabVariants, TabVariant } from "@/types/puzzle";

/**
 * Fraction of tile width that each tab extends beyond the logical edge.
 * FIXED: was 0.32 — real jigsaws use ~0.20. This was the #1 cause of
 * the blob/cloud appearance. Smaller ratio = tighter, more realistic tabs.
 */
export const TAB_RATIO = 0.2;

/** Cache for generated SVG path strings — avoids regenerating on each render. */
const pathCache = new Map<string, string>();

/** Cache for data-URI SVG mask strings. */
const maskCache = new Map<string, string>();

// ─── Internal geometry helpers ─────────────────────────────────────────────

/**
 * Build the path segment for a single edge, parameterised so it can be
 * oriented in any direction.
 *
 *  dir  = edge direction: 0 flat, 1 tab-out, -1 socket-in
 *  x0,y0 = start of this edge in bounding-box space
 *  x1,y1 = end   of this edge in bounding-box space
 *  nx,ny = outward normal unit vector for this edge
 *  v     = TabVariant with per-edge randomisation
 *  TAB   = absolute tab reach (TAB_RATIO × tileW)
 *
 * Returns a string of SVG path commands (no "M" prefix).
 *
 * KEY FIXES vs original:
 *  1. TAB_RATIO 0.32 → 0.20  (drives actual physical size)
 *  2. Neck t-range 0.35/0.65 → 0.38/0.62  (tighter neck, longer flat shoulders)
 *  3. Neck pinch H*0.45 → H*0.10  (creates real narrow neck, not a blob)
 *  4. Head peak H*1.02 → H*0.78  (mushroom shape, not overshot circle)
 *  5. Shoulder control pt H*0.15 → H*0.02  (dead-flat entry = sharp shoulder)
 *  6. shift multiplier 0.05 → 0.01  (tiny shift only — large shift breaks mirror)
 *
 * Interlocking guarantee: because socket (dir=-1) uses H = -1 * tabReach,
 * every control point is the exact negative of the tab's control point.
 * Provided shift is kept tiny (≤0.01) the socket is a perfect mirror of
 * the tab and they interlock with zero gap.
 */
function edgePath(
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  nx: number,
  ny: number,
  dir: EdgeDir,
  v: TabVariant,
  TAB: number
): string {
  if (dir === 0) {
    return `L ${x1} ${y1}`;
  }

  const sign = dir as 1 | -1;

  const dx = x1 - x0;
  const dy = y1 - y0;
  const len = Math.sqrt(dx * dx + dy * dy);
  const tx = dx / len;
  const ty = dy / len;

  const tabReach = TAB * v.bulge;

  // FIXED: was * 0.05 — large shift breaks tab/socket mirror symmetry.
  // Keep it very small so adjacent piece sockets still align perfectly.
  const shift = v.shift * len * 0.01;

  // Helper: point along the edge at parameter t, displaced d px along normal
  const P = (t: number, d: number) => ({
    x: x0 + tx * (len * t + shift) + nx * d,
    y: y0 + ty * (len * t + shift) + ny * d,
  });

  const H = sign * tabReach;
  const r = (n: number) => Math.round(n * 1000) / 1000;

  // ── Key geometry nodes ──────────────────────────────────────────────────
  //
  //  Edge (flat):  x0 ──── pA ──── [neck] ──── pK ──── x1
  //                        |                    |
  //                        pC (pinch)           pH (pinch)
  //                          \                 /
  //                            ──── pF (head peak) ────
  //
  // FIXED neck positions: 0.38/0.62 (was 0.35/0.65)
  //   → middle 24% of edge is the neck+head; 76% is flat shoulder
  //   → real jigsaw pieces have long flat sides with a small tab in the center
  //
  const pA = P(0.38, 0); // neck shoulder start
  const pK = P(0.62, 0); // neck shoulder end

  // FIXED pinch depth: H*0.10 (was H*0.45)
  //   → creates a clearly visible narrow neck
  //   → old value was so wide the neck merged into the head = circular blob
  const pC = P(0.38, H * 0.1); // left neck pinch
  const pH = P(0.62, H * 0.1); // right neck pinch

  // FIXED head peak: H*0.78 (was H*1.02)
  //   → mushroom-shaped head, not an overshot circle
  //   → combined with smaller TAB_RATIO this gives classic jigsaw proportions
  const pF = P(0.5, H * 0.78); // mushroom head center

  // ── Five cubic Bézier segments ─────────────────────────────────────────
  //
  //  Segment 1: flat line → neck start (pA)
  //  Segment 2: pA → left pinch (pC)   — dead-flat shoulder then tighten
  //  Segment 3: pC → head peak (pF)    — neck flares out to mushroom
  //  Segment 4: pF → right pinch (pH)  — mushroom curves back in
  //  Segment 5: pH → neck end (pK)     — tighten then dead-flat shoulder
  //  Segment 6: flat line → x1,y1
  //
  // FIXED shoulder control points: H*0.02 (was H*0.15)
  //   → near-zero displacement at the shoulder means the edge enters the
  //     neck almost horizontally — the classic flat-shoulder look of a
  //     real jigsaw piece.
  //
  return [
    `L ${r(pA.x)} ${r(pA.y)}`,

    // Seg 2 — flat shoulder entry, curve down into neck pinch
    `C ${r(P(0.38, H * 0.02).x)} ${r(P(0.38, H * 0.02).y)} ` +
      `${r(P(0.36, H * 0.08).x)} ${r(P(0.36, H * 0.08).y)} ` +
      `${r(pC.x)} ${r(pC.y)}`,

    // Seg 3 — neck widens and sweeps up to mushroom head
    `C ${r(P(0.38, H * 0.46).x)} ${r(P(0.38, H * 0.46).y)} ` +
      `${r(P(0.42, H * 0.78).x)} ${r(P(0.42, H * 0.78).y)} ` +
      `${r(pF.x)} ${r(pF.y)}`,

    // Seg 4 — head curves symmetrically back down
    `C ${r(P(0.58, H * 0.78).x)} ${r(P(0.58, H * 0.78).y)} ` +
      `${r(P(0.62, H * 0.46).x)} ${r(P(0.62, H * 0.46).y)} ` +
      `${r(pH.x)} ${r(pH.y)}`,

    // Seg 5 — neck tightens then flat shoulder exit
    `C ${r(P(0.64, H * 0.08).x)} ${r(P(0.64, H * 0.08).y)} ` +
      `${r(P(0.62, H * 0.02).x)} ${r(P(0.62, H * 0.02).y)} ` +
      `${r(pK.x)} ${r(pK.y)}`,

    `L ${r(x1)} ${r(y1)}`,
  ].join(" ");
}

// ─── Public API ───────────────────────────────────────────────────────────

export interface GeometryArgs {
  /** Logical tile width in pixels (before padding). */
  tileW: number;
  /** Logical tile height in pixels (before padding). */
  tileH: number;
  edges: PieceEdges;
  variants: PieceTabVariants;
}

/**
 * Returns a memoised SVG `d` attribute string for the given piece geometry.
 * The path is defined in a coordinate space where the bounding box starts at
 * (0,0) and has size (tileW + 2·pad) × (tileH + 2·pad).
 */
export function getJigsawSVGPath({ tileW, tileH, edges, variants }: GeometryArgs): string {
  const key = `${tileW}x${tileH}|${edges.top}${edges.right}${edges.bottom}${edges.left}|${variantKey(variants)}`;
  const cached = pathCache.get(key);
  if (cached) return cached;

  const TAB = TAB_RATIO * tileW; // absolute tab depth (px)
  const pad = TAB; // padding on each side

  // Tiny micro-overlap to completely hide anti-aliasing seams/gaps
  const bleed = 0.45;

  // Logical square corners in bounding-box space
  const left = pad - bleed;
  const top = pad - bleed;
  const right = pad + tileW + bleed;
  const bottom = pad + tileH + bleed;

  // Outward normals for each edge
  //   TOP    normal points UP    → (0, -1)
  //   RIGHT  normal points RIGHT → (1,  0)
  //   BOTTOM normal points DOWN  → (0,  1)
  //   LEFT   normal points LEFT  → (-1, 0)

  const d = [
    `M ${left} ${top}`,
    // TOP edge: left → right, outward normal (0,-1) = upward
    edgePath(left, top, right, top, 0, -1, edges.top, variants.top, TAB),
    // RIGHT edge: top-right → bottom-right, outward normal (1,0)
    edgePath(right, top, right, bottom, 1, 0, edges.right, variants.right, TAB),
    // BOTTOM edge: right → left (reversed), outward normal (0,1) = downward
    edgePath(right, bottom, left, bottom, 0, 1, edges.bottom, variants.bottom, TAB),
    // LEFT edge: bottom-left → top-left (reversed), outward normal (-1,0)
    edgePath(left, bottom, left, top, -1, 0, edges.left, variants.left, TAB),
    "Z",
  ].join(" ");

  pathCache.set(key, d);
  return d;
}

/**
 * Returns a memoised data-URI SVG mask string.
 * The SVG viewport matches the bounding box size exactly.
 */
export function getJigsawMaskURI({ tileW, tileH, edges, variants }: GeometryArgs): string {
  const key = `mask:${tileW}x${tileH}|${edges.top}${edges.right}${edges.bottom}${edges.left}|${variantKey(variants)}`;
  const cached = maskCache.get(key);
  if (cached) return cached;

  const TAB = TAB_RATIO * tileW;
  const pad = TAB;
  const bboxW = Math.round(tileW + 2 * pad);
  const bboxH = Math.round(tileH + 2 * pad);

  const pathD = getJigsawSVGPath({ tileW, tileH, edges, variants });

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${bboxW}" height="${bboxH}" viewBox="0 0 ${bboxW} ${bboxH}"><path d="${pathD}" fill="white" stroke="white" stroke-width="0.8" stroke-linejoin="round"/></svg>`;

  const uri = `url("data:image/svg+xml;utf8,${encodeURIComponent(svg)}")`;
  maskCache.set(key, uri);
  return uri;
}

/** Compute bounding box dimensions (tileW + 2·pad). */
export function getBoundingBoxSize(tileW: number): number {
  return tileW + 2 * TAB_RATIO * tileW;
}

// ─── Helpers ──────────────────────────────────────────────────────────────

function variantKey(v: PieceTabVariants): string {
  const fmt = (t: TabVariant) => `${t.bulge.toFixed(2)},${t.neck.toFixed(2)},${t.shift.toFixed(2)}`;
  return `${fmt(v.top)}|${fmt(v.right)}|${fmt(v.bottom)}|${fmt(v.left)}`;
}
