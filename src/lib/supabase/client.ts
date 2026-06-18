import { createBrowserClient } from "@supabase/ssr";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

let browserClient: ReturnType<typeof createBrowserClient> | undefined;

const customStorage = {
  getItem: (key: string): string | null => {
    if (typeof window === "undefined") return null;
    return window.localStorage.getItem(key) || window.sessionStorage.getItem(key);
  },
  setItem: (key: string, value: string): void => {
    if (typeof window === "undefined") return;
    const keepSignedIn = window.localStorage.getItem("keepSignedIn") === "true";
    if (keepSignedIn) {
      window.localStorage.setItem(key, value);
      window.sessionStorage.removeItem(key);
    } else {
      window.sessionStorage.setItem(key, value);
      window.localStorage.removeItem(key);
    }
  },
  removeItem: (key: string): void => {
    if (typeof window === "undefined") return;
    window.localStorage.removeItem(key);
    window.sessionStorage.removeItem(key);
  }
};

export const createClient = () => {
  if (!browserClient) {
    browserClient = createBrowserClient(supabaseUrl!, supabaseKey!, {
      auth: {
        storage: customStorage,
        persistSession: true,
      }
    });
  }

  return browserClient;
};
