"use client";

import { useSelector, useDispatch } from "react-redux";
import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { RootState, AppDispatch } from "@/store";
import { fetchProfile } from "@/store/slices/authSlice";

export function useAuth() {
  const dispatch = useDispatch<AppDispatch>();
  const supabase = createClient();
  const router = useRouter();
  const { user, userProfile, userRole, isLoading, isInitializing } = useSelector(
    (state: RootState) => state.auth
  );

  const logout = useCallback(async () => {
    try {
      router.replace("/");
      // Allow router to start transitioning before session cookies are cleared
      await new Promise((resolve) => setTimeout(resolve, 100));
      await supabase.auth.signOut();
    } catch (error) {
      console.error("useAuth: Error logging out:", error);
    }
  }, [supabase, router]);

  const refreshProfile = useCallback(async () => {
    if (!user) return;
    try {
      return await dispatch(fetchProfile(user.id)).unwrap();
    } catch (error) {
      console.error("useAuth: Error refreshing profile:", error);
      throw error;
    }
  }, [dispatch, user]);

  return {
    user,
    userProfile,
    userRole,
    isLoading,
    isInitializing,
    isUserLoggedIn: !!user,
    logout,
    refreshProfile,
  };
}
