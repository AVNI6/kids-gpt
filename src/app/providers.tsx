"use client";

import { Provider, useDispatch, useSelector } from "react-redux";
import { store, AppDispatch, RootState } from "@/store";
import { ThemeProvider } from "next-themes";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { AuthChangeEvent, Session } from "@supabase/supabase-js";
import { setSessionUser, clearAuthState, fetchProfile } from "@/store/slices/authSlice";
import { toast } from "sonner";
import { usePathname } from "next/navigation";
import { fetchUserSessions } from "@/lib/services/shared/chat.actions";
import { setSessions, setLoadingSessions, resetChatState } from "@/store/slices/chatSlice";

function AuthSync() {
  const dispatch = useDispatch<AppDispatch>();
  const { userProfile } = useSelector((state: RootState) => state.auth);
  const pathname = usePathname();

  useEffect(() => {
    if (
      userProfile &&
      typeof window !== "undefined" &&
      pathname !== "/signin" &&
      pathname !== "/signup"
    ) {
      if (sessionStorage.getItem("showWelcomeToast") === "true") {
        toast.success("Welcome back!", {
          description: "Login successful!",
        });
        sessionStorage.removeItem("showWelcomeToast");
      }
    }
  }, [userProfile, pathname]);

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

function ChatInitializer() {
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useSelector((state: RootState) => state.auth);
  const { sessionsUserId } = useSelector((state: RootState) => state.chat);
  const fetchingUserIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!user) {
      if (sessionsUserId !== null) {
        dispatch(resetChatState());
      }
      fetchingUserIdRef.current = null;
      return;
    }

    if (sessionsUserId !== user.id && fetchingUserIdRef.current !== user.id) {
      fetchingUserIdRef.current = user.id;
      let isMounted = true;

      const loadInitialSessions = async () => {
        dispatch(setLoadingSessions(true));
        try {
          const userSessions = await fetchUserSessions(user.id, undefined, undefined, 20);
          if (isMounted) {
            dispatch(setSessions({ sessions: userSessions, userId: user.id }));
          }
        } catch (err) {
          console.error("ChatInitializer: Error loading sessions:", err);
          if (isMounted) {
            fetchingUserIdRef.current = null;
          }
        } finally {
          if (isMounted) {
            dispatch(setLoadingSessions(false));
          }
        }
      };
      loadInitialSessions();

      return () => {
        isMounted = false;
        fetchingUserIdRef.current = null;
      };
    }
  }, [user, sessionsUserId, dispatch]);

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
          <ChatInitializer />
          {children}
        </ThemeProvider>
      </QueryClientProvider>
    </Provider>
  );
}
