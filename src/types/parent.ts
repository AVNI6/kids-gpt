export * from "./dashboard";
import { ChildDetailsResult, ChildSafetyAndUsageResult, ParentActivityItem } from "./dashboard";

export interface SearchHistoryItem {
  id: string;
  title: string | null;
  created_at: string | null;
}

export interface Recommendation {
  subject: string;
  text: string;
  priority: string;
}

export interface AiInsightsResult {
  child_name: string;
  summary: string;
  recommendations: Recommendation[];
}

export interface NotificationItem {
  id: string;
  parent_id: string;
  child_id: string;
  type: string;
  title: string;
  message: string;
  is_read: boolean;
  metadata: Record<string, unknown> | null;
  created_at: string | null;
}

export type ChildClassroomSummary = {
  classroom_id: string;
  classroom_name: string;
  subject: string | null;
  grade_level: string | null;
  pending_assignments_count: number;
  completed_assignments_count: number;
};

export type CacheData = {
  details: ChildDetailsResult | null;
  safety: ChildSafetyAndUsageResult | null;
  history: SearchHistoryItem[];
  activities: ParentActivityItem[];
  screenTime: {
    screenTimeSeconds: number;
    dailyLimitMinutes: number;
    isLimitEnabled: boolean;
  } | null;
  aiInsights: AiInsightsResult | null;
  classrooms: ChildClassroomSummary[];
};
