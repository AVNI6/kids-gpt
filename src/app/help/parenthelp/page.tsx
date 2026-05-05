"use client";

import Link from "next/link";
import { ArrowLeft, Shield, BarChart3, CreditCard, Lock } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export default function ParentHelpPage() {
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
            Parental Hub
          </h1>
          <p className="text-muted-foreground text-lg">
            Manage safety settings, billing, and your child learning progress in ChatGPT Kids.
          </p>
        </section>

        <section className="grid md:grid-cols-2 gap-5">
          <Card className="bg-white border-2 border-[var(--theme-border-light)]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Shield className="h-5 w-5 text-[var(--theme-brand)]" /> Safety Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground">
              Control content filters, topic guardrails, and age-appropriate settings.
            </CardContent>
          </Card>
          <Card className="bg-white border-2 border-[var(--theme-border-light)]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <BarChart3 className="h-5 w-5 text-[var(--theme-brand)]" /> Child Progress
              </CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground">
              Review weekly growth, completed topics, and learning highlights.
            </CardContent>
          </Card>
        </section>

        <Card className="bg-white border-2 border-[var(--theme-border-light)]">
          <CardContent className="py-5 flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <CreditCard className="h-5 w-5 text-[var(--theme-brand)]" />
              <span className="font-medium">Billing & Subscriptions</span>
            </div>
            <Button variant="secondary">Manage Payments</Button>
          </CardContent>
        </Card>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">Common Parent Questions</h2>
          <Accordion className="space-y-3" defaultValue={["q1"]}>
            <AccordionItem
              value="q1"
              className="rounded-xl border-2 border-[var(--theme-border-light)] bg-white px-4"
            >
              <AccordionTrigger>Is my child safe using ChatGPT Kids?</AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                Yes. Interactions are moderated and safety controls are built for children.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem
              value="q2"
              className="rounded-xl border-2 border-[var(--theme-border-light)] bg-white px-4"
            >
              <AccordionTrigger>How do I see detailed progress reports?</AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                Open Parent Dashboard and select Weekly Insights for detailed reports.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem
              value="q3"
              className="rounded-xl border-2 border-[var(--theme-border-light)] bg-white px-4"
            >
              <AccordionTrigger>Where can I download invoices?</AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                Go to Subscriptions and open Billing History to download invoices.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </section>

        <Card className="bg-gradient-to-r from-[var(--theme-brand)] to-[var(--theme-brand-dark)] text-white border-0">
          <CardContent className="py-8 flex items-center justify-between gap-4 flex-wrap">
            <div>
              <h3 className="text-2xl font-bold">Your data is yours. Always.</h3>
              <p className="opacity-90">
                Learn how we protect your family with secure privacy controls.
              </p>
            </div>
            <Button variant="secondary">
              <Lock className="h-4 w-4 mr-2" /> Privacy Policy
            </Button>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
