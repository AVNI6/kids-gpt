import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import JigsawPuzzleStudio from "../../../../../components/kid/jigsaw-puzzle/JigsawPuzzleStudio";
import { type JigsawPuzzleActivityContent } from "@/types/activities.type";

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function JigsawPuzzleActivityPage({ params }: PageProps) {
  const { id } = await params;

  if (!id) {
    notFound();
  }

  const supabase = await createClient();

  const { data: activity, error } = await supabase
    .from("generated_activities")
    .select("id, kid_user_id, activity_type, content, created_at")
    .eq("id", id)
    .is("deleted_at", null)
    .single();

  if (error || !activity) {
    console.error("Error fetching dynamic jigsaw activity:", error);
    notFound();
  }

  if (activity.activity_type !== "jigsaw_puzzle") {
    console.warn(`Attempted to load activity type '${activity.activity_type}' as jigsaw puzzle.`);
    notFound();
  }

  const content = activity.content as JigsawPuzzleActivityContent;

  if (
    !content ||
    !content.selectedImage ||
    !content.rows ||
    !content.columns ||
    content.totalPieces !== content.rows * content.columns
  ) {
    console.error("Invalid jigsaw puzzle activity content payload:", activity.content);
    notFound();
  }

  const title = `${content.correctedTopic} Jigsaw Puzzle 🧩`;
  const subtitle =
    "Your custom puzzle is ready. Review the blueprint, inspect the scene, and enjoy the finished build.";

  return (
    <JigsawPuzzleStudio
      title={title}
      subtitle={subtitle}
      content={content}
      accentLabel="Custom Jigsaw Build"
    />
  );
}
