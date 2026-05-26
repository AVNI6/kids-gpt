import { type NextRequest, NextResponse } from "next/server";

import { createClient } from "./src/lib/supabase/middleware";

const VALID_ROLES = ["kid", "parent", "teacher"] as const;
type UserRole = (typeof VALID_ROLES)[number];

const AUTH_CALLBACK_ROUTE = "/auth/callback";
const RESET_PASSWORD_ROUTE = "/resetpassword";

type ProfileRow = {
  role: UserRole | null;
  is_onboarded: boolean | null;
};

const authRoutes = new Set(["/signup", "/signin", "/login", "/forgotpassword"]);
const publicRoutes = new Set(["/", ...authRoutes, AUTH_CALLBACK_ROUTE, RESET_PASSWORD_ROUTE]);

function isValidRole(role: string | null | undefined): role is UserRole {
  return VALID_ROLES.includes(role as UserRole);
}

function getPathParts(pathname: string) {
  const segments = pathname.split("/").filter(Boolean);
  return {
    basePath: segments[0],
    roleSegment: segments[1],
  };
}

function getRolePath(basePath: "chat" | "dashboard" | "onboarding", role: UserRole) {
  return `/${basePath}/${role}`;
}

function getCanonicalHome(role: UserRole, isOnboarded: boolean) {
  return isOnboarded ? getRolePath("dashboard", role) : getRolePath("onboarding", role);
}

function redirectWithCookies(response: NextResponse, request: NextRequest, pathname: string) {
  const redirectResponse = NextResponse.redirect(new URL(pathname, request.url));
  response.cookies.getAll().forEach((cookie) => {
    redirectResponse.cookies.set(cookie.name, cookie.value, cookie);
  });
  return redirectResponse;
}

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const { basePath, roleSegment } = getPathParts(pathname);
  const { supabase, response } = createClient(request);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    if (publicRoutes.has(pathname)) {
      return response;
    }

    return redirectWithCookies(response, request, "/signin");
  }

  if (pathname === AUTH_CALLBACK_ROUTE || pathname === RESET_PASSWORD_ROUTE) {
    return response;
  }

  const { data: profile } = await supabase
    .from("profile")
    .select("role, is_onboarded")
    .eq("user_id", user.id)
    .maybeSingle<ProfileRow>();

  const metadataRole = isValidRole(user.user_metadata?.role) ? user.user_metadata.role : null;
  const role = isValidRole(profile?.role) ? profile.role : (metadataRole ?? "kid");
  const isOnboarded = Boolean(profile?.is_onboarded);
  const canonicalHome = getCanonicalHome(role, isOnboarded);

  const isAuthRoute = authRoutes.has(pathname);
  const isOnboardingRoute = basePath === "onboarding";
  const isProtectedRoute = basePath === "chat" || basePath === "dashboard" || isOnboardingRoute;

  if (!isOnboarded) {
    if (pathname === "/") {
      return redirectWithCookies(response, request, getRolePath("onboarding", role));
    }

    if (isAuthRoute) {
      return redirectWithCookies(response, request, canonicalHome);
    }

    if (pathname === RESET_PASSWORD_ROUTE) {
      return response;
    }

    if (isOnboardingRoute) {
      if (roleSegment !== role) {
        return redirectWithCookies(response, request, getRolePath("onboarding", role));
      }

      return response;
    }

    if (basePath === "chat" || basePath === "dashboard") {
      return redirectWithCookies(response, request, getRolePath("onboarding", role));
    }

    if (!isProtectedRoute) {
      return redirectWithCookies(response, request, getRolePath("onboarding", role));
    }

    return response;
  }

  if (pathname === "/") {
    return response;
  }

  if (isAuthRoute || isOnboardingRoute) {
    return redirectWithCookies(response, request, canonicalHome);
  }

  if (basePath === "chat" || basePath === "dashboard") {
    if (roleSegment !== role) {
      return redirectWithCookies(response, request, getRolePath(basePath, role));
    }

    return response;
  }

  if (!isProtectedRoute) {
    return redirectWithCookies(response, request, canonicalHome);
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api).*)"],
};
