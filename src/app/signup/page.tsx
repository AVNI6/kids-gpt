"use client";
import { createClient } from "@/lib/supabase/client";
import { SubmitHandler, useForm } from "react-hook-form";

type FormValues = {
  email: string;
  password: string;
};

const Page = () => {
  const { register, handleSubmit } = useForm<FormValues>();

  const onSubmit: SubmitHandler<FormValues> = async (e) => {
    const supabase = createClient();
    const { data, error } = await supabase.auth.signUp({
      email: e.email,
      password: e.password,
      options: {
        emailRedirectTo: `${window.location.origin}/signin`,
      },
    });
    if (error) {
      console.log(error.message);
      return;
    }

    if (!data.session) {
      alert("Check your email to confirm your account");
    } else {
      alert("Signup successful");
    }
  };
  return (
    <div>
      <form onSubmit={handleSubmit(onSubmit)}>
        <input
          {...register("email", { required: true })}
          type="email"
          placeholder="Enter your email"
        />
        <input
          {...register("password", { required: true, minLength: 6 })}
          type="password"
          placeholder="Enter your password"
        />
        <button
          type="submit"
          className="px-3 py-1 rounded-md active:scale-95 hover:cursor-pointer bg-gray-500 text-white"
        >
          Sign Up
        </button>
      </form>
    </div>
  );
};

export default Page;
