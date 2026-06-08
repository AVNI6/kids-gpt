import { Card, CardContent } from "@/components/shared/ui/card";
import { Button } from "@/components/shared/ui/button";
import { Plus, Beaker, BookText, Microscope, Globe } from "lucide-react";

export default async function RecentResourcesGrid() {
  const resources = [
    {
      id: 1,
      title: "Introduction to Planetology",
      icon: Globe,
      color: "sky",
      views: "2.3k",
    },
    {
      id: 2,
      title: "Cell Biology Basics",
      icon: Microscope,
      color: "emerald",
      views: "1.8k",
    },
    {
      id: 3,
      title: "The Water Cycle",
      icon: Beaker,
      color: "blue",
      views: "1.5k",
    },
    {
      id: 4,
      title: "Mathematics Essentials",
      icon: BookText,
      color: "amber",
      views: "2.1k",
    },
  ];

  const getColorClasses = (color: string) => {
    const map: Record<string, { bg: string; border: string; icon: string }> = {
      sky: { bg: "bg-sky-50", border: "border-sky-100", icon: "text-sky-600" },
      emerald: { bg: "bg-emerald-50", border: "border-emerald-100", icon: "text-emerald-600" },
      blue: { bg: "bg-blue-50", border: "border-blue-100", icon: "text-blue-600" },
      amber: { bg: "bg-amber-50", border: "border-amber-100", icon: "text-amber-600" },
    };
    return map[color] || map.sky;
  };

  return (
    <Card className="rounded-[28px] border-sky-100 bg-white shadow-sm">
      <CardContent className="space-y-6 p-6">
        <h3 className="text-lg font-black text-slate-900">Recent Resources</h3>

        {/* Resource Grid */}
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {resources.map((resource) => {
            const colors = getColorClasses(resource.color);
            const IconComponent = resource.icon;

            return (
              <div
                key={resource.id}
                className={`${colors.bg} rounded-2xl border ${colors.border} p-4 hover:shadow-md transition-all cursor-pointer`}
              >
                <div className="flex flex-col items-center gap-3">
                  <div className={`rounded-full ${colors.bg} border ${colors.border} p-3`}>
                    <IconComponent className={`h-6 w-6 ${colors.icon}`} />
                  </div>
                  <p className="text-xs font-bold text-center text-slate-700 line-clamp-2">
                    {resource.title}
                  </p>
                  <p className="text-xs text-slate-500">{resource.views} views</p>
                </div>
              </div>
            );
          })}

          {/* Add New Resource Button */}
          <button className="rounded-2xl border-2 border-dashed border-slate-300 p-4 flex flex-col items-center gap-3 hover:border-sky-500 hover:bg-sky-50 transition-all">
            <div className="rounded-full bg-slate-100 p-3">
              <Plus className="h-6 w-6 text-slate-600" />
            </div>
            <p className="text-xs font-bold text-slate-600">Add New</p>
          </button>
        </div>

        {/* View All Button */}
        <Button className="w-full rounded-2xl bg-sky-500 text-white hover:bg-sky-600 font-semibold shadow-sm">
          View All Resources
        </Button>
      </CardContent>
    </Card>
  );
}
