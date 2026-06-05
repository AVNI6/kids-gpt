import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/middleware";

/**
 * Supabase SSR Session Middleware
 *
 * CRITICAL: This middleware MUST exist for @supabase/ssr to correctly refresh
 * access tokens between requests. Without it:
 *   - Expired JWTs are never refreshed in cookies
 *   - Server actions that call auth.getUser() see no valid session
 *   - verifyUserRole() throws "Unauthorized" on any request after token expiry
 *
 * This was the root cause of the assignment completion "Unauthorized" error.
 */
export async function middleware(request: NextRequest) {
  const { supabase, response } = createClient(request);

  // Refresh session if expired. MUST call getUser() — not getSession() — to
  // ensure the server-side token is validated and refreshed in cookies.
  await supabase.auth.getUser();

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths EXCEPT:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon)
     * - Public files (images, etc.)
     *
     * Server Actions POST to the current page URL and are matched by this
     * config so token refresh runs before every server action call.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
