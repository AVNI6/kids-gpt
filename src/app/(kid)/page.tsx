import { Suspense } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ChatInterface from "@/components/shared/chat-interface/ChatInterface";
import ChatSkeleton from "@/components/shared/chat-interface/ChatSkeleton";

interface PageProps {
  searchParams: Promise<{ id?: string }>;
}

export default async function Home({ searchParams }: PageProps) {
  const resolvedSearchParams = await searchParams;

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
      if (!profile.is_onboarded) {
        redirect("/onboarding");
      }
    }
  }

  return (
    <Suspense fallback={resolvedSearchParams.id ? <ChatSkeleton /> : null}>
      <ChatInterface initialSessionId={resolvedSearchParams.id} />
    </Suspense>
  );
}
