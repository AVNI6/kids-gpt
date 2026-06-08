import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Dedicated Server-Side Callback Route for Password Reset / Recovery.
 * This route exchanges the recovery token ('code') for a session, and redirects
 * the authenticated recovery user straight to the /resetpassword form.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (code) {
    try {
      const supabase = await createClient();

      // Exchange the recovery code for an active session
      const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

      if (!exchangeError) {
        const forwardedHost = request.headers.get("x-forwarded-host");
        const isLocalEnv = process.env.NODE_ENV === "development";

        if (isLocalEnv) {
          return NextResponse.redirect(`${origin}/resetpassword`);
        } else if (forwardedHost) {
          const protocol = request.headers.get("x-forwarded-proto") ?? "https";
          return NextResponse.redirect(`${protocol}://${forwardedHost}/resetpassword`);
        } else {
          return NextResponse.redirect(`${origin}/resetpassword`);
        }
      }

      console.error("Recovery code exchange failed:", exchangeError.message);
    } catch (err) {
      console.error("Unexpected error in recovery callback:", err);
    }
  }

  // Redirect to signin with error indicator if code is missing or exchange failed
  return NextResponse.redirect(`${origin}/signin?error=recovery-failed`);
}
