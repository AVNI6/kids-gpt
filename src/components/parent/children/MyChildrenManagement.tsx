"use client";

import { useState, useEffect, useTransition } from "react";
import { toast } from "sonner";
import { DashboardService } from "@/components/parent/home/dashboard.service";
import type { SentInvitation } from "@/lib/services/shared/invitations";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Plus, Settings2, GraduationCap, School, Target, BarChart3, Users } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { LinkedChildProfile } from "@/types/parent";
import { useParentDashboard } from "@/hooks/parent/useParentDashboard";
import { displayAge } from "@/lib/utils/kid/childAge";
import { displayGrade } from "@/lib/utils/kid/childGrade";
import { getLevelTitle } from "@/hooks/kid/useChildXP";
import ChildSettingsModal from "@/components/parent/children/ChildSettingsModal";
import LinkChildDialog from "@/components/parent/children/LinkChildDialog";
import ChildDetailPanel from "@/components/parent/children/ChildDetailPanel";

export default function MyChildrenManagement({
  linkedChildren,
}: {
  linkedChildren: LinkedChildProfile[];
}) {
  const { activeChildId, setActiveChildId } = useParentDashboard();
  const router = useRouter();
  const [activeSettingsChild, setActiveSettingsChild] = useState<LinkedChildProfile | null>(null);
  const [sentInvitations, setSentInvitations] = useState<SentInvitation[]>([]);
  const [isPending, startTransition] = useTransition();
  const [cancelInviteTarget, setCancelInviteTarget] = useState<{ id: string; email: string } | null>(null);

  const fetchSentInvitations = () => {
    DashboardService.getSentPendingInvitations().then((data) => {
      setSentInvitations(data);
    });
  };

  useEffect(() => {
    let active = true;
    DashboardService.getSentPendingInvitations().then((data) => {
      if (active) setSentInvitations(data);
    });
    return () => {
      active = false;
    };
  }, []);

  const handleCancelInvitation = (inviteId: string, email: string) => {
    const previous = [...sentInvitations];
    setSentInvitations((prev) => prev.filter((i) => i.id !== inviteId));

    startTransition(async () => {
      try {
        const res = await DashboardService.cancelChildInvitation(inviteId);
        if (res.success) {
          toast.success(`Invitation to ${email} cancelled.`);
          router.refresh();
        } else {
          toast.error(res.error || "Failed to cancel invitation.");
          setSentInvitations(previous);
        }
      } catch {
        toast.error("An unexpected error occurred.");
        setSentInvitations(previous);
      }
    });
  };

  // Selector handlers pushing URL parameters shallowly via Context
  const handleSelectChild = (childId: string | null) => {
    setActiveChildId(childId || "");
  };

  const selectedChild = linkedChildren.find((c) => c.user_id === activeChildId);

  // If a child is selected, show their full detailed panel
  if (activeChildId && selectedChild) {
    return <ChildDetailPanel selectedChild={selectedChild} handleSelectChild={handleSelectChild} />;
  }

  // Otherwise, render list of children cards grid
  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Top Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            My Children
          </h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium">
            Manage your children&apos;s profiles, track reports, and audit their educational logs.
          </p>
        </div>
        <LinkChildDialog
          onSuccess={fetchSentInvitations}
          trigger={
            <Button className="rounded-full bg-sky-600 hover:bg-sky-700 text-white shadow-sm h-11 px-6 font-bold cursor-pointer dark:bg-sky-500 dark:hover:bg-sky-600">
              <Plus className="w-5 h-5 mr-2" /> Add Child
            </Button>
          }
        />
      </div>

      {/* Children Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {linkedChildren.length === 0 ? (
          <Card className="col-span-full rounded-[32px] border-2 border-slate-200 dark:border-slate-800 bg-white dark:bg-black/30 p-12 text-center">
            <CardContent className="space-y-4">
              <div className="w-16 h-16 bg-sky-50 dark:bg-sky-950/40 rounded-2xl flex items-center justify-center mx-auto text-sky-500">
                <Users className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  No Linked Children Yet
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                  Link a child using their registered email above to start monitoring their dynamic
                  activities, search logs, and milestones.
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          linkedChildren.map((child) => {
            const gradeStr = displayGrade(child.standard);
            const ageStr = displayAge(child.date_of_birth);

            return (
              <Card
                key={child.user_id}
                className="rounded-[32px] border-slate-200/60 dark:border-slate-800/60 bg-white dark:bg-black/30 shadow-sm hover:shadow-md transition-all relative overflow-hidden group"
              >
                {/* Accent sky blue blob */}
                <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-br from-sky-400/5 to-indigo-500/5 dark:from-sky-500/10 dark:to-indigo-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />

                <CardContent className="p-8 relative z-10 flex flex-col h-full justify-between">
                  <div>
                    <div className="flex justify-between items-start mb-6">
                      <Avatar className="w-20 h-20 border-4 border-white dark:border-slate-800 shadow-sm ring-2 ring-slate-100 dark:ring-slate-800 shrink-0">
                        <AvatarImage src={child.avatar_url ?? undefined} className="object-cover" />
                        <AvatarFallback className="text-2xl font-black bg-gradient-to-br from-sky-400 to-sky-600 text-white">
                          {child.first_name?.[0] || "C"}
                        </AvatarFallback>
                      </Avatar>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setActiveSettingsChild(child)}
                        className="text-slate-400 hover:text-sky-600 hover:bg-sky-50 dark:hover:text-sky-400 dark:hover:bg-slate-900 rounded-full h-10 w-10 cursor-pointer transition-colors"
                      >
                        <Settings2 className="w-5 h-5" />
                      </Button>
                    </div>
                    <div className="space-y-1.5 mb-6">
                      <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight leading-none">
                        {child.first_name} {child.last_name}
                      </h3>
                      <div className="flex items-center gap-3 text-sm font-semibold text-slate-500 dark:text-slate-400">
                        <span className="flex items-center gap-1.5 text-sky-600 dark:text-sky-400 font-extrabold">
                          <GraduationCap className="w-4 h-4" /> {gradeStr}
                        </span>
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-200 dark:bg-slate-800" />
                        <span>{ageStr}</span>
                      </div>
                    </div>
                    <div className="space-y-3 mb-8">
                      {/* Classroom Row */}
                      <div className="flex items-center gap-3.5 p-3.5 rounded-2xl bg-slate-50 dark:bg-black/40 border border-slate-100 dark:border-slate-800/50">
                        <div className="p-2.5 bg-slate-100 dark:bg-slate-800 rounded-xl shadow-sm shrink-0">
                          <School className="w-4.5 h-4.5 text-slate-500 dark:text-slate-300" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[10px] text-slate-400 dark:text-slate-500 font-extrabold uppercase tracking-wider mb-0.5">
                            Classroom
                          </p>
                          <p className="text-sm font-bold text-slate-800 dark:text-slate-250 truncate">
                            {gradeStr}
                          </p>
                        </div>
                      </div>

                      {/* Learning Level Row */}
                      <div className="flex items-center gap-3.5 p-3.5 rounded-2xl bg-slate-50 dark:bg-black/40 border border-slate-100 dark:border-slate-800/50">
                        <div className="p-2.5 bg-slate-100 dark:bg-slate-800 rounded-xl shadow-sm shrink-0">
                          <Target className="w-4.5 h-4.5 text-sky-500 dark:text-sky-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[10px] text-slate-400 dark:text-slate-500 font-extrabold uppercase tracking-wider mb-0.5">
                            Learning Level
                          </p>
                          <p className="text-sm font-bold text-slate-800 dark:text-slate-250 truncate">
                            {getLevelTitle(child.total_experience_points)}
                          </p>
                        </div>
                      </div>
                    </div>
                    {/* Actions Grid */}
                    <div className="grid grid-cols-1 min-[340px]:grid-cols-2 gap-3">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setActiveChildId(child.user_id, "activities");
                        }}
                        className="w-full rounded-2xl border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-black/50 font-bold h-11 text-sm cursor-pointer hover:text-sky-600 dark:hover:text-sky-400 text-slate-700 dark:text-slate-200 transition-colors"
                      >
                        <BarChart3 className="w-4 h-4 mr-2" /> Reports
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setActiveChildId(child.user_id, "progress");
                        }}
                        className="w-full rounded-2xl border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-black/50 font-bold h-11 text-sm cursor-pointer hover:text-sky-600 dark:hover:text-sky-400 text-slate-700 dark:text-slate-200 transition-colors"
                      >
                        <GraduationCap className="w-4 h-4 mr-2" /> Classroom
                      </Button>
                      <Button
                        onClick={() => {
                          router.push(`/dashboard/parent/progress?childId=${child.user_id}`);
                        }}
                        className="w-full min-h-11 rounded-2xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-sm cursor-pointer dark:bg-sky-500 dark:hover:bg-sky-600 shadow-md hover:shadow-lg transition-all min-[340px]:col-span-2"
                      >
                        Manage Learning
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Sent Pending Invitations Section */}
      {sentInvitations.length > 0 && (
        <div className="space-y-6 pt-6 border-t border-slate-100 dark:border-slate-800/40">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-sky-500" />
            <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
              Pending Invitations
            </h2>
            <span className="bg-sky-100 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300 font-bold px-2 py-0.5 rounded-full text-xs">
              {sentInvitations.length}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {sentInvitations.map((invite) => (
              <Card
                key={invite.id}
                className="rounded-[28px] border-slate-200/60 dark:border-slate-800/60 bg-white dark:bg-black/30 shadow-sm relative overflow-hidden group hover:shadow-md transition-all"
              >
                <CardContent className="p-6 relative z-10 flex flex-col justify-between h-full gap-4">
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-sky-50 dark:bg-sky-950/40 flex items-center justify-center shrink-0">
                      <Plus className="w-5 h-5 text-sky-500" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-black text-slate-900 dark:text-white truncate">
                        {invite.invitee_email}
                      </p>
                      <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">
                        Invited {invite.created_at ? new Date(invite.created_at).toLocaleDateString() : "Recently"}
                      </p>
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    disabled={isPending}
                    onClick={() => setCancelInviteTarget({ id: invite.id, email: invite.invitee_email })}
                    className="w-full rounded-xl border-slate-200 dark:border-slate-800 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/20 dark:hover:text-red-400 font-bold h-10 text-xs cursor-pointer transition-colors"
                  >
                    Cancel Invitation
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Cancel Invitation Confirmation Modal */}
      <Dialog
        open={cancelInviteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setCancelInviteTarget(null);
        }}
      >
        <DialogContent className="max-w-md rounded-[24px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100">
          <DialogHeader>
            <DialogTitle className="text-lg font-black tracking-tight text-slate-950 dark:text-white flex items-center gap-2">
              Cancel Invitation
            </DialogTitle>
            <DialogDescription className="text-sm text-slate-500 dark:text-slate-400">
              Are you sure you want to cancel the invitation sent to <strong className="text-slate-800 dark:text-slate-200">{cancelInviteTarget?.email}</strong>? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-3 pt-4">
            <Button
              variant="outline"
              disabled={isPending}
              onClick={() => setCancelInviteTarget(null)}
              className="rounded-xl border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-black/50 font-bold h-11 text-sm cursor-pointer"
            >
              No, Keep It
            </Button>
            <Button
              disabled={isPending}
              onClick={() => {
                if (cancelInviteTarget) {
                  handleCancelInvitation(cancelInviteTarget.id, cancelInviteTarget.email);
                  setCancelInviteTarget(null);
                }
              }}
              className="rounded-xl bg-red-600 text-white hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600 font-bold h-11 text-sm cursor-pointer shadow-md"
            >
              Yes, Cancel Invite
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Settings Modal */}
      {activeSettingsChild && (
        <ChildSettingsModal
          child={activeSettingsChild}
          isOpen={activeSettingsChild !== null}
          onOpenChange={(open: boolean) => {
            if (!open) setActiveSettingsChild(null);
          }}
        />
      )}
    </div>
  );
}
