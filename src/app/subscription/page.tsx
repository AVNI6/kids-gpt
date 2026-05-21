"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Rocket, Star, Users, School, CheckCircle2, X, Loader2 } from "lucide-react";
import Link from "next/link";
import { fetchSubscriptionPlans } from "@/actions/chat.actions";

interface DisplayPlan {
  id?: string;
  name: string;
  price: number;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  buttonText: string;
  features: string[];
  popular?: boolean;
}
const planMetadata: Record<
  string,
  {
    description: string;
    icon: React.ComponentType<{ className?: string }>;
    buttonText: string;
    features: string[];
    popular?: boolean;
  }
> = {
  free: {
    description: "Perfect for starting your learning journey.",
    icon: Rocket,
    buttonText: "Get Started",
    features: ["Access to 5 core subjects", "Basic progress tracking"],
  },
  pro: {
    description: "Unlock limitless curiosity and discovery.",
    icon: Star,
    buttonText: "Upgrade Now",
    popular: true,
    features: ["Advanced voice interaction", "Personalized AI Tutor", "Ad-free experience"],
  },
  family: {
    description: "Learning together for the whole family.",
    icon: Users,
    buttonText: "Get Family Pro",
    features: ["Up to 5 student accounts", "Full Parent Dashboard", "Safety reports"],
  },
  teacher: {
    description: "Supercharge your classroom learning.",
    icon: School,
    buttonText: "Classroom Access",
    features: ["Classroom Management", "Worksheet Generator", "Student analytics"],
  },
};

export default function SubscriptionPage() {
  const [plans, setPlans] = useState<DisplayPlan[]>([]);
  const [annual, setAnnual] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState("Pro");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadPlans = async () => {
      try {
        const dbPlans = await fetchSubscriptionPlans();
        if (dbPlans && dbPlans.length > 0) {
          const mapped = dbPlans.map((p) => {
            const planKey = (p.plan_type || "free").toLowerCase();
            const meta = planMetadata[planKey] || planMetadata.free;
            return {
              id: p.id,
              name: p.plan_name || "Unnamed Plan",
              price: p.price ?? 0,
              description: meta.description,
              icon: meta.icon,
              buttonText: meta.buttonText,
              features: [
                p.max_messages_per_day && p.max_messages_per_day < 9999
                  ? `${p.max_messages_per_day} questions per day`
                  : "Unlimited AI questions",
                p.max_pdfs_per_day && p.max_pdfs_per_day > 0
                  ? `${p.max_pdfs_per_day} PDFs per day`
                  : "Basic access (no PDF generation)",
                ...meta.features,
              ],
              popular: meta.popular,
            };
          });
          setPlans(mapped);
        } else {
          setPlans([]);
        }
      } catch (err) {
        console.error("Failed to load plans directly from Supabase:", err);
        setPlans([]);
      } finally {
        setIsLoading(false);
      }
    };
    loadPlans();
  }, []);

  const getPrice = (price: number) => {
    if (price === 0) return "$0";
    return annual ? `$${Math.floor(price * 0.8)}` : `$${price}`;
  };

  return (
    <div className="min-h-screen bg-background relative overflow-x-hidden">
      <Link
        href="/"
        className="absolute top-6 right-6 z-50 h-10 w-10 flex items-center justify-center rounded-full bg-white/80 border border-slate-200 shadow-sm hover:bg-black/15 transition-colors"
      >
        <X className="w-5 h-5 text-slate-500" />
      </Link>

      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-24 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-indigo-500/15 blur-3xl" />
        <div className="absolute top-40 -left-24 h-72 w-72 rounded-full bg-cyan-400/10 blur-3xl" />
        <div className="absolute bottom-16 -right-20 h-72 w-72 rounded-full bg-emerald-400/10 blur-3xl" />
      </div>

      <main className="container mx-auto px-6 py-10">
        {/* Hero Section */}
        <section className="text-center mb-16">
          <Badge className="mb-5 rounded-full px-4 py-1 bg-indigo-100 text-indigo-700 border border-indigo-200">
            Flexible Plans for Every Learner
          </Badge>

          <h1 className="text-5xl md:text-6xl font-bold tracking-tight mb-4 text-foreground">
            Choose Your Adventure
          </h1>

          <p className="text-muted-foreground text-lg max-w-2xl mx-auto mb-8 leading-relaxed">
            Unlock the full power of your AI learning companion.
          </p>

          {/* Billing Toggle */}
          <div className="inline-flex items-center justify-center gap-4 rounded-full border bg-card px-5 py-3 shadow-sm">
            <span className={!annual ? "font-semibold" : "text-muted-foreground"}>Monthly</span>

            <Switch checked={annual} onCheckedChange={setAnnual} />

            <div className="flex items-center gap-2">
              <span className={annual ? "font-semibold" : "text-muted-foreground"}>Annual</span>

              <Badge variant="secondary" className="rounded-full">
                Save 20%
              </Badge>
            </div>
          </div>
          <p className="text-sm text-muted-foreground mt-3">
            {annual
              ? "Billed yearly at a discounted rate"
              : "Switch to annual and keep 20% in your pocket"}
          </p>
        </section>

        {/* Pricing Cards */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-10 h-10 text-primary animate-spin" />
          </div>
        ) : (
          <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {plans.map((plan) => {
              const Icon = plan.icon;
              const isSelected = selectedPlan === plan.name;

              return (
                <Card
                  key={plan.name}
                  className={`relative transition-all duration-300 cursor-pointer group ${
                    plan.popular ? "border-primary shadow-lg" : ""
                  } ${
                    isSelected
                      ? "ring-2 ring-primary shadow-xl border-primary"
                      : "hover:shadow-xl hover:border-primary/40"
                  }`}
                  onClick={() => setSelectedPlan(plan.name)}
                >
                  {isSelected && (
                    <Badge className="absolute top-3 right-3 bg-emerald-600 text-white">
                      Selected
                    </Badge>
                  )}

                  <CardHeader>
                    <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center mb-4 transition-transform duration-300 group-hover:scale-110">
                      <Icon className="h-6 w-6" />
                    </div>

                    <CardTitle>{plan.name}</CardTitle>
                    <CardDescription>{plan.description}</CardDescription>
                  </CardHeader>

                  <CardContent>
                    <div className="mb-6">
                      <span className="text-4xl font-bold">{getPrice(plan.price)}</span>

                      <span className="text-muted-foreground ml-1">
                        {plan.price === 0 ? "/forever" : "/month"}
                      </span>
                    </div>

                    <ul className="space-y-4 mb-8 min-h-[180px]">
                      {plan.features.map((feature) => (
                        <li
                          key={feature}
                          className="flex items-center gap-3 text-sm rounded-lg px-2 py-1 transition-colors group-hover:bg-muted/60"
                        >
                          <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                          <span className="truncate">{feature}</span>
                        </li>
                      ))}
                    </ul>

                    <Button className="w-full" variant={isSelected ? "default" : "secondary"}>
                      {isSelected ? "Selected Plan" : plan.buttonText}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </section>
        )}
      </main>
    </div>
  );
}
