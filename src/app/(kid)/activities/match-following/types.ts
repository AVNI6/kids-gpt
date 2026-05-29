export interface MatchItem {
  id: string;
  leftText: string;
  rightText: string;
}

export type ConnectionState = Record<string, string>; // leftId -> rightId

export interface SelectedDot {
  id: string;
  side: "left" | "right";
}

// Mirrors the original drawingState shape exactly
export interface DrawingState {
  startId: string;
  startSide: "left" | "right";
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
}
