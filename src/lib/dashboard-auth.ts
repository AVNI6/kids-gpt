import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

type UserRole = "kid" | "parent" | "teacher";

export async function checkDashboardAccess(requiredRoles: UserRole[]) {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  // Not authenticated
  if (authError || !user) {
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
