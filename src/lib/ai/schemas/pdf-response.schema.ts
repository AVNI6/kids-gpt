import { z } from "zod";

export const PdfResponseSchema = z.object({
  overview: z.string().min(1, "Overview is required"),
  pdfContent: z.string().min(1, "pdfContent is required"),
  pdfTheme: z.enum(["kid", "clean", "teacher"]),
  suggestedTitle: z.string().min(1, "suggestedTitle is required"),
});

export type PdfResponse = z.infer<typeof PdfResponseSchema>;
