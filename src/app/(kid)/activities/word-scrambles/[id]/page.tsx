import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import WordScramblesPage from "../page";

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function ScrambleActivityPage({ params }: PageProps) {
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
    console.error("Error fetching dynamic scramble activity:", error);
    notFound();
  }

  // Make sure this is a word_scramble activity type
  if (activity.activity_type !== "word_scramble") {
    console.warn(`Attempted to load activity type '${activity.activity_type}' as word scramble.`);
    notFound();
  }

  // Typecast and unpack the JSONB content field
  const content = activity.content as {
    words: Array<{
      answer: string;
      scrambled: string;
      hint: string;
    }>;
  };

  // Ensure content has words
  if (!content || !Array.isArray(content.words)) {
    console.error("Invalid scramble activity content payload:", activity.content);
    notFound();
  }

  // Define a nice dynamic scramble title
  const scrambleTitle = "Dynamic Word Scramble 🔠";

  return <WordScramblesPage scrambleTitle={scrambleTitle} words={content.words} />;
}
