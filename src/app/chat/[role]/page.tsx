import { notFound } from "next/navigation";
import { Suspense } from "react";

import ChatInterface from "@/components/shared/chat-interface/ChatInterface";
import ChatSkeleton from "@/components/shared/chat-interface/ChatSkeleton";
import MainLayout from "@/app/(main)/layout";

type Role = "parent" | "kid" | "teacher";

const allowedRoles: Role[] = ["parent", "kid", "teacher"];

export default async function ChatRoute({ params }: { params: Promise<{ role: string }> }) {
  const resolvedParams = await params;

  if (!allowedRoles.includes(resolvedParams.role as Role)) {
    notFound();
  }

  return (
    <MainLayout>
      <Suspense fallback={<ChatSkeleton />}>
        <ChatInterface />
      </Suspense>
    </MainLayout>
  );
}
