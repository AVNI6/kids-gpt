"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Star, Timer, Zap } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { kidActivities, activityButtonStyles, activityColorStyles } from "@/lib/kid-activities";
import { getActivityXpSettings } from "@/actions/activity.actions";
import { type ActivitySlug } from "@/types/activities.type";
import ActivityTopicModal from "@/components/ActivityTopicModal";

export default function ActivitiesPage() {
  const router = useRouter();
  const [showTopicModal, setShowTopicModal] = useState(false);
  const [activeActivitySlug, setActiveActivitySlug] = useState<ActivitySlug | null>(null);
  const [xpSettings, setXpSettings] = useState<Record<string, number>>({});

  useEffect(() => {
    getActivityXpSettings().then((data) => {
      setXpSettings(data);
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
      slug === "jigsaw-puzzle" ||
      slug === "match-following";

    if (isAiPowered) {
      setActiveActivitySlug(slug);
      setShowTopicModal(true);
    } else {
      router.push(href);
    }
  };

  return (
    <main className="min-h-screen bg-background px-6 py-8 relative">
      <div className="absolute top-20 left-10 h-64 w-64 rounded-full bg-sky-500/5 blur-3xl pointer-events-none" />
      <div className="absolute bottom-20 right-10 h-80 w-80 rounded-full bg-green-500/5 blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="mb-10">
          <h1 className="text-4xl font-black tracking-tight text-foreground sm:text-5xl">
            Learning Activities
          </h1>
          <p className="text-muted-foreground mt-2 text-lg">
            Pick a fun educational challenge to level up your brain!
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {kidActivities.map((activity) => {
            const Icon = activity.icon;
            const isAiPowered =
              activity.slug === "flashcards" ||
              activity.slug === "quizzes" ||
              activity.slug === "word-scrambles" ||
              activity.slug === "math-challenges" ||
              activity.slug === "science-lab" ||
              activity.slug === "logic-puzzles" ||
              activity.slug === "jigsaw-puzzle" ||
              activity.slug === "match-following";

            return (
              <Card
                key={activity.id}
                className="border-2 border-border shadow-sm hover:shadow-xl hover:border-sky-500/50 transition-all duration-300 bg-card text-foreground flex flex-col h-full rounded-[24px] overflow-visible relative transform-gpu"
              >
                {/* Premium Dynamic XP Badge on the corner of the card (overlapping the corner, locked to the card layout during scroll) */}
                <div className="absolute -top-3 -right-3 bg-gradient-to-r from-amber-500 via-orange-500 to-yellow-500 text-white font-black text-xs px-3.5 py-1.5 rounded-2xl shadow-md hover:scale-105 transition-transform duration-200 cursor-default select-none animate-pulse z-10 transform-gpu">
                  +{xpSettings[activity.slug] || 150} XP
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

                  <div className="flex items-end justify-between mt-6">
                    <div>
                      <div className="flex flex-wrap gap-2 mb-3">
                        {isAiPowered && (
                          <Badge className="bg-purple-500/10 text-purple-600 border-purple-500/20 font-bold">
                            ✨ AI Powered
                          </Badge>
                        )}
                        {activity.badge && (
                          <Badge variant="secondary" className="font-bold">
                            {activity.badge}
                          </Badge>
                        )}
                      </div>

                      {activity.duration && (
                        <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground mb-1">
                          <Timer className="w-4 h-4" />
                          {activity.duration}
                        </div>
                      )}

                      {activity.stars && (
                        <div className="flex gap-1 mb-1">
                          {Array.from({ length: activity.stars }).map((_, index) => (
                            <Star key={index} className="w-4 h-4 fill-sky-500 text-sky-500" />
                          ))}
                        </div>
                      )}

                      {activity.users && (
                        <div className="flex -space-x-2 mt-1">
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
                      className={`${activityButtonStyles[activity.color]} rounded-[16px] py-6 px-6 shadow-md hover:shadow-lg font-bold text-white transition-all`}
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
