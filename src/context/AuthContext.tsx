"use client";
import React, { createContext, useEffect, useState, useRef, useCallback, useMemo } from "react";
import { User, Session } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { UserRole, UserProfile } from "@/types/user";
import { AuthService } from "@/lib/services/auth.service";
export interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  userRole: UserRole | null;
  isLoading: boolean;
  isUserLoggedIn: boolean;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}
export const AuthContext = createContext<AuthContextType | undefined>(undefined);
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUserLoggedIn, setIsUserLoggedIn] = useState(false);
  const isLoggingOutRef = useRef(false);
  const lastLoadedUserIdRef = useRef<string | null>(null);
  const supabase = createClient();
  useEffect(() => {
    let isMounted = true;
    // Check current user securely on mount using the coordinated AuthService
    const checkUser = async () => {
      if (isLoggingOutRef.current) return;
      try {
        const { user: currentUser, profile, role } = await AuthService.getInitialAuth();
        if (!isMounted || isLoggingOutRef.current) return;
        if (currentUser) {
          setUser(currentUser);
          setIsUserLoggedIn(true);
          lastLoadedUserIdRef.current = currentUser.id;
          setUserProfile(profile);
          setUserRole(role);
        } else {
          lastLoadedUserIdRef.current = null;
          setUser(null);
          setUserProfile(null);
          setUserRole(null);
          setIsUserLoggedIn(false);
        }
      } catch (error) {
        console.error("AuthContext: Error checking user:", error);
        if (isMounted) {
          lastLoadedUserIdRef.current = null;
          setUser(null);
          setUserProfile(null);
          setUserRole(null);
          setIsUserLoggedIn(false);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };
    checkUser();
    // Subscribe to auth state changes reactively
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event: string, session: Session | null) => {
      if (!isMounted || isLoggingOutRef.current) {
        setIsLoading(false);
        return;
      }
      // Ignore INITIAL_SESSION if we are already bootstrapping
      if (event === "INITIAL_SESSION") {
        return;
      }
      // Clear cache on significant session modifications to get fresh details next time
      if (event === "SIGNED_IN" || event === "SIGNED_OUT" || event === "TOKEN_REFRESHED") {
        AuthService.clearInitialAuthCache();
      }
      if (session?.user) {
        setUser(session.user);
        setIsUserLoggedIn(true);
        // Fetch profile if not already loaded for this user
        if (lastLoadedUserIdRef.current !== session.user.id) {
          lastLoadedUserIdRef.current = session.user.id;
          const { data: profile } = await supabase
            .from("profile")
            .select("*")
            .eq("user_id", session.user.id)
            .maybeSingle();
          if (!isMounted || isLoggingOutRef.current) return;
          if (profile) {
            setUserProfile(profile);
            if (profile.role) {
              setUserRole(profile.role as UserRole);
            }
          }
        }
      } else {
        lastLoadedUserIdRef.current = null;
        setUser(null);
        setUserProfile(null);
        setUserRole(null);
        setIsUserLoggedIn(false);
      }
      setIsLoading(false);
    });
    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const refreshProfile = useCallback(async () => {
    try {
      AuthService.clearInitialAuthCache();
      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser();
      if (currentUser) {
        const { data: profile } = await supabase
          .from("profile")
          .select("*")
          .eq("user_id", currentUser.id)
          .maybeSingle();
        if (profile) {
          setUserProfile(profile);
          if (profile.role) {
            setUserRole(profile.role as UserRole);
          }
        }
      }
    } catch (error) {
      console.error("Error refreshing profile:", error);
    }
  }, [supabase]);

  const logout = useCallback(async () => {
    try {
      isLoggingOutRef.current = true;
      AuthService.clearInitialAuthCache();
      lastLoadedUserIdRef.current = null;
      setUser(null);
      setUserProfile(null);
      setUserRole(null);
      setIsUserLoggedIn(false);
      await supabase.auth.signOut();
      window.location.href = "/";
    } catch (error) {
      console.error("Error logging out:", error);
    } finally {
      isLoggingOutRef.current = false;
    }
  }, [supabase]);

  const value = useMemo(
    () => ({
      user,
      userProfile,
      userRole,
      isLoading,
      isUserLoggedIn,
      logout,
      refreshProfile,
    }),
    [user, userProfile, userRole, isLoading, isUserLoggedIn, logout, refreshProfile]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export { useAuth } from "@/hooks/useAuth";
