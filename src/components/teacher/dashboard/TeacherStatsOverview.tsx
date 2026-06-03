import { Card, CardContent } from "@/components/shared/ui/card";
import { CheckCircle2, Users, School } from "lucide-react";

type Props = {
  totalClassrooms: number;
  totalStudents: number;
  pendingRequests: number;
};

export default function TeacherStatsOverview({
  totalClassrooms,
  totalStudents,
  pendingRequests,
}: Props) {
  const stats = [
    {
      label: "Classrooms",
      value: String(totalClassrooms),
      sublabel: "Active Classrooms",
      icon: School,
      color: "yellow",
    },
    {
      label: "Total Students",
      value: String(totalStudents),
      sublabel: "Enrolled in your classes",
      icon: Users,
      color: "blue",
    },
    {
      label: "Pending Requests",
      value: String(pendingRequests),
      sublabel: "Awaiting approval",
      icon: CheckCircle2,
      color: "pink",
    },
  ];

  const getColorClasses = (color: string) => {
    const map: Record<string, { bg: string; border: string; text: string; icon: string }> = {
      pink: {
        bg: "bg-rose-50",
        border: "border-rose-100",
        text: "text-rose-700",
        icon: "text-rose-600",
      },
      blue: {
        bg: "bg-sky-50",
        border: "border-sky-100",
        text: "text-sky-700",
        icon: "text-sky-600",
      },
      yellow: {
        bg: "bg-amber-50",
        border: "border-amber-100",
        text: "text-amber-700",
        icon: "text-amber-600",
      },
    };
    return map[color] || map.blue;
  };

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {stats.map((stat) => {
        const colors = getColorClasses(stat.color);
        const IconComponent = stat.icon;

        return (
          <Card
            key={stat.label}
            className={`rounded-[28px] ${colors.border} bg-white shadow-sm border`}
          >
            <CardContent className="space-y-4 p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs uppercase font-bold text-slate-600 mb-1">{stat.label}</p>
                  <p className="text-3xl font-black text-slate-900">{stat.value}</p>
                </div>
                <div className={`rounded-full ${colors.bg} p-3`}>
                  <IconComponent className="h-6 w-6" data-icon="inline-start" />
                </div>
              </div>

              <p className={`text-sm font-semibold ${colors.text}`}>{stat.sublabel}</p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
