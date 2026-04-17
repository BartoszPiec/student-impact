import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

type RequireAdminOptions = {
  redirectOnFail?: boolean;
  authRedirectTo?: string;
  forbiddenRedirectTo?: string;
};

export async function requireAdmin(options: RequireAdminOptions = {}) {
  const {
    redirectOnFail = false,
    authRedirectTo = "/auth",
    forbiddenRedirectTo = "/app",
  } = options;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    if (redirectOnFail) {
      redirect(authRedirectTo);
    }

    throw new Error("Nieautoryzowany");
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("role")
    .eq("user_id", user.id)
    .single();

  if (error) {
    throw new Error("Nie udało się zweryfikować uprawnień administratora");
  }

  if (profile?.role !== "admin") {
    if (redirectOnFail) {
      redirect(forbiddenRedirectTo);
    }

    throw new Error("Brak uprawnień administratora");
  }

  return { supabase, user, profile };
}
