"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { APP_ROUTES } from "@/constant/AppRoutes";

interface AuthPromptPopoverContentProps {
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}

export default function AuthPromptPopoverContent({
  title,
  description,
  icon: Icon,
}: AuthPromptPopoverContentProps) {
  return (
    <div className="flex flex-col gap-3 text-center items-center">
      <div className="p-2 bg-sky-500/10 rounded-full text-sky-500">
        <Icon className="w-6 h-6" />
      </div>
      <h4 className="font-bold text-popover-foreground">{title}</h4>
      <p className="text-muted-foreground text-xs">{description}</p>
      <Link
        href={APP_ROUTES.Signin}
        className={cn(
          buttonVariants({ variant: "default" }),
          "w-full mt-2 bg-sky-500 hover:bg-sky-600 text-white rounded-xl cursor-pointer flex items-center justify-center h-10 text-sm font-semibold"
        )}
      >
        Sign In
      </Link>
    </div>
  );
}
