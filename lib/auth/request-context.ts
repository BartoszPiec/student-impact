import { cache } from "react";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

export type AppRole = "student" | "company" | "admin";

export type RequestContext = {
  user: User | null;
  role: AppRole | null;
};

function isAppRole(value: unknown): value is AppRole {
  return value === "student" || value === "company" || value === "admin";
}

export const getCurrentUser = cache(async (): Promise<User | null> => {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();

  if (error) return null;
  return data.user;
});

export const getRequestContext = cache(async (): Promise<RequestContext> => {
  const user = await getCurrentUser();

  if (!user) return { user: null, role: null };

  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("role")
    .eq("user_id", user.id)
    .maybeSingle();

  return {
    user,
    role: isAppRole(data?.role) ? data.role : null,
  };
});
