"use client";

import Link from "next/link";

import {
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
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  "Create an account",
  "Choose your role",
  "Connect with class code",
  "Start learning with AI",
];

export default function HelpPage() {
  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto max-w-6xl px-4 py-10 space-y-14 relative">
        <div className="absolute top-4 right-2 z-50">
          <Link href="/">
            <Button
              variant="ghost"
              size="icon"
              className="h-12 w-12 rounded-full bg-card border-2 border-border text-muted-foreground hover:text-sky-600 hover:border-sky-500/30 shadow-sm transition-all"
            >
              <X className="h-6 w-6" />
            </Button>
          </Link>
        </div>
        <section className="text-center space-y-6">
          <Badge className="px-4 py-2 text-sm bg-sky-100 text-sky-700 border-sky-200 hover:bg-sky-200 transition-colors">
            Help Center
          </Badge>

          <div className="space-y-4">
            <h1 className="text-5xl md:text-7xl font-black tracking-tight text-foreground">
              How can we <span className="text-sky-600">help?</span>
            </h1>

            <p className="text-muted-foreground text-xl max-w-2xl mx-auto font-medium">
              Find guides for students, parents, and teachers. Learn how to use Kidoza safely and
              effectively.
            </p>
          </div>
        </section>

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
                  className="p-6 md:p-8 bg-card border-2 border-border/50 rounded-3xl overflow-hidden flex flex-col gap-6"
                >
                  <CardHeader className="p-0 space-y-4">
                    <div className="w-16 h-16 rounded-2xl bg-sky-50 flex items-center justify-center group-hover:bg-sky-100 transition-colors">
                      <Icon className="w-8 h-8 text-sky-600" />
                    </div>

                    <div className="space-y-2">
                      <CardTitle className="text-2xl font-bold text-foreground">
                        {role.title}
                      </CardTitle>
                      <CardDescription className="text-muted-foreground font-medium">
                        {role.description}
                      </CardDescription>
                    </div>
                  </CardHeader>

                  <CardContent className="p-0">
                    <Button
                      render={<Link href={role.href} />}
                      nativeButton={false}
                      className="w-full h-12 bg-sky-600 hover:bg-sky-700 text-white rounded-xl font-bold shadow-lg shadow-sky-500/20 transition-all"
                    >
                      Explore Guide
                      <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>

        <section className="space-y-8">
          <div>
            <h2 className="text-2xl font-bold">Getting Started</h2>
            <p className="text-muted-foreground">Start your learning journey in 4 simple steps</p>
          </div>

          <div className="grid md:grid-cols-4 gap-8">
            {steps.map((step, index) => (
              <div key={step} className="relative">
                <Card className="p-6 border-2 border-border/50 shadow-sm hover:border-sky-500/30 transition-colors rounded-3xl flex flex-col items-center justify-center bg-card">
                  <CardContent className="p-0 space-y-2 text-center">
                    <div className="w-16 h-16 rounded-2xl bg-sky-600 text-white flex items-center justify-center font-black text-2xl mx-auto shadow-lg shadow-sky-200">
                      {index + 1}
                    </div>

                    <h3 className="font-bold text-foreground text-base">{step}</h3>
                  </CardContent>
                </Card>

                {index < steps.length - 1 && (
                  <div className="hidden md:flex items-center justify-center absolute -right-9 top-1/2 -translate-y-1/2 z-10">
                    <div className="h-10 w-10 rounded-full bg-card text-sky-500 flex items-center justify-center border-2 border-border shadow-sm">
                      <ArrowRight className="h-5 w-5" />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

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
              <Card className="p-6">
                <CardHeader className="p-0 pb-4">
                  <CardTitle>Student Help Guide</CardTitle>
                </CardHeader>
                <CardContent className="p-0 space-y-4 text-(--theme-text-secondary)">
                  <p>• How to chat with AI tutor</p>
                  <p>• Solve quizzes and flashcards</p>
                  <p>• Join teacher classroom</p>
                  <p>• View your learning progress</p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="parent" className="mt-6">
              <Card className="p-6">
                <CardHeader className="p-0 pb-4">
                  <CardTitle>Parent Help Guide</CardTitle>
                </CardHeader>
                <CardContent className="p-0 space-y-4 text-(--theme-text-secondary)">
                  <p>• Monitor child activity</p>
                  <p>• Safety controls</p>
                  <p>• Subscription management</p>
                  <p>• Learning reports</p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="teacher" className="mt-6">
              <Card className="p-6">
                <CardHeader className="p-0 pb-4">
                  <CardTitle>Teacher Help Guide</CardTitle>
                </CardHeader>
                <CardContent className="p-0 space-y-4 text-(--theme-text-secondary)">
                  <p>• Create classroom</p>
                  <p>• Share class codes</p>
                  <p>• Create activities</p>
                  <p>• Track student performance</p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </section>

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
                  className="p-6 hover:shadow-lg hover:border-sky-500/30 transition-all cursor-pointer bg-card border-2 border-border/50 rounded-2xl group"
                >
                  <CardContent className="p-0 flex gap-5">
                    <div className="w-14 h-14 rounded-2xl bg-sky-50 flex items-center justify-center group-hover:bg-sky-100 transition-colors">
                      <Icon className="w-6 h-6 text-sky-600" />
                    </div>

                    <div className="space-y-1">
                      <h3 className="font-bold text-foreground text-lg">{topic.title}</h3>
                      <p className="text-muted-foreground font-medium">{topic.desc}</p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>

        <section className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold">Frequently Asked Questions</h2>
          </div>
          <Accordion className="w-full space-y-4" defaultValue={["1"]}>
            {[
              {
                q: "How do students join a class?",
                a: "Students can join using the classroom code shared by the teacher.",
              },
              {
                q: "Is Kidoza safe for children?",
                a: "Yes. All conversations are moderated and filtered for child-safe learning.",
              },
              {
                q: "Can parents monitor progress?",
                a: "Yes. Parents can view reports, scores, and activity history.",
              },
              {
                q: "Can teachers create quizzes?",
                a: "Yes. Teachers can create quizzes, flashcards, puzzles, and assign them to students.",
              },
            ].map((faq, index) => (
              <AccordionItem
                key={index}
                value={(index + 1).toString()}
                className="rounded-2xl border-2 border-border/50 bg-card px-6 hover:border-sky-500/30 transition-colors overflow-hidden"
              >
                <AccordionTrigger className="text-lg font-bold text-foreground hover:text-sky-600 hover:no-underline py-5">
                  {faq.q}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground text-base font-medium pb-5">
                  {faq.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </section>

        {/* SUPPORT OPTIONS */}
        <section className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold">Need More Help?</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <Card className="p-6 md:p-8 group bg-card border-2 border-border/50 hover:border-sky-500/30 transition-all rounded-2xl overflow-hidden shadow-sm hover:shadow-md">
              <CardContent className="p-0 text-center space-y-5">
                <div className="w-16 h-16 rounded-full bg-sky-500/10 flex items-center justify-center mx-auto group-hover:bg-sky-500/20 transition-colors">
                  <MessageSquare className="h-8 w-8 text-sky-600" />
                </div>
                <h3 className="text-xl font-bold text-foreground">AI Support</h3>
                <Button className="w-full bg-muted text-muted-foreground hover:bg-sky-600 hover:text-white rounded-xl h-12 font-bold transition-all">
                  Start Chat
                </Button>
              </CardContent>
            </Card>

            <Card className="p-6 md:p-8 group bg-card border-2 border-border/50 hover:border-sky-500/30 transition-all rounded-2xl overflow-hidden shadow-sm hover:shadow-md">
              <CardContent className="p-0 text-center space-y-5">
                <div className="w-16 h-16 rounded-full bg-sky-500/10 flex items-center justify-center mx-auto group-hover:bg-sky-500/20 transition-colors">
                  <Mail className="h-8 w-8 text-sky-600" />
                </div>
                <h3 className="text-xl font-bold text-foreground">Email Support</h3>
                <Button className="w-full bg-muted text-muted-foreground hover:bg-sky-600 hover:text-white rounded-xl h-12 font-bold transition-all">
                  Contact Us
                </Button>
              </CardContent>
            </Card>

            <Card className="p-6 md:p-8 group bg-card border-2 border-border/50 hover:border-sky-500/30 transition-all rounded-2xl overflow-hidden shadow-sm hover:shadow-md">
              <CardContent className="p-0 text-center space-y-5">
                <div className="w-16 h-16 rounded-full bg-sky-500/10 flex items-center justify-center mx-auto group-hover:bg-sky-500/20 transition-colors">
                  <Video className="h-8 w-8 text-sky-600" />
                </div>
                <h3 className="text-xl font-bold text-foreground">Video Tutorials</h3>
                <Button className="w-full bg-muted text-muted-foreground hover:bg-sky-600 hover:text-white rounded-xl h-12 font-bold transition-all">
                  Watch Tutorials
                </Button>
              </CardContent>
            </Card>
          </div>
        </section>

        <footer className="pt-12 border-t border-slate-200">
          <div className="flex flex-col md:flex-row justify-between items-center gap-8 text-center md:text-left">
            <div className="space-y-2">
              <h3 className="font-black text-2xl text-sky-600 tracking-tight">Kidoza</h3>
              <p className="text-slate-500 font-medium">Safe, interactive AI learning for kids.</p>
            </div>

            <div className="flex flex-wrap justify-center gap-8 text-sm font-bold text-muted-foreground/60">
              <Link href="/privacy" className="hover:text-sky-500 transition-colors">
                Privacy
              </Link>
              <Link href="/terms" className="hover:text-sky-500 transition-colors">
                Terms
              </Link>
              <Link href="/safety" className="hover:text-sky-500 transition-colors">
                Child Safety
              </Link>
              <Link href="/accessibility" className="hover:text-sky-500 transition-colors">
                Accessibility
              </Link>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}
