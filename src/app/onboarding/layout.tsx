import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function OnboardingLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  // Case 1: Unauthenticated user -> Redirect to signin
  if (authError || !user) {
    redirect("/signin");
  }

  // Fetch user profile to check onboarding completion
  const { data: profile, error: profileError } = await supabase
    .from("profile")
    .select("is_onboarded, role")
    .eq("user_id", user.id)
    .maybeSingle();

  if (profileError) {
    console.error("OnboardingLayout: Error fetching user profile:", profileError);
  }

  // Case 2: Onboarding completed -> Redirect to root page
  if (profile?.is_onboarded) {
    redirect("/");
  }

  // Case 3: User who still needs onboarding -> Proceed
  return <>{children}</>;
}
