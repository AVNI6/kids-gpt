"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { hasAnyGeminiApiKey, generateStructuredObject } from "@/lib/ai/structured-generator";

const jigsawDifficultySchema = z.enum(["easy", "medium", "hard", "extreme"]);
const jigsawPuzzleStyleSchema = z.enum(["square", "classic-jigsaw"]);
const snapSensitivitySchema = z.enum(["easy", "medium", "strict"]);

const jigsawPuzzleSchema = z.object({
  correctedTopic: z
    .string()
    .describe("The corrected or intended topic inferred from the user's request."),
  selectedImage: z
    .string()
    .describe(
      "A public path to an image inside /public/jigsaw-puzzle, for example /jigsaw-puzzle/dinosaur.png."
    ),
  difficulty: jigsawDifficultySchema.describe("The final difficulty level for the puzzle."),
  rows: z.number().int().min(2).max(10).describe("Number of puzzle rows."),
  columns: z.number().int().min(2).max(10).describe("Number of puzzle columns."),
  totalPieces: z
    .number()
    .int()
    .min(4)
    .max(100)
    .describe("The total number of puzzle pieces. Must equal rows multiplied by columns."),
  imageInstructions: z
    .string()
    .describe("Short instructions explaining how the image should be sliced for the puzzle."),
  gameplayTips: z
    .string()
    .describe("Kid-friendly gameplay tips that help the puzzle feel fun and playable."),
  puzzleStyle: jigsawPuzzleStyleSchema.describe("The visual style of the jigsaw puzzle."),
  recommendedPieceSize: z
    .string()
    .describe("A suggested frontend piece size, such as 72px or 96px."),
  shufflePieces: z.boolean().describe("Whether the puzzle pieces should start shuffled."),
  snapSensitivity: snapSensitivitySchema.describe("How strict the snapping behavior should be."),
  previewEnabled: z.boolean().describe("Whether a preview image should be shown before play."),
  timerRecommended: z.boolean().describe("Whether a timer is recommended for this puzzle."),
  hintsAllowed: z.boolean().describe("Whether hints should be enabled for this puzzle."),
});

export type JigsawPuzzleActivityContent = z.infer<typeof jigsawPuzzleSchema>;

/**
 * Server Action to dynamically generate a kid-friendly jigsaw puzzle configuration
 * for a given topic and save it in Supabase.
 */
export async function generateJigsawPuzzle(topic: string) {
  try {
    const trimmedTopic = topic.trim();
    if (!trimmedTopic) {
      return { error: "Please provide a topic for your jigsaw puzzle!" };
    }

    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { error: "Unauthorized. Please sign in to continue." };
    }

    const { data: profile, error: profileError } = await supabase
      .from("profile")
      .select("role")
      .eq("user_id", user.id)
      .is("deleted_at", null)
      .single();

    if (profileError || !profile || profile.role !== "kid") {
      return { error: "Only kid accounts are authorized to generate new activities!" };
    }

    if (!hasAnyGeminiApiKey) {
      return {
        error: "AI generation is currently unavailable. Please contact support or try again later.",
      };
    }

    const { object } = await generateStructuredObject({
      schema: jigsawPuzzleSchema,
      system: `You are an intelligent AI Jigsaw Puzzle Creator for children and families.

Your responsibility is to understand the user's puzzle request and generate optimized puzzle configuration metadata for a real drag-and-drop jigsaw puzzle game.

IMPORTANT CORE RULES:
- ALWAYS use images from the "/public/jigsaw-puzzle" folder.
- NEVER generate a new image.
- NEVER invent imaginary images.
- NEVER describe non-existing images.
- ONLY select images that realistically exist inside the provided jigsaw-puzzle directory.
- Your job is ONLY to configure the puzzle settings and metadata.

TOPIC UNDERSTANDING RULES:
- If the user makes spelling mistakes, grammar mistakes, incomplete words, or typing mistakes, intelligently auto-correct and infer the intended meaning.
- Always determine the most likely intended topic.

Examples:
- "dinosar" → dinosaur
- "spce rocket" → space rocket
- "animls" → animals
- "jungel" → jungle
- "carss" → cars
- "oceen" → ocean
- "unicrn" → unicorn

IMAGE SELECTION RULES:
- Select the MOST relevant image from "/public/jigsaw-puzzle".
- Match the image closely with the corrected topic.
- Prefer kid-friendly colorful images.
- If an exact match is unavailable:
  - choose the closest matching image.

PUZZLE SIZE RULES:

1. If the user explicitly specifies:
- rows
- columns
- piece count
- grid size

THEN ALWAYS use the exact requested configuration.

Examples:
- "6x6 puzzle" → rows=6 columns=6
- "8 by 8 puzzle" → rows=8 columns=8
- "make 25 pieces" → totalPieces=25
- "cut into 20 pieces" → closest balanced layout like 4x5

2. If the user does NOT specify a piece count/grid:
DEFAULT TO:
- rows = 5
- columns = 5
- totalPieces = 25

DIFFICULTY RULES:
If the user specifies difficulty instead of piece count/grid:

- Beginner
- Kids
- Very Easy
→ 2x2

- Easy
- Simple
→ 3x3

- Medium
- Normal
→ 5x5

- Hard
→ 7x7

- Extreme
- Expert
- Impossible
→ 10x10

IMPORTANT PRIORITY RULE:
- Explicit rows/columns/piece count ALWAYS overrides difficulty.

EXAMPLES:
- "hard dinosaur puzzle"
→ 7x7

- "easy animal puzzle"
→ 3x3

- "extreme space puzzle"
→ 10x10

- "8x8 jungle puzzle"
→ 8x8

- "make puzzle of cat"
→ default 5x5

IMAGE CUTTING RULES:
- The selected image will be sliced into puzzle pieces using the Sharp library.
- Puzzle pieces must be optimized for drag-and-drop gameplay.
- Prefer balanced grids whenever possible.
- Ensure puzzle dimensions work smoothly for frontend rendering.

GAMEPLAY OPTIMIZATION RULES:
- Ensure gameplay is fun and kid-friendly.
- Avoid impossible configurations unless explicitly requested.
- Keep puzzle layouts visually balanced.
- Ensure smooth experience for mobile and desktop devices.
- Make the puzzle enjoyable and educational.

RETURN FORMAT RULES:
Always return:

1. correctedTopic
   - The corrected/intended topic

2. selectedImage
   - Relative image path from "/public/jigsaw-puzzle"

3. difficulty
   - easy | medium | hard | extreme

4. rows
   - Number of puzzle rows

5. columns
   - Number of puzzle columns

6. totalPieces
   - rows × columns

7. imageInstructions
   - Short explanation about how the image should be sliced

8. gameplayTips
   - Kid-friendly gameplay advice

9. puzzleStyle
   - square | classic-jigsaw

10. recommendedPieceSize
   - Suggested frontend piece size

11. shufflePieces
   - boolean

12. snapSensitivity
   - easy | medium | strict

13. previewEnabled
   - boolean

14. timerRecommended
   - boolean

15. hintsAllowed
   - boolean

IMPORTANT VALIDATION RULES:
- totalPieces MUST equal rows × columns.
- Always return clean structured data.
- Never return markdown.
- Never explain outside schema.
- Never generate additional text.
- Ensure output works perfectly for:
  - Next.js
  - React DnD
  - Sharp image slicing
  - Konva/Fabric canvas rendering
  - Real drag-drop jigsaw puzzle systems

The final result must be optimized for a production-grade educational jigsaw puzzle application for children.
`,
      prompt: `
The user wants to create a jigsaw puzzle.

USER REQUEST:
"${trimmedTopic}"

YOUR TASK:
1. Understand and auto-correct the intended topic if needed.
2. Select the most relevant image from "/public/jigsaw-puzzle".
3. Detect:
   - difficulty
   - piece count
   - rows/columns
   - grid size
4. If no size/count is provided:
   - use default 5x5.
5. Generate optimized puzzle metadata.
6. Ensure the puzzle works perfectly for:
   - drag-drop gameplay
   - Sharp image slicing
   - React puzzle rendering
   - kid-friendly educational gameplay.
`,
    });

    const { data: insertedRow, error: insertError } = await supabase
      .from("generated_activities")
      .insert({
        kid_user_id: user.id,
        activity_type: "jigsaw_puzzle",
        content: object,
      })
      .select("id")
      .single();

    if (insertError) {
      console.error("Database error saving generated jigsaw puzzle activity:", insertError);
      return { error: `Failed to save jigsaw puzzle activity: ${insertError.message}` };
    }

    return {
      success: true,
      activityId: insertedRow.id,
      data: object,
    };
  } catch (err) {
    console.error("Error in generateJigsawPuzzle server action:", err);
    return {
      error:
        err instanceof Error
          ? err.message
          : "An unexpected error occurred during jigsaw puzzle generation.",
    };
  }
}
