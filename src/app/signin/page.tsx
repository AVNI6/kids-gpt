"use client";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { SubmitHandler, useForm } from "react-hook-form";

type FormValues = {
  email: string;
  password: string;
};

const SignIn = () => {
  const supabase = createClient();
  const router = useRouter();
  const { register, handleSubmit } = useForm<FormValues>();

  const onSubmit: SubmitHandler<FormValues> = async (e) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: e.email,
      password: e.password,
    });
    if (error) {
      console.log(error.message);
      return;
    }

    if (data.session) {
      router.push("/");
    }
  };

  return (
    <div>
      <form onSubmit={handleSubmit(onSubmit)}>
        <input {...register("email")} type="text" placeholder="Enter your email" />
        <input {...register("password")} type="password" placeholder="Enter your password" />
        <button
          type="submit"
          className="px-3 py-1 rounded-md active:scale-95 hover:cursor-pointer bg-gray-500 text-white"
        >
          Sign In
        </button>
      </form>
    </div>
  );
};

export default SignIn;
