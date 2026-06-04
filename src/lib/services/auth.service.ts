import { createClient } from "@/lib/supabase/client";
import { User } from "@supabase/supabase-js";
import { UserProfile, UserRole } from "@/types/user";

export interface AuthBootstrapResult {
  user: User | null;
  profile: UserProfile | null;
  role: UserRole | null;
}

let initialAuthPromise: Promise<AuthBootstrapResult> | null = null;

/**
 * Centralized service to manage client-side authentication bootstrapping,
 * session token caching, and request coordination.
 */
export const AuthService = {
  /**
   * Performs the initial auth check exactly once, caching the resulting promise
   * to eliminate duplicate parallel executions (e.g. under React Strict Mode).
   */
  getInitialAuth(forceRefresh = false): Promise<AuthBootstrapResult> {
    const supabase = createClient();

    if (forceRefresh) {
      initialAuthPromise = null;
    }

    if (!initialAuthPromise) {
      initialAuthPromise = (async (): Promise<AuthBootstrapResult> => {
        try {
          const {
            data: { user },
            error: userError,
          } = await supabase.auth.getUser();

          if (userError || !user) {
            return { user: null, profile: null, role: null };
          }

          const { data: profile, error: profileError } = await supabase
            .from("profile")
            .select("*")
            .eq("user_id", user.id)
            .maybeSingle();

          if (profileError || !profile) {
            return { user, profile: null, role: null };
          }

          return {
            user,
            profile,
            role: (profile.role as UserRole) || null,
          };
        } catch (error) {
          console.error("AuthService: Error bootstrapping authentication:", error);
          return { user: null, profile: null, role: null };
        }
      })();
    }

    return initialAuthPromise;
  },

  /**
   * Resets the cached auth promise.
   * Should be invoked on state changes like sign-in, sign-out, or password recovery.
   */
  clearInitialAuthCache() {
    initialAuthPromise = null;
  },
};
