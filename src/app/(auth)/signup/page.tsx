"use client";

import {
  Sparkles,
  Lightbulb,
  ShieldCheck,
  School,
  User,
  Mail,
  Cake,
  Lock,
  Rocket,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import Link from "next/link";

import { SubmitHandler, useForm } from "react-hook-form";
import { createClient } from "@/lib/supabase/client";

const supabase = createClient();
export default function ChatGPTKidSignupPage() {
  type FormValue = {
    name: string;
    email: string;
    password: string;
  };

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValue>();

  const onSubmit: SubmitHandler<FormValue> = async (e) => {
    const { data, error } = await supabase.auth.signUp({
      email: e.email,
      password: e.password,
      options: {
        data: {
          fullname: e.name,
        },
        emailRedirectTo: `${window.location.origin}/signin`,
      },
    });
    if (error) {
      console.error(error);
    }
    if (data) {
      alert("Signup successful! Please check your email to confirm your account.");
    }
  };
  return (
    <main className="min-h-screen bg-linear-to-br from-sky-100 via-white to-green-50 flex flex-col px-6">
      <div className="my-auto mx-auto max-w-6xl w-full grid lg:grid-cols-2 gap-10 items-center">
        <div className="hidden lg:flex flex-col gap-8 relative">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-sky-500 flex items-center justify-center shadow-lg">
              <Sparkles className="text-white w-8 h-8" />
            </div>
            <h1 className="text-5xl font-black text-sky-600">ChatGPT Kid</h1>
          </div>

          <Card className="relative border-2 border-sky-200 rounded-3xl shadow-xl overflow-visible">
            <CardContent className="p-8">
              <div className="absolute -top-5 -left-5 w-14 h-14 rounded-full bg-blue-900 flex items-center justify-center shadow-lg">
                <Lightbulb className="text-white" />
              </div>

              <p className="text-xl text-slate-600 italic leading-relaxed">
                “Hi there! I’m your AI learning buddy. Let’s create your account and start exploring
                fun adventures together!”
              </p>

              <div className="mt-8 flex gap-3 flex-wrap">
                <Button
                  variant="outline"
                  className="rounded-full px-4 py-2 flex items-center gap-2"
                >
                  <ShieldCheck className="w-4 h-4 text-sky-500" />
                  <span className="font-semibold text-sm">Kid-Safe AI</span>
                </Button>
                <Button
                  variant="outline"
                  className="rounded-full px-4 py-2 flex items-center gap-2"
                >
                  <School className="w-4 h-4 text-green-500" />
                  <span className="font-semibold text-sm">Teacher Approved</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Signup Form */}
        <Card className="rounded-3xl border-2 border-sky-200 shadow-xl">
          <CardContent className="p-8 md:p-10">
            <div className="mb-8">
              <h2 className="text-3xl font-black mb-2">Create Account</h2>
              <p className="text-slate-500">
                Fill in the bubbles to start your learning journey 🚀
              </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="space-y-2">
                <label className="font-semibold">Full Name</label>
                <div className="relative">
                  <User className="absolute left-4 top-4 w-5 h-5 text-slate-400" />
                  <Input
                    {...register("name", { required: true })}
                    className="pl-12 h-14 rounded-4xl"
                    placeholder="Alex Explorer"
                  />
                </div>
              </div>

              {/* Parent Email */}
              <div className="space-y-2">
                <label className="font-semibold">Email</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-4 w-5 h-5 text-slate-400" />
                  <Input
                    {...register("email", { required: true })}
                    type="email"
                    className="pl-12 h-14 rounded-4xl"
                    placeholder="you@example.com"
                  />
                </div>
              </div>

              {/* <div className="grid md:grid-cols-1 gap-6"> */}
              {/* DOB */}
              {/* <div className="space-y-2">
                  <label className="font-semibold">Date of Birth</label>
                  <div className="relative">
                    <Cake className="absolute left-4 top-4 w-5 h-5 text-slate-400" />
                    <Input type="date" className="pl-12 h-14 rounded-4xl" />
                  </div>
                </div> */}

              {/* Password */}
              <div className="space-y-2">
                <label className="font-semibold">Password</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-4 w-5 h-5 text-slate-400" />
                  <Input
                    {...register("password", { required: true })}
                    type="password"
                    className="pl-12 h-14 rounded-4xl"
                    placeholder="••••••••"
                  />
                </div>
              </div>
              {/* </div> */}

              {/* Terms */}
              <div className="flex items-center gap-3">
                <Checkbox required />
                <p className="text-sm text-slate-500 leading-relaxed">
                  I agree to the{" "}
                  <Link href="#" className="text-sky-600 font-semibold hover:underline">
                    Safety Rules
                  </Link>{" "}
                  and{" "}
                  <Link href="#" className="text-sky-600 font-semibold hover:underline">
                    Privacy Terms
                  </Link>
                </p>
              </div>

              {/* Submit */}
              <Button
                type="submit"
                className="w-full h-14 rounded-2xl text-lg font-bold flex items-center gap-2"
              >
                Create Account
                <Rocket className="w-5 h-5" />
              </Button>

              <p className="text-center text-slate-500">
                Already an explorer?{" "}
                <Link href="/signin" className="text-sky-600 font-semibold hover:underline">
                  Log in here
                </Link>
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
