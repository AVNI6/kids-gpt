import { NextRequest, NextResponse } from "next/server";
import { processPendingSummaries } from "@/lib/services/shared/summary.actions";
import { aiLogger } from "@/lib/ai/logger";

export const dynamic = "force-dynamic";

async function handleRequest(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      aiLogger.warn("SummarizeRoute", "Unauthorized cron invocation attempt");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const result = await processPendingSummaries();

    return NextResponse.json({
      success: true,
      processedCount: result.processedCount,
    });
  } catch (error) {
    aiLogger.error("SummarizeRoute", "Error in summarize API endpoint", {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json(
      {
        error: "Internal Server Error",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  return handleRequest(req);
}

export async function GET(req: NextRequest) {
  // Allow GET for easier testing in development
  return handleRequest(req);
}
