"use client";

import { Provider } from "react-redux";
import { store } from "@/store";
import { ThemeProvider } from "next-themes";
import { AuthProvider } from "@/context/AuthContext";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

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
          <AuthProvider>{children}</AuthProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </Provider>
  );
}
