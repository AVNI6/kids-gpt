"use server";

import { createClient } from "@/lib/supabase/server";
import { sendInvitationEmail } from "./email";
import { headers } from "next/headers";
import crypto from "crypto";

export type InvitationValidationResult = {
  success: boolean;
  email?: string;
  error?: string;
};

export type InvitationCreationResult = {
  success: boolean;
  message?: string;
  inviteLink?: string;
  error?: string;
};

/**
 * Validates an invitation token.
 * Checks if the invitation exists, is not accepted, is not deleted, and has not expired.
 */
export async function validateInviteToken(token: string): Promise<InvitationValidationResult> {
  if (!token) {
    return { success: false, error: "Token is required." };
  }

  const supabase = await createClient();

  const { data: invite, error } = await supabase
    .from("child_invitations")
    .select("invitee_email, expires_at, accepted_at, deleted_at")
    .eq("token", token)
    .maybeSingle();

  if (error) {
    console.error("Error validating invite token:", error.message);
    return { success: false, error: "Failed to validate invitation token." };
  }

  if (!invite) {
    return { success: false, error: "Invitation not found." };
  }

  if (invite.accepted_at) {
    return { success: false, error: "This invitation has already been accepted." };
  }

  if (invite.deleted_at) {
    return { success: false, error: "This invitation is no longer active." };
  }

  const expiresAt = new Date(invite.expires_at);
  if (expiresAt.getTime() < Date.now()) {
    return { success: false, error: "This invitation link has expired." };
  }

  return { success: true, email: invite.invitee_email };
}

/**
 * Creates a child invitation, saves it to the database, and sends the mock email.
 */
export async function createChildInvitation(
  email: string,
  parentId: string
): Promise<InvitationCreationResult> {
  const targetEmail = email.trim().toLowerCase();
  if (!targetEmail) {
    return { success: false, error: "Email is required." };
  }

  const supabase = await createClient();

  // Generate secure 32-character token
  const token = crypto.randomBytes(16).toString("hex");

  // Expiration date (7 days from now)
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  // Get parent's name for email personalization
  const { data: parentProfile, error: profileError } = await supabase
    .from("profile")
    .select("first_name, last_name")
    .eq("user_id", parentId)
    .maybeSingle();

  const parentName = parentProfile
    ? `${parentProfile.first_name || ""} ${parentProfile.last_name || ""}`.trim() || "Your Parent"
    : "Your Parent";

  // Soft-delete any existing active invitations to the same email to avoid duplicates
  await supabase
    .from("child_invitations")
    .update({ deleted_at: new Date().toISOString() })
    .eq("invitee_email", targetEmail)
    .is("accepted_at", null)
    .is("deleted_at", null);

  // Insert invitation
  const { error: insertError } = await supabase
    .from("child_invitations")
    .insert({
      parent_id: parentId,
      invitee_email: targetEmail,
      token,
      expires_at: expiresAt.toISOString(),
    });

  if (insertError) {
    console.error("Error creating child invitation:", insertError.message);
    return { success: false, error: "Failed to create invitation in database." };
  }

  // Build the invitation link
  let baseUrl = "http://localhost:3000";
  try {
    const headersList = await headers();
    const host = headersList.get("host");
    if (host) {
      const protocol = host.includes("localhost") || host.includes("127.0.0.1") ? "http" : "https";
      baseUrl = `${protocol}://${host}`;
    }
  } catch (e) {
    if (process.env.NEXT_PUBLIC_APP_URL) {
      baseUrl = process.env.NEXT_PUBLIC_APP_URL;
    }
  }

  const inviteLink = `${baseUrl}/signup?invite_token=${token}`;

  // Send mock email
  await sendInvitationEmail(targetEmail, parentName, inviteLink);

  return {
    success: true,
    message: `An invitation email has been sent to ${targetEmail}!`,
    inviteLink,
  };
}
