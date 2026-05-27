"use client";

import React, { createContext, useContext, useEffect, useState, useRef } from "react";
import { User, Session } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { UserRole, UserProfile } from "@/types/auth";
import { useRouter } from "next/navigation";

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  userRole: UserRole | null;
  isLoading: boolean;
  isUserLoggedIn: boolean;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUserLoggedIn, setIsUserLoggedIn] = useState(false);
  const isLoggingOutRef = useRef(false);
  const lastLoadedUserIdRef = useRef<string | null>(null);
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    // Check current user on mount
    const checkUser = async () => {
      if (isLoggingOutRef.current) return;
      try {
        const {
          data: { user: currentUser },
        } = await supabase.auth.getUser();

        if (isLoggingOutRef.current) return;

        if (currentUser) {
          setUser(currentUser);
          setIsUserLoggedIn(true);

          // Only fetch profile if not already fetched for this user ID
          if (lastLoadedUserIdRef.current !== currentUser.id) {
            lastLoadedUserIdRef.current = currentUser.id;
            const { data: profile } = await supabase
              .from("profile")
              .select("*")
              .eq("user_id", currentUser.id)
              .maybeSingle();

            if (isLoggingOutRef.current) return;

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
      } catch (error) {
        console.error("Error checking user:", error);
        lastLoadedUserIdRef.current = null;
        setUser(null);
        setUserProfile(null);
        setUserRole(null);
        setIsUserLoggedIn(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkUser();

    // Subscribe to auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event: string, session: Session | null) => {
      if (isLoggingOutRef.current) {
        setIsLoading(false);
        return;
      }

      if (session?.user) {
        setUser(session.user);
        setIsUserLoggedIn(true);

        // Only fetch profile if not already fetched for this user ID
        if (lastLoadedUserIdRef.current !== session.user.id) {
          lastLoadedUserIdRef.current = session.user.id;
          const { data: profile } = await supabase
            .from("profile")
            .select("*")
            .eq("user_id", session.user.id)
            .maybeSingle();

          if (isLoggingOutRef.current) return;

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

    return () => subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const logout = async () => {
    try {
      isLoggingOutRef.current = true;

      // 1. Optimistically clear local states immediately
      lastLoadedUserIdRef.current = null;
      setUser(null);
      setUserProfile(null);
      setUserRole(null);
      setIsUserLoggedIn(false);

      // 2. Await full signOut to ensure locks are cleanly released
      await supabase.auth.signOut();

      // 3. Navigate home
      router.push("/");
    } catch (error) {
      console.error("Error logging out:", error);
    } finally {
      isLoggingOutRef.current = false;
    }
  };

  const value = {
    user,
    userProfile,
    userRole,
    isLoading,
    isUserLoggedIn,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
