"use client";

import { Button } from "@/components/ui/button";
import { APP_ROUTES } from "@/lib/constants/common";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { Skeleton } from "@/components/ui/skeleton";
import { useEffect, useState } from "react";

const Navbar = () => {
  const { isUserLoggedIn, isInitializing } = useAuth();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setMounted(true);
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  if (!mounted) {
    return (
      <div className="flex items-center gap-2">
        <Skeleton className="h-9 w-20 rounded-lg" />
        <Skeleton className="h-9 w-24 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      {isInitializing ? (
        <>
          <Skeleton className="h-9 w-20 rounded-lg" />
          <Skeleton className="h-9 w-24 rounded-xl" />
        </>
      ) : (
        !isUserLoggedIn && (
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
        )
      )}
    </div>
  );
};

export default Navbar;
