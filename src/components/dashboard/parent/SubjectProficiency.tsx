import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, Lightbulb } from "lucide-react";

export default async function SubjectProficiency() {
  const subjects = [
    { name: "Mathematics", progress: 78, color: "blue", trend: "+5%" },
    { name: "Science", progress: 85, color: "green", trend: "+3%" },
    { name: "Reading", progress: 72, color: "amber", trend: "+2%" },
    { name: "History", progress: 68, color: "violet", trend: "-1%" },
  ];

  const getColorClasses = (color: string) => {
    const map: Record<string, { bg: string; bar: string; text: string }> = {
      blue: { bg: "bg-sky-50", bar: "bg-sky-500", text: "text-sky-700" },
      green: { bg: "bg-emerald-50", bar: "bg-emerald-500", text: "text-emerald-700" },
      amber: { bg: "bg-amber-50", bar: "bg-amber-500", text: "text-amber-700" },
      violet: { bg: "bg-violet-50", bar: "bg-violet-500", text: "text-violet-700" },
    };
    return map[color] || map.blue;
  };

  return (
    <Card className="rounded-[28px] border-sky-100 bg-white shadow-sm">
      <CardContent className="space-y-6 p-6">
        <h3 className="text-lg font-black text-slate-900">Subject Proficiency</h3>

        {/* Progress Bars */}
        <div className="space-y-4">
          {subjects.map((subject) => {
            const colors = getColorClasses(subject.color);
            return (
              <div
                key={subject.name}
                className={`${colors.bg} rounded-2xl border border-opacity-20 p-4`}
              >
                <div className="flex items-center justify-between mb-2">
                  <p className="font-semibold text-slate-800">{subject.name}</p>
                  <span className={`text-sm font-bold ${colors.text}`}>{subject.progress}%</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
                  <div
                    className={`h-full ${colors.bar} transition-all`}
                    style={{ width: `${subject.progress}%` }}
                  />
                </div>
                <p className="text-xs text-slate-500 mt-2 flex items-center gap-1">
                  <TrendingUp className="h-3 w-3 text-green-600" />
                  {subject.trend} this week
                </p>
              </div>
            );
          })}
        </div>

        {/* AI Suggestion */}
        <div className="rounded-2xl bg-linear-to-br from-sky-50 to-emerald-50 border border-sky-200 p-4 space-y-3">
          <div className="flex items-start gap-3">
            <div className="rounded-full bg-sky-500/20 p-2 shrink-0">
              <Lightbulb className="h-4 w-4 text-sky-600" />
            </div>
            <div>
              <p className="text-xs uppercase font-black text-sky-700 mb-1">
                AI Personalized Suggestion
              </p>
              <p className="text-sm text-slate-700">
                Your child&apos;s Science progress is strong! Consider more advanced topics or
                supplementary readings to keep engagement high.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
