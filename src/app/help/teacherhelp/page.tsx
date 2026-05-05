"use client";

import Link from "next/link";
import { ArrowLeft, School, WandSparkles, LineChart, FileDown } from "lucide-react";

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
    <main className="min-h-screen bg-[var(--theme-bg-light)]">
      <div className="container mx-auto max-w-5xl px-4 py-10 space-y-8">
        <Link
          href="/help"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Help Center
        </Link>

        <section className="space-y-3">
          <h1 className="text-4xl font-bold tracking-tight text-[var(--theme-brand)]">
            Teacher Knowledge Hub
          </h1>
          <p className="text-muted-foreground text-lg">
            Set up classes, generate activities, and track student outcomes with ChatGPT Kids.
          </p>
        </section>

        <section className="grid md:grid-cols-2 gap-5">
          <Card className="bg-white border-2 border-[var(--theme-border-light)]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <School className="h-5 w-5 text-[var(--theme-brand)]" /> Classroom Setup
              </CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground">
              Create classes, share codes, and manage student permissions quickly.
            </CardContent>
          </Card>
          <Card className="bg-white border-2 border-[var(--theme-border-light)]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <WandSparkles className="h-5 w-5 text-[var(--theme-brand)]" /> AI Worksheet
                Generator
              </CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground">
              Generate custom quizzes, puzzles, and worksheets by topic and level.
            </CardContent>
          </Card>
        </section>

        <section className="grid md:grid-cols-2 gap-5">
          <Card className="bg-white border-2 border-[var(--theme-border-light)]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <LineChart className="h-5 w-5 text-[var(--theme-brand)]" /> Tracking Performance
              </CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground">
              Monitor class averages, topic mastery, and student engagement trends.
            </CardContent>
          </Card>
          <Card className="bg-white border-2 border-[var(--theme-border-light)]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <FileDown className="h-5 w-5 text-[var(--theme-brand)]" /> Export Reports
              </CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground">
              Export student reports in CSV or PDF for parent-teacher meetings.
            </CardContent>
          </Card>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">Frequently Asked Questions</h2>
          <Accordion className="space-y-3" defaultValue={["q1"]}>
            <AccordionItem
              value="q1"
              className="rounded-xl border-2 border-[var(--theme-border-light)] bg-white px-4"
            >
              <AccordionTrigger>How do I generate a quiz?</AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                Go to Activities, pick a topic, set level, and click Generate with AI.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem
              value="q2"
              className="rounded-xl border-2 border-[var(--theme-border-light)] bg-white px-4"
            >
              <AccordionTrigger>Where can I find student reports?</AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                Open Class Analytics and filter by class, student, or time period.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem
              value="q3"
              className="rounded-xl border-2 border-[var(--theme-border-light)] bg-white px-4"
            >
              <AccordionTrigger>Is student data secure?</AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                Yes, data access is role-based and protected with secure storage policies.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </section>

        <Card className="bg-gradient-to-r from-[var(--theme-brand)] to-[var(--theme-brand-dark)] text-white border-0">
          <CardContent className="py-8 text-center space-y-4">
            <h3 className="text-3xl font-bold">Still have questions?</h3>
            <p className="opacity-90">
              Our support team is available to help your classroom succeed.
            </p>
            <div className="flex items-center justify-center gap-3 flex-wrap">
              <Button variant="secondary">Live Chat Support</Button>
              <Button variant="secondary">Email Support</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
