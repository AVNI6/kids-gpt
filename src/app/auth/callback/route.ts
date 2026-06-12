import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Server-Side Callback Route for Supabase OAuth.
 * This route receives the authorization code ('code') from Google,
 * exchanges it for a secure session, retrieves the user's profile,
 * and dynamically redirects them based on their onboarding status and role.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "";

  if (code) {
    try {
      const supabase = await createClient();

      // Securely exchange the OAuth code for a session
      const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

      if (!exchangeError) {
        // Retrieve the authenticated user's ID
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        let targetPath = next || "/onboarding";

        if (user) {
          // Query the public.profile table for this user_id
          const { data: profile, error: profileError } = await supabase
            .from("profile")
            .select("is_onboarded, role")
            .eq("user_id", user.id)
            .maybeSingle(); // maybeSingle returns null instead of throwing an error if the user has no profile yet

          if (profileError) {
            console.error("Error querying profile in OAuth callback:", profileError.message);
          }

          if (profile && profile.is_onboarded === true) {
            // Already onboarded: send them directly to their role-specific dashboard
            targetPath = profile.role ? `/dashboard/${profile.role}` : "/dashboard";
          } else {
            // Not onboarded: direct them to onboarding flow
            if (next && next !== "/onboarding") {
              targetPath = next;
            } else {
              targetPath = profile?.role ? `/onboarding/${profile.role}` : "/onboarding";
            }
          }
        } else {
          if (userError) {
            console.error("Error fetching user in OAuth callback:", userError.message);
          }
        }

        const forwardedHost = request.headers.get("x-forwarded-host");
        const isLocalEnv = process.env.NODE_ENV === "development";

        if (isLocalEnv) {
          // Local development redirect
          return NextResponse.redirect(`${origin}${targetPath}`);
        } else if (forwardedHost) {
          // Securely handle production redirects behind load balancers/reverse proxies
          const protocol = request.headers.get("x-forwarded-proto") ?? "https";
          return NextResponse.redirect(`${protocol}://${forwardedHost}${targetPath}`);
        } else {
          return NextResponse.redirect(`${origin}${targetPath}`);
        }
      }

      console.error("Supabase OAuth code exchange failed:", exchangeError.message);
    } catch (err) {
      console.error("Unexpected error in auth callback:", err);
    }
  }

  // Redirect to signin with error indicator if code is missing or exchange failed
  return NextResponse.redirect(`${origin}/signin?error=auth-failed`);
}
