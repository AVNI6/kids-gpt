import Link from "next/link";

import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/server";
import { ConnectionCodeCopy } from "@/components/profile/connection-code-copy";

type Role = "parent" | "kid" | "teacher";
const allowedRoles: Role[] = ["parent", "kid", "teacher"];

type ProfileRow = {
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  username: string | null;
  role: Role | null;
  connection_code: string | null;
  total_experience_points: number | null;
  current_streak: number | null;
  avatar_url: string | null;
};

type ParentChildLinkRow = {
  child_user_id: string;
  parent_user_id: string;
  is_approved: boolean | null;
};

type KidPermissionRow = {
  id: string;
  default_id: string | null;
  is_allowed: boolean | null;
  created_at: string | null;
  deleted_at: string | null;
};

type KidPermissionDefaultRow = {
  id: string;
  category: string | null;
  default_allowed: boolean | null;
};

export default async function ProfilePage({ params }: { params: { role: string } }) {
  const roleParam = params.role as Role;
  if (!allowedRoles.includes(roleParam)) return null;

  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  const user = userData?.user;
  if (!user) return null; // middleware should have redirected

  // Fetch profile for current user (RLS will enforce owners-only)
  const { data: profile, error: profileError } = await supabase
    .from("profile")
    .select(
      "user_id, first_name, last_name, username, role, connection_code, total_experience_points, current_streak, avatar_url"
    )
    .eq("user_id", user.id)
    .maybeSingle<ProfileRow>();

  if (profileError || !profile) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-linear-to-br from-sky-50 via-white to-emerald-50 px-6 text-slate-900">
        <Card className="w-full max-w-lg rounded-[28px] border-sky-100 shadow-sm">
          <CardContent className="p-8 text-center">
            <h1 className="text-2xl font-black">Profile not found</h1>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Your profile row could not be loaded yet. Please refresh, or complete onboarding if
              this is a new account.
            </p>
            <Link
              href={`/dashboard/${roleParam}`}
              className="mt-5 inline-flex text-sm font-semibold text-sky-600"
            >
              Back to dashboard
            </Link>
          </CardContent>
        </Card>
      </main>
    );
  }

  // Parent-specific: fetch linked kids (approved)
  let linkedKids: ProfileRow[] = [];
  if (roleParam === "parent") {
    const { data: links } = await supabase
      .from("parent_child_link")
      .select("child_user_id")
      .eq("parent_user_id", user.id)
      .eq("is_approved", true)
      .returns<ParentChildLinkRow[]>();

    const childIds = (links || []).map((link) => link.child_user_id).filter(Boolean);
    if (childIds.length > 0) {
      const { data: kids } = await supabase
        .from("profile")
        .select("user_id, username, avatar_url, total_experience_points, current_streak")
        .in("user_id", childIds)
        .returns<ProfileRow[]>();
      linkedKids = kids || [];
    }
  }

  // Kid-specific: fetch parents and permissions
  let parents: ProfileRow[] = [];
  let permissions: KidPermissionRow[] = [];
  let permissionDefaults: KidPermissionDefaultRow[] = [];
  if (roleParam === "kid") {
    const { data: pLinks } = await supabase
      .from("parent_child_link")
      .select("parent_user_id, is_approved")
      .eq("child_user_id", user.id)
      .eq("is_approved", true)
      .returns<ParentChildLinkRow[]>();

    const parentIds = (pLinks || []).map((link) => link.parent_user_id).filter(Boolean);
    if (parentIds.length > 0) {
      const { data: pProfiles } = await supabase
        .from("profile")
        .select("user_id, first_name, last_name, username, connection_code")
        .in("user_id", parentIds)
        .returns<ProfileRow[]>();
      parents = pProfiles || [];
    }

    const { data: perms } = await supabase
      .from("kid_permissions")
      .select("id, default_id, is_allowed, created_at, deleted_at")
      .eq("kid_user_id", user.id);
    permissions = (perms || []) as KidPermissionRow[];

    const defaultIds = permissions
      .map((permission) => permission.default_id)
      .filter((defaultId): defaultId is string => Boolean(defaultId));

    if (defaultIds.length > 0) {
      const { data: defaults } = await supabase
        .from("kid_permissions_default")
        .select("id, category, default_allowed")
        .in("id", defaultIds)
        .returns<KidPermissionDefaultRow[]>();
      permissionDefaults = defaults || [];
    }
  }

  const activePermissions = permissions.filter((permission) => permission.deleted_at === null);
  const connectedParents = parents.length;
  const connectionStatus =
    connectedParents > 0
      ? `Connected to ${connectedParents} parent${connectedParents === 1 ? "" : "s"}`
      : "No parent linked yet";

  return (
    <main className="min-h-screen px-6 py-8 bg-linear-to-br from-sky-50 via-white to-emerald-50 text-slate-900">
      <div className="mx-auto w-full max-w-4xl">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-3xl font-extrabold">Profile</h1>
          <Link href={`/dashboard/${roleParam}`} className="text-sm font-medium text-sky-600">
            Back to dashboard
          </Link>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <Card className="col-span-1">
            <CardContent className="flex flex-col items-center gap-4 p-6">
              <Avatar size="lg">
                {profile?.avatar_url ? (
                  <AvatarImage
                    src={profile.avatar_url ?? undefined}
                    alt={profile?.username ?? undefined}
                  />
                ) : (
                  <AvatarFallback>
                    {(profile?.username || user.email || "?").charAt(0).toUpperCase()}
                  </AvatarFallback>
                )}
              </Avatar>
              <div className="text-center">
                <h2 className="text-lg font-bold">
                  {profile?.first_name
                    ? `${profile.first_name} ${profile.last_name || ""}`
                    : profile?.username || user.email}
                </h2>
                <p className="text-sm text-slate-600">{user.email}</p>
              </div>
              <div className="mt-3 w-full space-y-2">
                {roleParam === "parent" && (
                  <div className="space-y-2">
                    <p className="text-xs text-slate-500">Connection code</p>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="secondary" className="rounded-full px-3 py-1 text-sm">
                        {profile?.connection_code || "—"}
                      </Badge>
                      {profile?.connection_code ? (
                        <ConnectionCodeCopy code={profile.connection_code} />
                      ) : null}
                    </div>
                    <p className="text-xs leading-5 text-slate-500">
                      Share this code with a kid to establish the family link.
                    </p>
                  </div>
                )}

                {roleParam === "kid" && (
                  <div className="space-y-2 rounded-3xl bg-sky-50/80 p-4">
                    <Badge className="rounded-full bg-sky-600 px-3 py-1 text-white hover:bg-sky-600">
                      {connectionStatus}
                    </Badge>
                    <div className="grid grid-cols-2 gap-3 pt-2 text-left">
                      <div className="rounded-2xl bg-white p-3 shadow-sm">
                        <p className="text-xs text-slate-500">XP</p>
                        <div className="text-lg font-bold">
                          {profile?.total_experience_points ?? 0}
                        </div>
                      </div>
                      <div className="rounded-2xl bg-white p-3 shadow-sm">
                        <p className="text-xs text-slate-500">Current streak</p>
                        <div className="text-lg font-bold">{profile?.current_streak ?? 0}</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <div className="col-span-2 space-y-6">
            {roleParam === "parent" && (
              <Card>
                <CardContent className="p-6">
                  <h3 className="mb-2 text-lg font-bold">Linked kids</h3>
                  {linkedKids.length === 0 ? (
                    <p className="text-sm text-slate-500">
                      You don’t have any approved children linked yet.
                    </p>
                  ) : (
                    <ul className="space-y-3">
                      {linkedKids.map((k) => (
                        <li key={k.user_id} className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Avatar>
                              {k.avatar_url ? (
                                <AvatarImage
                                  src={k.avatar_url ?? undefined}
                                  alt={k.username ?? undefined}
                                />
                              ) : (
                                <AvatarFallback>
                                  {(k.username || "K").charAt(0).toUpperCase()}
                                </AvatarFallback>
                              )}
                            </Avatar>
                            <div>
                              <div className="font-medium">{k.username}</div>
                              <div className="text-sm text-slate-500">
                                XP: {k.total_experience_points ?? 0} • Streak:{" "}
                                {k.current_streak ?? 0}
                              </div>
                            </div>
                          </div>
                          <Link href={`/dashboard/kid/profile`} className="text-sm text-sky-600">
                            Open
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}

                  <div className="mt-6 border-t pt-4">
                    <h4 className="text-sm font-semibold">Subscription</h4>
                    <p className="mt-2 text-sm text-slate-500">
                      Manage your plan and billing here (placeholder).
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {roleParam === "kid" && (
              <>
                <Card>
                  <CardContent className="p-6">
                    <h3 className="mb-2 text-lg font-bold">Parents</h3>
                    {parents.length === 0 ? (
                      <p className="text-sm text-slate-500">No parents linked yet.</p>
                    ) : (
                      <ul className="space-y-3">
                        {parents.map((p) => (
                          <li key={p.user_id} className="flex items-center justify-between">
                            <div>
                              <div className="font-medium">
                                {p.first_name ? `${p.first_name} ${p.last_name || ""}` : p.username}
                              </div>
                              <div className="text-sm text-slate-500">
                                Connection code: {p.connection_code || "—"}
                              </div>
                            </div>
                            <Badge className="rounded-full px-3 py-1">Connected</Badge>
                          </li>
                        ))}
                      </ul>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <h3 className="mb-2 text-lg font-bold">Permissions (read-only)</h3>
                    {activePermissions.length === 0 ? (
                      <p className="text-sm text-slate-500">No explicit permissions found.</p>
                    ) : (
                      <ul className="space-y-3">
                        {activePermissions.map((perm) => {
                          const defaultLabel =
                            permissionDefaults.find((item) => item.id === perm.default_id)
                              ?.category ?? "custom";

                          return (
                            <li
                              key={perm.id}
                              className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3"
                            >
                              <div>
                                <div className="text-sm font-semibold capitalize">
                                  {defaultLabel}
                                </div>
                                <div className="text-xs text-slate-500">Read-only guardrail</div>
                              </div>
                              <Badge
                                variant={perm.is_allowed ? "secondary" : "destructive"}
                                className="rounded-full px-3 py-1"
                              >
                                {perm.is_allowed ? "Allowed" : "Blocked"}
                              </Badge>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
