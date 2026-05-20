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
};

export type LinkedStudentProfile = LinkedChildProfile;
