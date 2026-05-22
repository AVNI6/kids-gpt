"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { type AuthChangeEvent, type Session, type User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { UserRole, UserProfile } from "@/types/auth";

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
  const supabase = createClient();

  useEffect(() => {
    let isMounted = true;

    const loadProfile = async (userId: string) => {
      try {
        const { data: profile } = await supabase
          .from("profile")
          .select("*")
          .eq("user_id", userId)
          .maybeSingle();

        if (!isMounted) {
          return;
        }

        setUserProfile(profile ?? null);
        setUserRole(profile?.role ? (profile.role as UserRole) : null);
      } catch (error) {
        console.error("Error loading profile:", error);
      }
    };

    const bootstrapAuth = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!isMounted) {
          return;
        }

        const currentUser = session?.user ?? null;

        setUser(currentUser);
        setIsUserLoggedIn(Boolean(currentUser));

        if (currentUser) {
          await loadProfile(currentUser.id);
        } else {
          setUserProfile(null);
          setUserRole(null);
        }
      } catch (error) {
        console.error("Error checking user:", error);
        if (isMounted) {
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

    bootstrapAuth();

    // Subscribe to auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      async (_event: AuthChangeEvent, session: Session | null) => {
        if (!isMounted) {
          return;
        }

        if (session?.user) {
          setUser(session.user);
          setIsUserLoggedIn(true);
          await loadProfile(session.user.id);
        } else {
          setUser(null);
          setUserProfile(null);
          setUserRole(null);
          setIsUserLoggedIn(false);
        }

        setIsLoading(false);
      }
    );

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const logout = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setUserProfile(null);
      setUserRole(null);
      setIsUserLoggedIn(false);
      window.location.href = "/";
    } catch (error) {
      console.error("Error logging out:", error);
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
