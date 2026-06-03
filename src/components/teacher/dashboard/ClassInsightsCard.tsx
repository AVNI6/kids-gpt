import { Card, CardContent } from "@/components/shared/ui/card";
import { Lightbulb, Sparkles } from "lucide-react";

export default async function ClassInsightsCard() {
  return (
    <Card className="rounded-[28px] border-violet-100 bg-linear-to-br from-violet-500 via-violet-400 to-purple-500 shadow-lg border-0">
      <CardContent className="space-y-4 p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-white" />
              <p className="text-xs uppercase font-black text-white/80">AI Insights</p>
            </div>
            <h3 className="text-xl font-black text-white">Class Performance</h3>
          </div>
        </div>

        {/* Insights List */}
        <div className="space-y-3 pt-2">
          <div className="flex items-start gap-3">
            <Lightbulb className="h-5 w-5 text-yellow-200 shrink-0 mt-0.5" />
            <p className="text-sm text-white/90">
              Noah and James show slower progress in comprehension—consider adding visual aids to
              lessons.
            </p>
          </div>

          <div className="flex items-start gap-3">
            <Lightbulb className="h-5 w-5 text-yellow-200 shrink-0 mt-0.5" />
            <p className="text-sm text-white/90">
              Ella and Zara are excelling—they may benefit from advanced challenge activities.
            </p>
          </div>

          <div className="flex items-start gap-3">
            <Lightbulb className="h-5 w-5 text-yellow-200 shrink-0 mt-0.5" />
            <p className="text-sm text-white/90">
              Weekly quiz average improved by 5%—keep up the engaging teaching style!
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-white/20">
          <p className="text-xs text-white/70">
            💡 These insights are powered by real-time class analytics
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
