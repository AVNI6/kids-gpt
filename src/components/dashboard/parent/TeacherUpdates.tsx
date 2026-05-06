import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { MessageSquare } from "lucide-react";

export default async function TeacherUpdates() {
  const updates = [
    {
      id: 1,
      teacher: "Ms. Johnson",
      message: "Great participation in class today! Keep up the excellent work.",
      timestamp: "2 hours ago",
      avatar: "MJ",
    },
    {
      id: 2,
      teacher: "Mr. Chen",
      message: "Science project submission received. Excellent presentation skills!",
      timestamp: "1 day ago",
      avatar: "MC",
    },
  ];

  return (
    <Card className="rounded-[28px] border-sky-100 bg-white shadow-sm">
      <CardContent className="space-y-4 p-6">
        <h3 className="text-lg font-black text-slate-900">Teacher Updates</h3>

        <div className="space-y-3">
          {updates.map((update) => (
            <div
              key={update.id}
              className="rounded-2xl border border-sky-100 bg-sky-50 p-4 hover:shadow-md transition-all"
            >
              <div className="flex items-start gap-3">
                <Avatar className="h-10 w-10 shrink-0 border-2 border-sky-200">
                  <AvatarFallback className="bg-sky-200 text-sky-700 font-bold text-xs">
                    {update.avatar}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-900">{update.teacher}</p>
                  <p className="text-sm text-slate-700 mt-1 line-clamp-2">{update.message}</p>
                  <p className="text-xs text-slate-500 mt-2">{update.timestamp}</p>
                </div>

                <MessageSquare className="h-5 w-5 text-sky-400 shrink-0 mt-1" />
              </div>
            </div>
          ))}
        </div>

        {/* View All Link */}
        <button className="w-full text-center py-2 text-sm font-semibold text-sky-600 hover:text-sky-700 hover:bg-sky-50 rounded-xl transition-colors">
          View all messages →
        </button>
      </CardContent>
    </Card>
  );
}
