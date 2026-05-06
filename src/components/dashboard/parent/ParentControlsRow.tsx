import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CreditCard, Shield, Download } from "lucide-react";

export default async function ParentControlsRow() {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {/* Subscription / Family Plan */}
      <Card className="rounded-3xl border-sky-100 bg-linear-to-br from-sky-50 to-cyan-50 shadow-sm hover:shadow-md transition-all">
        <CardContent className="space-y-4 p-6">
          <div className="flex items-start justify-between">
            <div>
              <h4 className="text-lg font-black text-slate-900">Family Plan</h4>
              <p className="text-sm text-slate-600 mt-1">Current: Premium</p>
            </div>
            <div className="rounded-full bg-sky-500/20 p-3">
              <CreditCard className="h-5 w-5 text-sky-600" />
            </div>
          </div>

          <div className="text-xs text-slate-600 space-y-1">
            <p>✓ Unlimited kids</p>
            <p>✓ Advanced analytics</p>
            <p>✓ No ads</p>
          </div>

          <Button className="w-full rounded-2xl bg-sky-600 hover:bg-sky-700 text-white font-semibold">
            Manage Plan
          </Button>
        </CardContent>
      </Card>

      {/* Safety Controls */}
      <Card className="rounded-3xl border-emerald-100 bg-linear-to-br from-emerald-50 to-green-50 shadow-sm hover:shadow-md transition-all">
        <CardContent className="space-y-4 p-6">
          <div className="flex items-start justify-between">
            <div>
              <h4 className="text-lg font-black text-slate-900">Safety Controls</h4>
              <p className="text-sm text-slate-600 mt-1">All systems active</p>
            </div>
            <div className="rounded-full bg-emerald-500/20 p-3">
              <Shield className="h-5 w-5 text-emerald-600" />
            </div>
          </div>

          <div className="text-xs text-slate-600 space-y-1">
            <p>✓ Content filters on</p>
            <p>✓ Screen time limits</p>
            <p>✓ Parent notifications</p>
          </div>

          <Button
            variant="outline"
            className="w-full rounded-2xl border-emerald-200 text-emerald-700 hover:bg-emerald-50 font-semibold"
          >
            Review Settings
          </Button>
        </CardContent>
      </Card>

      {/* Export Data */}
      <Card className="rounded-3xl border-violet-100 bg-linear-to-br from-violet-50 to-purple-50 shadow-sm hover:shadow-md transition-all">
        <CardContent className="space-y-4 p-6">
          <div className="flex items-start justify-between">
            <div>
              <h4 className="text-lg font-black text-slate-900">Export Data</h4>
              <p className="text-sm text-slate-600 mt-1">Get reports & insights</p>
            </div>
            <div className="rounded-full bg-violet-500/20 p-3">
              <Download className="h-5 w-5 text-violet-600" />
            </div>
          </div>

          <div className="text-xs text-slate-600 space-y-1">
            <p>✓ Monthly reports</p>
            <p>✓ Progress summaries</p>
            <p>✓ CSV export available</p>
          </div>

          <Button
            variant="outline"
            className="w-full rounded-2xl border-violet-200 text-violet-700 hover:bg-violet-50 font-semibold"
          >
            Export Now
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
