import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cancelCooperation } from "./_actions";

export const dynamic = "force-dynamic";

export default async function CancelPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: applicationId } = await params;

  if (!applicationId || applicationId === "undefined") redirect("/app");

  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) redirect("/auth");

  // aplikacja
  const { data: appRow, error: appErr } = await supabase
    .from("applications")
    .select("id, status, student_id, offer_id")
    .eq("id", applicationId)
    .maybeSingle();

  if (appErr || !appRow) {
    return (
      <main className="space-y-4 max-w-2xl">
        <h1 className="text-xl font-semibold">Nie znaleziono aplikacji</h1>
        <pre className="rounded-md border p-4 text-sm overflow-auto">
          {JSON.stringify({ applicationId, appErr, appRow }, null, 2)}
        </pre>
        <Button asChild variant="outline">
          <Link href="/app">Wróć</Link>
        </Button>
      </main>
    );
  }

  // oferta (weryfikacja firmy)
  const { data: offer, error: offerErr } = await supabase
    .from("offers")
    .select("id, company_id, tytul")
    .eq("id", appRow.offer_id)
    .maybeSingle();

  if (offerErr || !offer) {
    return (
      <main className="space-y-4 max-w-2xl">
        <h1 className="text-xl font-semibold">Nie znaleziono oferty</h1>
        <pre className="rounded-md border p-4 text-sm overflow-auto">
          {JSON.stringify({ applicationId, offerErr, offer }, null, 2)}
        </pre>
        <Button asChild variant="outline">
          <Link href="/app">Wróć</Link>
        </Button>
      </main>
    );
  }

  const isStudent = user.id === appRow.student_id;
  const isCompany = user.id === offer.company_id;
  if (!isStudent && !isCompany) redirect("/app");

  // anulowanie tylko accepted
  if (appRow.status !== "accepted") {
    redirect(`/app/deliverables/${applicationId}`);
  }

  const action = cancelCooperation.bind(null, applicationId);

  return (
    <main className="space-y-4 max-w-2xl">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold">Anuluj współpracę</h1>
        <p className="text-sm text-muted-foreground">
          To zakończy zlecenie. Historia czatu pozostanie dostępna jako historia.
        </p>
        <div className="text-sm text-muted-foreground">
          Oferta: <span className="text-foreground">{offer.tytul ?? "Zlecenie"}</span>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Powód anulowania</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <form action={action} className="space-y-3">
            <Textarea
              name="reason"
              rows={5}
              required
              placeholder="Napisz krótko dlaczego anulujesz (wymagane)."
            />

            <div className="flex gap-2">
              <Button type="submit" variant="destructive">
                Potwierdź anulowanie
              </Button>

              <Button asChild variant="outline">
                <Link href={`/app/deliverables/${applicationId}`}>Wróć</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
