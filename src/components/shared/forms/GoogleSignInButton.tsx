"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { FcGoogle } from "react-icons/fc";
import { toast } from "sonner";

interface GoogleSignInButtonProps {
  className?: string;
  next?: string;
}

/**
 * A reusable client-side button to handle Supabase Google OAuth sign-in.
 *
 * It securely creates a Supabase browser client, constructs the correct callback URI
 * targeting `/auth/callback`, and handles redirecting the user to Google.
 */
export default function GoogleSignInButton({ className, next = "/" }: GoogleSignInButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const supabase = createClient();

  const handleSignIn = async () => {
    try {
      setIsLoading(true);

      // Dynamically get the current origin on the client side
      const origin = typeof window !== "undefined" ? window.location.origin : "";
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || origin || "http://localhost:3000";
      const redirectTo = `${siteUrl}/auth/callback?next=${encodeURIComponent(next)}`;

      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo,
          queryParams: {
            access_type: "offline",
            prompt: "consent",
          },
        },
      });

      if (error) {
        throw error;
      }
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "An unexpected error occurred. Please try again.";
      console.error("Google OAuth error:", error);
      toast.error("Google sign in failed", {
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleSignIn}
      disabled={isLoading}
      className={`rounded-full flex items-center justify-center gap-3 border-2 border-border py-4 px-6 font-bold hover:bg-muted text-foreground transition-all duration-200 w-full disabled:opacity-50 disabled:cursor-not-allowed ${className || ""}`}
    >
      <FcGoogle className="text-xl" />
      {isLoading ? "Connecting to Google..." : "Sign In with Google"}
    </button>
  );
}
