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
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DashboardService } from "@/components/parent/home/dashboard.service";
import { toast } from "sonner";

interface LinkChildDialogProps {
  trigger?: React.ReactElement;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export default function LinkChildDialog({ trigger, open: controlledOpen, onOpenChange: controlledOnOpenChange }: LinkChildDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [linkEmail, setLinkEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const isControlled = typeof controlledOpen !== "undefined" && controlledOnOpenChange !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const onOpenChange = isControlled ? controlledOnOpenChange : setInternalOpen;

  const handleLinkSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const email = linkEmail.trim();

    if (!email) {
      toast.error("Please enter an email address.");
      return;
    }

    setIsLoading(true);

    try {
      const result = await DashboardService.linkChild(email);
      if (result.status === "success") {
        toast.success("Child account linked successfully.");
        setLinkEmail("");
        onOpenChange?.(false);
      } else if (result.status === "pending") {
        toast.success(`An invitation email has been sent to ${email}!`);
        setLinkEmail("");
        onOpenChange?.(false);
      } else {
        toast.error("Linking failed", {
          description: result.message || "Failed to link child.",
        });
      }
    } catch (error) {
      toast.error("Error occurred", {
        description: error instanceof Error ? error.message : "Failed to link Child.",
      });
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
          disabled={isLoading}
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
        {isLoading ? "Sending..." : "Link Child"}
      </Button>
    </form>
  );

  const dialogHeader = (
    <DialogHeader>
      <DialogTitle className="text-lg font-black tracking-tight text-slate-950 dark:text-white flex items-center gap-2">
        <Link2 className="h-5 w-5 text-sky-600" /> Link a Child
      </DialogTitle>
      <DialogDescription className="text-sm text-slate-500 dark:text-slate-400">
        Link a child by email. If they haven&apos;t signed up yet, Then create a account first.
      </DialogDescription>
    </DialogHeader>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger render={trigger} />
      <DialogContent className="max-w-md rounded-[24px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100">
        {dialogHeader}
        {formContent}
      </DialogContent>
    </Dialog>
  );
}
