import { notFound } from "next/navigation";
import { Suspense } from "react";

import ChatInterface from "@/components/shared/chat-interface/ChatInterface";
import MainLayout from "@/app/(main)/layout";

type Role = "parent" | "kid" | "teacher";

const allowedRoles: Role[] = ["parent", "kid", "teacher"];

export default async function ChatRoute({ params }: { params: Promise<{ role: string }> }) {
  const resolvedParams = await params;

  if (!allowedRoles.includes(resolvedParams.role as Role)) {
    notFound();
  }

  return (
    <Suspense
      fallback={
        <div className="flex-1 flex items-center justify-center bg-background text-slate-400">
          Loading...
        </div>
      }
    >
      <MainLayout>
        <ChatInterface />
      </MainLayout>
    </Suspense>
  );
}
