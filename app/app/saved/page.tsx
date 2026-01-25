import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { removeSavedOffer } from "./_actions";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const dynamic = "force-dynamic";

type SP = Record<string, string | string[] | undefined>;
const getStr = (sp: SP, key: string) => (typeof sp[key] === "string" ? (sp[key] as string) : "");

export default async function SavedOffersPage({
  searchParams,
}: {
  searchParams: Promise<SP>;
}) {
  const sp = await searchParams;

  const q = getStr(sp, "q");
  const typ = getStr(sp, "typ"); // micro/projekt/praktyka/""
  const sort = getStr(sp, "sort") || "saved_newest"; // saved_newest / offer_newest / stawka_desc / stawka_asc

  const supabase = await createClient();

  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) redirect("/auth");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("user_id", user.id)
    .single();

  if (profile?.role !== "student") redirect("/app");

  // Pobieramy zapisane + osadzone dane oferty
  const { data: rows, error } = await supabase
    .from("saved_offers")
    .select("created_at, offers(id, tytul, opis, typ, czas, wymagania, stawka, status, created_at)")
    .eq("student_id", user.id)
    .order("created_at", { ascending: false });

  // Normalizacja + filtracja po status
  let items = (rows ?? [])
    .map((r: any) => {
      const offer = Array.isArray(r.offers) ? r.offers[0] : r.offers;
      return { saved_at: r.created_at, offer };
    })
    .filter((x) => x.offer && x.offer.status === "published");

  // Filtry
  if (typ && ["micro", "projekt", "praktyka"].includes(typ)) {
    items = items.filter((x) => x.offer.typ === typ);
  }

  if (q) {
    const needle = q.toLowerCase();
    items = items.filter((x) => {
      const t = String(x.offer.tytul ?? "").toLowerCase();
      const o = String(x.offer.opis ?? "").toLowerCase();
      return t.includes(needle) || o.includes(needle);
    });
  }

  // Sort (robimy w JS, żeby nie walczyć z order po relacji)
  if (sort === "offer_newest") {
    items.sort((a, b) => String(b.offer.created_at).localeCompare(String(a.offer.created_at)));
  } else if (sort === "stawka_desc") {
    items.sort((a, b) => Number(b.offer.stawka ?? -1) - Number(a.offer.stawka ?? -1));
  } else if (sort === "stawka_asc") {
    items.sort((a, b) => Number(a.offer.stawka ?? 1e15) - Number(b.offer.stawka ?? 1e15));
  } // saved_newest zostaje domyślnie (już jest)

  return (
    <main className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Zapisane</h1>
        <p className="text-sm text-muted-foreground">Twoje zapisane oferty — wróć do nich jednym kliknięciem.</p>
      </div>

      {/* FILTRY */}
      <Card>
        <CardContent className="p-4">
          <form method="get" className="grid gap-3 md:grid-cols-5 items-end">
            <div className="md:col-span-2">
              <div className="text-sm mb-1">Szukaj</div>
              <Input name="q" defaultValue={q} placeholder="np. Next.js, UX, analiza..." />
            </div>

            <div>
              <div className="text-sm mb-1">Typ</div>
              <select name="typ" defaultValue={typ || ""} className="h-10 w-full rounded-md border px-3 text-sm">
                <option value="">Wszystkie</option>
                <option value="micro">micro</option>
                <option value="projekt">projekt</option>
                <option value="praktyka">praktyka</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <div className="text-sm mb-1">Sortowanie</div>
              <select name="sort" defaultValue={sort} className="h-10 w-full rounded-md border px-3 text-sm">
                <option value="saved_newest">Najnowsze zapisane</option>
                <option value="offer_newest">Najnowsze oferty</option>
                <option value="stawka_desc">Stawka malejąco</option>
                <option value="stawka_asc">Stawka rosnąco</option>
              </select>
            </div>

            <div className="md:col-span-5 flex gap-2">
              <Button type="submit">Zastosuj</Button>
              <Button asChild variant="outline">
                <Link href="/app/saved">Wyczyść</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* LICZNIK + CHIPY */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="text-sm text-muted-foreground">
          Wyników: <span className="text-foreground font-medium">{items.length}</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {q && <Badge variant="secondary">szukaj: {q}</Badge>}
          {typ && <Badge variant="secondary">typ: {typ}</Badge>}
          {sort !== "saved_newest" && <Badge variant="secondary">sort: {sort}</Badge>}
        </div>
      </div>

      {error && (
        <pre className="rounded-md border p-4 text-sm overflow-auto">
          {JSON.stringify(error, null, 2)}
        </pre>
      )}

      {/* LISTA */}
      <div className="grid gap-4 md:grid-cols-2">
        {items.map(({ offer }: any) => {
          const removeAction = removeSavedOffer.bind(null, offer.id);

          return (
            <Card key={offer.id}>
              <CardHeader className="space-y-2">
                <div className="flex items-start justify-between gap-3">
                  <CardTitle className="text-base">{offer.tytul}</CardTitle>
                  <Badge variant="secondary">{offer.typ}</Badge>
                </div>
                <div className="text-sm text-muted-foreground line-clamp-2">{offer.opis}</div>
              </CardHeader>

              <CardContent className="space-y-3">
                <div className="grid gap-1 text-sm">
                  <div>
                    Stawka: <span className="font-medium">{offer.stawka ?? "-"}</span>
                  </div>
                  {offer.wymagania && <div>Wymagania: {offer.wymagania}</div>}
                  {offer.czas && <div>Czas: {offer.czas}</div>}
                </div>

                <div className="flex gap-2">
                  <Button asChild className="flex-1">
                    <Link href={`/app/offers/${offer.id}`}>Szczegóły</Link>
                  </Button>

                  <form action={removeAction}>
                    <Button variant="outline" type="submit">Usuń</Button>
                  </form>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* EMPTY STATE */}
      {!error && items.length === 0 && (
        <Card>
          <CardContent className="p-6 space-y-3">
            <div className="text-sm text-muted-foreground">
              Nie masz jeszcze zapisanych ofert (albo filtry nic nie znalazły).
            </div>
            <Button asChild>
              <Link href="/app">Przeglądaj oferty</Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </main>
  );
}
