import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function ParentOnboardingLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/signin");
  }

  const { data: profile } = await supabase
    .from("profile")
    .select("role")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!profile || profile.role !== "parent") {
    redirect("/onboarding");
  }

  return <>{children}</>;
}
