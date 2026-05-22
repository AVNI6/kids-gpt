"use client";

import { usePathname } from "next/navigation";
import { Provider } from "react-redux";
import { store } from "@/store";
import { ThemeProvider } from "next-themes";
import { AuthProvider } from "@/context/AuthContext";

export function Providers({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuthRoute =
    pathname === "/signin" ||
    pathname === "/signup" ||
    pathname === "/forgotpassword" ||
    pathname === "/resetpassword" ||
    pathname.startsWith("/auth/");

  return (
    <Provider store={store}>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        {isAuthRoute ? children : <AuthProvider>{children}</AuthProvider>}
      </ThemeProvider>
    </Provider>
  );
}
