"use client";

import { Provider, useDispatch, useSelector } from "react-redux";
import { store, AppDispatch, RootState } from "@/store";
import { ThemeProvider } from "next-themes";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { Session } from "@supabase/supabase-js";
import {
  setSessionUser,
  clearAuthState,
  fetchProfile,
  setLoadingState,
  setInitializingState,
} from "@/store/slices/authSlice";

function AuthInitializer({ children }: { children: React.ReactNode }) {
  const dispatch = useDispatch<AppDispatch>();
  const isLoggingOutRef = useRef(false);
  const lastLoadedUserIdRef = useRef<string | null>(null);
  const supabase = createClient();

  const user = useSelector((state: RootState) => state.auth.user);
  const userProfile = useSelector((state: RootState) => state.auth.userProfile);

  // 1. Bootstraps initial session on mount (lean, synchronous action dispatching)
  useEffect(() => {
    let isMounted = true;

    const initializeAuth = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!isMounted || isLoggingOutRef.current) return;

        if (session?.user) {
          dispatch(setSessionUser(session.user));
          // Note: profile fetch will be triggered by the secondary useEffect watching user state
        } else {
          lastLoadedUserIdRef.current = null;
          dispatch(clearAuthState());
        }
      } catch (error) {
        console.error("AuthInitializer: Error during getSession init:", error);
        if (isMounted) {
          dispatch(setLoadingState(false));
          dispatch(setInitializingState(false));
        }
      } finally {
        if (isMounted) {
          // If there is no active session on mount, immediately resolve loading states.
          // Otherwise, loading state will resolve once the profile fetch thunk completes.
          const {
            data: { session: currentSession },
          } = await supabase.auth.getSession();
          if (!currentSession?.user) {
            dispatch(setLoadingState(false));
            dispatch(setInitializingState(false));
          }
        }
      }
    };

    initializeAuth();

    // Subscribe to auth state changes reactively
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event: string, session: Session | null) => {
      // Ignore INITIAL_SESSION as it is already handled by initializeAuth
      if (event === "INITIAL_SESSION") {
        return;
      }

      if (!isMounted || isLoggingOutRef.current) {
        dispatch(setLoadingState(false));
        dispatch(setInitializingState(false));
        return;
      }

      if (session?.user) {
        dispatch(setSessionUser(session.user));
      } else {
        lastLoadedUserIdRef.current = null;
        dispatch(clearAuthState());
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 2. Fetch profile reactively outside the Supabase event listener/auth context to avoid Web Lock deadlocks
  useEffect(() => {
    if (user && !userProfile) {
      if (lastLoadedUserIdRef.current !== user.id) {
        lastLoadedUserIdRef.current = user.id;
        dispatch(fetchProfile(user.id));
      }
    }
  }, [user, userProfile, dispatch]);

  return <>{children}</>;
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: Infinity, // Avoid automatic refetching unless invalidated
          },
        },
      })
  );
  return (
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <AuthInitializer>{children}</AuthInitializer>
        </ThemeProvider>
      </QueryClientProvider>
    </Provider>
  );
}
