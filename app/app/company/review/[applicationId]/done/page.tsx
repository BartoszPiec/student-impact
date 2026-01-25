import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Stars } from "@/components/ReviewCard";
import { openChatForApplication } from "../../../../chat/_actions";

export const dynamic = "force-dynamic";

// Stars now imported from ReviewCard

export default async function CompanyReviewDonePage({
  params,
}: {
  params: Promise<{ applicationId: string }>;
}) {
  const { applicationId } = await params;

  const supabase = await createClient();

  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) redirect("/auth");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("user_id", user.id)
    .single();

  if (profile?.role !== "company") redirect("/app");

  const { data: appRow } = await supabase
    .from("applications")
    .select("id, offer_id, student_id")
    .eq("id", applicationId)
    .maybeSingle();

  if (!appRow) redirect("/app/company/applications");

  const { data: offer } = await supabase
    .from("offers")
    .select("id, tytul, company_id, status")
    .eq("id", appRow.offer_id)
    .maybeSingle();

  if (!offer || offer.company_id !== user.id) redirect("/app/company/applications");

  const { data: review } = await supabase
    .from("reviews")
    .select("id, rating, comment, created_at")
    .eq("application_id", applicationId)
    .eq("reviewer_role", "company")
    .maybeSingle();

  if (!review) redirect(`/app/company/review/${applicationId}`);

  // student name (fallback)
  const { data: studentProfile } = await supabase
    .from("profiles")
    .select("name")
    .eq("user_id", appRow.student_id)
    .maybeSingle();

  const studentLabel =
    (studentProfile as any)?.name ||
    (studentProfile as any)?.email ||
    "student";

  // ✅ akcja otwierająca czat (historia)
  const chatAction = openChatForApplication.bind(null, applicationId);

  return (
    <main className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold">Ocena zapisana ✅</h1>
          <p className="text-sm text-muted-foreground">
            Dzięki — to pomaga budować jakość platformy i ułatwia studentom rozwój portfolio.
          </p>
        </div>

        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href="/app/company/applications">Wróć do aplikacji</Link>
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="space-y-2">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="space-y-1">
              <CardTitle className="text-lg">Podsumowanie współpracy</CardTitle>
              <div className="text-sm text-muted-foreground">
                Oferta: <span className="text-foreground">{offer.tytul ?? "Zlecenie"}</span>
              </div>
              <div className="text-sm text-muted-foreground">
                Student: <span className="text-foreground">{studentLabel}</span>
              </div>
            </div>

            <div className="flex flex-col items-end gap-1">
              <Stars rating={review.rating} />
              <Badge variant="secondary">{review.rating}/5</Badge>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 pt-1">
            <Badge variant="outline">Status oferty: {offer.status}</Badge>
            <Badge variant="outline">Zlecenie zamknięte</Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <Separator />

          <div className="space-y-1">
            <div className="text-xs text-muted-foreground">Komentarz</div>
            {review.comment ? (
              <div className="text-sm whitespace-pre-wrap">{review.comment}</div>
            ) : (
              <div className="text-sm text-muted-foreground">Bez komentarza.</div>
            )}
          </div>

          <Separator />

          <div className="space-y-2">
            <div className="text-sm font-medium">Co teraz?</div>
            <div className="text-sm text-muted-foreground">
              Możesz dodać kolejne zlecenie, skorzystać z gotowych pakietów albo wrócić do rozmowy i
              historii ustaleń.
            </div>

            <div className="flex flex-wrap gap-2 pt-2">
              <Button asChild>
                <Link href="/app/company/offers/new">Dodaj nowe ogłoszenie</Link>
              </Button>

              <Button asChild variant="outline">
                <Link href="/app/company/packages">Przejdź do pakietów</Link>
              </Button>

              <Button asChild variant="outline">
                <Link href={`/app/deliverables/${applicationId}`}>Zobacz realizację</Link>
              </Button>

              <Button asChild variant="outline">
                <Link href={`/app/students/${appRow.student_id}`}>Profil studenta</Link>
              </Button>

              <form action={openChatForApplication.bind(null, applicationId)}>
                <Button type="submit" variant="outline">Czat (historia)</Button>
              </form>
            </div>
          </div>

        </CardContent>
      </Card>

      <div className="text-xs text-muted-foreground">
        Tip: Jeśli często zlecasz podobne rzeczy, pakiety skracają czas briefu i upraszczają współpracę.
      </div>
    </main>
  );
}
