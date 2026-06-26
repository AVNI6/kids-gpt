import { NextRequest, NextResponse } from "next/server";
import { activeGenerations } from "@/lib/ai/active-generations";
import { createClient } from "@/lib/supabase/server";
import { aiLogger } from "@/lib/ai/logger";

export async function POST(req: NextRequest) {
  try {
    const { messageId, sessionId } = await req.json();

    if (!messageId) {
      return NextResponse.json({ error: "Missing messageId" }, { status: 400 });
    }

    aiLogger.info(
      "ChatStopAPI",
      `Received stop request for message: ${messageId}, session: ${sessionId}`
    );

    // Retrieve and abort the active controller
    const controller = activeGenerations.get(messageId);
    if (controller) {
      controller.abort();
      activeGenerations.delete(messageId);
      aiLogger.info("ChatStopAPI", `Aborted generation controller for message: ${messageId}`);
    } else {
      aiLogger.warn("ChatStopAPI", `No active controller found for message: ${messageId}`);
    }

    // Update status in the database to failed so that the UI stops loading it
    try {
      const supabase = await createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        // Fetch current content first to preserve whatever was generated so far
        const { data: currentMsg } = await supabase
          .from("chat_messages")
          .select("content")
          .eq("id", messageId)
          .maybeSingle();

        const existingContent = currentMsg?.content || "";
        const hasTermination =
          existingContent.includes("Session has been terminated") ||
          existingContent.includes("terminated");
        const stopContent = hasTermination
          ? existingContent
          : existingContent.trim()
            ? `${existingContent}\n\n*(Session has been terminated.)*`
            : "Session has been terminated.";

        const rowExists = currentMsg !== null;

        if (rowExists) {
          // Message already exists, update it
          const { error: updateErr } = await supabase
            .from("chat_messages")
            .update({
              status: "failed",
              content: stopContent,
            })
            .eq("id", messageId);

          if (updateErr) throw updateErr;
          aiLogger.info(
            "ChatStopAPI",
            `Marked existing message ${messageId} as failed/stopped in DB`
          );
        } else {
          // Message does not exist (meaning client stopped before server placeholder was created).
          // We insert a placeholder directly to prevent client from polling forever.
          let resolvedSessionId = sessionId;
          if (!resolvedSessionId) {
            // Fallback: try to find the latest active session for this user
            const { data: latestSession } = await supabase
              .from("chat_sessions")
              .select("id")
              .eq("user_id", user.id)
              .order("updated_at", { ascending: false })
              .limit(1)
              .maybeSingle();
            resolvedSessionId = latestSession?.id;
          }

          if (resolvedSessionId) {
            const { error: insertErr } = await supabase.from("chat_messages").insert({
              id: messageId,
              user_id: user.id,
              session_id: resolvedSessionId,
              sender_role: "model",
              content: stopContent,
              status: "failed",
            });

            if (insertErr) throw insertErr;
            aiLogger.info(
              "ChatStopAPI",
              `Inserted stopped placeholder message ${messageId} directly into DB`
            );
          } else {
            aiLogger.warn(
              "ChatStopAPI",
              `Could not insert stopped message because sessionId is missing`
            );
          }
        }
      }
    } catch (dbErr) {
      aiLogger.error("ChatStopAPI", "Failed to update status in DB for stopped message", {
        error: dbErr instanceof Error ? dbErr.message : String(dbErr),
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    aiLogger.error("ChatStopAPI", "Error handling stop request", {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
