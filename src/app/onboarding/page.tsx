import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { RoleOnboardingPage } from "@/components/shared/onboarding/role-onboarding-page";

export default async function OnboardingSelectionPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/signin");
  }

  const { data: profile } = await supabase
    .from("profile")
    .select("is_onboarded, role")
    .eq("user_id", user.id)
    .maybeSingle();

  if (profile?.is_onboarded) {
    redirect("/");
  }

  if (user.user_metadata?.invite_token) {
    redirect("/onboarding/kid");
  }

  if (profile?.role === "parent" || profile?.role === "teacher") {
    redirect(`/onboarding/${profile.role}`);
  }

  return <RoleOnboardingPage />;
}
