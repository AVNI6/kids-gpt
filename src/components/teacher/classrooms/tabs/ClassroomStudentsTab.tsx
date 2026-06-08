"use client";

import { Users } from "lucide-react";
import { Card, CardContent } from "@/components/shared/ui/card";
import { Badge } from "@/components/shared/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/shared/ui/avatar";
import type { WorkspaceStudent } from "@/types/classroom.types";

type Props = {
  students: WorkspaceStudent[];
  getInitials: (first?: string | null, last?: string | null) => string;
};

export default function ClassroomStudentsTab({ students, getInitials }: Props) {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h3 className="text-lg font-black text-slate-950 dark:text-white flex items-center gap-2">
          <Users className="h-5 w-5 text-indigo-600" />
          Class Roster
        </h3>
        <p className="text-xs text-slate-500 font-semibold">
          Approved student accounts currently linked to this class workspace.
        </p>
      </div>

      {students.length === 0 ? (
        <Card className="rounded-[32px] border-dashed border-2 border-indigo-150 dark:border-slate-800 bg-indigo-50/5 p-12 text-center">
          <CardContent className="space-y-4 p-0 max-w-sm mx-auto flex flex-col items-center">
            <div className="h-12 w-12 rounded-2xl bg-indigo-50 dark:bg-slate-800 flex items-center justify-center text-indigo-500">
              <Users className="h-6 w-6" />
            </div>
            <div>
              <h4 className="text-base font-black text-slate-950 dark:text-white">
                No students enrolled
              </h4>
              <p className="text-xs text-slate-500 font-semibold leading-relaxed mt-1">
                Provide the classroom code to kids to invite them. They will appear here once you
                approve their requests on the dashboard.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {students.map((student) => {
            const name =
              `${student.first_name || ""} ${student.last_name || ""}`.trim() || "Student";
            return (
              <Card
                key={student.user_id}
                className="rounded-[28px] border-slate-200/50 dark:border-slate-800/50 bg-white dark:bg-slate-900/40 p-5 hover:shadow-xs transition-shadow"
              >
                <CardContent className="p-0 flex items-center gap-3.5">
                  <Avatar className="h-12 w-12 border dark:border-slate-800 shadow-xs shrink-0">
                    <AvatarImage src={student.avatar_url ?? undefined} />
                    <AvatarFallback className="text-sm bg-indigo-500 text-white font-black">
                      {getInitials(student.first_name, student.last_name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <h4 className="text-sm font-black text-slate-950 dark:text-white leading-tight truncate">
                      {name}
                    </h4>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1">
                      XP Score:{" "}
                      <span className="font-extrabold text-indigo-600">
                        {student.total_experience_points || 0}
                      </span>
                    </p>
                    {student.current_streak > 0 && (
                      <Badge className="bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-450 border-none font-bold text-[8px] tracking-wider uppercase px-2 py-0 h-4 mt-1.5">
                        {student.current_streak} Day Streak
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
