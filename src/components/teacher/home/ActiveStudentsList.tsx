import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Users, Award, ShieldAlert } from "lucide-react";
import { getSafeXP } from "@/hooks/kid/useChildXP";
import StreakDisplay from "@/components/ui/StreakDisplay";
import type { ApprovedStudent } from "@/types/classroom.types";

type Props = {
  students: ApprovedStudent[];
};

export default function ActiveStudentsList({ students }: Props) {
  const getInitials = (firstName?: string | null, lastName?: string | null) => {
    if (firstName) {
      const first = firstName[0];
      const last = lastName ? lastName[0] : "";
      return (first + last).toUpperCase();
    }
    return "S";
  };

  return (
    <Card className="rounded-[32px] border-slate-200/60 bg-white dark:bg-slate-900/40 shadow-sm relative overflow-hidden transition-all duration-300">
      <div className="absolute top-0 right-0 w-32 h-32 bg-sky-500/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />

      <CardContent className="p-6 md:p-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-sky-600 dark:text-sky-400" />
            <h3 className="text-lg font-black text-slate-950 dark:text-white tracking-tight">
              Active Students
            </h3>
          </div>
          <Badge className="bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 border-none font-bold text-xs px-2.5 py-1 rounded-full">
            {students.length} Enrolled
          </Badge>
        </div>

        {/* Student Roster List */}
        {!students || students.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 px-4 text-center rounded-[24px] border-2 border-dashed border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/10">
            <ShieldAlert className="w-10 h-10 text-slate-400 mb-3" />
            <p className="text-sm text-slate-950 dark:text-slate-200 font-extrabold">
              No active students yet
            </p>
            <p className="text-xs text-slate-400 dark:text-slate-500 font-semibold max-w-xs mt-1">
              Once students enter a classroom code and you approve their request, they will appear
              here.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {students.map((student) => {
              const studentName = student.first_name
                ? `${student.first_name} ${student.last_name || ""}`.trim()
                : "Student";

              return (
                <div
                  key={student.user_id}
                  className="group relative flex items-center justify-between rounded-[24px] border border-slate-100 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-950/20 p-4 hover:shadow-md hover:bg-white dark:hover:bg-slate-900 hover:border-sky-100 dark:hover:border-slate-800/80 transition-all duration-300"
                >
                  <div className="flex items-center gap-3.5 min-w-0 flex-1">
                    <Avatar className="h-11 w-11 border border-slate-200 dark:border-slate-700 shadow-sm shrink-0">
                      <AvatarImage
                        src={student.avatar_url ?? undefined}
                        alt={studentName}
                        className="object-cover"
                      />
                      <AvatarFallback className="bg-gradient-to-br from-sky-400 to-sky-600 text-white font-black text-xs">
                        {getInitials(student.first_name, student.last_name)}
                      </AvatarFallback>
                    </Avatar>

                    <div className="min-w-0 flex-1 space-y-1">
                      <p className="font-extrabold text-slate-950 dark:text-white text-sm leading-none truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                        {studentName}
                      </p>

                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                        <span className="inline-flex items-center text-xs font-bold text-slate-500 dark:text-slate-400">
                          <Award className="w-3.5 h-3.5 mr-0.5 text-indigo-500" />
                          {getSafeXP(student.total_experience_points)} XP
                        </span>

                        {(student.current_streak || 0) > 0 && (
                          <>
                            <span className="text-[10px] text-slate-300 dark:text-slate-700">
                              •
                            </span>
                            <StreakDisplay
                              streak={student.current_streak}
                              variant="badge"
                              className="scale-90 origin-left py-0 px-2 h-5 flex items-center"
                            />
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <Badge className="bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 border-none font-bold text-[10px] uppercase px-2 py-1 rounded-md shrink-0 ml-3">
                    {student.classroom_name}
                  </Badge>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
