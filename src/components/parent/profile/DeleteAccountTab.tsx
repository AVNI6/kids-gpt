"use client";

import { useState } from "react";
import { softDeleteChildConnection } from "@/lib/services/parent/parent.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { AlertTriangle } from "lucide-react";
import type { LinkedChildProfile } from "@/types/kid";

interface DeleteAccountTabProps {
  child: LinkedChildProfile;
  onSuccess: () => void;
}

export default function DeleteAccountTab({ child, onSuccess }: DeleteAccountTabProps) {
  const [isPending, setIsPending] = useState(false);
  const [typedConfirm, setTypedConfirm] = useState("");

  const handleDelete = async () => {
    if (typedConfirm.toLowerCase() !== child.first_name?.toLowerCase()) {
      toast.error("Confirmation error", {
        description: `Please type "${child.first_name}" correctly to confirm.`,
      });
      return;
    }

    setIsPending(true);
    try {
      const response = await softDeleteChildConnection(child.user_id);
      if (response.success) {
        toast.success("Child removed", {
          description: response.message || "Connection soft-deleted successfully.",
        });
        onSuccess();
      } else {
        toast.error("Operation failed", {
          description: response.error || "Could not delete connection.",
        });
      }
    } catch (err) {
      toast.error("Error occurred", {
        description: err instanceof Error ? err.message : "Failed to execute.",
      });
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h3 className="text-lg font-black tracking-tight text-slate-900 dark:text-white">
          Remove Child Connection
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
          Remove {child.first_name}&apos;s account link from your parent panel.
        </p>
      </div>

      <div className="p-5 border border-rose-200/50 bg-rose-50/40 rounded-3xl dark:border-rose-950/20 dark:bg-rose-950/10 flex items-start gap-4">
        <div className="p-2.5 bg-rose-100 dark:bg-rose-950 text-rose-650 rounded-xl shrink-0 mt-0.5">
          <AlertTriangle className="w-5 h-5" />
        </div>
        <div className="space-y-1.5 min-w-0">
          <h4 className="text-xs font-black uppercase tracking-wider text-rose-600 dark:text-rose-400">
            Warning: This action is serious
          </h4>
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
            This will immediately unlink {child.first_name}&apos;s profile from your dashboard. You
            will lose access to their history log, streaks, AI metrics, and reports.
          </p>
        </div>
      </div>

      <div className="space-y-4 pt-2">
        <div className="space-y-2">
          <Label className="text-xs font-bold text-slate-600 dark:text-slate-400">
            To confirm, type your child&apos;s first name
            <span className="font-extrabold">{child.first_name}</span>:
          </Label>
          <Input
            type="text"
            placeholder={child.first_name || "Child's First Name"}
            value={typedConfirm}
            onChange={(e) => setTypedConfirm(e.target.value)}
            className="w-full h-11 px-4 rounded-xl border border-slate-200 bg-white/40 focus-visible:bg-white focus-visible:ring-rose-500 focus-visible:border-rose-500 text-sm font-semibold transition-all dark:border-slate-800 dark:bg-slate-900"
          />
        </div>

        <div className="flex justify-end pt-4 border-t border-slate-100 dark:border-slate-800/60">
          <Button
            type="button"
            onClick={handleDelete}
            loading={isPending}
            loadingText="Removing..."
            disabled={typedConfirm.toLowerCase() !== child.first_name?.toLowerCase()}
            className="rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold h-11 px-6 text-xs cursor-pointer shadow-md hover:shadow-lg focus:ring-rose-500 disabled:opacity-50"
          >
            Confirm Unlink Connection
          </Button>
        </div>
      </div>
    </div>
  );
}
