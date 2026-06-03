import Link from "next/link";
import { ArrowRight, MessagesSquare } from "lucide-react";

import { Card, CardContent } from "@/components/shared/ui/card";

type ChatItem = {
  title: string;
  meta: string;
  role: string;
};

const chats: ChatItem[] = [
  {
    title: '"Why is the sky blue?"',
    meta: "Yesterday at 4:15 PM · Science Helper",
    role: "Science",
  },
  {
    title: '"Help with long division"',
    meta: "2 days ago · Math Tutor",
    role: "Math",
  },
];

export default function RecentChatsCard() {
  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <MessagesSquare className="h-5 w-5 text-sky-500" />
          <h2 className="text-xl font-black tracking-tight text-slate-950 dark:text-slate-50">
            Recent AI Chats
          </h2>
        </div>
        <Link href="#" className="text-sm font-semibold text-sky-600 hover:text-sky-700">
          View All
        </Link>
      </div>

      <Card className="rounded-[28px] border-sky-100 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <CardContent className="space-y-3 p-5 sm:p-6">
          {chats.map((chat) => (
            <div
              key={chat.title}
              className="group flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50/70 px-4 py-4 transition-colors hover:bg-slate-100/80 dark:border-slate-800 dark:bg-slate-800/50 dark:hover:bg-slate-800"
            >
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white text-sky-600 shadow-sm ring-1 ring-sky-100 dark:bg-slate-900 dark:ring-sky-900/60">
                  <MessagesSquare className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-extrabold text-slate-950 dark:text-slate-50">
                    {chat.title}
                  </p>
                  <p className="truncate text-xs text-slate-500 dark:text-slate-400">{chat.meta}</p>
                </div>
              </div>

              <div className="ml-3 flex items-center gap-2 text-xs font-bold text-slate-400">
                <span className="rounded-full bg-white px-2.5 py-1 text-slate-500 ring-1 ring-slate-200 dark:bg-slate-900 dark:text-slate-400 dark:ring-slate-700">
                  {chat.role}
                </span>
                <ArrowRight className="h-4 w-4 text-slate-400 dark:text-slate-500 transition-transform group-hover:translate-x-0.5" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </section>
  );
}
