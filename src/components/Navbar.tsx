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
        setProfile(data.user.email || "A");
      }
    }
    checkUser();
  }, [profile]);
  const handleLogOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error(error);
    }
    setProfile("");
  };
  return (
    <div className="flex items-center gap-2">
      {profile && (
        <div
          onClick={handleLogOut}
          className="w-9 h-9 cursor-pointer hover:bg-hover-sky-blue transition-all ease-out duration-300 rounded-full bg-sky-blue text-white flex items-center justify-center"
        >
          {profile.charAt(0).toUpperCase()}
        </div>
      )}
      {!profile && (
        <>
          <Button variant="ghost" size="lg">
            <Link href="/signin">Sign In</Link>
          </Button>
          <Button size="lg">
            <Link href="/signup">Sign Up</Link>
          </Button>
        </>
      )}
    </div>
  );
};

export default Navbar;
