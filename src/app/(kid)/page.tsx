import { Suspense } from "react";
import ChatInterface from "@/components/shared/chat-interface/ChatInterface";
import { Spinner } from "@/components/ui/spinner";

export default async function Home() {
  return (
    <Suspense
      fallback={
        <div className="flex h-[calc(100vh-80px)] w-full flex-col items-center justify-center gap-4 bg-background">
          <div className="relative flex items-center justify-center">
            {/* outer glow ring */}
            <div className="absolute size-16 rounded-full border-4 border-sky-500/20 animate-pulse" />
            <Spinner className="size-10 text-sky-500" />
          </div>
          <p className="text-base font-bold text-muted-foreground animate-pulse">
            Loading Explorer Space...
          </p>
        </div>
      }
    >
      <ChatInterface />
    </Suspense>
  );
}
