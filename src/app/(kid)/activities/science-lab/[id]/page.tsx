import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import ScienceLabPage from "../page";

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function ScienceActivityPage({ params }: PageProps) {
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
    console.error("Error fetching dynamic science lab activity:", error);
    notFound();
  }

  // Make sure this is a science_lab activity type
  if (activity.activity_type !== "science_lab") {
    console.warn(`Attempted to load activity type '${activity.activity_type}' as science lab.`);
    notFound();
  }

  // Typecast and unpack the JSONB content field
  const content = activity.content as {
    experiments: Array<{
      title: string;
      setup: string;
      options: Array<{
        label: string;
        correct: boolean;
      }>;
      explanation: string;
    }>;
  };

  // Ensure content has experiments
  if (!content || !Array.isArray(content.experiments)) {
    console.error("Invalid science activity content payload:", activity.content);
    notFound();
  }

  // Define a nice dynamic science lab title
  const scienceTitle = "Dynamic Science Lab 🔬🧪";

  return <ScienceLabPage labTitle={scienceTitle} experiments={content.experiments} />;
}
