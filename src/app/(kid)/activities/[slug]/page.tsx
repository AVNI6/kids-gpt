"use client";

import { useState, use } from "react";
import Link from "next/link";
import { notFound, useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle2, Star, Timer } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { kidActivities, activityColorStyles, activityButtonStyles } from "@/lib/kid-activities";
import { APP_ROUTES } from "@/constant/AppRoutes";
import ActivityTopicModal from "@/components/ActivityTopicModal";

interface PageProps {
  params: Promise<{
    slug: string;
  }>;
}

export default function ActivityDetailPage({ params }: PageProps) {
  // Unwrap parameters with modern Next.js client use hook
  const { slug } = use(params);
  const router = useRouter();
  const [showTopicModal, setShowTopicModal] = useState(false);

  const activity = kidActivities.find((item) => item.slug === slug);

  if (!activity) {
    return notFound();
  }

  const isAiPowered =
    activity.slug === "flashcards" ||
    activity.slug === "quizzes" ||
    activity.slug === "word-scrambles" ||
    activity.slug === "math-challenges" ||
    activity.slug === "science-lab" ||
    activity.slug === "logic-puzzles" ||
    activity.slug === "jigsaw-puzzle" ||
    activity.slug === "match-following";

  const handleStartClick = () => {
    if (isAiPowered) {
      setShowTopicModal(true);
    } else {
      router.push(activity.href);
    }
  };

  const Icon = activity.icon;

  return (
    <main className="min-h-screen bg-background px-6 py-10">
      <div className="max-w-4xl mx-auto space-y-8">
        <Link
          href={APP_ROUTES.Activities}
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground font-bold"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Activities
        </Link>

        <Card className="border-2 border-border shadow-lg bg-card">
          <CardHeader className="space-y-4">
            <div
              className={`w-16 h-16 rounded-2xl flex items-center justify-center ${activityColorStyles[activity.color]}`}
            >
              <Icon className="h-8 w-8" />
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <CardTitle className="text-3xl font-black text-foreground">
                {activity.title}
              </CardTitle>
              {activity.badge && (
                <Badge variant="secondary" className="font-bold">
                  {activity.badge}
                </Badge>
              )}
              {activity.xp && (
                <Badge className="bg-sky-500/10 text-sky-500 border-sky-500/20 font-bold">
                  {activity.xp}
                </Badge>
              )}
            </div>

            <p className="text-muted-foreground text-lg">{activity.description}</p>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="flex flex-wrap items-center gap-6 text-sm text-muted-foreground font-bold">
              {activity.duration && (
                <span className="inline-flex items-center gap-2">
                  <Timer className="h-4 w-4 text-sky-500" /> {activity.duration}
                </span>
              )}
              {activity.stars && (
                <span className="inline-flex items-center gap-1">
                  {Array.from({ length: activity.stars }).map((_, index) => (
                    <Star key={`star-${index}`} className="h-4 w-4 fill-sky-500 text-sky-500" />
                  ))}
                </span>
              )}
            </div>

            <div className="rounded-2xl border-2 border-border bg-muted/30 p-6 space-y-3">
              <h3 className="text-lg font-bold text-foreground">How it works</h3>
              <ul className="space-y-2">
                {activity.steps.map((step, index) => (
                  <li
                    key={step}
                    className="flex items-center gap-3 text-muted-foreground font-semibold"
                  >
                    <span className="h-6 w-6 rounded-full bg-sky-500/10 text-sky-500 text-xs font-bold flex items-center justify-center">
                      {index + 1}
                    </span>
                    {step}
                  </li>
                ))}
              </ul>
            </div>

            <Button
              onClick={handleStartClick}
              className={`${activityButtonStyles[activity.color]} w-full rounded-2xl text-base font-bold py-6 text-white shadow-lg`}
            >
              Start {activity.title}
            </Button>
          </CardContent>
        </Card>

        <div className="grid md:grid-cols-3 gap-4 font-semibold">
          <Card className="border-2 border-border bg-card">
            <CardContent className="py-6 space-y-2">
              <h4 className="font-bold text-foreground">Difficulty</h4>
              <p className="text-sm text-muted-foreground">Beginner friendly</p>
            </CardContent>
          </Card>
          <Card className="border-2 border-border bg-card">
            <CardContent className="py-6 space-y-2">
              <h4 className="font-bold text-foreground">Rewards</h4>
              <p className="text-sm text-muted-foreground">Streaks, XP, and badges</p>
            </CardContent>
          </Card>
          <Card className="border-2 border-border bg-card">
            <CardContent className="py-6 space-y-2">
              <h4 className="font-bold text-foreground">Progress</h4>
              <p className="text-sm text-muted-foreground">Track growth each round</p>
            </CardContent>
          </Card>
        </div>

        <Button
          variant="outline"
          className="w-full rounded-2xl border-border hover:bg-muted font-bold text-foreground"
        >
          <CheckCircle2 className="mr-2 h-4 w-4" /> Mark as Favorite
        </Button>
      </div>

      <ActivityTopicModal
        isOpen={showTopicModal}
        onClose={() => setShowTopicModal(false)}
        activitySlug={activity.slug}
      />
    </main>
  );
}
