"use client";

import Link from "next/link";
import Image from "next/image";

import {
  Search,
  GraduationCap,
  Users,
  Shield,
  BookOpen,
  MessageSquare,
  Mail,
  Video,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  ArrowDownRight,
} from "lucide-react";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const roleGuides = [
  {
    title: "Student Help",
    description: "Learn how to use AI chat, solve quizzes, puzzles, and join classes safely.",
    icon: GraduationCap,
    value: "student",
    href: "/help/studenthelp",
  },
  {
    title: "Parent Help",
    description: "Manage child safety, progress tracking, subscription, and learning history.",
    icon: Users,
    value: "parent",
    href: "/help/parenthelp",
  },
  {
    title: "Teacher Help",
    description: "Create activities, manage classrooms, assign quizzes, and track performance.",
    icon: BookOpen,
    value: "teacher",
    href: "/help/teacherhelp",
  },
];

const quickTopics = [
  {
    title: "Joining a Class",
    desc: "Use your teacher class code to connect instantly.",
    icon: Users,
  },
  {
    title: "Safe AI Learning",
    desc: "Understand how child-safe AI moderation works.",
    icon: Shield,
  },
  {
    title: "Progress Tracking",
    desc: "See scores, streaks, activities, and achievements.",
    icon: CheckCircle2,
  },
  {
    title: "Subscriptions",
    desc: "Manage plans, billing, and family features.",
    icon: Sparkles,
  },
];

const steps = [
  "Create your ChatGPT Kids account",
  "Choose your role",
  "Connect with class code (optional)",
  "Start learning with AI",
];

export default function HelpPage() {
  return (
    <div className="min-h-screen bg-(--theme-bg-light)]">
      <main className="container mx-auto max-w-6xl px-4 py-10 space-y-14">
        {/* HERO */}
        <section className="text-center space-y-6">
          <Badge className="px-4 py-2 text-sm bg-(--theme-border-light) text-(--theme-brand) border border-(--theme-brand)/20">
            Help Center
          </Badge>

          <div className="space-y-3">
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight">How can we help?</h1>

            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Find guides for students, parents, and teachers. Learn how to use ChatGPT Kids safely
              and effectively.
            </p>
          </div>
        </section>

        {/* ROLE GUIDES */}
        <section className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold">Choose your role</h2>
            <p className="text-muted-foreground">Personalized help based on your role</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {roleGuides.map((role) => {
              const Icon = role.icon;

              return (
                <Card
                  key={role.title}
                  className="group transition hover:shadow-lg hover:-translate-y-1 cursor-pointer bg-white border-2 border-(--theme-border-light)"
                >
                  <CardHeader>
                    <div className="w-14 h-14 rounded-2xl bg-(--theme-border-light) flex items-center justify-center">
                      <Icon className="w-7 h-7 text-(--theme-brand)" />
                    </div>

                    <CardTitle>{role.title}</CardTitle>

                    <CardDescription>{role.description}</CardDescription>
                  </CardHeader>

                  <CardContent>
                    <Button
                      render={<Link href={role.href} />}
                      nativeButton={false}
                      className="w-full bg-(--theme-brand) hover:bg-(--theme-brand-dark) text-white"
                    >
                      Explore Guide
                      <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>

        {/* GETTING STARTED */}
        <section className="space-y-8">
          <div>
            <h2 className="text-2xl font-bold">Getting Started</h2>
            <p className="text-muted-foreground">Start your learning journey in 4 simple steps</p>
          </div>

          <div className="grid md:grid-cols-4 gap-6">
            {steps.map((step, index) => (
              <div key={step} className="relative">
                <Card>
                  <CardContent className="pt-6 space-y-4">
                    <div className="w-12 h-12 rounded-full bg-(--theme-brand) text-white flex items-center justify-center font-bold">
                      {index + 1}
                    </div>

                    <h3 className="font-semibold">{step}</h3>
                  </CardContent>
                </Card>

                {index < steps.length - 1 && (
                  <div className="hidden md:flex items-center justify-center absolute -right-4 top-1/2 -translate-y-1/2 z-10">
                    <div className="h-8 w-8 rounded-full bg-(--theme-border-light) text-(--theme-brand) flex items-center justify-center border border-(--theme-brand)/20">
                      <ArrowRight className="h-4 w-4" />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="md:hidden grid gap-2">
            {steps.slice(0, -1).map((step) => (
              <div
                key={`mobile-arrow-${step}`}
                className="flex items-center justify-center text-(--theme-brand)/70"
              >
                <ArrowDownRight className="h-4 w-4" />
              </div>
            ))}
          </div>
        </section>

        {/* HELP CONTENT TABS */}
        <section className="space-y-8">
          <div>
            <h2 className="text-2xl font-bold">Guides & Resources</h2>
          </div>

          <Tabs defaultValue="student" className="w-full">
            <TabsList className="grid w-full md:w-125 grid-cols-3">
              <TabsTrigger value="student">Student</TabsTrigger>
              <TabsTrigger value="parent">Parent</TabsTrigger>
              <TabsTrigger value="teacher">Teacher</TabsTrigger>
            </TabsList>

            <TabsContent value="student" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Student Help Guide</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-(--theme-text-secondary)">
                  <p>• How to chat with AI tutor</p>
                  <p>• Solve quizzes and flashcards</p>
                  <p>• Join teacher classroom</p>
                  <p>• View your learning progress</p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="parent" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Parent Help Guide</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-(--theme-text-secondary)">
                  <p>• Monitor child activity</p>
                  <p>• Safety controls</p>
                  <p>• Subscription management</p>
                  <p>• Learning reports</p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="teacher" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Teacher Help Guide</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-(--theme-text-secondary)">
                  <p>• Create classroom</p>
                  <p>• Share class codes</p>
                  <p>• Create activities</p>
                  <p>• Track student performance</p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </section>

        {/* POPULAR TOPICS */}
        <section className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold">Popular Topics</h2>
            <p className="text-muted-foreground">Frequently accessed support topics</p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {quickTopics.map((topic) => {
              const Icon = topic.icon;

              return (
                <Card
                  key={topic.title}
                  className="hover:shadow-md transition cursor-pointer bg-white border-2 border-(--theme-border-light)"
                >
                  <CardContent className="pt-6 flex gap-4">
                    <div className="w-12 h-12 rounded-xl bg-(--theme-border-light) flex items-center justify-center">
                      <Icon className="w-5 h-5 text-(--theme-brand)" />
                    </div>

                    <div>
                      <h3 className="font-semibold">{topic.title}</h3>
                      <p className="text-sm text-muted-foreground">{topic.desc}</p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>

        {/* FAQ */}
        <section className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold">Frequently Asked Questions</h2>
          </div>

          <Accordion className="w-full space-y-3" defaultValue={["1"]}>
            <AccordionItem
              value="1"
              className="rounded-xl border-2 border-(--theme-border-light) bg-white px-4"
            >
              <AccordionTrigger>How do students join a class?</AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                Students can join using the classroom code shared by the teacher.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem
              value="2"
              className="rounded-xl border-2 border-(--theme-border-light) bg-white px-4"
            >
              <AccordionTrigger>Is ChatGPT Kids safe for children?</AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                Yes. All conversations are moderated and filtered for child-safe learning.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem
              value="3"
              className="rounded-xl border-2 border-(--theme-border-light) bg-white px-4"
            >
              <AccordionTrigger>Can parents monitor progress?</AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                Yes. Parents can view reports, scores, and activity history.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem
              value="4"
              className="rounded-xl border-2 border-(--theme-border-light) bg-white px-4"
            >
              <AccordionTrigger>Can teachers create quizzes?</AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                Yes. Teachers can create quizzes, flashcards, puzzles, and assign them to students.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </section>

        {/* SUPPORT OPTIONS */}
        <section className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold">Need More Help?</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <Card className="group bg-white border-2 border-(--theme-border-light)">
              <CardContent className="pt-6 text-center space-y-4">
                <MessageSquare className="mx-auto h-8 w-8 text-(--theme-brand)" />
                <h3 className="font-semibold">AI Support</h3>
                <Button className="w-full bg-muted text-foreground hover:bg-(--theme-brand) hover:text-white group-hover:bg-(--theme-brand) group-hover:text-white">
                  Start Chat
                </Button>
              </CardContent>
            </Card>

            <Card className="group bg-white border-2 border-(--theme-border-light)">
              <CardContent className="pt-6 text-center space-y-4">
                <Mail className="mx-auto h-8 w-8 text-(--theme-brand)" />
                <h3 className="font-semibold">Email Support</h3>
                <Button className="w-full bg-muted text-foreground hover:bg-(--theme-brand) hover:text-white group-hover:bg-(--theme-brand) group-hover:text-white">
                  Contact Us
                </Button>
              </CardContent>
            </Card>

            <Card className="group bg-white border-2 border-(--theme-border-light)">
              <CardContent className="pt-6 text-center space-y-4">
                <Video className="mx-auto h-8 w-8 text-(--theme-brand)" />
                <h3 className="font-semibold">Video Tutorials</h3>
                <Button className="w-full bg-muted text-foreground hover:bg-(--theme-brand) hover:text-white group-hover:bg-(--theme-brand) group-hover:text-white">
                  Watch Tutorials
                </Button>
              </CardContent>
            </Card>
          </div>
        </section>

        <footer className="py-8">
          <div className="flex flex-col md:flex-row justify-between gap-6">
            <div>
              <h3 className="font-bold text-lg text-(--theme-brand)">ChatGPT Kids Companion</h3>
              <p className="text-sm text-muted-foreground">
                Safe, interactive AI learning for kids.
              </p>
            </div>

            <div className="flex gap-6 text-sm text-muted-foreground">
              <Link href="/privacy">Privacy</Link>
              <Link href="/terms">Terms</Link>
              <Link href="/safety">Child Safety</Link>
              <Link href="/accessibility">Accessibility</Link>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}
