"use client";

import { useState } from "react";
import { Link2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/shared/ui/dialog";
import { Button } from "@/components/shared/ui/button";
import { Input } from "@/components/shared/ui/input";
import { Label } from "@/components/shared/ui/label";
import { DashboardService } from "@/components/parent/home/dashboard.service";

interface LinkChildDialogProps {
  trigger?: React.ReactElement;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export default function LinkChildDialog({ trigger, open, onOpenChange }: LinkChildDialogProps) {
  const [linkEmail, setLinkEmail] = useState("");
  const [linkMessage, setLinkMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleLinkSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const email = linkEmail.trim();

    if (!email) {
      setLinkMessage("Please enter an email address.");
      return;
    }

    setIsLoading(true);
    setLinkMessage(null);

    try {
      const result = await DashboardService.linkChild(email);
      setLinkMessage(result.message);
      if (result.status === "success" || result.status === "pending") {
        setLinkEmail("");
      }
    } catch (error) {
      setLinkMessage(error instanceof Error ? error.message : "Failed to create link request.");
    } finally {
      setIsLoading(false);
    }
  };

  const formContent = (
    <form onSubmit={handleLinkSubmit} className="space-y-4 pt-4">
      <div className="space-y-2">
        <Label
          htmlFor="childEmail"
          className="font-bold text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400"
        >
          Child&apos;s Email
        </Label>
        <Input
          id="childEmail"
          name="childEmail"
          type="email"
          value={linkEmail}
          onChange={(event) => setLinkEmail(event.target.value)}
          placeholder="child@example.com"
          className="h-11 rounded-xl bg-slate-50 border-slate-200 dark:bg-black/40 dark:border-slate-800 text-slate-900 dark:text-white focus-visible:ring-sky-500 focus-visible:ring-2"
        />
      </div>

      <Button
        type="submit"
        disabled={isLoading}
        className="w-full rounded-xl bg-sky-600 text-white hover:bg-sky-700 h-11 font-bold cursor-pointer dark:bg-sky-500 dark:hover:bg-sky-600"
      >
        {isLoading ? "Sending..." : "Send Link Invite"}
      </Button>

      {linkMessage ? (
        <p className="rounded-xl bg-sky-50 dark:bg-sky-950/30 px-4 py-3 text-sm font-semibold text-sky-700 dark:text-sky-300 border border-sky-100 dark:border-sky-900/30">
          {linkMessage}
        </p>
      ) : null}
    </form>
  );

  const dialogHeader = (
    <DialogHeader>
      <DialogTitle className="text-lg font-black tracking-tight text-slate-950 dark:text-white flex items-center gap-2">
        <Link2 className="h-5 w-5 text-sky-600" /> Link a Child
      </DialogTitle>
      <DialogDescription className="text-sm text-slate-500 dark:text-slate-400">
        Invite a child by email. If they haven&apos;t signed up yet, we&apos;ll send a pending
        invite.
      </DialogDescription>
    </DialogHeader>
  );

  if (typeof open !== "undefined" && onOpenChange) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md rounded-[24px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100">
          {dialogHeader}
          {formContent}
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog>
      <DialogTrigger render={trigger} />
      <DialogContent className="max-w-md rounded-[24px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100">
        {dialogHeader}
        {formContent}
      </DialogContent>
    </Dialog>
  );
}
