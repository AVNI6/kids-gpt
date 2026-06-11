"use client";

import { Trash2 } from "lucide-react";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface DeleteSessionDialogProps {
  sessionId: string;
  onDelete: (sessionId: string) => Promise<void>;
  trigger?: React.ReactElement;
  onOpenDialog?: () => void;
}

export default function DeleteSessionDialog({
  sessionId,
  onDelete,
  trigger,
  onOpenDialog,
}: DeleteSessionDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleOpenChange = (open: boolean) => {
    if (open && onOpenDialog) {
      onOpenDialog();
    }
    setIsOpen(open);
  };

  const handleConfirmDelete = async () => {
    setIsDeleting(true);
    try {
      await onDelete(sessionId);
      setIsOpen(false);
    } catch (error) {
      console.error("Delete failed:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger
        render={
          trigger || (
            <Button
              variant="ghost"
              size="sm"
              className="text-red-500 hover:text-red-600 hover:bg-red-50"
            >
              <Trash2 className="w-4 h-4 mr-2" /> Delete
            </Button>
          )
        }
      />
      <DialogContent className="sm:max-w-[425px] rounded-2xl border-border bg-background">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-foreground">Delete Chat?</DialogTitle>
          <DialogDescription className="text-muted-foreground pt-2">
            This will permanently delete this chat session and all its messages. This action cannot
            be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 pt-4">
          <Button
            variant="outline"
            onClick={() => setIsOpen(false)}
            disabled={isDeleting}
            className="rounded-xl border-border hover:bg-accent hover:text-accent-foreground"
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirmDelete}
            disabled={isDeleting}
            className="rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-sm"
          >
            {isDeleting ? "Deleting..." : "Delete"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
