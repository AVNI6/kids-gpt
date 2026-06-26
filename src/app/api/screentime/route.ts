import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getLocalDateString } from "@/lib/utils";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    // Verify authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { childId, activeSeconds, timezone = "Asia/Kolkata" } = await request.json();

    if (!childId || activeSeconds === undefined || activeSeconds === null) {
      return NextResponse.json({ success: false, error: "Invalid parameters" }, { status: 400 });
    }

    // Capture local date string using getLocalDateString
    const todayStr = getLocalDateString(new Date(), timezone);

    // Call atomic PostgreSQL function increment_screen_time
    const { error: rpcError } = await supabase.rpc("increment_screen_time", {
      p_child_id: childId,
      p_date: todayStr,
      p_seconds: activeSeconds,
    });

    if (rpcError) {
      console.error("[Route: API Screentime] Postgres RPC Error:", rpcError);
      return NextResponse.json({ success: false, error: rpcError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[Route: API Screentime] Error in screentime POST:", err);
    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : "An unexpected error occurred.",
      },
      { status: 500 }
    );
  }
}
