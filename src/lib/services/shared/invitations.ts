"use server";

import { createClient } from "@/lib/supabase/server";
import { sendInvitationEmail } from "./email";
import { headers } from "next/headers";
import crypto from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";

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

  if (profileError) {
    console.error("Error fetching parent profile for child invitation:", profileError.message);
  }

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
  let baseUrl = "";
  try {
    const headersList = await headers();
    const host = headersList.get("x-forwarded-host") || headersList.get("host");
    const proto = headersList.get("x-forwarded-proto") ||
      (host && (host.includes("localhost") || host.includes("127.0.0.1")) ? "http" : "https");
    if (host) {
      baseUrl = `${proto}://${host}`;
    }
  } catch {
    // Fallback when headers() is not available
  }

  if (!baseUrl) {
    baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SITE_URL || "";
  }

  // Normalize trailing slash
  baseUrl = baseUrl.replace(/\/$/, "");

  const inviteLink = `${baseUrl}/signup?invite_token=${token}`;

  // Send mock email
  await sendInvitationEmail(targetEmail, parentName, inviteLink);

  return {
    success: true,
    message: `An invitation email has been sent to ${targetEmail}!`,
    inviteLink,
  };
}

/**
 * Given an invite token stored in the user's metadata,
 * resolves and returns the inviting parent's email address.
 * Used to pre-fill the parentEmail field on the kid onboarding page.
 */
export async function getParentEmailByInviteToken(token: string): Promise<string | null> {
  const res = await getParentDetailsByInviteToken(token);
  return res.parentEmail;
}

export type ParentDetailsResult = {
  parentId: string | null;
  parentEmail: string | null;
  error?: string;
};

/**
 * Resolves the parent_id and parent_email for an invitation token securely from the database.
 */
export async function getParentDetailsByInviteToken(token: string): Promise<ParentDetailsResult> {
  if (!token) return { parentId: null, parentEmail: null, error: "Invitation token is missing." };

  const adminClient = createAdminClient();

  // Find the invitation row by token (must be active and unexpired)
  const { data: invite, error: inviteError } = await adminClient
    .from("child_invitations")
    .select("parent_id, invitee_email, expires_at, accepted_at, deleted_at")
    .eq("token", token)
    .maybeSingle();

  if (inviteError) {
    console.error("Error finding invitation:", inviteError.message);
    return { parentId: null, parentEmail: null, error: "Failed to query invitation." };
  }

  if (!invite) {
    return { parentId: null, parentEmail: null, error: "Invitation not found." };
  }

  if (invite.accepted_at) {
    return { parentId: null, parentEmail: null, error: "This invitation has already been accepted." };
  }

  if (invite.deleted_at) {
    return { parentId: null, parentEmail: null, error: "This invitation is no longer active." };
  }

  const expiresAt = new Date(invite.expires_at);
  if (expiresAt.getTime() < Date.now()) {
    return { parentId: null, parentEmail: null, error: "This invitation link has expired." };
  }

  // Resolve parent's email from their profile
  const { data: parentProfile, error: profileError } = await adminClient
    .from("profile")
    .select("email")
    .eq("user_id", invite.parent_id)
    .is("deleted_at", null)
    .maybeSingle();

  if (profileError || !parentProfile?.email) {
    console.error("Error finding parent profile:", profileError?.message);
    return { parentId: null, parentEmail: null, error: "Parent profile not found." };
  }

  return {
    parentId: invite.parent_id,
    parentEmail: parentProfile.email,
  };
}
