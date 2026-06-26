"use client";

import { Provider, useDispatch } from "react-redux";
import { store, AppDispatch } from "@/store";
import { ThemeProvider } from "next-themes";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { AuthChangeEvent, Session } from "@supabase/supabase-js";
import { setSessionUser, clearAuthState, fetchProfile } from "@/store/slices/authSlice";

function AuthSync() {
  const dispatch = useDispatch<AppDispatch>();

  useEffect(() => {
    const supabase = createClient();
    let isMounted = true;
    let lastLoadedUserId: string | null = null;

    // Load initial session on mount to prevent auth flicker on page refreshes
    const initializeAuth = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!isMounted) return;

        if (session?.user) {
          dispatch(setSessionUser(session.user));
          if (lastLoadedUserId !== session.user.id) {
            lastLoadedUserId = session.user.id;
            dispatch(fetchProfile(session.user.id));
          }
        } else {
          lastLoadedUserId = null;
          dispatch(clearAuthState());
        }
      } catch (error) {
        console.error("AuthSync: Error during getSession initialization:", error);
      }
    };

    initializeAuth();

    // Subscribe to auth state changes reactively
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event: AuthChangeEvent, session: Session | null) => {
      if (!isMounted) return;

      if (event === "SIGNED_OUT") {
        lastLoadedUserId = null;
        dispatch(clearAuthState());
        return;
      }

      if (session?.user) {
        dispatch(setSessionUser(session.user));
        if (lastLoadedUserId !== session.user.id) {
          lastLoadedUserId = session.user.id;
          dispatch(fetchProfile(session.user.id));
        }
      } else {
        lastLoadedUserId = null;
        dispatch(clearAuthState());
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [dispatch]);

  return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5 * 60 * 1000, // 5 minutes staleTime
          },
        },
      })
  );

  return (
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <AuthSync />
          {children}
        </ThemeProvider>
      </QueryClientProvider>
    </Provider>
  );
}
