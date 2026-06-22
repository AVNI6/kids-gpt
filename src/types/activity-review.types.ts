/**
 * Activity Review System — Type Definitions
 *
 * These types define the shape of review_data stored in the activity_reviews table
 * for each supported activity type. All types are purely additive; they are captured
 * at completion time and stored in the JSONB `review_data` column.
 */

// ============================================================
// Per-item types used inside review payloads
// ============================================================

export interface QuizReviewItem {
  question: string;
  options: string[];
  kid_answer: string | null;
  correct_answer: string;
  is_correct: boolean;
  feedback?: string;
}

export interface FlashcardReviewItem {
  question: string;
  answer: string;
}

export interface WordScrambleReviewItem {
  scrambled: string;
  kid_input: string;
  correct_answer: string;
  is_correct: boolean;
  hint?: string;
}

export interface MathChallengeReviewItem {
  question: string;
  kid_answer: number | null;
  correct_answer: number;
  options: number[];
  is_correct: boolean;
}

export interface LogicPuzzleReviewItem {
  sequence: string[];
  kid_answer: string | null;
  correct_answer: string;
  is_correct: boolean;
  hint?: string;
}

export interface ScienceLabReviewItem {
  title: string;
  setup: string;
  kid_answer: string | null;
  correct_answer: string;
  is_correct: boolean;
  explanation?: string;
}

export interface MatchConnectionReviewItem {
  left_text: string;
  right_text: string; // correct right match
  kid_right_text: string | null; // what the kid connected
  is_correct: boolean;
}

// ============================================================
// Top-level review_data payloads (stored in JSONB)
// ============================================================

export interface QuizReviewData {
  type: "quizzes" | "logic-puzzles" | "science-lab";
  title: string;
  items: QuizReviewItem[] | LogicPuzzleReviewItem[] | ScienceLabReviewItem[];
  total_questions: number;
  correct_count: number;
  duration_seconds?: number;
}

export interface FlashcardReviewData {
  type: "flashcards";
  title: string;
  total_cards: number;
  mastered: FlashcardReviewItem[];
  review: FlashcardReviewItem[];
  duration_seconds?: number;
}

export interface WordScrambleReviewData {
  type: "word-scrambles";
  title: string;
  items: WordScrambleReviewItem[];
  total_words: number;
  correct_count: number;
  duration_seconds?: number;
}

export interface MathChallengeReviewData {
  type: "math-challenges";
  title: string;
  items: MathChallengeReviewItem[];
  total_questions: number;
  correct_count: number;
  duration_seconds?: number;
}

export interface MemoryMatchReviewData {
  type: "memory-match";
  world_id: number;
  step_number: number;
  total_pairs: number;
  matches_found: number;
  total_flips: number;
  duration_seconds?: number;
}

export interface MatchFollowingReviewData {
  type: "match-following";
  title: string;
  connections: MatchConnectionReviewItem[];
  total_pairs: number;
  correct_count: number;
  duration_seconds?: number;
}

export interface JigsawReviewData {
  type: "jigsaw-puzzle";
  grid_size: number;
  theme_name: string;
  theme_url?: string;
  duration_seconds?: number;
  completion_status: "solved";
}

export type ActivityReviewData =
  | QuizReviewData
  | FlashcardReviewData
  | WordScrambleReviewData
  | MathChallengeReviewData
  | MemoryMatchReviewData
  | MatchFollowingReviewData
  | JigsawReviewData;

// ============================================================
// Payload for saving a review (used in saveActivityReview)
// ============================================================

export interface SaveActivityReviewPayload {
  activityType: string;
  rewardId?: string | null;
  submissionId?: string | null;
  generatedActivityId?: string | null;
  scorePercentage: number;
  xpEarned: number;
  durationSeconds?: number | null;
  reviewData: ActivityReviewData;
}

// ============================================================
// Full DB row returned from getActivityReviewForParent
// ============================================================

export interface ActivityReviewRow {
  id: string;
  user_id: string;
  activity_type: string;
  reward_id: string | null;
  submission_id: string | null;
  generated_activity_id: string | null;
  score_percentage: number;
  xp_earned: number;
  duration_seconds: number | null;
  review_data: ActivityReviewData;
  created_at: string;
}
