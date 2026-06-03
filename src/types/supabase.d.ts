import { UserProfile } from "@/types/user";

declare module "@supabase/supabase-js" {
  interface User {
    /**
     * Optional profile data joined from the `profile` table.
     * This is not returned by default — populate it manually when needed.
     */
    profile?: UserProfile;
  }
}

export {};
