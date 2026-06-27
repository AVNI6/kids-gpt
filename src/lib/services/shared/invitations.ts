"use server";

import { createClient } from "@/lib/supabase/server";
import { sendInvitationEmail } from "./email";
import { headers } from "next/headers";
import crypto from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

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

  // 1. Check if the parent is already linked to a child with this email
  const { data: targetProfile } = await supabase
    .from("profile")
    .select("user_id")
    .eq("email", targetEmail)
    .is("deleted_at", null)
    .maybeSingle();

  if (targetProfile) {
    const { data: existingLink } = await supabase
      .from("parent_child_link")
      .select("id")
      .eq("parent_user_id", parentId)
      .eq("child_user_id", targetProfile.user_id)
      .eq("is_active", true)
      .is("deleted_at", null)
      .maybeSingle();

    if (existingLink) {
      return { success: false, error: "You are already linked with this child profile." };
    }
  }

  // 2. Check if there is an active pending invitation sent by this parent to this email
  const { data: existingInvite } = await supabase
    .from("child_invitations")
    .select("id")
    .eq("parent_id", parentId)
    .eq("invitee_email", targetEmail)
    .is("accepted_at", null)
    .is("deleted_at", null)
    .gt("expires_at", new Date().toISOString())
    .maybeSingle();

  if (existingInvite) {
    return { success: false, error: "An invitation is already pending for this email." };
  }

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

  // Soft-delete any existing active/expired/cancelled duplicate invitations from THIS parent to avoid duplicates
  await supabase
    .from("child_invitations")
    .update({ deleted_at: new Date().toISOString() })
    .eq("invitee_email", targetEmail)
    .eq("parent_id", parentId)
    .is("accepted_at", null)
    .is("deleted_at", null);

  // Insert invitation
  const { error: insertError } = await supabase.from("child_invitations").insert({
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
    const proto =
      headersList.get("x-forwarded-proto") ||
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
  try {
    await sendInvitationEmail(targetEmail, parentName, inviteLink);
  } catch (emailErr) {
    console.error("Failed to send invitation email:", emailErr);
    // Rollback: delete the inserted invitation row from the database so it's not locked as "pending"
    await supabase.from("child_invitations").delete().eq("token", token);
    return {
      success: false,
      error: "Failed to send invitation email. Please check your SMTP configuration and try again.",
    };
  }

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
    return {
      parentId: null,
      parentEmail: null,
      error: "This invitation has already been accepted.",
    };
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

export type PendingInvitation = {
  id: string;
  parent_id: string;
  invitee_email: string;
  expires_at: string;
  created_at: string;
  parent_name: string;
  parent_email: string;
  parent_avatar: string | null;
  parent_username: string | null;
};

/**
 * Retrieves active pending invitations for the authenticated child.
 */
export async function getPendingInvitations(): Promise<PendingInvitation[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !user.email) return [];

  const { data: invites, error } = await supabase
    .from("child_invitations")
    .select("id, parent_id, invitee_email, expires_at, created_at")
    .eq("invitee_email", user.email.trim().toLowerCase())
    .is("accepted_at", null)
    .is("deleted_at", null)
    .gt("expires_at", new Date().toISOString())
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching pending invitations:", error.message);
    return [];
  }

  if (!invites || invites.length === 0) return [];

  const parentIds = Array.from(new Set(invites.map((i) => i.parent_id)));
  const adminClient = createAdminClient();
  const { data: profiles } = await adminClient
    .from("profile")
    .select("user_id, first_name, last_name, email, username, avatar_url")
    .in("user_id", parentIds);

  const profileMap = new Map(profiles?.map((p) => [p.user_id, p]) || []);

  return invites.map((invite) => {
    const profile = profileMap.get(invite.parent_id);
    return {
      id: invite.id,
      parent_id: invite.parent_id,
      invitee_email: invite.invitee_email,
      expires_at: invite.expires_at,
      created_at: invite.created_at,
      parent_name: profile
        ? `${profile.first_name || ""} ${profile.last_name || ""}`.trim() ||
          profile.username ||
          "Parent"
        : "Parent",
      parent_email: profile?.email || "",
      parent_avatar: profile?.avatar_url || null,
      parent_username: profile?.username || null,
    };
  });
}

export type SentInvitation = {
  id: string;
  invitee_email: string;
  expires_at: string;
  created_at: string;
};

/**
 * Retrieves active pending invitations sent by the authenticated parent.
 */
export async function getSentPendingInvitations(): Promise<SentInvitation[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("child_invitations")
    .select("id, invitee_email, expires_at, created_at")
    .eq("parent_id", user.id)
    .is("accepted_at", null)
    .is("deleted_at", null)
    .gt("expires_at", new Date().toISOString())
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching sent pending invitations:", error.message);
    return [];
  }

  return data || [];
}

/**
 * Accepts a child invitation transactionally and idempotently.
 */
export async function acceptChildInvitation(
  inviteId: string
): Promise<{ success: boolean; error?: string }> {
  if (!inviteId) return { success: false, error: "Invitation ID is required." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated." };

  // Call the transactional accept_child_invitation RPC
  const { data, error } = await supabase.rpc("accept_child_invitation", {
    p_invite_id: inviteId,
    p_child_user_id: user.id,
  });

  if (error) {
    console.error("Error accepting child invitation via RPC:", error.message);
    return { success: false, error: error.message };
  }

  const result = data as { status: string; message: string } | null;
  if (!result || result.status === "error") {
    return { success: false, error: result?.message || "Failed to accept invitation." };
  }

  // Clear metadata token if the user signed up using it and it's still present
  if (user.user_metadata?.invite_token) {
    const adminClient = createAdminClient();
    await adminClient.auth.admin.updateUserById(user.id, {
      user_metadata: {
        ...user.user_metadata,
        invite_token: null,
      },
    });
  }

  revalidatePath("/dashboard/kid");
  return { success: true };
}

/**
 * Declines a child invitation (soft-deletes it so the kid no longer sees it).
 */
export async function declineChildInvitation(
  inviteId: string
): Promise<{ success: boolean; error?: string }> {
  if (!inviteId) return { success: false, error: "Invitation ID is required." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated." };

  const { error } = await supabase
    .from("child_invitations")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", inviteId)
    .eq("invitee_email", user.email?.trim().toLowerCase() || "")
    .is("accepted_at", null)
    .is("deleted_at", null);

  if (error) {
    console.error("Error declining child invitation:", error.message);
    return { success: false, error: "Failed to decline invitation." };
  }

  revalidatePath("/dashboard/kid");
  return { success: true };
}

/**
 * Cancels a child invitation sent by the parent.
 */
export async function cancelChildInvitation(
  inviteId: string
): Promise<{ success: boolean; error?: string }> {
  if (!inviteId) return { success: false, error: "Invitation ID is required." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated." };

  const { error } = await supabase
    .from("child_invitations")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", inviteId)
    .eq("parent_id", user.id)
    .is("accepted_at", null)
    .is("deleted_at", null);

  if (error) {
    console.error("Error cancelling child invitation:", error.message);
    return { success: false, error: "Failed to cancel invitation." };
  }

  revalidatePath("/dashboard/parent");
  return { success: true };
}
