# CODEX — Wytyczne: poprawki i zabezpieczenia przed publikacją

> Data: 2026-06-10 | Autor: Claude (audyt) | Wykonawca: Codex (implementacja)
> Kontekst biznesowy: testy pilotażowe E2E **26.06–08.07** (umowy i pieniądze POZA aplikacją, w aplikacji wszystko w trybie testowym), pitch VC **09.07**, GO LIVE z płatnościami **~01.08** (po rejestracji działalności).
> Zasada nadrzędna: **ZERO nowych feature'ów poza tą listą.** Każda godzina kodu poza P0/P1 to godzina stracona — produkt jest gotowy, brakuje walidacji rynku.

---

## P0 — przed testem pilotażowym (deadline: 24.06)

### P0-1. Tryb pilotażowy (PILOT MODE)
Pilot zakłada: pełny flow w aplikacji (rejestracja → zamówienie pakietu → czat → deliverables → recenzja) + płatność **Stripe TEST mode** (karta 4242…) + umowa podpisywana **poza aplikacją** (wzór od prawnika). Aplikacja musi to komunikować, żeby nie wprowadzać firm w błąd:
- [ ] Env flag `NEXT_PUBLIC_PILOT_MODE=true` → globalny, nieinwazyjny baner w layoucie `/app`: „Wersja pilotażowa — płatności w trybie testowym, rozliczenie zgodnie z umową pilotażową".
- [ ] Gdy pilot mode: adnotacja na generowanych PDF (`lib/pdf/contract-a-template.tsx`, `lib/pdf/contract-b-template.tsx`, faktura/rachunek): „DOKUMENT TESTOWY — wygenerowany w pilotażu, niewiążący. Wiążąca jest umowa pilotażowa podpisana odrębnie."
- [ ] Checkout w pilot mode działa wyłącznie na kluczach `sk_test_`/`pk_test_` — twarda walidacja env (jeśli `PILOT_MODE=true` i klucz zaczyna się od `sk_live_` → błąd przy starcie/checkout).
- [ ] E-maile transakcyjne w pilot mode z prefiksem `[PILOTAŻ]` w temacie.

### P0-2. Spójność modelu prowizji (decyzja biznesowa — NOWE stawki)
Decyzja wspólników (2026-06-10), zastępuje obecne domyślne:
| Typ | Stawka | Uwagi |
|---|---|---|
| Pakiety systemowe (`platform_service`) | **25%** | zgodnie z szablonami pakietów w `Pakiety Usług/` |
| Custom zlecenia (`application`, job/mikro) | **15%** | jedna stawka zamiast 10/15 — upraszcza komunikację |
| Recurring (kolejne zamówienie tej samej firmy z tym samym studentem) | **15%** | dotyczy też pakietów — zachęta do retencji (operacyjnie: admin ustawia explicit rate przy kontrakcie) |

Zmiany w kodzie:
- [ ] `lib/commission.ts:13` — `ALLOWED_COMMISSION_RATE_OPTIONS = [0.1, 0.15, 0.2]` **nie zawiera 0.25**, a `lib/services/package-customization.ts:103,129` używa `commission_rate: 0.25` → niespójność: `isAllowedCommissionRate(0.25) === false`, podczas gdy warianty pakietów niosą 0.25. Dodać `0.25` do allowed options.
- [ ] `DEFAULT_PLATFORM_SERVICE_COMMISSION_RATE` `0.2 → 0.25` (`lib/commission.ts:12`); `DEFAULT_JOB_COMMISSION_RATE` `0.1 → 0.15` (ujednolicenie do 15%). `DEFAULT_MICRO_COMMISSION_RATE` zostaje 0.15.
- [ ] Sprawdzić wszystkie miejsca czytające te stałe (admin system-services form, checkout, `lib/stripe/stripe-event-processor.ts:298`, PDF) — czy poprawnie renderują 25%.
- [ ] Pamiętać o invariancie: `contracts.commission_rate` jest **zamrażana per kontrakt** — zmiana defaultów nie może ruszać istniejących kontraktów (tak już działa, tylko potwierdzić testem).
- [ ] Zaktualizować legal copy, jeśli gdzieś wisi konkretny % (grep: `lib/pdf/legal-clauses-pl.ts` — obecnie odwołuje się do „stawki przypisanej do rodzaju zlecenia", OK).

### P0-3. Nazewnictwo umowy studenta — czeka na decyzję prawnika (do 24.06)
`PILOT_MVP_DECISIONS_2026-05-09.md` mówi „Student widzi umowę nazwaną **Umowa zlecenie**", a szablony/plan mówią o **Umowie o dzieło** (`lib/pdf/contract-b-template.tsx`, `lib/pdf/legal-clauses-pl.ts:118`). To nie jest kosmetyka: zlecenie vs dzieło ma inne skutki PIT/ZUS dla studenta <26 r.ż. (zerowy PIT obejmuje zlecenie, NIE dzieło).
- [ ] Po decyzji prawnika: ujednolicić nazwę i treść klauzul w `contract-b-template.tsx`, `legal-clauses-pl.ts`, wszystkich labelach UI (grep: „dzieło", „zlecenie").
- [ ] Jeśli zlecenie: zweryfikować logikę PIT (`20260416141000_add_calculate_pit_withholding_rpc.sql`) pod kątem zwolnienia <26 r.ż.

### P0-4. Pakiety pierwszej fali w system-services
- [ ] Utworzyć 5 pakietów (specyfikacja: `Student2Work_Launch_Plan/03_PAKIETY_PIERWSZA_FALA.xlsx` + pełne treści w `Pakiety Usług/_GOTOWE_SZABLONY_LAUNCH_SET.md`): Pakiet grafik SM, Prezentacja firmowa, Montaż Reels, Retusz zdjęć produktowych, Testy manualne QA. Preferencja: seed-migracja (powtarzalna na preview/prod) zamiast ręcznego klikania w `/app/admin/system-services/new`.
- [ ] Warianty S/M/L z cenami z xlsx, `commission_rate: 0.25`, milestone template 1-etapowy („Realizacja zamówienia").

### P0-5. Komunikacja
- [ ] Podpiąć klucz Resend i zweryfikować wysyłkę e-maili transakcyjnych na preview (`app/api/webhooks/notifications/route.ts`).
- [ ] `ReportProblemButton` (`app/app/chat/[id]/_components/ReportProblemButton.tsx`) — działa (dialog + `reportProblem`). Zweryfikować e2e: zgłoszenie → kontrakt `disputed` → widoczne w `/app/admin/disputes` → powiadomienie do admina (e-mail). Jeśli brak powiadomienia e-mail do admina — dodać (w pilocie reagujemy w 48h SLA).

### P0-6. Higiena repo przed testami
- [ ] Working tree ma ~50+ niezacommitowanych modyfikacji (git status z 2026-06-10) — zacommitować/pushnąć, żeby preview == repo (lekcja z 2026-05-29).
- [ ] Przed każdą sesją testową z firmą: `node scripts/mvp-scenario-suite.mjs` na preview (26 scenariuszy) musi być zielone.

---

## P1 — przed GO LIVE z płatnościami (deadline: 31.07)

### P1-1. Infrastruktura produkcyjna (runbook: `PRODUCTION_GO_LIVE_RUNBOOK.md`)
- [ ] Live Stripe: `sk_live_`/`pk_live_` + webhook produkcyjny `https://student2work.pl/api/stripe/webhook` + `STRIPE_WEBHOOK_SECRET` (wymaga zarejestrowanej działalności — patrz wytyczne prawne).
- [ ] DNS `student2work.pl`: A → `76.76.21.21` (obecnie `2.57.91.91`).
- [ ] `UPSTASH_REDIS_REST_URL/TOKEN` (rate limiting realnie aktywny), `SENTRY_DSN`.
- [ ] `check:production` zielony + transakcja groszowa e2e na live przed pierwszym płatnym zleceniem.

### P1-2. Spory — minimalny workflow admina
- [ ] `/app/admin/disputes` jest read-only. Dodać minimalne akcje: „rozwiąż spór" (przywróć milestone do `in_progress` lub zaakceptuj) + notatka. Pełny refund-flow może zostać operacyjny (Stripe Dashboard) — ale stan w DB musi dać się domknąć bez SQL-a.

### P1-3. Zaufanie i profil
- [ ] Minimalne portfolio studenta: pole „linki do prac" (3 URL-e) w `student_profiles` + render na profilu publicznym (`app/app/students/[id]/page.tsx`). Bez uploadu plików — tylko linki (Behance/Drive). Małe, a odblokowuje selekcję i sprzedaż.
- [ ] Taksonomia kategorii: ujednolicić landing (3 filary) vs `constants.ts` (12) vs job-form (~38) → jedna lista 8–12 kategorii zgodna z pakietami pierwszej fali. Nie przebudowywać — zmapować i ukryć nadmiar.

### P1-4. Zgodność (po audycie prawnika — pakiet 3)
- [ ] Wgrać poprawki prawnika do `/regulamin` i `/polityka-prywatnosci`.
- [ ] Zweryfikować ścieżkę „usuń konto / eksport danych" (RODO) — jeśli brak, minimalna wersja: żądanie przez e-mail + SOP ręczny, link w polityce prywatności.
- [ ] KSeF: od 2026 e-faktury obowiązkowe — na start wystarczy proces ręczny (faktury platformy wystawiane w zewnętrznym programie księgowym zintegrowanym z KSeF), ale NIE komunikować PDF-ów z apki jako faktur VAT, dopóki księgowa nie potwierdzi obiegu. Ewentualna integracja API KSeF = backlog Q4.

---

## P2 — po launchu (backlog, NIE ruszać przed walidacją)
- Subskrypcje/recurring (paczka grafik co miesiąc) — dopiero po ≥3 powtórnych zamówieniach ręcznych.
- Narzędzie matchingu w adminie — dopiero gdy ręczny matching > 2h/dzień.
- Ranking jakości studentów, automatyczne QA, self-service refund, integracja KSeF, panel edycji `service_package_milestone_templates`.

## Czego NIE robić w ogóle (decyzja founderska)
- Nowych kategorii usług (SEO, prawne, księgowe) — poza kompetencjami studenckimi / ryzyko regulacyjne.
- Publicznej giełdy gigów studenckich (`service_packages` studentów) — chaos podaży; zostaje wyłączone z nawigacji na pilot.
- Przebudowy UI/UX poza krytycznymi blokerami z testów.

## Raportowanie
Po każdym ukończonym punkcie: commit z prefiksem `pilot:`, krótki wpis w `AGENT_NOTEBOOK.md` (co, gdzie, jak zweryfikowane). Pytania/decyzje → do Bartosza na czacie koordynacyjnym.
