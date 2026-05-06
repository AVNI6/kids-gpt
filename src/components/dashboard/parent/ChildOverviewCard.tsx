import { getLinkedChildren } from "@/actions/dashboard.actions";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { UserRound } from "lucide-react";

export default async function ChildOverviewCard() {
  const children = await getLinkedChildren();
  const child = children[0];

  if (!child) {
    return (
      <Card className="rounded-[28px] border-sky-100 bg-white shadow-sm">
        <CardContent className="p-6">
          <p className="text-slate-600">No linked children found.</p>
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
    return "K";
  };

  return (
    <Card className="rounded-[28px] border-sky-100 bg-white shadow-sm">
      <CardContent className="space-y-6 p-6">
        {/* Child Profile Header */}
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16 border-4 border-sky-500/20 shadow-md">
            <AvatarImage src={child.avatar_url ?? undefined} alt={child.first_name ?? "Child"} />
            <AvatarFallback className="bg-sky-100 text-sky-700 font-bold text-lg">
              {getInitials(child.first_name, child.last_name)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <h2 className="text-2xl font-black text-slate-900">
              {child.first_name} {child.last_name}
            </h2>
            <p className="text-sm text-slate-500 mt-1">@{child.username || "student"}</p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
          {/* Grade / Status */}
          <div className="rounded-2xl bg-sky-50 border border-sky-100 p-4">
            <p className="text-xs uppercase font-bold text-sky-700 mb-2">Grade</p>
            <p className="text-xl font-black text-sky-900">4th Grade</p>
          </div>

          {/* Curiosity Score */}
          <div className="rounded-2xl bg-emerald-50 border border-emerald-100 p-4">
            <p className="text-xs uppercase font-bold text-emerald-700 mb-2">Curiosity Score</p>
            <p className="text-xl font-black text-emerald-900">87%</p>
          </div>

          {/* Daily Goal */}
          <div className="rounded-2xl bg-amber-50 border border-amber-100 p-4">
            <p className="text-xs uppercase font-bold text-amber-700 mb-2">Daily Goal</p>
            <p className="text-sm font-semibold text-amber-900">30 min learning</p>
          </div>

          {/* Activity Status */}
          <div className="rounded-2xl bg-violet-50 border border-violet-100 p-4">
            <p className="text-xs uppercase font-bold text-violet-700 mb-2">Status Today</p>
            <p className="text-sm font-semibold text-violet-900">Active • 45 min</p>
          </div>
        </div>

        {/* Manage Profile Button */}
        <Button className="w-full rounded-2xl bg-sky-500 text-white hover:bg-sky-600 font-semibold shadow-sm">
          <UserRound className="mr-2 h-4 w-4" />
          Manage Profile
        </Button>
      </CardContent>
    </Card>
  );
}
