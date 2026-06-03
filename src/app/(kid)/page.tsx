import { Suspense } from "react";
import ChatInterface from "@/components/shared/chat-interface/ChatInterface";

export default async function Home() {
  return (
    <Suspense
      fallback={
        <div className="flex-1 flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-sky-500 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <ChatInterface />
    </Suspense>
  );
}
