"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Star, Timer, Zap, ArrowLeft } from "lucide-react";
import { Card, CardContent } from "@/components/shared/ui/card";
import { Button } from "@/components/shared/ui/button";
import { Badge } from "@/components/shared/ui/badge";
import { kidActivities, activityButtonStyles, activityColorStyles } from "@/lib/kid-activities";
import { useSidebar } from "@/components/shared/ui/sidebar";
import {
  getActivitySettings,
  type ActivityDbSettings,
} from "@/lib/services/kid/activities/activity.actions";
import { type ActivitySlug } from "@/types/activities.type";
import ActivityTopicModal from "@/components/kid/activities/ActivityTopicModal";

export default function ActivitiesPage() {
  const router = useRouter();
  const [showTopicModal, setShowTopicModal] = useState(false);
  const [activeActivitySlug, setActiveActivitySlug] = useState<ActivitySlug | null>(null);
  const [activitySettings, setActivitySettings] = useState<Record<string, ActivityDbSettings>>({});
  const { state, isMobile } = useSidebar();
  const isSidebarExpanded = state === "expanded" && !isMobile;

  useEffect(() => {
    getActivitySettings().then((data: Record<string, ActivityDbSettings>) => {
      setActivitySettings(data);
    });
  }, []);

  const handleStartActivity = (slug: ActivitySlug, href: string) => {
    const isAiPowered =
      slug === "flashcards" ||
      slug === "quizzes" ||
      slug === "word-scrambles" ||
      slug === "math-challenges" ||
      slug === "science-lab" ||
      slug === "logic-puzzles" ||
      slug === "match-following";

    if (isAiPowered) {
      setActiveActivitySlug(slug);
      setShowTopicModal(true);
    } else {
      router.push(href);
    }
  };

  return (
    <main className="min-h-screen bg-background px-4 py-6 sm:px-6 sm:py-8 relative">
      <div className="absolute top-20 left-10 h-64 w-64 rounded-full bg-sky-500/5 blur-3xl pointer-events-none" />
      <div className="absolute bottom-20 right-10 h-80 w-80 rounded-full bg-green-500/5 blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="mb-5 lg:mb-10">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.back()}
              className="md:hidden h-12 w-12 rounded-2xl border-2 border-border bg-card hover:bg-accent hover:border-sky-500/30 text-foreground shadow-sm transition-all hover:scale-105 active:scale-95 cursor-pointer flex items-center justify-center shrink-0"
              aria-label="Go back"
            >
              <ArrowLeft className="w-6 h-6" />
            </Button>
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-black tracking-tight text-foreground">
              Learning Activities
            </h1>
          </div>
          <p className="text-muted-foreground mt-3 text-md md:text-lg">
            Pick a fun educational challenge to level up your brain!
          </p>
        </div>

        <div
          className={
            isSidebarExpanded
              ? "grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6"
              : "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3  gap-6"
          }
        >
          {kidActivities.map((activity) => {
            const Icon = activity.icon;
            const isAiPowered =
              activity.slug === "flashcards" ||
              activity.slug === "quizzes" ||
              activity.slug === "word-scrambles" ||
              activity.slug === "math-challenges" ||
              activity.slug === "science-lab" ||
              activity.slug === "logic-puzzles" ||
              activity.slug === "match-following";

            return (
              <Card
                key={activity.id}
                className="border-2 border-border shadow-sm hover:shadow-xl hover:border-sky-500/50 transition-all duration-300 bg-card text-foreground flex flex-col h-full rounded-[24px] overflow-visible relative transform-gpu"
              >
                {/* Premium Dynamic XP Badge on the corner of the card (overlapping the corner, locked to the card layout during scroll) */}
                <div className="absolute -top-3 -right-3 bg-gradient-to-r from-amber-500 via-orange-500 to-yellow-500 text-white font-black text-xs px-3.5 py-1.5 rounded-2xl shadow-md hover:scale-105 transition-transform duration-200 cursor-default select-none animate-pulse z-10 transform-gpu">
                  +{activitySettings[activity.slug]?.xp_reward || 150} XP
                </div>

                <CardContent className="p-6 flex flex-col h-full justify-between">
                  <div>
                    <div className="flex items-center mb-4">
                      <div
                        className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-transform hover:scale-105 duration-200 ${
                          activityColorStyles[activity.color]
                        }`}
                      >
                        <Icon className="w-8 h-8" />
                      </div>
                    </div>

                    <h3 className="text-2xl font-black tracking-tight mb-2 text-foreground">
                      {activity.title}
                    </h3>

                    <p className="mb-6 text-muted-foreground leading-relaxed">
                      {activity.description}
                    </p>
                  </div>

                  <div className="flex flex-col gap-4">
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                      {isAiPowered && (
                        <Badge className="bg-purple-500/10 text-purple-600 border-purple-500/20 font-bold shrink-0">
                          ✨ AI Powered
                        </Badge>
                      )}
                      {activity.badge && (
                        <Badge variant="secondary" className="font-bold shrink-0">
                          {activity.badge}
                        </Badge>
                      )}

                      {(activitySettings[activity.slug]?.minutes !== undefined ||
                        activity.duration) && (
                        <div className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground shrink-0">
                          <Timer className="w-4 h-4" />
                          {activitySettings[activity.slug]?.minutes !== undefined
                            ? `${activitySettings[activity.slug].minutes} Mins`
                            : activity.duration}
                        </div>
                      )}

                      {activity.stars && (
                        <div className="flex gap-1 shrink-0">
                          {Array.from({ length: activity.stars }).map((_, index) => (
                            <Star key={index} className="w-4 h-4 fill-sky-500 text-sky-500" />
                          ))}
                        </div>
                      )}

                      {activity.users && (
                        <div className="flex -space-x-2 shrink-0">
                          {activity.users.map((user) => (
                            <div
                              key={user}
                              className="w-8 h-8 rounded-full border-2 border-card bg-muted text-xs font-black flex items-center justify-center"
                            >
                              {user}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <Button
                      onClick={() => handleStartActivity(activity.slug, activity.href)}
                      className={`${activityButtonStyles[activity.color]} w-full rounded-[16px] py-4 px-6 shadow-md hover:shadow-lg font-bold text-white transition-all shrink-0`}
                    >
                      Start Activity
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      <ActivityTopicModal
        isOpen={showTopicModal}
        onClose={() => {
          setShowTopicModal(false);
          setActiveActivitySlug(null);
        }}
        activitySlug={activeActivitySlug}
      />

      <div className="fixed bottom-8 right-8 group z-50">
        <Button
          size="icon"
          className="w-16 h-16 rounded-full bg-sky-600 hover:bg-sky-700 shadow-2xl"
        >
          <Zap className="w-8 h-8 group-hover:rotate-12 transition-transform" />
        </Button>

        <div className="absolute right-20 top-3 bg-sky-600 text-white px-4 py-2 rounded-xl whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
          Quick Challenge!
        </div>
      </div>
    </main>
  );
}
