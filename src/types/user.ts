export type UserRole = "kid" | "parent" | "teacher";

export type SignUpUserInput = {
  email: string;
  password: string;
  role: UserRole;
};

export type SignInUserInput = {
  email: string;
  password: string;
};

export interface UserProfile {
  id: string;
  user_id: string;
  role?: UserRole;
  first_name?: string;
  last_name?: string;
  avatar_url?: string;
  date_of_birth?: string | null;
  is_onboarded?: boolean;
  created_at?: string;
  updated_at?: string;
}
