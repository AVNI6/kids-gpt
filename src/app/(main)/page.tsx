import { Suspense } from "react";
import ChatInterface from "@/components/ChatInterface";

export default async function Home() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ChatInterface />
    </Suspense>
  );
}
