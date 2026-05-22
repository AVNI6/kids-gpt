import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sparkles, Send, Mic, Image as ImageIcon } from "lucide-react";
import Link from "next/link";

export function AITutorCenterSkeleton() {
  return (
    <Card className="rounded-[32px] border-sky-100 bg-white shadow-sm h-full">
      <CardContent className="p-6 space-y-4">
        <Skeleton className="h-8 w-48 bg-slate-100" />
        <Skeleton className="h-32 w-full rounded-2xl bg-slate-100" />
        <div className="flex gap-2">
          <Skeleton className="h-10 w-24 rounded-full bg-slate-100" />
          <Skeleton className="h-10 w-24 rounded-full bg-slate-100" />
        </div>
      </CardContent>
    </Card>
  );
}

export default function AITutorCenter() {
  const suggestions = [
    "Explain fractions",
    "Help me with science",
    "Create a fun story",
    "Solve this math problem",
  ];

  return (
    <section className="space-y-4 h-full flex flex-col">
      <h2 className="text-2xl font-black text-slate-900 tracking-tight">AI Tutor 🤖</h2>
      <Card className="rounded-[32px] border-sky-200 bg-linear-to-br from-sky-50 to-indigo-50 shadow-sm flex-1">
        <CardContent className="p-6 flex flex-col h-full justify-between gap-6">
          <div className="bg-white/60 backdrop-blur-sm rounded-3xl p-6 border border-white shadow-sm text-center flex-1 flex flex-col justify-center items-center">
            <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center mb-4 shadow-lg animate-pulse">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-xl font-black text-slate-800 mb-2">Hi! I&apos;m your AI Tutor.</h3>
            <p className="text-slate-600 font-medium max-w-sm">
              I can help you with homework, explain hard concepts, or write fun stories together!
            </p>

            <div className="flex flex-wrap justify-center gap-2 mt-6">
              {suggestions.map((suggestion, i) => (
                <Button
                  key={i}
                  variant="secondary"
                  className="rounded-full bg-white text-indigo-700 hover:bg-indigo-50 shadow-sm text-xs font-bold h-8"
                >
                  {suggestion}
                </Button>
              ))}
            </div>
          </div>

          <div className="flex gap-2 items-center bg-white p-2 rounded-full shadow-sm border border-slate-100 focus-within:ring-2 focus-within:ring-indigo-200 transition-all">
            <Button
              size="icon"
              variant="ghost"
              className="rounded-full text-slate-400 hover:text-indigo-600"
            >
              <ImageIcon className="w-5 h-5" />
            </Button>
            <Input
              placeholder="Ask me anything..."
              className="border-0 focus-visible:ring-0 shadow-none bg-transparent font-medium"
            />
            <Button
              size="icon"
              variant="ghost"
              className="rounded-full text-slate-400 hover:text-indigo-600"
            >
              <Mic className="w-5 h-5" />
            </Button>
            <Button
              size="icon"
              className="rounded-full bg-indigo-600 text-white hover:bg-indigo-700 shadow-md"
            >
              <Send className="w-4 h-4 ml-0.5" />
            </Button>
          </div>

          <div className="flex justify-between items-center px-2">
            <span className="text-xs font-bold text-slate-500">Recent Chats</span>
            <Link href="/dashboard/kid/ai-tutor">
              <Button variant="link" className="text-indigo-600 font-bold h-auto p-0">
                View All
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
