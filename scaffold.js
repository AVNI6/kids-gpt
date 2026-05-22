/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require("fs");
const path = require("path");

const dir = path.join(__dirname, "src/components/dashboard/kid/sections");
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true });
}

const sections = [
  "WelcomeHub",
  "ContinueLearning",
  "DailyOverview",
  "ClassroomOverview",
  "TeacherTasks",
  "GamesHub",
  "GameHistory",
  "AITutorCenter",
  "LearningProgress",
  "AchievementsRewards",
  "LearningRecommendations",
  "NotificationsUpdates",
];

sections.forEach((section) => {
  const content = `import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function ${section}Skeleton() {
  return (
    <Card className="rounded-[32px] border-sky-100 bg-white shadow-sm">
      <CardContent className="p-6 space-y-4">
        <Skeleton className="h-8 w-1/3 bg-slate-100" />
        <Skeleton className="h-32 w-full bg-slate-100" />
      </CardContent>
    </Card>
  );
}

export default async function ${section}({ data }: { data: any }) {
  return (
    <Card className="rounded-[32px] border-sky-100 bg-white shadow-sm">
      <CardContent className="p-6 space-y-4">
        <h2 className="text-2xl font-black text-slate-900">${section}</h2>
        <p className="text-slate-500">Coming soon</p>
      </CardContent>
    </Card>
  );
}
`;
  fs.writeFileSync(path.join(dir, `${section}.tsx`), content);
});

// Write the index.ts
const indexContent = sections
  .map((s) => `export { default as ${s}, ${s}Skeleton } from "./${s}";`)
  .join("\n");
fs.writeFileSync(path.join(dir, "index.ts"), indexContent);

console.log("Scaffolded 12 sections.");
