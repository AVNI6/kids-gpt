import { notFound } from "next/navigation";

import ChatInterface from "@/components/ChatInterface";

type Role = "parent" | "kid" | "teacher";

const allowedRoles: Role[] = ["parent", "kid", "teacher"];

export default function ChatRoute({ params }: { params: { role: string } }) {
  if (!allowedRoles.includes(params.role as Role)) {
    notFound();
  }

  return <ChatInterface />;
}
