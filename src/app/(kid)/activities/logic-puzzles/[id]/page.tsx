import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import LogicPuzzlesPage from "../page";

interface PageProps {
  params: Promise<{
    id: string;
  }>;
  searchParams: Promise<{
    assignment_id?: string;
  }>;
}

export default async function LogicActivityPage({ params, searchParams }: PageProps) {
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
    console.error("Error fetching dynamic logic activity:", error);
    notFound();
  }

  // Make sure this is a logic_puzzle activity type
  if (activity.activity_type !== "logic_puzzle") {
    console.warn(`Attempted to load activity type '${activity.activity_type}' as logic puzzle.`);
    notFound();
  }

  // Typecast and unpack the JSONB content field
  const content = activity.content as {
    puzzles: Array<{
      sequence: string[];
      options: Array<{
        label: string;
        correct: boolean;
      }>;
      hint: string;
    }>;
  };

  // Ensure content has puzzles
  if (!content || !Array.isArray(content.puzzles)) {
    console.error("Invalid logic puzzle activity content payload:", activity.content);
    notFound();
  }

  // Define a nice dynamic logic puzzle title
  const puzzleTitle = "Dynamic Logic Puzzle 🧩";

  return (
    <LogicPuzzlesPage
      puzzleTitle={puzzleTitle}
      puzzles={content.puzzles}
      assignmentId={assignment_id}
    />
  );
}
