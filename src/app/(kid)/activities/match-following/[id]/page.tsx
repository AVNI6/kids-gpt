import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import MatchFollowingPage from "../page";

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function MatchFollowingActivityPage({ params }: PageProps) {
  // Await params as required by Next.js 15/16 rules
  const { id } = await params;

  if (!id) {
    notFound();
  }

  // Create server-side Supabase client
  const supabase = await createClient();

  // Fetch the dynamic activity row from generated_activities
  const { data: activity, error } = await supabase
    .from("generated_activities")
    .select("id, kid_user_id, activity_type, content, created_at")
    .eq("id", id)
    .is("deleted_at", null)
    .single();

  if (error || !activity) {
    console.error("Error fetching dynamic match pairs activity:", error);
    notFound();
  }

  // Make sure this is a match_pairs activity type
  if (activity.activity_type !== "match_pairs") {
    console.warn(`Attempted to load activity type '${activity.activity_type}' as match pairs.`);
    notFound();
  }

  // Typecast and unpack the JSONB content field
  const content = activity.content as {
    pairs: Array<{
      id: string;
      leftText: string;
      rightText: string;
    }>;
  };

  // Ensure content has pairs
  if (!content || !Array.isArray(content.pairs)) {
    console.error("Invalid match pairs activity content payload:", activity.content);
    notFound();
  }

  // Define a nice dynamic match pairs title
  const matchTitle = "Dynamic Match Pairs 🔗🧩";

  return <MatchFollowingPage matchTitle={matchTitle} pairs={content.pairs} />;
}
