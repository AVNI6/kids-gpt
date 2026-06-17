"use client";

import Link from "next/link";
import { ArrowLeft, School, WandSparkles, LineChart, FileDown } from "lucide-react";
import { APP_ROUTES } from "@/lib/constants/common";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export default function TeacherHelpPage() {
  return (
    <main className="min-h-screen bg-background">
      <div className="container mx-auto max-w-5xl px-4 py-12 space-y-12">
        <Link
          href={APP_ROUTES.Help}
          className="inline-flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-sky-600 transition-colors bg-card px-4 py-2 rounded-full border border-border shadow-sm w-fit"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Help Center
        </Link>

        <section className="space-y-4">
          <h1 className="text-5xl font-black tracking-tight text-foreground">
            Teacher <span className="text-sky-600">Hub</span>
          </h1>
          <p className="text-muted-foreground text-xl font-medium">
            Set up classes, generate activities, and track student outcomes with Kidoza.
          </p>
        </section>

        <section className="grid md:grid-cols-2 gap-6">
          <Card className="p-6 md:p-8 bg-card border-2 border-border/50 rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition-all">
            <CardHeader className="p-0 space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-sky-50 dark:bg-sky-950/40 flex items-center justify-center">
                <School className="w-8 h-8 text-sky-600" />
              </div>
              <div className="space-y-2">
                <CardTitle className="text-2xl font-bold text-foreground">
                  Classroom Setup
                </CardTitle>
                <p className="text-muted-foreground font-medium">
                  Create classes, share codes, and manage student permissions quickly.
                </p>
              </div>
            </CardHeader>
          </Card>
          <Card className="p-6 md:p-8 bg-card border-2 border-border/50 rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition-all">
            <CardHeader className="p-0 space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-sky-50 dark:bg-sky-950/40 flex items-center justify-center">
                <WandSparkles className="w-8 h-8 text-sky-600" />
              </div>
              <div className="space-y-2">
                <CardTitle className="text-2xl font-bold text-foreground">
                  AI Worksheet Generator
                </CardTitle>
                <p className="text-muted-foreground font-medium">
                  Generate custom quizzes, puzzles, and worksheets by topic and level.
                </p>
              </div>
            </CardHeader>
          </Card>
        </section>

        <section className="grid md:grid-cols-2 gap-6">
          <Card className="p-6 md:p-8 bg-card border-2 border-border/50 rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition-all">
            <CardHeader className="p-0 space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-sky-50 dark:bg-sky-950/40 flex items-center justify-center">
                <LineChart className="w-8 h-8 text-sky-600" />
              </div>
              <div className="space-y-2">
                <CardTitle className="text-2xl font-bold text-foreground">
                  Tracking Performance
                </CardTitle>
                <p className="text-muted-foreground font-medium">
                  Monitor class averages, topic mastery, and student engagement trends.
                </p>
              </div>
            </CardHeader>
          </Card>
          <Card className="p-6 md:p-8 bg-card border-2 border-border/50 rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition-all">
            <CardHeader className="p-0 space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-sky-50 dark:bg-sky-950/40 flex items-center justify-center">
                <FileDown className="w-8 h-8 text-sky-600" />
              </div>
              <div className="space-y-2">
                <CardTitle className="text-2xl font-bold text-foreground">Export Reports</CardTitle>
                <p className="text-muted-foreground font-medium">
                  Export student reports in CSV or PDF for parent-teacher meetings.
                </p>
              </div>
            </CardHeader>
          </Card>
        </section>

        <section className="space-y-6">
          <h2 className="text-3xl font-black text-foreground">Frequently Asked Questions</h2>
          <Accordion className="space-y-4" defaultValue={["q1"]}>
            <AccordionItem
              value="q1"
              className="rounded-2xl border-2 border-border/50 bg-card px-6 hover:border-sky-500/30 transition-colors overflow-hidden"
            >
              <AccordionTrigger className="text-lg font-bold text-foreground hover:text-sky-600 hover:no-underline py-5">
                How do I generate a quiz?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground text-base font-medium pb-5">
                Go to Activities, pick a topic, set level, and click Generate with AI.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem
              value="q2"
              className="rounded-2xl border-2 border-border/50 bg-card px-6 hover:border-sky-500/30 transition-colors overflow-hidden"
            >
              <AccordionTrigger className="text-lg font-bold text-foreground hover:text-sky-600 hover:no-underline py-5">
                Where can I find student reports?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground text-base font-medium pb-5">
                Open Class Analytics and filter by class, student, or time period.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem
              value="q3"
              className="rounded-2xl border-2 border-border/50 bg-card px-6 hover:border-sky-500/30 transition-colors overflow-hidden"
            >
              <AccordionTrigger className="text-lg font-bold text-foreground hover:text-sky-600 hover:no-underline py-5">
                Is student data secure?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground text-base font-medium pb-5">
                Yes, data access is role-based and protected with secure storage policies.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </section>
      </div>
    </main>
  );
}
