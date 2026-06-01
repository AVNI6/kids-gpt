import { getLinkedStudents } from "@/actions/dashboard.actions";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Zap, Users } from "lucide-react";
import { getSafeXP } from "@/hooks/useChildXP";
import StreakDisplay from "@/components/dashboard/StreakDisplay";

export default async function ActiveStudentsList() {
  const students = await getLinkedStudents();

  if (!students || students.length === 0) {
    return (
      <Card className="rounded-[28px] border-sky-100 bg-white shadow-sm">
        <CardContent className="p-6">
          <p className="text-slate-600">No linked students found.</p>
        </CardContent>
      </Card>
    );
  }

  const getInitials = (firstName?: string | null, lastName?: string | null) => {
    if (firstName) {
      const first = firstName[0];
      const last = lastName ? lastName[0] : "";
      return (first + last).toUpperCase();
    }
    return "S";
  };

  const getActivityStatus = (index: number) => {
    const statuses = [
      { label: "Quiz 85%", color: "bg-emerald-100 text-emerald-700" },
      { label: "Active 12m", color: "bg-sky-100 text-sky-700" },
      { label: "Reading", color: "bg-amber-100 text-amber-700" },
      { label: "Quiz 92%", color: "bg-emerald-100 text-emerald-700" },
      { label: "Active 5m", color: "bg-sky-100 text-sky-700" },
    ];
    return statuses[index % statuses.length];
  };

  return (
    <Card className="rounded-[28px] border-sky-100 bg-white shadow-sm">
      <CardContent className="space-y-4 p-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-black text-slate-900">Active Students</h3>
          <div className="flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-1">
            <Zap className="h-3 w-3 text-emerald-600" />
            <span className="text-xs font-bold text-emerald-700">{students.length}</span>
          </div>
        </div>

        {/* Student List */}
        <div className="space-y-3">
          {students.map((student, index) => {
            const status = getActivityStatus(index);

            return (
              <div
                key={student.user_id}
                className="rounded-2xl border border-sky-100 bg-sky-50 p-3 hover:shadow-md transition-all cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    <Avatar className="h-10 w-10 border-2 border-sky-200">
                      <AvatarImage
                        src={student.avatar_url ?? undefined}
                        alt={student.first_name ?? "Student"}
                      />
                      <AvatarFallback className="bg-sky-200 text-sky-700 font-bold text-xs">
                        {getInitials(student.first_name, student.last_name)}
                      </AvatarFallback>
                    </Avatar>

                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-slate-900 text-sm">
                        {student.first_name} {student.last_name}
                      </p>
                      <span className="text-xs font-semibold text-slate-500 mt-1 block">
                        {getSafeXP(student.total_experience_points)} XP • Streak:{" "}
                        <StreakDisplay streak={student.current_streak} variant="simple-text" />
                      </span>
                    </div>
                  </div>

                  <Badge className={`${status.color} border-0 text-xs font-bold shrink-0`}>
                    {status.label}
                  </Badge>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <button className="w-full text-center py-2 text-sm font-semibold text-sky-600 hover:text-sky-700 hover:bg-sky-50 rounded-xl transition-colors flex items-center justify-center gap-2">
          <Users className="h-4 w-4" />
          View Full Class
        </button>
      </CardContent>
    </Card>
  );
}
