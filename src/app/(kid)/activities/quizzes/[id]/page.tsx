import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import QuizzesPage from "../page";
import { type QuizActivityContent } from "@/types/activities.type";

interface PageProps {
  params: Promise<{
    id: string;
  }>;
  searchParams: Promise<{
    assignment_id?: string;
  }>;
}

export default async function QuizActivityPage({ params, searchParams }: PageProps) {
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
    console.error("Error fetching dynamic quiz activity:", error);
    notFound();
  }

  // Make sure this is a quiz activity type
  if (activity.activity_type !== "quiz") {
    console.warn(`Attempted to load activity type '${activity.activity_type}' as quiz.`);
    notFound();
  }

  const content = activity.content as QuizActivityContent;

  // Ensure content has questions
  if (!content || !Array.isArray(content.questions)) {
    console.error("Invalid quiz activity content payload:", activity.content);
    notFound();
  }

  const quizTitle = "AI Quiz Quest ✨";

  return (
    <QuizzesPage quizTitle={quizTitle} questions={content.questions} assignmentId={assignment_id} />
  );
}
