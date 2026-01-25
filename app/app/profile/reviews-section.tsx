import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Stars, ReviewCard } from "@/components/ReviewCard";

export const dynamic = "force-dynamic";

export default async function ReviewsSection() {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) redirect("/auth");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("user_id", user.id)
    .single();

  if (profile?.role !== "student") return null;

  const { data: reviews, error } = await supabase
    .from("reviews")
    .select("id, rating, comment, created_at, company_id, application_id, reviewer_role, reviewee_id, reviewer_id")
    .eq("reviewer_role", "company")
    .eq("reviewee_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    return (
      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-slate-900 tracking-tight">Oceny i referencje</h2>
        <div className="rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-600">
          Wystąpił błąd podczas ładowania opinii.
        </div>
      </section>
    );
  }

  const rows = reviews ?? [];
  if (rows.length === 0) {
    return (
      <section className="space-y-2">
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">Oceny i referencje</h2>
        <div className="text-sm text-muted-foreground bg-white p-6 rounded-2xl border border-dashed border-slate-200 text-center">
          Brak ocen — Twoje referencje od firm pojawią się tutaj po zakończeniu zleceń.
        </div>
      </section>
    );
  }

  const avg = rows.reduce((sum, r: any) => sum + (Number(r.rating) || 0), 0) / rows.length;

  const companyIds = Array.from(new Set(
    rows.map((r: any) => r.company_id || (r.reviewer_role === 'company' ? r.reviewer_id : null)).filter(Boolean)
  ));
  const { data: companies } = companyIds.length
    ? await supabase.from("company_profiles").select("user_id, nazwa").in("user_id", companyIds)
    : { data: [] as any[] };

  const companyNameMap = new Map((companies ?? []).map((c: any) => [c.user_id, c.nazwa]));

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Oceny i referencje</h2>
          <p className="text-sm text-slate-500 font-medium">Zweryfikowane opinie od pracodawców.</p>
        </div>
        <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-full border border-slate-100 shadow-sm">
          <span className="text-lg font-bold text-slate-800">{avg.toFixed(1)}</span>
          <Stars rating={Math.round(avg)} />
          <span className="text-xs text-slate-400 font-medium ml-1">({rows.length})</span>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {rows.map((r: any) => {
          const cId = r.company_id || r.reviewer_id;
          const cName = companyNameMap.get(cId) || "Firma";

          return (
            <ReviewCard
              key={r.id}
              id={r.id}
              rating={r.rating}
              comment={r.comment}
              createdAt={r.created_at}
              reviewerId={cId}
              reviewerName={cName}
              reviewerLink={`/app/companies/${cId}`}
            />
          );
        })}
      </div>
    </section>
  );
}


