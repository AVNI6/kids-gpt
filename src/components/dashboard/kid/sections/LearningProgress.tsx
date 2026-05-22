import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";

type SubjectMastery = {
  math?: number;
  science?: number;
  english?: number;
  coding?: number;
};

export function LearningProgressSkeleton() {
  return (
    <Card className="rounded-[32px] border-sky-100 bg-white shadow-sm h-full">
      <CardContent className="p-6 space-y-4">
        <Skeleton className="h-8 w-48 bg-slate-100" />
        <div className="space-y-4 pt-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="space-y-2">
              <div className="flex justify-between">
                <Skeleton className="h-4 w-20 bg-slate-100" />
                <Skeleton className="h-4 w-8 bg-slate-100" />
              </div>
              <Skeleton className="h-3 w-full rounded-full bg-slate-100" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export default function LearningProgress({ mastery }: { mastery: SubjectMastery }) {
  const subjects = [
    {
      name: "Math",
      value: mastery?.math || 0,
      color: "from-rose-400 to-red-500",
      bg: "bg-rose-100",
    },
    {
      name: "Science",
      value: mastery?.science || 0,
      color: "from-emerald-400 to-teal-500",
      bg: "bg-emerald-100",
    },
    {
      name: "English",
      value: mastery?.english || 0,
      color: "from-blue-400 to-indigo-500",
      bg: "bg-blue-100",
    },
    {
      name: "Coding",
      value: mastery?.coding || 0,
      color: "from-fuchsia-400 to-purple-500",
      bg: "bg-fuchsia-100",
    },
  ];

  return (
    <section className="space-y-4 h-full flex flex-col">
      <h2 className="text-2xl font-black text-slate-900 tracking-tight">Subject Mastery 📈</h2>
      <Card className="rounded-[32px] border-slate-200 bg-white shadow-sm flex-1">
        <CardContent className="p-6 flex flex-col justify-center h-full gap-6">
          {subjects.map((subject, index) => (
            <div key={index} className="space-y-2">
              <div className="flex justify-between items-end">
                <span className="font-black text-slate-700">{subject.name}</span>
                <span className="text-sm font-bold text-slate-500">{subject.value}%</span>
              </div>
              <Progress
                value={subject.value}
                className={`h-4 ${subject.bg}`}
                indicatorClassName={`bg-gradient-to-r ${subject.color}`}
              />
            </div>
          ))}

          <div className="mt-4 p-4 rounded-2xl bg-sky-50 border border-sky-100 text-sm font-bold text-sky-800 flex items-center justify-between">
            <span>Teacher Assessment Score</span>
            <span className="text-lg text-sky-600 bg-white px-3 py-1 rounded-full shadow-sm">
              A+
            </span>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
