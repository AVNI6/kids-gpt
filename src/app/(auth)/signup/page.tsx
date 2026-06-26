import { Suspense } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AuthSkeleton } from "@/components/shared/skeletonLoading";
import SignupForm from "./SignupForm";

export const dynamic = "force-dynamic";

export default async function SignupPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const { data: profile } = await supabase
      .from("profile")
      .select("is_onboarded, role")
      .eq("user_id", user.id)
      .maybeSingle();

    if (profile) {
      if (profile.is_onboarded) {
        redirect("/");
      } else {
        redirect(user.user_metadata?.invite_token ? "/onboarding/kid" : "/onboarding");
      }
    }
  }

  return (
    <Suspense fallback={<AuthSkeleton />}>
      <SignupForm />
    </Suspense>
  );
}
