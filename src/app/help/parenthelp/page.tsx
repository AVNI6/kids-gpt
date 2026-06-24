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
import { APP_ROUTES } from "@/lib/constants/app_routes";

export default function ParentHelpPage() {
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
            Parental <span className="text-sky-600">Hub</span>
          </h1>
          <p className="text-muted-foreground text-xl font-medium">
            Manage safety settings, billing, and your child&apos;s learning progress in Kidoza.
          </p>
        </section>

        <section className="grid md:grid-cols-2 gap-6">
          <Card className="p-6 md:p-8 bg-card border-2 border-border/50 rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition-all">
            <CardHeader className="p-0 space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-sky-50 dark:bg-sky-950/40 flex items-center justify-center">
                <Shield className="w-8 h-8 text-sky-600" />
              </div>
              <div className="space-y-2">
                <CardTitle className="text-2xl font-bold text-foreground">
                  Safety Settings
                </CardTitle>
                <p className="text-muted-foreground font-medium">
                  Control content filters, topic guardrails, and age-appropriate settings.
                </p>
              </div>
            </CardHeader>
          </Card>
          <Card className="p-6 md:p-8 bg-card border-2 border-border/50 rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition-all">
            <CardHeader className="p-0 space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-sky-50 dark:bg-sky-950/40 flex items-center justify-center">
                <BarChart3 className="w-8 h-8 text-sky-600" />
              </div>
              <div className="space-y-2">
                <CardTitle className="text-2xl font-bold text-foreground">Child Progress</CardTitle>
                <p className="text-muted-foreground font-medium">
                  Review weekly growth, completed topics, and learning highlights.
                </p>
              </div>
            </CardHeader>
          </Card>
        </section>

        <Card className="p-6 bg-card border-2 border-border/50 rounded-2xl shadow-sm overflow-hidden">
          <CardContent className="p-0 flex items-center justify-between gap-6 flex-wrap">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-sky-500/10 flex items-center justify-center">
                <CreditCard className="h-6 w-6 text-sky-600" />
              </div>
              <div className="space-y-1">
                <span className="font-bold text-foreground block text-lg">
                  Billing & Subscriptions
                </span>
                <span className="text-muted-foreground text-sm">
                  Manage your plan and invoices.
                </span>
              </div>
            </div>
            <Button
              variant="secondary"
              className="rounded-full px-6 font-bold text-sky-700 bg-sky-500/10 hover:bg-sky-500/20 transition-colors"
            >
              Manage Payments
            </Button>
          </CardContent>
        </Card>

        <section className="space-y-6">
          <h2 className="text-3xl font-black text-foreground">Common Parent Questions</h2>
          <Accordion className="space-y-4" defaultValue={["q1"]}>
            <AccordionItem
              value="q1"
              className="rounded-2xl border-2 border-border/50 bg-card px-6 hover:border-sky-500/30 transition-colors overflow-hidden"
            >
              <AccordionTrigger className="text-lg font-bold text-foreground hover:text-sky-600 hover:no-underline py-5">
                Is my child safe using Kidoza?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground text-base font-medium pb-5">
                Yes. Interactions are moderated and safety controls are built for children.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem
              value="q2"
              className="rounded-2xl border-2 border-border/50 bg-card px-6 hover:border-sky-500/30 transition-colors overflow-hidden"
            >
              <AccordionTrigger className="text-lg font-bold text-foreground hover:text-sky-600 hover:no-underline py-5">
                How do I see detailed progress reports?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground text-base font-medium pb-5">
                Open Parent Dashboard and select Weekly Insights for detailed reports.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem
              value="q3"
              className="rounded-2xl border-2 border-border/50 bg-card px-6 hover:border-sky-500/30 transition-colors overflow-hidden"
            >
              <AccordionTrigger className="text-lg font-bold text-foreground hover:text-sky-600 hover:no-underline py-5">
                Where can I download invoices?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground text-base font-medium pb-5">
                Go to Subscriptions and open Billing History to download invoices.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </section>

        <Card className="p-8 md:p-10 bg-gradient-to-r from-sky-600 to-sky-700 text-white border-0 rounded-3xl overflow-hidden shadow-xl shadow-sky-500/20">
          <CardContent className="p-0 flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="space-y-2 text-center md:text-left">
              <h3 className="text-3xl font-black">Your data is yours. Always.</h3>
              <p className="text-sky-50 text-lg font-medium">
                Learn how we protect your family with secure privacy controls.
              </p>
            </div>
            <Button
              variant="secondary"
              className="rounded-full px-8 h-14 text-sky-700 font-bold text-lg hover:bg-white transition-colors"
            >
              <Lock className="h-5 w-5 mr-2" /> Privacy Policy
            </Button>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
