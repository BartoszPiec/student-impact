import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { PageContainer } from "@/components/ui/page-container";
import { AlertTriangle, ArrowLeft, XCircle } from "lucide-react";
import { cancelCooperation } from "./_actions";

export const dynamic = "force-dynamic";

function MissingResourceState({ title }: { title: string }) {
  return (
    <main className="mx-auto max-w-2xl space-y-4 p-6">
      <h1 className="text-xl font-semibold">{title}</h1>
      <p className="text-sm text-muted-foreground">
        Nie mozemy otworzyć tego formularza. Wroc do panelu i wybierz aktywne zlecenie z listy.
      </p>
      <Button asChild variant="outline">
        <Link href="/app">Wroc</Link>
      </Button>
    </main>
  );
}

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

  const { data: appRow, error: appErr } = await supabase
    .from("applications")
    .select("id, status, student_id, offer_id")
    .eq("id", applicationId)
    .maybeSingle();

  if (appErr || !appRow) {
    return <MissingResourceState title="Nie znaleziono aplikacji" />;
  }

  const { data: offer, error: offerErr } = await supabase
    .from("offers")
    .select("id, company_id, tytul")
    .eq("id", appRow.offer_id)
    .maybeSingle();

  if (offerErr || !offer) {
    return <MissingResourceState title="Nie znaleziono oferty" />;
  }

  const isStudent = user.id === appRow.student_id;
  const isCompany = user.id === offer.company_id;
  if (!isStudent && !isCompany) redirect("/app");

  if (appRow.status !== "accepted") {
    redirect(`/app/deliverables/${applicationId}`);
  }

  const action = cancelCooperation.bind(null, applicationId);

  return (
    <main className="min-h-screen bg-slate-50/60 py-10">
      <PageContainer className="max-w-3xl">
        <div className="space-y-6">
          <div className="space-y-3">
            <Button asChild variant="outline" className="rounded-2xl border-slate-200 bg-white">
              <Link href={`/app/deliverables/${applicationId}`}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Wroc do realizacji
              </Link>
            </Button>

            <div className="rounded-[2rem] border border-red-200 bg-gradient-to-br from-white via-red-50/60 to-white p-8 shadow-sm">
              <div className="flex items-start gap-4">
                <div className="rounded-2xl bg-red-100 p-3 text-red-600">
                  <AlertTriangle className="h-6 w-6" />
                </div>
                <div className="space-y-2">
                  <h1 className="text-3xl font-black tracking-tight text-slate-950">Anuluj współpracę</h1>
                  <p className="text-sm leading-6 text-slate-600">
                    Ta operacja zakonczy zlecenie i zapisze powod anulowania w historii sprawy. Historia czatu pozostanie
                    dostepna, a dalsze kroki rozliczeniowe będą zalezne od stanu współpracy.
                  </p>
                  <p className="text-sm font-semibold text-slate-700">
                    Oferta: <span className="text-slate-950">{offer.tytul ?? "Zlecenie"}</span>
                  </p>
                </div>
              </div>
            </div>
          </div>

          <Card className="overflow-hidden rounded-[2rem] border-slate-200 shadow-sm">
            <CardHeader className="border-b border-slate-100 bg-white">
              <CardTitle className="text-lg font-black text-slate-950">Powod anulowania</CardTitle>
            </CardHeader>
            <CardContent className="bg-white p-8">
              <form action={action} className="space-y-6">
                <div className="space-y-2">
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">Wymagane uzasadnienie</p>
                  <Textarea
                    name="reason"
                    rows={6}
                    required
                    className="min-h-[180px] rounded-[1.5rem] border-slate-200 bg-slate-50 px-5 py-4 text-base leading-7 text-slate-900"
                    placeholder="Napisz krotko dlaczego anulujesz współpracę."
                  />
                </div>

                <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                  <Button asChild variant="outline" className="h-12 rounded-2xl border-slate-200 px-6">
                    <Link href={`/app/deliverables/${applicationId}`}>Wroc</Link>
                  </Button>

                  <Button
                    type="submit"
                    className="h-12 rounded-2xl bg-red-600 px-6 font-bold text-white hover:bg-red-700"
                  >
                    <XCircle className="mr-2 h-4 w-4" />
                    Potwierdz anulowanie
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </PageContainer>
    </main>
  );
}
