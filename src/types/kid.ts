export * from "./dashboard";
import { LinkedChildProfile } from "./dashboard";

export type KidDashboardStats = {
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  date_of_birth: string | null;
  total_experience_points: number;
  current_streak: number;
  longest_streak: number;
};

export type LinkedStudentProfile = LinkedChildProfile;
