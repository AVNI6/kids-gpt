import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  // 1. Skip token refresh for prefetch requests to avoid concurrent token rotation races.
  const isPrefetch =
    request.headers.get("purpose") === "prefetch" ||
    request.headers.get("next-router-prefetch") === "1" ||
    request.headers.get("sec-purpose") === "prefetch";

  if (isPrefetch) {
    return NextResponse.next();
  }

  const pathname = request.nextUrl.pathname;

  // Define route categories
  const isAuthRoute =
    pathname.startsWith("/signin") ||
    pathname.startsWith("/signup") ||
    pathname.startsWith("/resetpassword") ||
    pathname.startsWith("/forgotpassword");

  const isProtectedRoute =
    pathname === "/" ||
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/onboarding") ||
    pathname.startsWith("/activities") ||
    pathname.startsWith("/chat") ||
    pathname.startsWith("/subscription");

  // 2. Do not attempt session refresh if no Supabase auth cookies exist (guest user).
  const hasAuthCookie = request.cookies.getAll().some((c) => c.name.startsWith("sb-"));

  if (!hasAuthCookie) {
    if (isProtectedRoute) {
      return NextResponse.redirect(new URL("/signin", request.url));
    }
    return NextResponse.next();
  }

  // 3. Guest check passed, now refresh/check session using supabase client
  const client = createClient(request);
  const {
    data: { user },
  } = await client.supabase.auth.getUser();

  // Case 1: Authenticated user accessing auth routes -> redirect to /
  if (user && isAuthRoute) {
    const redirectResponse = NextResponse.redirect(new URL("/", request.url));
    client.response.cookies.getAll().forEach((cookie) => {
      redirectResponse.cookies.set(cookie.name, cookie.value, cookie);
    });
    return redirectResponse;
  }

  // Case 2: Unauthenticated user accessing protected routes -> redirect to /signin
  if (!user && isProtectedRoute) {
    const redirectResponse = NextResponse.redirect(new URL("/signin", request.url));
    client.response.cookies.getAll().forEach((cookie) => {
      redirectResponse.cookies.set(cookie.name, cookie.value, cookie);
    });
    return redirectResponse;
  }

  const response = client.response;
  response.headers.set("x-middleware-cache", "no-cache");
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
