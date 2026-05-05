"use client";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { useEffect, useState } from "react";

const supabase = createClient();

const Navbar = () => {
  const [profile, setProfile] = useState("");

  useEffect(() => {
    async function checkUser() {
      const { data, error } = await supabase.auth.getUser();
      if (error) {
        console.log(error);
      }
      if (data?.user) {
        setProfile(data.user.email || "");
      }
    }
    checkUser();
  }, []);

  const handleLogOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error(error);
    }
    setProfile("");
  };

  return (
    <div className="flex items-center gap-1 sm:gap-2">
      {profile ? (
        <div className="flex items-center gap-2 sm:gap-4">
          <Link
            href="/profile"
            className="w-8 h-8 sm:w-9 sm:h-9 cursor-pointer bg-sky-blue hover:bg-hover-sky-blue transition-all ease-out duration-300 rounded-full text-white flex items-center justify-center text-sm sm:text-base"
          >
            {profile.charAt(0).toUpperCase()}
          </Link>
          <Link href="/signup">
            <Button
              size="sm"
              variant="destructive"
              onClick={handleLogOut}
              className="h-8 sm:h-10 px-3 sm:px-6"
            >
              Logout
            </Button>
          </Link>
        </div>
      ) : (
        <>
          <Link href="/signin">
            <Button variant="ghost" size="sm" className="h-8 sm:h-10 px-2 sm:px-4">
              Sign In
            </Button>
          </Link>
          <Link href="/signup">
            <Button size="sm" className="h-8 sm:h-10 px-3 sm:px-6">
              Sign Up
            </Button>
          </Link>
        </>
      )}
    </div>
  );
};

export default Navbar;
