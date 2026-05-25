"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { User } from "@supabase/supabase-js";
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
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    // Check current user on mount
    const checkUser = async () => {
      try {
        const {
          data: { user: currentUser },
        } = await supabase.auth.getUser();

        if (currentUser) {
          setUser(currentUser);
          setIsUserLoggedIn(true);
          // Fetch profile
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
        } else {
          setUser(null);
          setUserProfile(null);
          setUserRole(null);
          setIsUserLoggedIn(false);
        }
      } catch (error) {
        console.error("Error checking user:", error);
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
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        setUser(session.user);
        setIsUserLoggedIn(true);
        // Fetch profile
        const { data: profile } = await supabase
          .from("profile")
          .select("*")
          .eq("user_id", session.user.id)
          .maybeSingle();
        if (profile) {
          setUserProfile(profile);
          if (profile.role) {
            setUserRole(profile.role as UserRole);
          }
        }
      } else {
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
      await supabase.auth.signOut();
      setUser(null);
      setUserProfile(null);
      setUserRole(null);
      setIsUserLoggedIn(false);
      router.push("/");
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
