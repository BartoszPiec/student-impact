import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Stars, ReviewCard } from "@/components/ReviewCard";

export const dynamic = "force-dynamic";

type ReviewRow = {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  company_id: string | null;
  reviewer_role: string;
  reviewer_id: string;
};

type CompanyRow = { user_id: string; nazwa: string | null };

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

  const rows = (reviews ?? []) as ReviewRow[];
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

  const avg = rows.reduce((sum, review) => sum + (Number(review.rating) || 0), 0) / rows.length;

  const companyIds = Array.from(new Set(
    rows
      .map((review) => review.company_id || (review.reviewer_role === "company" ? review.reviewer_id : null))
      .filter((companyId): companyId is string => Boolean(companyId))
  ));
  const { data: companies } = companyIds.length
    ? await supabase.from("company_profiles").select("user_id, nazwa").in("user_id", companyIds)
    : { data: [] as CompanyRow[] };

  const companyNameMap = new Map(((companies ?? []) as CompanyRow[]).map((company) => [company.user_id, company.nazwa]));

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Oceny i referencje</h2>
          <p className="text-sm text-slate-500 font-medium">Zweryfikowane opinie od pracodawców.</p>
        </div>
        <div className="flex w-fit max-w-full items-center gap-2 rounded-2xl border border-slate-100 bg-white px-3 py-2 shadow-sm sm:rounded-full sm:px-4">
          <span className="text-lg font-bold text-slate-800">{avg.toFixed(1)}</span>
          <Stars rating={Math.round(avg)} />
          <span className="ml-1 whitespace-nowrap text-xs font-medium text-slate-400">({rows.length})</span>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {rows.map((r) => {
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


