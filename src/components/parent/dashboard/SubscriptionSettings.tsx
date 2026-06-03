"use client";

import { useState } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/shared/ui/card";
import { Button } from "@/components/shared/ui/button";
import { Switch } from "@/components/shared/ui/switch";
import { Badge } from "@/components/shared/ui/badge";
import { CreditCard, ShieldCheck, AlertCircle, CheckCircle, Crown } from "lucide-react";

export default function SubscriptionSettings() {
  const [autoRenew, setAutoRenew] = useState(true);
  const [weeklyReports, setWeeklyReports] = useState(true);
  const [securityAlerts, setSecurityAlerts] = useState(true);

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Premium Subscription Card */}
      <Card className="rounded-[28px] border-slate-200/60 dark:border-slate-800/60 bg-white/80 dark:bg-slate-900/80 shadow-sm relative overflow-hidden backdrop-blur-sm">
        <div className="absolute top-0 right-0 w-40 h-40 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
        <CardHeader>
          <div className="flex items-center justify-between">
            <Badge className="bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 font-bold hover:bg-purple-100 rounded-full py-1 px-3 flex items-center gap-1">
              <Crown className="w-3.5 h-3.5 text-purple-500 fill-purple-500" />
              Active Plan
            </Badge>
            <span className="text-sm font-bold text-slate-500">$14.99 / mo</span>
          </div>
          <CardTitle className="text-2xl font-black text-slate-900 dark:text-white tracking-tight mt-2">
            ChatGPT Kid Plus Family
          </CardTitle>
          <CardDescription className="text-slate-500 dark:text-slate-400 font-medium">
            Full educational access for up to 3 children.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="space-y-2.5">
            {[
              "Unlimited AI learning conversations",
              "Advanced teacher/parent monitoring dashboard",
              "Weekly customized curriculum goals",
              "Advanced safe-content filtration",
            ].map((feature, i) => (
              <div
                key={i}
                className="flex items-center gap-2.5 text-sm text-slate-600 dark:text-slate-300 font-medium"
              >
                <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>{feature}</span>
              </div>
            ))}
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center gap-3">
            <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-700 dark:text-slate-200">
                Visa ending in 4242
              </p>
              <p className="text-xs text-slate-500">Next billing date: June 15, 2026</p>
            </div>
          </div>
        </CardContent>

        <CardFooter className="flex flex-wrap gap-3 pt-2">
          <Button
            variant="outline"
            className="rounded-xl border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 font-bold text-xs sm:text-sm"
          >
            Update Payment
          </Button>
          <Button className="rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs sm:text-sm shadow-sm">
            Change Plan
          </Button>
        </CardFooter>
      </Card>

      {/* Safety & Settings Panel */}
      <Card className="rounded-[28px] border-slate-200/60 dark:border-slate-800/60 bg-white/80 dark:bg-slate-900/80 shadow-sm backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-purple-600" />
            Security & Controls
          </CardTitle>
          <CardDescription className="text-slate-500 dark:text-slate-400 font-medium">
            Manage your account security and safety notifications.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-bold text-slate-700 dark:text-slate-200">
                Auto-Renew Subscription
              </p>
              <p className="text-xs text-slate-500">
                Keep account active for uninterrupted child access.
              </p>
            </div>
            <Switch
              checked={autoRenew}
              onCheckedChange={setAutoRenew}
              className="data-[state=checked]:bg-purple-600"
            />
          </div>

          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-bold text-slate-700 dark:text-slate-200">
                Weekly Progress Email Reports
              </p>
              <p className="text-xs text-slate-500">
                Get summaries of children&apos;s educational performance.
              </p>
            </div>
            <Switch
              checked={weeklyReports}
              onCheckedChange={setWeeklyReports}
              className="data-[state=checked]:bg-purple-600"
            />
          </div>

          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-bold text-slate-700 dark:text-slate-200">
                Immediate Security Alerts
              </p>
              <p className="text-xs text-slate-500">
                Alert me if flagged words are typed in conversations.
              </p>
            </div>
            <Switch
              checked={securityAlerts}
              onCheckedChange={setSecurityAlerts}
              className="data-[state=checked]:bg-purple-600"
            />
          </div>
        </CardContent>

        <CardFooter className="pt-2">
          <div className="flex items-start gap-2 text-xs text-slate-500 dark:text-slate-400 font-medium bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-100 dark:border-slate-800/60 w-full">
            <AlertCircle className="w-4 h-4 text-purple-500 shrink-0 mt-0.5" />
            <span>
              All settings are applied immediately. Changing these preferences only affects
              parent-level configurations.
            </span>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
