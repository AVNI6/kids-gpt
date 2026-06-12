export type DashboardRole = "kid" | "parent" | "teacher";

export type DashboardUserProfile = {
  user_id: string;
  email: string | null;
  first_name: string | null;
  last_name: string | null;
  username: string | null;
  avatar_url: string | null;
  date_of_birth: string | null;
  role: DashboardRole | null;
  total_experience_points: number | null;
  current_streak: number | null;
  longest_streak: number | null;
  standard?: string | null;
  mobile_no?: string | null;
};

export type KidDashboardStats = {
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  date_of_birth: string | null;
  total_experience_points: number;
  current_streak: number;
  longest_streak: number;
};

export type LinkedChildProfile = {
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  username: string | null;
  avatar_url: string | null;
  date_of_birth: string | null;
  role: DashboardRole | null;
  total_experience_points: number | null;
  current_streak: number | null;
  longest_streak: number | null;
  standard: string | null;
};

export type LinkedStudentProfile = LinkedChildProfile;

export type ChildActivityLog = {
  id: string;
  rewards_amount: number | null;
  description: string | null;
  created_at: string | null;
  source_type: string | null;
  score?: number | null;
  activity_settings?: {
    id: string;
    slug: string;
    title: string;
  } | null;
};

export type ChildDetailsResult = {
  total_completed: number;
  total_xp: number;
  current_streak: number;
  longest_streak: number;
  learning_time_mins: number;
  quiz_accuracy: number;
  subject_mastery: {
    math: number;
    science: number;
    english: number;
    coding: number;
  };
  timeline: ChildActivityLog[];
};

export type ParentActivityItem = {
  id: string;
  rewards_amount: number;
  description: string | null;
  created_at: string | null;
  source_type: string;
  score: number | null;
  activity_settings: {
    id: string;
    slug: string;
    title: string;
  } | null;
};

export type ChildSafetyAndUsageResult = {
  safety_score: number;
  content_filter_status: string;
  focus_mode_active: boolean;
  daily_screen_time_mins: number;
  weekly_ai_interactions: number;
  unresolved_alerts_count: number;
  daily_limit_minutes?: number;
  is_screen_time_limit_enabled?: boolean;
};
