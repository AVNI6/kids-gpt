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
    <main className="min-h-screen bg-background">
      <div className="container mx-auto max-w-5xl px-4 py-12 space-y-12">
        <Link
          href="/help"
          className="inline-flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-sky-600 transition-colors bg-card px-4 py-2 rounded-full border border-border shadow-sm w-fit"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Help Center
        </Link>

        <section className="space-y-4">
          <h1 className="text-5xl font-black tracking-tight text-foreground">
            Hello, <span className="text-sky-600">Young Explorer!</span>
          </h1>
          <p className="text-muted-foreground text-xl font-medium">
            Learn how to chat, join classes, and earn badges in ChatGPT Kids.
          </p>
        </section>

        <section className="grid md:grid-cols-3 gap-6">
          <Card className="bg-card border-2 border-border/50 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="space-y-3">
              <div className="w-12 h-12 rounded-xl bg-sky-500/10 flex items-center justify-center">
                <MessageSquare className="h-6 w-6 text-sky-600" />
              </div>
              <CardTitle className="text-xl font-bold text-foreground">Chat with AI</CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground font-medium">
              Ask questions about math, science, stories, or homework.
            </CardContent>
          </Card>

          <Card className="bg-card border-2 border-border/50 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="space-y-3">
              <div className="w-12 h-12 rounded-xl bg-sky-500/10 flex items-center justify-center">
                <Users className="h-6 w-6 text-sky-600" />
              </div>
              <CardTitle className="text-xl font-bold text-foreground">Join a Class</CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground font-medium">
              Use your class code from teacher to unlock tasks and activities.
            </CardContent>
          </Card>

          <Card className="bg-card border-2 border-border/50 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="space-y-3">
              <div className="w-12 h-12 rounded-xl bg-sky-500/10 flex items-center justify-center">
                <Trophy className="h-6 w-6 text-sky-600" />
              </div>
              <CardTitle className="text-xl font-bold text-foreground">Earn Badges</CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground font-medium">
              Complete lessons and quizzes to collect achievement badges.
            </CardContent>
          </Card>
        </section>

        <section className="space-y-6">
          <h2 className="text-3xl font-black text-foreground">Common Questions</h2>
          <Accordion className="space-y-4" defaultValue={["q1"]}>
            <AccordionItem
              value="q1"
              className="rounded-2xl border-2 border-border/50 bg-card px-6 hover:border-sky-500/30 transition-colors overflow-hidden"
            >
              <AccordionTrigger className="text-lg font-bold text-foreground hover:text-sky-600 hover:no-underline py-5">
                How do I ask a good question?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground text-base font-medium pb-5">
                Be specific. Example: &quot;Can you explain fractions with pizza slices?&quot;
              </AccordionContent>
            </AccordionItem>
            <AccordionItem
              value="q2"
              className="rounded-2xl border-2 border-border/50 bg-card px-6 hover:border-sky-500/30 transition-colors overflow-hidden"
            >
              <AccordionTrigger className="text-lg font-bold text-foreground hover:text-sky-600 hover:no-underline py-5">
                Where are my stickers and rewards?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground text-base font-medium pb-5">
                Open your profile and check the rewards cabinet to view progress.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem
              value="q3"
              className="rounded-2xl border-2 border-border/50 bg-card px-6 hover:border-sky-500/30 transition-colors overflow-hidden"
            >
              <AccordionTrigger className="text-lg font-bold text-foreground hover:text-sky-600 hover:no-underline py-5">
                Can I use voice to chat?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground text-base font-medium pb-5">
                Yes, on supported plans you can use voice for AI conversations.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </section>

        <Card className="bg-gradient-to-r from-sky-600 to-sky-700 text-white border-0 rounded-3xl overflow-hidden shadow-xl shadow-sky-500/20">
          <CardContent className="py-10 px-8 flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="space-y-2 text-center md:text-left">
              <h3 className="text-3xl font-black">Need more help?</h3>
              <p className="text-sky-50 text-lg font-medium">
                Ask your parent or teacher to contact support.
              </p>
            </div>
            <Button
              variant="secondary"
              className="rounded-full px-8 h-14 text-sky-700 font-bold text-lg hover:bg-white transition-colors"
            >
              <Sparkles className="h-5 w-5 mr-2" /> Contact Support
            </Button>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
