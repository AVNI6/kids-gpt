"use client";

import { Share2, Copy, Check } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface ShareLinkProps {
  sessionId: string;
  trigger?: React.ReactNode;
}

export default function ShareLink({ sessionId, trigger }: ShareLinkProps) {
  const [copied, setCopied] = useState(false);

  // Ensure we handle SSR safely for the URL
  const shareUrl =
    typeof window !== "undefined" ? `${window.location.origin}/share/${sessionId}` : "";

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy!", err);
    }
  };

  return (
    <Dialog>
      <DialogTrigger>
        {trigger || (
          <Button variant="outline" size="sm" className="gap-2 rounded-xl">
            <Share2 className="w-4 h-4" /> Share
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle>Share this chat</DialogTitle>
          <DialogDescription>
            Anyone with this link will be able to view all messages in this session.
          </DialogDescription>
        </DialogHeader>
        <div className="flex items-center space-x-2 pt-4">
          <div className="grid flex-1 gap-2">
            <label htmlFor="link" className="sr-only">
              Link
            </label>
            <Input id="link" defaultValue={shareUrl} readOnly className="h-9" />
          </div>
          <Button
            type="submit"
            size="sm"
            className="px-3"
            onClick={handleCopy}
            variant={copied ? "outline" : "default"}
          >
            <span className="sr-only">Copy</span>
            {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
