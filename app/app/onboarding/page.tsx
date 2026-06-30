import { redirect } from "next/navigation";
import { getRequestContext } from "@/lib/auth/request-context";
import { createClient } from "@/lib/supabase/server";
import OnboardingClient from "./onboarding-client";

export const dynamic = "force-dynamic";

export default async function OnboardingPage() {
  const { user, role } = await getRequestContext();
  if (!user) redirect("/auth");
  if (role !== "student" && role !== "company") redirect("/app");

  const supabase = await createClient();
  const profileResult = role === "company"
    ? await supabase
      .from("company_profiles")
      .select("nazwa, nip, address, city")
      .eq("user_id", user.id)
      .maybeSingle()
    : await supabase
      .from("student_profiles")
      .select("public_name, kierunek, rok, bio")
      .eq("user_id", user.id)
      .maybeSingle();

  const profile = profileResult.data;
  const initialData = role === "company"
    ? {
        companyName: profile && "nazwa" in profile ? profile.nazwa : null,
        nip: profile && "nip" in profile ? profile.nip : null,
        address: profile && "address" in profile ? profile.address : null,
        city: profile && "city" in profile ? profile.city : null,
      }
    : {
        publicName: profile && "public_name" in profile ? profile.public_name : null,
        kierunek: profile && "kierunek" in profile ? profile.kierunek : null,
        rok: profile && "rok" in profile ? profile.rok : null,
        bio: profile && "bio" in profile ? profile.bio : null,
      };

  return <OnboardingClient role={role} initialData={initialData} />;
}
