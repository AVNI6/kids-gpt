"use client";

import { useContext } from "react";
import { AuthContext } from "@/context/AuthContext";

/**
 * Custom hook to access the unified AuthContext.
 * It provides reactive access to user, userProfile, userRole, isLoading, and logout/refresh helpers.
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
