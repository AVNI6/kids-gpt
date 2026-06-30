import { notFound } from "next/navigation";
import { Suspense } from "react";

import ChatInterface from "@/components/shared/chat-interface/ChatInterface";
import ChatSkeleton from "@/components/shared/chat-interface/ChatSkeleton";
import MainLayout from "@/app/(main)/layout";

type Role = "parent" | "kid" | "teacher";

const allowedRoles: Role[] = ["parent", "kid", "teacher"];

interface PageProps {
  params: Promise<{ role: string }>;
  searchParams: Promise<{ id?: string }>;
}

export default async function ChatRoute({ params, searchParams }: PageProps) {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;

  if (!allowedRoles.includes(resolvedParams.role as Role)) {
    notFound();
  }

  return (
    <MainLayout>
      <Suspense fallback={resolvedSearchParams.id ? <ChatSkeleton /> : null}>
        <ChatInterface initialSessionId={resolvedSearchParams.id} />
      </Suspense>
    </MainLayout>
  );
}
