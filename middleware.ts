import { type NextRequest } from "next/server";
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
// Helper to extract the Supabase auth token and return its expiration time (seconds)
function getSessionExpiry(request: NextRequest): number | null {
  try {
    const allCookies = request.cookies.getAll();
    // Find the cookie starting with sb- and ending with -auth-token (or chunked .0)
    const mainCookie = allCookies.find(
      (c) => c.name.startsWith("sb-") && c.name.endsWith("-auth-token")
    );
    let cookieValue = mainCookie?.value || null;

    if (!cookieValue) {
      const chunkZeroCookie = allCookies.find(
        (c) => c.name.startsWith("sb-") && c.name.endsWith("-auth-token.0")
      );
      if (chunkZeroCookie) {
        const baseName = chunkZeroCookie.name.slice(0, -2); // remove ".0"
        const chunks = allCookies
          .filter((c) => c.name.startsWith(baseName))
          .sort((a, b) => {
            const aNum = parseInt(a.name.split(".").pop() || "0", 10);
            const bNum = parseInt(b.name.split(".").pop() || "0", 10);
            return aNum - bNum;
          });
        cookieValue = chunks.map((c) => c.value).join("");
      }
    }

    if (!cookieValue) return null;

    let rawJson = cookieValue;
    if (cookieValue.startsWith("base64-")) {
      const base64Str = cookieValue.substring("base64-".length);
      rawJson = atob(base64Str);
    }

    const decoded = JSON.parse(rawJson);
    if (decoded && typeof decoded.expires_at === "number") {
      return decoded.expires_at;
    }
  } catch (err) {
    console.error("Error parsing supabase session expiry:", err);
  }
  return null;
}

export async function middleware(request: NextRequest) {
  const client = createClient(request);

  const expiry = getSessionExpiry(request);
  const now = Math.floor(Date.now() / 1000);

  // If there's an active session and it is close to expiring (less than 60s remaining), or already expired,
  // we trigger the Supabase auth.getUser() to refresh the session token and write updated cookies.
  // Otherwise, we skip calling getUser() to avoid unnecessary database calls and concurrent token refreshes.
  if (expiry !== null && expiry <= now + 60) {
    await client.supabase.auth.getUser();
  }

  const response = client.response;
  response.headers.set("x-middleware-cache", "no-cache");
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
