import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

type CookieStore = Awaited<ReturnType<typeof cookies>>;
type MutableCookieStore = CookieStore & {
  set: (name: string, value: string, options?: Record<string, unknown>) => void;
};

function isMutableCookieStore(store: CookieStore): store is MutableCookieStore {
  return "set" in store && typeof store.set === "function";
}

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              if (isMutableCookieStore(cookieStore)) {
                cookieStore.set(name, value, options);
              }
            });
          } catch {
            // Server Components may expose a read-only cookie store.
          }
        },
      },
    }
  );
}
