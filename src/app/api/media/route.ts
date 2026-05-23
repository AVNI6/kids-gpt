import { GoogleGenAI } from "@google/genai";
import path from "path";

export const runtime = "nodejs";

const ai = new GoogleGenAI({
  apiKey: process.env.GOOGLE_GEMINI_API_KEY!,
});

const getErrorMessage = (error: Error) => error.message || "Unknown error";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();

    const file = formData.get("file") as File | null;
    const prompt = (formData.get("prompt") as string) || "Describe this file";

    if (!file) {
      return Response.json({ error: "No file uploaded" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const tempPath = path.join("/tmp", file.name);
    await import("fs/promises").then((fs) => fs.writeFile(tempPath, buffer));

    const uploadedFile = await ai.files.upload({
      file: tempPath,
      config: {
        mimeType: file.type || "application/octet-stream",
      },
    });

    console.log("Uploaded file:", uploadedFile);

    const result = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: [
        {
          role: "user",
          parts: [
            {
              fileData: {
                fileUri: uploadedFile.uri,
                mimeType: uploadedFile.mimeType,
              },
            },
            { text: `\n\n${prompt}` },
          ],
        },
      ],
    });

    return Response.json({
      success: true,
      file: uploadedFile,
      text: result.text,
    });
  } catch (err) {
    const error = err instanceof Error ? err : new Error(String(err));
    console.error(error);
    return Response.json({ error: getErrorMessage(error) || "Upload failed" }, { status: 500 });
  }
}

// =========================
// GET: Fetch file metadata
// =========================
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const name = searchParams.get("name");

    if (!name) {
      return Response.json({ error: "File name required" }, { status: 400 });
    }

    const file = await ai.files.get({
      name,
    });

    return Response.json({
      success: true,
      file,
    });
  } catch (err) {
    const error = err instanceof Error ? err : new Error(String(err));
    console.error(error);
    return Response.json({ error: getErrorMessage(error) || "Fetch failed" }, { status: 500 });
  }
}
