"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Check, X } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  acceptChildInvitation,
  declineChildInvitation,
  type PendingInvitation,
} from "@/lib/services/shared/invitations";
import { toast } from "sonner";

interface PendingInvitationsProps {
  initialInvitations: PendingInvitation[];
}

export default function PendingInvitations({ initialInvitations }: PendingInvitationsProps) {
  const [invitations, setInvitations] = useState<PendingInvitation[]>(initialInvitations);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  // If there are no invitations, do not render anything
  if (invitations.length === 0) return null;

  const handleAccept = (id: string, parentName: string) => {
    // Optimistic UI update: remove invitation from local list immediately
    const previousInvites = [...invitations];
    setInvitations((prev) => prev.filter((inv) => inv.id !== id));

    startTransition(async () => {
      try {
        const res = await acceptChildInvitation(id);
        if (res.success) {
          toast.success(`You are now linked with ${parentName}!`);
          router.refresh();
        } else {
          toast.error(res.error || "Failed to accept invitation.");
          // Revert on failure
          setInvitations(previousInvites);
        }
      } catch {
        toast.error("An unexpected error occurred.");
        setInvitations(previousInvites);
      }
    });
  };

  const handleDecline = (id: string, parentName: string) => {
    // Optimistic UI update
    const previousInvites = [...invitations];
    setInvitations((prev) => prev.filter((inv) => inv.id !== id));

    startTransition(async () => {
      try {
        const res = await declineChildInvitation(id);
        if (res.success) {
          toast.success(`Invitation from ${parentName} declined.`);
          router.refresh();
        } else {
          toast.error(res.error || "Failed to decline invitation.");
          setInvitations(previousInvites);
        }
      } catch {
        toast.error("An unexpected error occurred.");
        setInvitations(previousInvites);
      }
    });
  };

  return (
    <div className="w-full space-y-4 animate-in fade-in slide-in-from-top-4 duration-500">
      <div className="flex items-center gap-2 px-1">
        <Users className="w-5 h-5 text-sky-500" />
        <h2 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">
          Pending Family Invitations
        </h2>
        <span className="bg-sky-100 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300 font-bold px-2 py-0.5 rounded-full text-xs">
          {invitations.length}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {invitations.map((invite) => (
          <Card
            key={invite.id}
            className="rounded-[24px] border-slate-200/60 dark:border-slate-800/60 bg-white dark:bg-black/30 shadow-sm relative overflow-hidden group hover:shadow-md transition-all"
          >
            <CardContent className="p-5 flex items-center justify-between gap-4 relative z-10">
              <div className="flex items-center gap-3.5 min-w-0">
                <Avatar className="w-10 h-10 border border-slate-100 dark:border-slate-800 rounded-full shrink-0 shadow-sm">
                  <AvatarImage src={invite.parent_avatar ?? undefined} className="object-cover" />
                  <AvatarFallback className="text-xs font-black bg-gradient-to-br from-sky-400 to-sky-600 text-white rounded-full flex items-center justify-center">
                    {invite.parent_name?.[0] || "P"}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="text-sm font-black text-slate-900 dark:text-white truncate leading-snug">
                    {invite.parent_name}
                  </p>
                  {invite.parent_username && (
                    <p className="text-[10px] text-sky-600 dark:text-sky-400 font-extrabold leading-none mb-0.5">
                      @{invite.parent_username}
                    </p>
                  )}
                  <p className="text-xs text-slate-400 dark:text-slate-500 font-medium truncate">
                    {invite.parent_email}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <Button
                  size="icon"
                  variant="outline"
                  onClick={() => handleDecline(invite.id, invite.parent_name)}
                  disabled={isPending}
                  className="rounded-xl border-slate-200 dark:border-slate-800 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/20 dark:hover:text-red-400 h-9 w-9 cursor-pointer transition-colors"
                >
                  <X className="w-4 h-4" />
                </Button>
                <Button
                  size="icon"
                  onClick={() => handleAccept(invite.id, invite.parent_name)}
                  disabled={isPending}
                  className="rounded-xl bg-sky-600 text-white hover:bg-sky-700 dark:bg-sky-500 dark:hover:bg-sky-600 h-9 w-9 cursor-pointer shadow-sm hover:shadow transition-all"
                >
                  <Check className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
