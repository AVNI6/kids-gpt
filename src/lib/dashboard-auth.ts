import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { cookies, headers } from "next/headers";

type UserRole = "kid" | "parent" | "teacher";

export async function checkDashboardAccess(requiredRoles: UserRole[]) {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  // Not authenticated
  if (authError || !user) {
    // Detect if this is a prefetch request
    let isPrefetch = false;
    try {
      const headerStore = await headers();
      isPrefetch =
        headerStore.get("purpose") === "prefetch" ||
        headerStore.get("next-router-prefetch") === "1" ||
        headerStore.get("sec-purpose") === "prefetch";
    } catch {
      // Ignore errors outside of request context
    }

    if (isPrefetch) {
      const cookieStore = await cookies();
      const hasAuthCookie = cookieStore.getAll().some((c) => c.name.startsWith("sb-"));
      // If we have an auth cookie, it's likely just expired and needs refresh on the actual request.
      // Do not redirect prefetch requests to prevent caching redirect to /signin.
      if (hasAuthCookie) {
        return;
      }
    }

    redirect("/signin");
  }

  const { data: profile, error: profileError } = await supabase
    .from("profile")
    .select("role")
    .eq("user_id", user.id)
    .is("deleted_at", null)
    .maybeSingle();

  // Profile not found or role not set
  if (profileError || !profile || !profile.role) {
    redirect("/onboarding");
  }

  // Check if user's role is allowed
  if (!requiredRoles.includes(profile.role)) {
    // Redirect to their correct dashboard based on their role
    const roleRedirectMap: Record<string, string> = {
      kid: "/dashboard/kid",
      parent: "/dashboard/parent",
      teacher: "/dashboard/teacher",
    };

    redirect(roleRedirectMap[profile.role] || "/dashboard/" + profile.role);
  }
}
