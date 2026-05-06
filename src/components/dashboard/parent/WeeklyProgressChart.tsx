import { Card, CardContent } from "@/components/ui/card";

export default async function WeeklyProgressChart() {
  const weekData = [
    { day: "Mon", value: 30, label: "30m" },
    { day: "Tue", value: 45, label: "45m" },
    { day: "Wed", value: 35, label: "35m" },
    { day: "Thu", value: 50, label: "50m" },
    { day: "Fri", value: 40, label: "40m" },
    { day: "Sat", value: 60, label: "60m" },
    { day: "Sun", value: 45, label: "45m" },
  ];

  const maxValue = Math.max(...weekData.map((d) => d.value));

  return (
    <Card className="rounded-[28px] border-sky-100 bg-white shadow-sm">
      <CardContent className="space-y-4 p-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-black text-slate-900">Weekly Progress</h3>
          <span className="text-sm font-semibold text-sky-600">315 min</span>
        </div>

        <div className="flex items-end justify-around gap-2 h-40">
          {weekData.map((item) => {
            const heightPercent = (item.value / maxValue) * 100;
            return (
              <div key={item.day} className="flex flex-col items-center gap-2 flex-1">
                {/* Bar */}
                <div className="w-full bg-sky-100 rounded-t-lg overflow-hidden flex items-end justify-center h-full relative group">
                  <div
                    className="w-3/4 bg-sky-500 rounded-t-lg transition-all hover:bg-sky-600 group-hover:shadow-lg"
                    style={{ height: `${heightPercent}%` }}
                  />
                  {/* Tooltip */}
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-xs font-bold px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                    {item.label}
                  </div>
                </div>

                {/* Day Label */}
                <p className="text-xs font-bold text-slate-500">{item.day}</p>
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="pt-2 border-t border-slate-100 flex items-center justify-center gap-4 text-xs text-slate-600">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded bg-sky-500" />
            <span>Learning time</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
