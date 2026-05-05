"use client";

import Link from "next/link";
import { Star, Timer, Zap } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { kidActivities, activityButtonStyles, activityColorStyles } from "@/lib/kid-activities";

export default function ActivitiesPage() {
  return (
    <main className="min-h-screen bg-slate-50 px-6 py-8">
      <div className="max-w-7xl mx-auto">
        {/* Heading */}
        <div className="mb-10">
          <h1 className="text-4xl font-bold">Activities</h1>
          <p className="text-muted-foreground mt-2">Pick a fun activity and start learning!</p>
        </div>

        {/* Activities Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {kidActivities.map((activity) => {
            const Icon = activity.icon;

            return (
              <Card
                key={activity.id}
                className={`border-2 shadow-sm hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:border-sky-300 transition-all duration-300 ${
                  activity.dark ? "bg-slate-900 text-white" : "bg-white"
                }`}
              >
                <CardContent className="p-6 flex flex-col h-full">
                  {/* Icon */}
                  <div
                    className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 ${
                      activityColorStyles[activity.color]
                    }`}
                  >
                    <Icon className="w-8 h-8" />
                  </div>

                  {/* Title */}
                  <h3 className="text-2xl font-bold mb-2">{activity.title}</h3>

                  {/* Description */}
                  <p
                    className={`mb-6 flex-1 ${activity.dark ? "text-slate-400" : "text-slate-500"}`}
                  >
                    {activity.description}
                  </p>

                  {/* Footer */}
                  <div className="flex items-center justify-between mt-auto">
                    <div>
                      {activity.xp && <Badge>{activity.xp}</Badge>}

                      {activity.badge && <Badge variant="secondary">{activity.badge}</Badge>}

                      {activity.duration && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Timer className="w-4 h-4" />
                          {activity.duration}
                        </div>
                      )}

                      {activity.stars && (
                        <div className="flex gap-1">
                          {Array.from({ length: activity.stars }).map((_, index) => (
                            <Star key={index} className="w-4 h-4 fill-current" />
                          ))}
                        </div>
                      )}

                      {activity.users && (
                        <div className="flex -space-x-2">
                          {activity.users.map((user) => (
                            <div
                              key={user}
                              className="w-8 h-8 rounded-full border-2 border-white bg-slate-200 text-xs font-bold flex items-center justify-center"
                            >
                              {user}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Button with route */}
                    <Button
                      render={<Link href={activity.href} />}
                      nativeButton={false}
                      className={`${activityButtonStyles[activity.color]} rounded-2xl`}
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

      {/* Floating Quick Challenge Button */}
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
