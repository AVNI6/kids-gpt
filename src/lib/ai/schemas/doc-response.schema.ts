import { z } from "zod";

export const DocResponseSchema = z.object({
  overview: z.string().min(1, "Overview is required"),
  docContent: z.string().min(1, "docContent is required"),
  docTheme: z.enum(["kid", "clean", "teacher"]),
  suggestedTitle: z.string().min(1, "suggestedTitle is required"),
});

export type DocResponse = z.infer<typeof DocResponseSchema>;
