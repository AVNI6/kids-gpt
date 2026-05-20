import { Card, CardContent } from "@/components/ui/card";
import { Clock, Zap, BookOpen } from "lucide-react";

export default async function DailyActivityStats() {
  return (
    <Card className="rounded-[28px] border-sky-100 bg-white shadow-sm">
      <CardContent className="space-y-4 p-6">
        <h3 className="text-lg font-black text-slate-900">Today&apos;s Activity</h3>

        <div className="grid grid-cols-3 gap-4">
          {/* Time Spent */}
          <div className="rounded-2xl bg-sky-50 border border-sky-100 p-4 text-center">
            <div className="flex justify-center mb-3">
              <div className="rounded-full bg-sky-500/20 p-3">
                <Clock className="h-5 w-5 text-sky-600" />
              </div>
            </div>
            <p className="text-xs uppercase font-bold text-sky-700 mb-1">Time Spent</p>
            <p className="text-2xl font-black text-sky-900">45 min</p>
            <p className="text-xs text-sky-600 mt-1">+15 min vs yesterday</p>
          </div>

          {/* Quizzes Completed */}
          <div className="rounded-2xl bg-emerald-50 border border-emerald-100 p-4 text-center">
            <div className="flex justify-center mb-3">
              <div className="rounded-full bg-emerald-500/20 p-3">
                <Zap className="h-5 w-5 text-emerald-600" />
              </div>
            </div>
            <p className="text-xs uppercase font-bold text-emerald-700 mb-1">Quizzes Done</p>
            <p className="text-2xl font-black text-emerald-900">3</p>
            <p className="text-xs text-emerald-600 mt-1">80% accuracy</p>
          </div>

          {/* Reading Sessions */}
          <div className="rounded-2xl bg-amber-50 border border-amber-100 p-4 text-center">
            <div className="flex justify-center mb-3">
              <div className="rounded-full bg-amber-500/20 p-3">
                <BookOpen className="h-5 w-5 text-amber-600" />
              </div>
            </div>
            <p className="text-xs uppercase font-bold text-amber-700 mb-1">Reading</p>
            <p className="text-2xl font-black text-amber-900">2</p>
            <p className="text-xs text-amber-600 mt-1">+1 session</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
