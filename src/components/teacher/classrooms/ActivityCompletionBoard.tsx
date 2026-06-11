import { Card, CardContent } from "@/components/ui/card";
import { BookOpen } from "lucide-react";

export default async function ActivityCompletionBoard() {
  const assignments = [
    { name: "Ella", completed: 92 },
    { name: "James", completed: 78 },
    { name: "Sofia", completed: 85 },
    { name: "Noah", completed: 88 },
    { name: "Zara", completed: 95 },
  ];

  // maxValue not used; removed to satisfy linter

  return (
    <Card className="rounded-[28px] border-sky-100 bg-white shadow-sm">
      <CardContent className="space-y-6 p-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="rounded-full bg-sky-100 p-3">
                <BookOpen className="h-5 w-5 text-sky-600" />
              </div>
              <h3 className="text-lg font-black text-slate-900">The Water Cycle</h3>
            </div>
            <p className="text-sm text-slate-600">Assignment completion status</p>
          </div>
          <span className="text-xs uppercase font-bold text-sky-700 bg-sky-100 px-3 py-1 rounded-full">
            In Progress
          </span>
        </div>

        {/* Assignment Bars */}
        <div className="space-y-4">
          {assignments.map((assignment) => (
            <div key={assignment.name} className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="font-semibold text-slate-700">{assignment.name}</p>
                <span className="text-sm font-bold text-sky-600">{assignment.completed}%</span>
              </div>

              <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                <div
                  className="h-full bg-linear-to-r from-sky-500 to-sky-400 rounded-full transition-all"
                  style={{ width: `${assignment.completed}%` }}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Class Average */}
        <div className="flex items-center justify-between rounded-2xl bg-sky-50 border border-sky-100 p-4">
          <div>
            <p className="text-xs uppercase font-bold text-sky-700">Class Average Completion</p>
            <p className="text-lg font-black text-sky-900 mt-1">87.6%</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-sky-600 font-semibold">2 students</p>
            <p className="text-xs text-sky-600">need help</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
