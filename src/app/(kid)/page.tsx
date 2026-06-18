import { Suspense } from "react";
import ChatInterface from "@/components/shared/chat-interface/ChatInterface";
import ChatSkeleton from "@/components/shared/chat-interface/ChatSkeleton";

export default async function Home() {
  return (
    <Suspense fallback={<ChatSkeleton />}>
      <ChatInterface />
    </Suspense>
  );
}
