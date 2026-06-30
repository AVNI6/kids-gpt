"use client";

import React, { useRef, useState } from "react";
import { Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { validateImageFile } from "@/lib/puzzle/validators";
import { toast } from "sonner";

interface UploadImageButtonProps {
  onImageSelected: (file: File) => void;
  isLoading?: boolean;
}

export default function UploadImageButton({ onImageSelected, isLoading }: UploadImageButtonProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMsg(null);
    const validationError = validateImageFile(file);

    if (validationError) {
      setErrorMsg(validationError);
      toast.error("Upload failed", {
        description: validationError,
      });
      return;
    }

    toast.success("Image uploaded successfully!", {
      description: "Preparing your custom puzzle...",
    });
    onImageSelected(file);
  };

  return (
    <div className="w-full flex flex-col items-center gap-2">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
        id="jigsaw-image-upload"
      />
      <Button
        onClick={handleClick}
        disabled={isLoading}
        variant="outline"
        className="w-full rounded-xl sm:rounded-2xl border-2 border-dashed border-sky-200 bg-sky-50/50 hover:bg-sky-50 dark:border-sky-900/60 dark:bg-sky-950/20 text-sky-700 dark:text-sky-400 font-bold px-4 py-4 sm:py-6 shadow-sm hover:border-sky-300 transition-all duration-300 cursor-pointer"
      >
        <Upload className="mr-2 size-5" />
        Upload Photo
      </Button>
      {errorMsg && (
        <p
          className="text-xs font-semibold text-rose-500 max-w-xs text-center mt-1 animate-pulse"
          role="alert"
        >
          {errorMsg}
        </p>
      )}
    </div>
  );
}
