"use client";

import Link from "next/link";
import { ArrowLeft, MessageSquare, Users, Trophy, Sparkles } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export default function StudentHelpPage() {
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
            Hello, Young Explorer!
          </h1>
          <p className="text-muted-foreground text-lg">
            Learn how to chat, join classes, and earn badges in ChatGPT Kids.
          </p>
        </section>

        <section className="grid md:grid-cols-3 gap-5">
          <Card className="bg-white border-2 border-[var(--theme-border-light)]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <MessageSquare className="h-5 w-5 text-[var(--theme-brand)]" /> Chat with AI
              </CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground">
              Ask questions about math, science, stories, or homework.
            </CardContent>
          </Card>
          <Card className="bg-white border-2 border-[var(--theme-border-light)]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Users className="h-5 w-5 text-[var(--theme-brand)]" /> Join a Class
              </CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground">
              Use your class code from teacher to unlock tasks and activities.
            </CardContent>
          </Card>
          <Card className="bg-white border-2 border-[var(--theme-border-light)]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Trophy className="h-5 w-5 text-[var(--theme-brand)]" /> Earn Badges
              </CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground">
              Complete lessons and quizzes to collect achievement badges.
            </CardContent>
          </Card>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">Common Student Questions</h2>
          <Accordion className="space-y-3" defaultValue={["q1"]}>
            <AccordionItem
              value="q1"
              className="rounded-xl border-2 border-[var(--theme-border-light)] bg-white px-4"
            >
              <AccordionTrigger>How do I ask a good question?</AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                Be specific. Example: &quot;Can you explain fractions with pizza slices?&quot;
              </AccordionContent>
            </AccordionItem>
            <AccordionItem
              value="q2"
              className="rounded-xl border-2 border-[var(--theme-border-light)] bg-white px-4"
            >
              <AccordionTrigger>Where are my stickers and rewards?</AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                Open your profile and check the rewards cabinet to view progress.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem
              value="q3"
              className="rounded-xl border-2 border-[var(--theme-border-light)] bg-white px-4"
            >
              <AccordionTrigger>Can I use voice to chat?</AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                Yes, on supported plans you can use voice for AI conversations.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </section>

        <Card className="bg-gradient-to-r from-[var(--theme-brand)] to-[var(--theme-brand-dark)] text-white border-0">
          <CardContent className="py-8 flex items-center justify-between gap-4 flex-wrap">
            <div>
              <h3 className="text-2xl font-bold">Need more help?</h3>
              <p className="opacity-90">Ask your parent or teacher to contact support.</p>
            </div>
            <Button variant="secondary">
              <Sparkles className="h-4 w-4 mr-2" /> Contact Support
            </Button>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
