"use client";

import Link from "next/link";
import { ArrowLeft, School, WandSparkles, LineChart, FileDown } from "lucide-react";
import { APP_ROUTES } from "@/constant/AppRoutes";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
            Set up classes, generate activities, and track student outcomes with ChatGPT Kids.
          </p>
        </section>

        <section className="grid md:grid-cols-2 gap-6">
          <Card className="bg-card border-2 border-border/50 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="space-y-3">
              <div className="w-12 h-12 rounded-xl bg-sky-500/10 flex items-center justify-center">
                <School className="h-6 w-6 text-sky-600" />
              </div>
              <CardTitle className="text-xl font-bold text-foreground">Classroom Setup</CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground font-medium">
              Create classes, share codes, and manage student permissions quickly.
            </CardContent>
          </Card>
          <Card className="bg-card border-2 border-border/50 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="space-y-3">
              <div className="w-12 h-12 rounded-xl bg-sky-500/10 flex items-center justify-center">
                <WandSparkles className="h-6 w-6 text-sky-600" />
              </div>
              <CardTitle className="text-xl font-bold text-foreground">
                AI Worksheet Generator
              </CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground font-medium">
              Generate custom quizzes, puzzles, and worksheets by topic and level.
            </CardContent>
          </Card>
        </section>

        <section className="grid md:grid-cols-2 gap-6">
          <Card className="bg-card border-2 border-border/50 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="space-y-3">
              <div className="w-12 h-12 rounded-xl bg-sky-500/10 flex items-center justify-center">
                <LineChart className="h-6 w-6 text-sky-600" />
              </div>
              <CardTitle className="text-xl font-bold text-foreground">
                Tracking Performance
              </CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground font-medium">
              Monitor class averages, topic mastery, and student engagement trends.
            </CardContent>
          </Card>
          <Card className="bg-card border-2 border-border/50 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="space-y-3">
              <div className="w-12 h-12 rounded-xl bg-sky-500/10 flex items-center justify-center">
                <FileDown className="h-6 w-6 text-sky-600" />
              </div>
              <CardTitle className="text-xl font-bold text-foreground">Export Reports</CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground font-medium">
              Export student reports in CSV or PDF for parent-teacher meetings.
            </CardContent>
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

        <Card className="bg-gradient-to-r from-sky-600 to-sky-700 text-white border-0 rounded-3xl overflow-hidden shadow-xl shadow-sky-500/20">
          <CardContent className="py-10 px-8 text-center space-y-6">
            <div className="space-y-2">
              <h3 className="text-3xl font-black">Still have questions?</h3>
              <p className="text-sky-50 text-lg font-medium">
                Our support team is available to help your classroom succeed.
              </p>
            </div>
            <div className="flex items-center justify-center gap-4 flex-wrap">
              <Button
                variant="secondary"
                className="rounded-full px-8 h-12 text-sky-700 font-bold hover:bg-white transition-colors"
              >
                Live Chat Support
              </Button>
              <Button
                variant="secondary"
                className="rounded-full px-8 h-12 text-sky-700 font-bold hover:bg-white transition-colors"
              >
                Email Support
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
