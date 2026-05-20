"use client";

import { useState } from "react";
import { ClipboardCopy, Check } from "lucide-react";

import { Button } from "@/components/ui/button";

type ConnectionCodeCopyProps = {
  code: string;
};

export function ConnectionCodeCopy({ code }: ConnectionCodeCopyProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  };

  return (
    <Button type="button" variant="secondary" size="sm" onClick={handleCopy}>
      {copied ? <Check className="mr-2 h-4 w-4" /> : <ClipboardCopy className="mr-2 h-4 w-4" />}
      {copied ? "Copied" : "Copy code"}
    </Button>
  );
}
