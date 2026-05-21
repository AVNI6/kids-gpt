import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import ColorMixerPage from "../page";

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function ColorMixerActivityPage({ params }: PageProps) {
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
    console.error("Error fetching dynamic color mixer activity:", error);
    notFound();
  }

  // Make sure this is a color_mixer activity type
  if (activity.activity_type !== "color_mixer") {
    console.warn(`Attempted to load activity type '${activity.activity_type}' as color mixer.`);
    notFound();
  }

  // Typecast and unpack the JSONB content field
  const content = activity.content as {
    levels: Array<{
      targetColorName: string;
      targetHex: string;
      requiredColors: string[];
      hint: string;
    }>;
  };

  // Ensure content has levels
  if (!content || !Array.isArray(content.levels)) {
    console.error("Invalid color mixer activity content payload:", activity.content);
    notFound();
  }

  // Define a nice dynamic color mixer title
  const mixerTitle = "Dynamic Color Mixer 🎨🧪";

  return <ColorMixerPage mixerTitle={mixerTitle} levels={content.levels} />;
}
