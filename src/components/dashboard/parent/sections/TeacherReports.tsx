"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { MessageCircle, FileText, Calendar, CheckCircle2, Clock } from "lucide-react";
import type { LinkedChildProfile } from "@/types/dashboard.types";

const MOCK_REPORTS = [
  {
    id: 1,
    teacherName: "Mr. Davis",
    teacherAvatar: "https://i.pravatar.cc/150?u=davis",
    classroom: "Science 101",
    summary:
      "Excellent progress in the recent biology module. Very engaged during interactive AI sessions.",
    improvement: "Needs slightly more focus on physics fundamentals.",
    assignments: [
      { type: "MCQ Quiz", title: "Cell Structures", dueDate: "Tomorrow", status: "completed" },
      { type: "Worksheet", title: "Physics Basics", dueDate: "Friday", status: "pending" },
    ],
  },
  {
    id: 2,
    teacherName: "Ms. Sarah",
    teacherAvatar: "https://i.pravatar.cc/150?u=sarah",
    classroom: "English Literature",
    summary: "Reading comprehension has improved significantly. Great vocabulary retention.",
    improvement: "Encourage reading more non-fiction articles.",
    assignments: [
      { type: "Flashcards", title: "Weekly Vocab", dueDate: "Today", status: "completed" },
      { type: "Puzzle", title: "Word Search", dueDate: "Monday", status: "pending" },
    ],
  },
];

export default function TeacherReports({
  linkedChildren,
}: {
  linkedChildren: LinkedChildProfile[];
}) {
  const activeChild = linkedChildren[0];

  if (!activeChild) return null;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
          Teacher Reports
        </h1>
        <p className="text-slate-500 dark:text-slate-400 font-medium">
          Feedback and assignments from {activeChild.first_name}&apos;s teachers.
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {MOCK_REPORTS.map((report) => (
          <Card
            key={report.id}
            className="rounded-[32px] border-slate-200/60 dark:border-slate-800/60 bg-white dark:bg-slate-900/50 shadow-sm overflow-hidden"
          >
            <CardContent className="p-0">
              <div className="p-8 border-b border-slate-100 dark:border-slate-800/50">
                <div className="flex justify-between items-start mb-6">
                  <div className="flex items-center gap-4">
                    <Avatar className="w-14 h-14 border-2 border-slate-100 dark:border-slate-800">
                      <AvatarImage src={report.teacherAvatar} className="object-cover" />
                      <AvatarFallback className="bg-blue-100 text-blue-700 font-bold">
                        {report.teacherName[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="text-lg font-black text-slate-900 dark:text-white">
                        {report.teacherName}
                      </h3>
                      <p className="text-sm font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md inline-block mt-1">
                        {report.classroom}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="rounded-full hover:bg-blue-50 dark:hover:bg-blue-900/30 text-blue-600 dark:text-blue-400"
                  >
                    <MessageCircle className="w-5 h-5" />
                  </Button>
                </div>

                <div className="space-y-4">
                  <div className="bg-blue-50/50 dark:bg-blue-900/10 p-4 rounded-2xl border border-blue-100/50 dark:border-blue-800/30">
                    <p className="text-sm text-slate-700 dark:text-slate-300 font-medium italic">
                      &quot;{report.summary}&quot;
                    </p>
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                      Areas for Improvement
                    </h4>
                    <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">
                      {report.improvement}
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-8 bg-slate-50/50 dark:bg-slate-900/20">
                <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-4">
                  Assigned Activities
                </h4>
                <div className="space-y-3">
                  {report.assignments.map((assignment, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-white dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60 rounded-xl shadow-sm"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`p-2 rounded-lg ${assignment.status === "completed" ? "bg-emerald-100 dark:bg-emerald-900/50" : "bg-orange-100 dark:bg-orange-900/50"}`}
                        >
                          {assignment.status === "completed" ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                          ) : (
                            <Clock className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-900 dark:text-white">
                            {assignment.title}
                          </p>
                          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                            {assignment.type}
                          </p>
                        </div>
                      </div>
                      <div className="text-right flex items-center gap-2">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                          {assignment.dueDate}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-6 flex gap-3">
                  <Button
                    variant="outline"
                    className="flex-1 rounded-xl font-bold border-slate-200 dark:border-slate-700"
                  >
                    <MessageCircle className="w-4 h-4 mr-2" /> Message
                  </Button>
                  <Button className="flex-1 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold hover:bg-slate-800 dark:hover:bg-slate-200">
                    <FileText className="w-4 h-4 mr-2" /> Full Report
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
