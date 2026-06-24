import { Suspense } from "react";
import ChatInterface from "@/components/shared/chat-interface/ChatInterface";
import ChatSkeleton from "@/components/shared/chat-interface/ChatSkeleton";

interface PageProps {
  searchParams: Promise<{ id?: string }>;
}

export default async function Home({ searchParams }: PageProps) {
  const resolvedSearchParams = await searchParams;
  return (
    <Suspense fallback={resolvedSearchParams.id ? <ChatSkeleton /> : null}>
      <ChatInterface />
    </Suspense>
  );
}
