import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import MathChallengesPage from "../page";

interface PageProps {
  params: Promise<{
    id: string;
  }>;
  searchParams: Promise<{
    assignment_id?: string;
  }>;
}

export default async function MathActivityPage({ params, searchParams }: PageProps) {
  // Await params as required by Next.js 15/16 rules
  const { id } = await params;
  const { assignment_id } = await searchParams;

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
    console.error("Error fetching dynamic math activity:", error);
    notFound();
  }

  // Make sure this is a math_challenge activity type
  if (activity.activity_type !== "math_challenge") {
    console.warn(`Attempted to load activity type '${activity.activity_type}' as math challenge.`);
    notFound();
  }

  // Typecast and unpack the JSONB content field
  const content = activity.content as {
    equations: Array<{
      question: string;
      answer: number;
      options: number[];
    }>;
  };

  // Ensure content has equations
  if (!content || !Array.isArray(content.equations)) {
    console.error("Invalid math activity content payload:", activity.content);
    notFound();
  }

  // Define a nice dynamic math challenge title
  const challengeTitle = "Dynamic Math Challenge 🧮";

  return (
    <MathChallengesPage
      challengeTitle={challengeTitle}
      equations={content.equations}
      assignmentId={assignment_id}
    />
  );
}
