import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import FlashcardsPage from "../page";
import { type FlashcardActivityContent } from "@/types/activities.type";

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function FlashcardActivityPage({ params }: PageProps) {
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
    console.error("Error fetching dynamic flashcard activity:", error);
    notFound();
  }

  // Make sure this is a flashcard activity type
  if (activity.activity_type !== "flashcards") {
    console.warn(`Attempted to load activity type '${activity.activity_type}' as flashcard.`);
    notFound();
  }

  const content = activity.content as unknown as FlashcardActivityContent;

  // Ensure content has flashcards
  if (!content || !Array.isArray(content.flashcards)) {
    console.error("Invalid flashcards activity content payload:", activity.content);
    notFound();
  }

  const deckTitle = "AI Flashcard Quest ✨";

  return <FlashcardsPage deckTitle={deckTitle} flashcards={content.flashcards} />;
}
