"use client";

import { Button } from "@/components/ui/button";
import { APP_ROUTES } from "@/constant/AppRoutes";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

const Navbar = () => {
  const { isUserLoggedIn } = useAuth();

  return (
    <div className="flex items-center gap-2">
      {!isUserLoggedIn && (
        <>
          <Link href={APP_ROUTES.Signin}>
            <Button
              variant="ghost"
              size="sm"
              className="h-9 px-4 font-semibold text-foreground/70 hover:text-foreground"
            >
              Sign In
            </Button>
          </Link>
          <Link href={APP_ROUTES.Signup}>
            <Button
              size="sm"
              className="h-9 px-5 bg-sky-500 hover:bg-sky-600 text-white font-bold rounded-xl shadow-lg shadow-sky-500/20 transition-all active:scale-95"
            >
              Sign Up
            </Button>
          </Link>
        </>
      )}
    </div>
  );
};

export default Navbar;
