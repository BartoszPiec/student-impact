# Plan pierwszych testów Student2Work

> Dokument operacyjny przygotowany na podstawie analizy realnego kodu (branch `codex/mvp-pilot-ready`, stan 2026-06-05).
> Etykiety statusu kodu: `JEST W KODZIE` / `CZĘŚCIOWO` / `BRAK` / `NIEJASNE` / `[ZAŁOŻENIE / DO WERYFIKACJI W KODZIE]`.
> Zasada: nic nie jest uznane za gotowe, jeśli nie ma dowodu w pliku.

---

## 1. Executive summary

**Najważniejszy wniosek: macie produkt zbudowany na poziomie wczesnej produkcji, a walidację rynku na poziomie zera.** To klasyczna pułapka over-buildingu. Student2Work to w praktyce „Useme dla studentów" z pełnym escrow (Stripe Checkout + Connect), modelem dwóch umów (firma↔platforma „Umowa o Świadczenie Usługi" + student↔platforma „Umowa o Dzieło"), generowaniem PDF, fakturami, rachunkami, naliczaniem PIT, księgą rozliczeń (ledger), prowizją zmienną (10/15/20%) i panelem admina. Zespół sam ocenia stan jako **PREVIEW: GO** (build czysty, suita E2E 26/26 zielona) i **PRODUKCJA: NO-GO wyłącznie z powodów infrastrukturalnych** (brak live'owych kluczy Stripe, DNS `student2work.pl`, webhooka produkcyjnego, Upstash, Sentry DSN) — **zero blockerów w samym kodzie**.

**Co to znaczy strategicznie:** problemem nie jest „czy aplikacja działa", tylko „czy ktokolwiek tego chce, zapłaci i czy studenci dowiozą jakość". Na te pytania kod nie odpowiada i nie odpowie.

**Rekomendowana strategia testu:** zatrzymać budowanie nowych funkcji. Uruchomić **dwuetapowy test: concierge (tydzień 2-3) → controlled beta na realnej aplikacji (tydzień 4-6) → płatne piloty (tydzień 5-7)** na **kuratorowanej puli studentów** w **jednej niszy**.

**Strategia wejścia: gotowe pakiety jako klin (entry-package wedge).** Pierwszy target outreachu: **właściciele e-commerce** — pakiety „retusz zdjęć produktowych + grafiki produktowe/social + wgrywanie listingów" (bez SEO — to nie kompetencja studencka, patrz §11). Powód: najwyższa pilność, najłatwiejszy QA, najtańsze ryzyko, powtarzalność i recurring, najszersza dostępna podaż studentów (grafika/foto/marketing). Ale klin to same **pakiety wejściowe** — sprzedawane też lokalnym MŚP (wizytówka Google, prezentacje), founderom (logo, makiety) i zespołom IT (QA, dokumentacja). Segment zapasowy: **agencje / studia kreatywne** (podwykonawstwo powtarzalnych zadań, white-label).

**Trzy największe ryzyka:** (1) pusty marketplace — brak jednoczesnej podaży i popytu; (2) jakość i terminowość studentów — bo na niej stoi cała obietnica; (3) brak działającego self-service rozwiązywania sporów/zwrotów (`Zgłoś problem` to martwy przycisk — patrz §2), więc każdy płatny pilot musi mieć ręczny SOP reklamacji.

**Rekomendacja na 6-8 tygodni:** 1 nisza (e-commerce), 10-20 firm w lejku, 20-30 wyselekcjonowanych studentów, 3-5 pakietów, cel: **3-5 realnie dostarczonych zleceń i ≥2 płatne (lub deklaratywnie płatne) piloty z powtórnym zamówieniem od ≥1 firmy.** Jeśli to się nie uda przy gotowym produkcie — problemem jest popyt/segment, nie technologia, i należy pivotować segment lub model (concierge-as-a-service), a nie dobudowywać funkcje.

---

## 2. Co faktycznie istnieje w aplikacji po analizie kodu

### 2.1 Architektura i stack `JEST W KODZIE`

| Warstwa | Technologia | Dowód |
|---|---|---|
| Framework | Next.js 16 (App Router, RSC, Server Actions) | `package.json`, `app/` |
| UI | React 19, Radix UI, Tailwind 4, lucide, sonner | `package.json`, `components/ui` |
| Backend/DB | Supabase Postgres + Auth + Storage, 94 migracje, RLS na wszystkich tabelach, RPC `SECURITY DEFINER` | `supabase/migrations/`, `20260417101000_enable_rls_all_tables.sql` |
| Płatności | Stripe Checkout (escrow) + Stripe Connect (wypłaty studentom) + webhook (podpis + outbox + idempotencja) | `app/api/stripe/*`, `lib/stripe/*`, `20260417120000_stripe_events_outbox.sql` |
| E-mail | Resend (transakcyjny, wyzwalany webhookiem Supabase na INSERT do `notifications`) | `app/api/webhooks/notifications/route.ts` |
| Anti-abuse | Upstash Redis (rate limit), Cloudflare Turnstile (auth) | `lib/rate-limit.ts`, `app/api/auth/verify-turnstile` |
| Dane firm | CEIDG/GUS (lookup po NIP) | `lib/ceidg`, `lib/gus`, `app/app/onboarding/_actions.ts` |
| Dokumenty | react-pdf (umowy + faktury/rachunki) | `lib/pdf`, `types/documents.ts` |
| Hosting/Cron | Vercel; crony: auto-accept, cleanup-sessions, process-stripe-events | `app/api/cron/*`, `vercel.json` |
| Obserwowalność | Sentry | `sentry.*.config.ts` |

**Główne moduły:** marketplace ofert (`app/app/offers`, `app/app/jobs`), pakiety/usługi (`app/app/services`, `app/app/orders`, `app/app/company/packages`), panel firmy (`app/app/company/*`), kontrakty/dostawy (`app/app/deliverables`), czat (`app/app/chat`), finanse (`app/app/finances`), panel admina (`app/app/admin/*`).

### 2.2 Role i onboarding `JEST W KODZIE`

- `profiles.role ∈ {student, company, admin}` — `app/app/onboarding/page.tsx:61`, `lib/admin/auth.ts:40`.
- Tabele profili: `student_profiles` (public_name, kierunek, rok, bio, `kompetencje[]`), `company_profiles` (nazwa, NIP, address, city — uzupełniane z CEIDG).
- Routing po roli: student → `/app/jobs`, firma → `/app/company/packages`, admin → `/app/admin/offers` (`app/app/page.tsx:46-53`).
- Rejestracja: e-mail+hasło z wyborem roli student/company + Turnstile (`app/auth/page.tsx:56,157`).

### 2.3 Dwa mechanizmy marketplace `JEST W KODZIE`

To kluczowe dla testów — produkt ma **dwie równoległe ścieżki**, które zbiegają się do jednego kontraktu:

**A) Oferty + Aplikacje (customowe zlecenia firm / giełda zleceń)**
- `offers`: tytuł, opis, `typ` (micro/projekt/praktyka/job), czas, wymagania, stawka, kategoria, technologie, `is_platform_service`, typ umowy (B2B/UoP/UZ/Staż), tryb pracy, etapy `company_defined`/`student_defined` (`app/app/company/jobs/new/_actions.ts`).
- `applications`: offer_id, student_id, status (sent/accepted/in_progress/completed/rejected/cancelled), `proposed_stawka`, `counter_stawka` — **negocjacja stawki i auto-accept są w kodzie** (`app/app/offers/[id]/_actions.ts:177,207`). Multi-kandydat: oferta zostaje otwarta dla innych.

**B) Pakiety + Zamówienia usług (pakiety platformy / gigi studenckie)**
- `service_packages` (student_id, title, price, delivery_time_days) — gigi tworzone przez studentów (`lib/types/services.ts:3`).
- **System services** — pakiety platformowe tworzone przez admina (`type='platform_service', is_system=true`) z wariantami, szablonami milestone'ów, locked-content i personalizacją; w kodzie istnieją gotowe: pakiet logo, pakiet social media (`lib/services/system-services.ts`, migracje `*_logo_package_*`, `*_social_media_package_*`).
- `service_orders` (package_id, company_id, student_id, `entry_point` company_request/student_private_proposal, status, amount, counter_amount, snapshoty request/quote).
- Private proposals: student → firma (`lib/services/private-proposals.ts`).

### 2.4 Kontrakt / escrow (wspólny rdzeń) `JEST W KODZIE`

- `contracts`: company_id, student_id, **application_id XOR service_order_id**, `source_type`, total_amount, `commission_rate` (zamrożona), funding_mode (full/sequential), status (draft/awaiting_funding/active/delivered/completed/cancelled/disputed), terms_status, akceptacje obu stron (`app/api/stripe/create-checkout/route.ts:140`).
- `milestones`: status (draft→funded→in_progress→delivered→accepted→released / disputed / refunded), `amount_minor`, kryteria akceptacji.
- Różnica ścieżek (decyzja produktowa 2026-04-16): **application** → student definiuje milestones, negocjacja, full/sequential; **service_order** → zawsze **1 milestone**, `terms_status='agreed'`, full funding.
- Finansowanie: Stripe Checkout server-authoritative — wymaga `terms_status='agreed'` + akceptacji umowy przez obie strony (`create-checkout/route.ts:192,243`).
- Akceptacja pracy: `review_delivery_v2` → accept = release środków + payout; reject = powrót do in_progress (`20260121_refactor_v1.sql`).
- `deliverables`: wersjonowane, pliki, status pending/accepted/rejected.
- Wypłaty: Stripe Connect z kontrolą gotowości konta — **pomija transfer i zostawia payout `pending` z polskim komunikatem, gdy konto studenta niegotowe** (`lib/stripe/payouts.ts`, `lib/stripe/connect-readiness.ts`).
- Prowizja: 10% application/job, 15% micro/service-order, 20% platform/system service (pamięć projektu, `20260325210000_variable_commission_model_v1.sql`).

### 2.5 Dokumenty, prawo, finanse `JEST W KODZIE`

- Dwie umowy: `contract_a` (firma↔platforma), `contract_b` (student↔platforma) + faktura firmy i rachunek studenta — PDF + akceptacja cyfrowa obu stron + IP (`20260216_contract_documents_and_invoices.sql`).
- Dostęp do dokumentów per-strona wymuszony RLS (contract_a tylko firma, contract_b tylko student) — `app/api/documents/download/route.ts`.
- Naliczanie PIT (`20260416141000_add_calculate_pit_withholding_rpc.sql`), licznik/numeracja faktur, eksporty admina (ZIP faktur, CSV PIT).
- Księga rozliczeń / accounting layer (`accounting_book_lines_v1`, `get_admin_stats`).
- Strony prawne: `/regulamin`, `/polityka-prywatnosci` `JEST W KODZIE` (treść `[DO WERYFIKACJI MERYTORYCZNEJ przez prawnika]`).

### 2.6 Komunikacja, powiadomienia, opinie `JEST W KODZIE`

- `conversations` + `messages` (per aplikacja/zamówienie), badge nieprzeczytanych, wiadomości systemowe.
- Powiadomienia in-app (`notifications`) + e-mail przez Resend.
- Opinie z oceną w kategoriach (`lib/reviews.ts`, `components/ReviewCard.tsx`).

### 2.7 Panel admina `JEST W KODZIE`

analytics, contracts, **disputes (read-only triage)**, exports, finance (invoices/ledger/periods), offers, payouts, PIT, system-services (CRUD), users, vault.

### 2.8 Tabela gotowości funkcji

| Funkcja | Status | Dowód w kodzie | Waga biznesowa | Gotowość do testu | Rekomendacja |
|---|---|---|---|---|---|
| Rejestracja/logowanie + role | `JEST W KODZIE` | `app/auth/page.tsx`, `onboarding` | Krytyczna | Wysoka | Testować jak jest |
| Profil studenta | `CZĘŚCIOWO` | `student_profiles` (bio, kierunek, kompetencje) | Wysoka | Średnia | Brak portfolio/próbek prac → dodać ręcznie w kuracji |
| Profil firmy + CEIDG | `JEST W KODZIE` | `lib/ceidg`, `lib/gus` | Wysoka | Wysoka | Testować |
| Tablica ofert + filtry | `JEST W KODZIE` | `app/app/page.tsx:57` | Wysoka | Wysoka | Testować |
| Tworzenie zlecenia przez firmę | `JEST W KODZIE` | `company/jobs/new/_actions.ts` | Krytyczna | Średnia (UX briefu złożony) | Test z asystą concierge |
| Pakiety platformowe (system services) | `CZĘŚCIOWO` | `system-services.ts`; aktywne tylko logo + social media | Krytyczna | Średnia | Włączyć/utworzyć 3-5 pakietów pod e-commerce |
| Gigi studenckie (service_packages) | `JEST W KODZIE` | `lib/types/services.ts` | Średnia | Średnia | Nie eksponować na start (chaos podaży) |
| Aplikowanie + negocjacja | `JEST W KODZIE` | `offers/[id]/_actions.ts` | Krytyczna | Wysoka | Testować |
| Zapisane oferty | `JEST W KODZIE` | `app/app/saved` | Niska | Wysoka | OK |
| Czat | `JEST W KODZIE` | `app/app/chat` | Wysoka | Wysoka | Testować |
| Kontrakt + dwie umowy PDF | `JEST W KODZIE` | `contract_documents` | Krytyczna | Wysoka | Testować na preview |
| Escrow (Stripe Checkout) | `JEST W KODZIE` | `create-checkout/route.ts` | Krytyczna | Wysoka (test mode) | Live wymaga kluczy/DNS |
| Wypłaty (Stripe Connect) | `JEST W KODZIE` | `lib/stripe/payouts.ts` | Krytyczna | Średnia | Student musi dokończyć onboarding Connect |
| Dostarczanie pracy (deliverables) | `JEST W KODZIE` | `submit_delivery_v2` | Krytyczna | Wysoka | Testować |
| Recenzja + release środków | `JEST W KODZIE` | `review_delivery_v2` | Krytyczna | Wysoka | Testować |
| Opinie/oceny | `JEST W KODZIE` | `lib/reviews.ts` | Wysoka | Wysoka | Testować |
| Powiadomienia in-app + e-mail | `JEST W KODZIE` | webhook + Resend | Wysoka | Wysoka | Wymaga klucza Resend |
| Faktury / rachunki / PIT | `JEST W KODZIE` | `20260216_*`, `20260416141000_*` | Wysoka | Wysoka | Weryfikacja księgowa |
| Panel admina | `JEST W KODZIE` | `app/app/admin/*` | Wysoka | Wysoka | Używać do operacji |
| **Self-service spór/reklamacja** | **`CZĘŚCIOWO`** | Przycisk „Zgłoś problem" **bez handlera** (`ChatSidebar.tsx:157`); admin tylko read-only (`admin/disputes/page.tsx`) | Krytyczna przy płatnym | Niska | **Obsłużyć ręcznie SOP-em; nie reklamować jako działające** |
| Anulowanie współpracy | `JEST W KODZIE` | `cancel/[id]/_actions.ts` (RPC `cancel_application`) | Wysoka | Średnia | Testować, sprawdzić ścieżkę zwrotu |
| RODO/regulamin (strony) | `JEST W KODZIE` | `/regulamin`, `/polityka-prywatnosci` | Wysoka | `NIEJASNE` (treść) | Audyt prawny przed płatnym |
| Spójność taksonomii kategorii | `CZĘŚCIOWO` | landing (3 filary) vs `constants.ts` (12) vs job-form (~38) | Średnia | — | Ujednolicić pod 1 niszę |

---

## 3. Ocena gotowości produktu do testów

| Wymiar | Ocena (0-10) | Uzasadnienie |
|---|---|---|
| Demo wewnętrzne | **9** | Build czysty, E2E 26/26 zielone, pełny happy-path działa na preview. |
| Test kontrolowany (mała grupa + asysta) | **8** | Wszystkie krytyczne flow są w kodzie; brakuje tylko self-service sporów (obsłużysz ręcznie) i kuracji podaży. |
| Płatny pilot | **7** | Działa na preview w test-mode. Do realnej płatności trzeba: live Stripe (`sk_live_`/`pk_live_`), DNS `student2work.pl` (A → `76.76.21.21`), webhook produkcyjny, Resend, audyt regulaminu. To dni pracy infra, nie tygodnie kodu. |
| Publiczna beta | **4-5** | Pusty marketplace, brak self-service reklamacji/zwrotów, operacje nieskalowane, taksonomia rozjechana, profil studenta bez portfolio. Za wcześnie. |

**Werdykt:** produkt jest gotowy do testów kontrolowanych i — po odblokowaniu infra — do płatnego pilota. **Nie jest gotowy do publicznej bety i nie o to teraz chodzi.** Wąskie gardło to popyt i podaż, nie funkcje.

---

## 4. Najważniejsze flow użytkowników

### 4.1 Flow firmy (custom zlecenie) `JEST W KODZIE`
Rejestracja (rola=company) → onboarding + CEIDG (NIP) → `/app/company/jobs/new` (brief: typ, kategoria, stawka, etapy) → publikacja oferty → przegląd aplikacji (`/app/company/applications`) → akceptacja studenta / negocjacja → akceptacja warunków umowy (obie strony) → opłacenie escrow (Stripe) → czat + odbiór dostawy → recenzja = release środków → faktura + opinia.

### 4.2 Flow firmy (pakiet) `JEST W KODZIE`
`/app/company/packages` → wybór pakietu → (opcjonalnie personalizacja) → `service_order` → kontrakt z 1 milestone, `terms_status='agreed'` → akceptacja umów → escrow → dostawa → recenzja → release.

### 4.3 Flow studenta `JEST W KODZIE`
Rejestracja (rola=student) → onboarding (kierunek, kompetencje, bio) → `/app/jobs` (przeglądanie) → zapis oferty / aplikacja (z opcją kontr-stawki) → czat → akceptacja → **onboarding Stripe Connect** (warunek wypłaty) → realizacja → upload deliverable → po akceptacji firmy: payout → opinia.

### 4.4 Flow admin/operacje `JEST W KODZIE / CZĘŚCIOWO`
`/app/admin`: monitoring kontraktów, finanse/ledger, payouts, faktury/PIT, użytkownicy, **disputes = tylko podgląd** (triage read-only), system-services CRUD. **Brak:** narzędzia do manualnego matchowania i do rozwiązywania sporu z poziomu UI (robi się to operacyjnie/SQL-em).

### 4.5 Flow concierge (manualny, na pierwsze testy)
Operator zespołu: (1) zbiera brief od firmy przez formularz/rozmowę poza apką, (2) dobiera 1-2 studentów z kuratorowanej puli, (3) zakłada/uzupełnia ofertę lub pakiet w apce za firmę, (4) pilnuje terminu i jakości (QA przed wysyłką do firmy), (5) prowadzi płatność i ewentualną reklamację ręcznie wg SOP. Celem jest, by **firma i student myśleli, że „apka to robi", a w tle robi to człowiek** — tak walidujesz popyt bez polegania na pełnej automatyzacji.

---

## 5. Persony i segmenty testowe

Analiza 9 person pod kątem pierwszego testu (skupienie na tym, co da najszybszy, najtańszy, powtarzalny sygnał):

1. **Founder z MVP (tech tasks)** — wysoka pilność i WTP, ale **wysokie ryzyko jakości kodu** i trudny QA dla zespołu nietechnicznego. Podaż „dobrych" studentów-devów wąska. → nie na pierwszy ogień.
2. **Mała firma usługowa (strona/GBP/automatyzacja)** — łatwa do dostarczenia, ale niska pilność i rozproszony popyt. → drugorzędne.
3. **Wsparcie prawno-formalne** — **odpada na start**: odpowiedzialność, ryzyko regulacyjne, jakość trudna do zagwarantowania przez studentów. Nie testować płatnie.
4. **Manager w średniej firmie** — dobra WTP, ale procurement/IT blokują, długi cykl, trudny dostęp. → później.
5. **E-commerce (opisy/grafiki/upload/marketplace)** — **najlepszy kandydat**: pilność (produkty czekają), wysoka powtarzalność i recurring, łatwy QA, niskie ryzyko, szeroka podaż studentów.
6. **Agencja/studio (podwykonawstwo)** — bardzo dobra powtarzalność i recurring, łatwy onboarding (klient zna proces), ale wymaga stabilnej jakości. → **najlepszy segment zapasowy**.
7. **Przedsiębiorca testujący pomysły** — ciekawy, ale niski wolumen i trudna powtarzalność. → nisza okazjonalna.
8. **Founder przed launchem (brand/landing/deck)** — wysoka pilność, świetne dopasowanie studentów-designerów, ale jednorazowość (słaby recurring). → dobry do testu pakietów „one-off".
9. **Mikrobiznes z małym budżetem** — łatwy dostęp, ale niska WTP i strach „student nie dowiezie". → ryzyko niskiej monetyzacji.

### Tabela scoringu segmentów (1-5; ryzyko i złożoność oceniane jako „im wyżej tym lepiej dla nas")

| Segment | Pilność | WTP | Łatwość dotarcia | Powtarzalność | Dopasowanie studentów | Niskie ryzyko | Niska złożoność ops | Szybkość 1. testu | Recurring | **Suma** |
|---|---|---|---|---|---|---|---|---|---|---|
| **E-commerce** | 4 | 4 | 4 | 5 | 5 | 5 | 4 | 5 | 5 | **41** |
| **Agencje/studia** | 3 | 4 | 3 | 5 | 4 | 3 | 3 | 3 | 5 | **33** |
| Founder przed launchem | 4 | 3 | 3 | 2 | 5 | 4 | 3 | 4 | 2 | 30 |
| Founder z MVP (tech) | 4 | 4 | 3 | 3 | 3 | 2 | 2 | 3 | 4 | 28 |
| Mikrobiznes | 2 | 2 | 4 | 2 | 4 | 4 | 4 | 4 | 2 | 28 |
| Manager średnia firma | 2 | 4 | 2 | 3 | 3 | 3 | 2 | 2 | 4 | 25 |

---

## 6. Najlepszy segment startowy

### Główny: właściciele e-commerce (małe/średnie sklepy: Allegro, Shopify, WooCommerce, BaseLinker)
**Konkretny pierwszy use-case:** „retusz zdjęć produktowych + grafiki produktowe/social + wgrywanie listingów" (bez SEO — patrz §11).

**Dlaczego ten segment pierwszy:**
- Ból jest ciągły i mierzalny: „mam 60 produktów ze słabymi zdjęciami / bez grafik / niewgranych", co wprost blokuje sprzedaż.
- Deliverable jest mały, powtarzalny i łatwy do QA przez nietechniczny zespół (czytasz opis, patrzysz na grafikę).
- Najszersza dostępna podaż studentów (grafika, foto, marketing) — łatwo zbudować kuratorowaną pulę.
- Naturalny recurring: nowe produkty co tydzień → powtórne zamówienia.
- Mapuje się na istniejące kategorie (`Design`, `Marketing`, „Internet/e-Commerce") i infrastrukturę system-services.

**Czego NIE testować jeszcze:** zadań prawnych (persona 3), złożonych tasków technicznych pod inwestora (persona 1, wysokie ryzyko jakości), zleceń od korporacji z procurementem (persona 4), publicznej, samoobsługowej giełdy gigów studenckich (chaos podaży), self-service sporów.

**Jak dotrzeć (konkretnie):**
- Grupy FB: „Allegro sprzedawcy", „Sprzedawcy e-commerce Polska", „Shopify Polska", „BaseLinker użytkownicy", „Dropshipping Polska".
- LinkedIn: filtr „właściciel/founder" + „e-commerce"/„sklep internetowy" w PL, firmy 1-15 osób.
- Bezpośrednio: sklepy z brakami w opisach/grafikach na Allegro/Shopify (widać natychmiast) — outreach z konkretnym przykładem ich produktu.
- 1 mikro-event/webinar „Jak ogarnąć opisy 100 produktów w tydzień ręką studenta" — zbiórka leadów.

**Spodziewane obiekcje (i kontry):** „student nie zna mojej branży" → damy brief + 1 próbkę przed resztą; „a jak nie dowiezie?" → płacisz po akceptacji, środki w escrow; „nie mam czasu pisać briefu" → my robimy brief za Ciebie (concierge); „za drogo" → policz koszt godziny własnej / agencji za te same 60 opisów.

### Zapasowy: agencje / studia kreatywne / mały software house
Podwykonawstwo zamkniętych, powtarzalnych zadań (kreacje social, banery, proste front-endy, retusz, listingi). Zaleta: klient zna proces, kupuje regularnie, łatwy onboarding, wysoki recurring. Wada: wymaga stabilnej jakości — wejść dopiero gdy pula studentów się sprawdzi w e-commerce.

---

## 7. Hipotezy do walidacji

| # | Obszar | Hipoteza | Metoda testu | Metryka | Próg sukcesu | Interpretacja porażki |
|---|---|---|---|---|---|---|
| H1 | Popyt | E-commerce ma palący, powtarzalny ból z opisami/grafikami | 15-20 rozmów discovery | % rozmów z „tak, mam ten ból teraz" | ≥60% | Zły segment lub zły use-case → zmień use-case w segmencie, potem segment |
| H2 | WTP | Firma zapłaci ≥ kwoty X za pakiet 10 opisów | Oferta cenowa w rozmowie + płatny pilot | % „tak, płacę" / liczba opłaconych | ≥30% zgód, ≥2 płatności | WTP za niska → przetestuj wyższą wartość/większy pakiet, nie niższą cenę |
| H3 | Klarowność pakietu | Firma rozumie zakres pakietu bez tłumaczenia | Test „pokaż pakiet, milcz 20s" | % rozumiejących bez pytań | ≥70% | Przepakuj zakres/nazwę/deliverable |
| H4 | Podaż | Da się zebrać 20-30 studentów gotowych dowieźć w 72h | Rekrutacja + zadanie próbne | Liczba studentów zdających próbę | ≥20 zdanych | Słaba podaż → zawęź kategorie / podnieś stawkę studenta |
| H5 | Jakość | Student dostarcza akceptowalną pracę za 1. razem | QA + akceptacja firmy | % deliverables zaakceptowanych bez >1 poprawki | ≥70% | Jakość = problem → twardsza kuracja + szablony + checklisty |
| H6 | Zaufanie | Escrow + dwie umowy + opinie wystarczą, by firma kupiła od „studenta" | Obiekcje w rozmowach sprzedażowych | % obiekcji o zaufanie | <40% | Dodaj gwarancję satysfakcji / pieczę zespołu |
| H7 | Operacje | Zespół obsłuży 1 zlecenie e2e < 90 min pracy ręcznej | Pomiar czasu na concierge | min/zlecenie | <90 min | Za drogie operacyjnie → uprość zakres lub zautomatyzuj 1 krok |
| H8 | Płynność | Dasz radę zmatchować popyt z podażą w <24h | Czas od briefu do przypisania | mediana godzin | <24h | Brak płynności → kuruj podaż „na zapas" pod top-3 pakiety |
| H9 | Retencja | ≥1 firma zamawia ponownie w 3 tyg. | Tracking powtórnych zamówień | liczba repeat | ≥1 (cel ≥2) | Brak repeat → produkt rozwiązuje ból jednorazowo, nie nawykowo |

---

## 8. Strategia pierwszego testu

**Model: concierge → controlled beta → płatny pilot, w jednej niszy (e-commerce).**

1. **Kuracja podaży najpierw (tydzień 1).** Zbuduj pulę 20-30 studentów (copy/design/marketing) z zadaniem próbnym. Bez podaży marketplace jest pusty — zaczynamy od strony, którą kontrolujemy.
2. **Concierge popytu (tydzień 2-3).** 15-20 firm outreach, brief zbierany ręcznie, oferta/pakiet zakładany w apce przez operatora, QA przed wysyłką. Cel: 3-5 realnych dostaw.
3. **Controlled beta na apce (tydzień 4).** 3-5 firm i 8-10 studentów wchodzi w realne flow aplikacji z bliską asystą. Mierzysz drop-offy i UX.
4. **Płatny pilot (tydzień 5-7).** Konwersja na realną płatność (po odblokowaniu live Stripe/DNS). Cel: ≥2 płatne + ≥1 powtórne zamówienie.
5. **3-5 pakietów** (patrz §11), **10-20 firm**, **20-30 studentów**, **direct outreach** (FB/LinkedIn/Allegro), zero płatnego marketingu.

**Procesy, które zostają ręczne na start:** matching, QA jakości, rozwiązywanie sporów/zwrotów, zbieranie briefu od „trudnych" firm, ustawianie pakietów pod konkretną firmę. **Co testujemy bez pisania kodu:** popyt, WTP, klarowność pakietu, jakość studentów, obiekcje zaufania.

---

## 9. Testy z firmami

**Cel ilościowy:** 60 kontaktów → 15-20 rozmów discovery → 5-8 firm w teście → ≥2 płatne piloty.

**Kanały outreachu:** grupy FB e-commerce, LinkedIn (founder/owner + e-commerce, 1-15 os.), bezpośredni DM do sklepów z widocznymi brakami opisów/grafik, polecenia od pierwszych zadowolonych firm.

**Szablon wiadomości (zimny, LinkedIn/FB DM):**
> Cześć [Imię], prowadzisz [sklep/markę] — widzę, że dochodzą nowe produkty. Pomagamy sklepom dowieźć obrobione zdjęcia i grafiki produktów ręką wyselekcjonowanych studentów, z płatnością dopiero po akceptacji efektu (środki zablokowane w escrow). Obrobimy Ci **5 zdjęć testowo za darmo** w 48h — jak wejdą, dorobimy resztę. Wrzucisz mi 5 zdjęć produktów?

**Szablon (e-mail, do sklepów):** Temat: „Obróbka 5 zdjęć produktów testowo w 48h (za darmo)" — ta sama treść, CTA: 15-min rozmowa lub przesłanie zdjęć.

**Pytania wywiadu discovery (nie sprzedawaj — słuchaj):**
1. Ile produktów dodajesz miesięcznie? Kto robi opisy i grafiki teraz?
2. Co Cię najbardziej blokuje przy publikacji nowego produktu?
3. Ile czasu/pieniędzy idzie na opisy i grafiki miesięcznie?
4. Próbowałeś freelancerów/agencji? Co poszło nie tak?
5. Gdybyś mógł oddać to komuś jutro — co musiałoby być prawdą, żebyś zaufał?
6. Ile zapłaciłbyś za 30 obrobionych zdjęć + 10 grafik produktowych w 5 dni?

**Skrypt sprzedaży płatnego pilota:** patrz §18.3.

**Obsługa obiekcji:**
- „Studenci = ryzyko" → „Płacisz po akceptacji, środki w escrow; pierwsza próbka gratis; my robimy QA przed wysyłką."
- „Nie mam czasu" → „Brief robimy za Ciebie w 10 min rozmowy."
- „Mam już freelancera" → „Zostaw, daj nam nadwyżkę / to czego freelancer nie wyrabia."
- „Za drogo" → przelicz na koszt godziny własnej; zaproponuj mniejszy pakiet startowy.

**Kryteria sukcesu (firmy):** ≥60% rozmów potwierdza ból (H1); ≥30% akceptuje cenę (H2); ≥2 płatne piloty; ≥1 powtórne zamówienie (H9).

---

## 10. Testy ze studentami

**Cel ilościowy:** 40-60 zgłoszeń → 20-30 po zadaniu próbnym → 10-15 aktywnych w pilotażu.

**Wymagania profilu (na start, wąsko, wg pierwszej fali pakietów):** grafika/foto (retusz, Photoshop/Lightroom/Figma/Canva), montaż wideo (CapCut/Premiere), QA (informatyka). Język polski C1+. Dostępność 5-10h/tydz. Możliwość wystawienia rachunku (umowa o dzieło przez platformę — `JEST W KODZIE`).

**Onboarding:** rejestracja (rola=student) → profil (kierunek, kompetencje, bio) → **dodanie 2-3 próbek do portfolio** (uwaga: pole portfolio z próbkami to `CZĘŚCIOWO` — na start zbieraj próbki ręcznie/linkiem) → **zadanie próbne** → **onboarding Stripe Connect** (warunek wypłaty — przeprowadź od razu, by nie blokować pierwszej wypłaty).

**Weryfikacja jakości (zadanie próbne, ~60-90 min):**
- Foto/retusz: obrób 3 zdjęcia produktowe (tło, kolor, kadr) wg wytycznych. Oceniasz: jednolitość tła, wierność koloru, spójność kadru.
- Grafik: 2 grafiki produktowe wg szablonu. Oceniasz: spójność, jakość, zgodność z wytycznymi.
Próg: ocena ≥4/5 wg checklisty (patrz §11).

**Zasady uczestnictwa:** termin = święty (deadline w 72h); komunikacja przez czat platformy; brak kontaktu poza platformą w trakcie pilota; 1 darmowa poprawka w zakresie; stawka znana z góry; wypłata po akceptacji firmy.

**Przykładowe zadania pilotażowe:** obróbka 15 zdjęć produktowych; zestaw 10 grafik; montaż 4 rolek; wgranie 20 listingów; prezentacja 8 slajdów.

**Kryteria sukcesu (studenci):** ≥20 zdaje próbę (H4); ≥70% deliverables akceptowane bez >1 poprawki (H5); mediana czasu reakcji na czacie <12h; <20% rezygnacji w trakcie zlecenia.

---

## 11. Testy pakietów

> **KOREKTA (2026-06-06):** wcześniejsza wersja proponowała „opisy produktów SEO" — to BŁĄD. SEO copywriting to osobny fach, którego student kierunkowy (marketing/grafika/IT) nie zdobywa na studiach; sprzedaż tego jako „studenckie" = utrata zaufania. Pakiety poniżej są przypisane do realnych kompetencji studenckich (pole „Wykonawca" = kierunek + rok), zwalidowane cenowo na polskim rynku (research czerwiec 2026) i ułożone wg logiki **pakiet wejściowy → klient widzi efekt → wystawia własne mikrozlecenie**. Pełne szablony: `Pakiety Usług/_GOTOWE_SZABLONY_LAUNCH_SET.md`; walidacja cen + nowe pakiety: `Pakiety Usług/_ANALIZA_00_WALIDACJA_CEN_I_NOWE_PAKIETY.md`.

**Strategia pakietów:** gotowy pakiet to najbardziej ustandaryzowany, niskoryzykowny element pracy — **brama wejścia firmy do ekosystemu**. Cel: firma kupuje pakiet, widzi że działa, a potem sama wystawia mikrozlecenie na „resztę roboty, której nie ma kto zrobić". Mapują się na istniejący mechanizm system-services (`/app/admin/system-services/new`). Prowizja 25%.

### 10 pakietów wejściowych (wg klastrów kompetencji studenta)

| # | Pakiet | Wykonawca (kierunek) | Cena entry | Czas | Brama → mikrozlecenie |
|---|---|---|---|---|---|
| 1 | Pakiet grafik social media | grafika/komunikacja wizualna | od 399 zł | 5–12 dni | prowadzenie SM, baner kampanijny |
| 2 | Prezentacja firmowa PPT | zarządzanie/marketing | od 299 zł | 5–10 dni | wersja EN, animacja, kolejne decki |
| 3 | Montaż krótkich wideo (Reels) | film/media | od 399 zł | 3–7 dni | stały strumień rolek, film firmowy |
| 4 | Logo + mini-księga znaku | grafika/wzornictwo | 699 zł | 10 dni | wizytówki, szablony SM, identyfikacja |
| 5 | Testy manualne QA | informatyka | od 599 zł | 5–15 dni | **naprawa znalezionych bugów (dev)** |
| 6 | Content plan SM | marketing/komunikacja | od 449 zł | 5–12 dni | prowadzenie SM, paczka grafik |
| 7 | Makiety UX/UI (Figma) | UX/informatyka | od 799 zł | 10–21 dni | **zakodowanie projektu (dev)** |
| 8 | Katalog / folder DTP | grafika/DTP | od 699 zł | 7–18 dni | kolejne materiały, wersja cyfrowa |
| 9 | Dokumentacja techniczna | informatyka/tech writing | od 699 zł | 7–18 dni | kolejne moduły, tłumaczenie EN |
| 10 | Rysunek CAD / digitalizacja | politechnika (mech./bud.) | od 549 zł | 7 dni | model 3D, dokumentacja serii |

**Dla każdego pakietu (wspólny standard testu):**
- **Test ceny:** 3 warianty (S/M/L) na różnych firmach — szukasz progu, gdzie „tak" nie boli; ceny komunikuj od razu w docelowej wysokości (z prowizją), nawet gdy rozliczasz poza apką (faza 1).
- **Checklist jakości:** wg sekcji wewnętrznej każdego szablonu (QA przed wysyłką do firmy).
- **Metryka:** % akceptacji ceny + % dostaw bez >1 poprawki (H2, H5).
- **Ryzyko bazowe:** branżowa specyfika → mitygacja briefem + 1 próbką.

### Pierwsza fala (uruchom 4–5, nie 10) — najniższy friction, najłatwiejszy QA
1. **Pakiet grafik social media** (#1) — najszerszy popyt, łatwe QA.
2. **Prezentacja firmowa** (#2) — najtańszy próg pierwszego zakupu.
3. **Montaż wideo / Reels** (#3) — szybki, wysoki popyt.
4. **Testy manualne QA** (#5) — najlepszy student-fit IT + najsilniejsza brama do pracy dev.
5. (opcjonalnie) **Makiety UX/UI** (#7) — druga brama do pracy dev.

### 6 pakietów dodanych ode mnie (NOWE — spoza obecnego katalogu)
Spójne ze student-fit, świadomie bez SEO. Pełny opis + ceny w pliku walidacji.
- **Retusz i obróbka zdjęć produktowych** (foto/grafika) — od 299 zł — entry dla e-commerce, błyskawiczne QA.
- **Korekta i redakcja tekstu PL** (filologia polska) — od 199 zł — najniższy próg, zero ryzyka.
- **Setup wizytówki Google / GBP** (marketing/IT) — od 299 zł — entry dla lokalnych MŚP (proceduralne, NIE „local SEO").
- **Ankieta / badanie + raport** (socjologia/psychologia/marketing) — od 449 zł — dla testujących pomysły.
- **Prosta automatyzacja no-code (Make/Zapier)** (informatyka) — od 399 zł — rosnący popyt, brama do IT.
- **Artykuły merytoryczne kierunkowe** (student danego kierunku) — od 399 zł — sprzedajemy wiedzę kierunkową i poprawność, NIE ranking w Google.

### Czego świadomie NIE dawać jako pakiet wejściowy
- **Strona WordPress** (za duża/długa/ryzykowna na pierwszy zakup) → to follow-on po makiecie UX (#7).
- **Migracja hostingu / Infrastruktura IT** → wysokie ryzyko (można położyć żywą stronę), tylko ze sprawdzonymi studentami.
- **Wsparcie IT/HelpDesk** → rozliczenie godzinowe/ciągłe, nie czysty zamknięty deliverable do QA.
- **Prowadzenie SM** → to usługa cykliczna = cel/retencja, do której prowadzą pakiety #1 i #6, nie sam start.

**Mapa pełnej drabinki entry → mikrozlecenie → upsell:** `Pakiety Usług/_MAPA_DRABINKI_ENTRY_MIKROZLECENIE.md`.

---

## 12. Testy zleceń tworzonych przez firmy

Dotyczy ścieżki A (`offers` + `applications`) — gdy firma nie chce pakietu, tylko własny brief.

**Jak firma zgłasza brief:** `/app/company/jobs/new` (`JEST W KODZIE`) — formularz jest **bogaty, ale złożony** (typ, kategoria z ~38 pozycji, stawka, tryb, etapy company/student-defined, typ umowy). Dla pierwszych testów: **firma wypełnia z asystą operatora** (concierge) lub operator zakłada za nią.

**Dane do zebrania w briefie (minimum, by student dowiózł):** cel biznesowy, konkretny deliverable, przykład „dobrego" rezultatu, materiały wejściowe (linki/pliki), deadline, budżet/stawka, kryteria akceptacji.

**Jak walidować zrozumiałość tworzenia briefu:** test „firma wypełnia sama, my obserwujemy i milczymy" — mierzysz: % ukończenia formularza, czas, miejsca utknięcia, liczba pytań. Próg: ≥70% kończy bez pomocy; jeśli niżej → uprość formularz / dodaj presety / skróć liczbę kategorii.

**Jak ręcznie ratować słabe briefy:** operator dzwoni, uzupełnia kryteria akceptacji i przykład, dopina materiały, dopiero potem publikuje/przypisuje. To jest sedno concierge — słaby brief = słaba dostawa = utrata zaufania.

**Co mierzyć:** completion rate briefu, czas wypełniania, % briefów wymagających ratunku, jakość dostawy z briefu vs z pakietu (hipoteza: pakiety dadzą wyższą jakość i niższy koszt operacyjny → potwierdzenie, że na start lepiej pchać pakiety).

---

## 13. Harmonogram 6-8 tygodni

Założenia: mały zespół (np. founder + 1-2 operatorów), mały budżet, dostęp do studentów, ręczne dopinanie procesu. Role: **PO** = founder/product, **OPS** = operator concierge/QA, **SALES** = sprzedaż/outreach (mogą się pokrywać).

### Tydzień 1 — Fundament i kuracja podaży
- **Cel:** gotowa pula studentów + 3 pakiety + CRM + odblokowana infra do test-mode.
- **Produkt:** utworzyć 4–5 pakietów pierwszej fali (§11) w `/app/admin/system-services/new`; spiąć Resend (klucz); zweryfikować happy-path na preview; **napisać SOP ręcznej reklamacji** (bo `Zgłoś problem` nie działa); zdecydować, czy ukryć martwy przycisk.
- **Biznes:** ustalić widełki cen (3 poziomy/pakiet); spisać ICP e-commerce.
- **Sprzedaż:** zbudować listę 60 firm; przygotować szablony (§9, §18).
- **Operacje:** rekrutacja studentów (40-60 zgłoszeń), zadanie próbne, kuracja do 20-30.
- **Badania:** 5 wywiadów discovery (H1).
- **Owner:** PO (produkt), OPS (studenci), SALES (lista).
- **Output:** 20+ studentów po próbie, 3 pakiety live na preview, CRM z 60 firmami.
- **KPI:** ≥20 studentów zdanych; ≥3 pakiety; ≥5 wywiadów.
- **Decyzja EOW:** czy podaż wystarczająca, by ruszyć z popytem? (jeśli <10 studentów → przedłuż kurację).

### Tydzień 2 — Concierge popytu (pierwszy kontakt)
- **Cel:** uruchomić outreach i zebrać pierwsze realne briefy.
- **Produkt:** szablony briefu, checklisty QA per pakiet.
- **Sprzedaż:** 60 wiadomości wysłanych, 10-15 rozmów discovery, oferta „3 opisy gratis".
- **Operacje:** dobór studentów do pierwszych 3 firm, zebranie briefów.
- **Badania:** dokończyć 15-20 wywiadów (H1, H6).
- **Output:** 3-5 firm z zaakceptowanym briefem testowym.
- **KPI:** ≥15 rozmów; ≥60% potwierdza ból; ≥3 darmowe próbki w toku.
- **Decyzja EOW:** segment/pakiet trafiony? (jeśli <40% potwierdza ból → zmień use-case, potem segment).

### Tydzień 3 — Pierwsze dostawy concierge
- **Cel:** dowieźć 3-5 realnych darmowych próbek na czas i w jakości.
- **Produkt:** dopracować checklisty na bazie pierwszych dostaw.
- **Sprzedaż:** prezentacja efektu firmom + miękkie domknięcie na płatny pakiet.
- **Operacje:** QA każdej dostawy przed wysyłką; pomiar czasu pracy ręcznej (H7).
- **Badania:** ankieta po próbce (§19).
- **Output:** 3-5 dostarczonych próbek; ≥2 firmy deklarują chęć płatnego zamówienia.
- **KPI:** ≥70% dostaw zaakceptowanych bez >1 poprawki (H5); czas ops <90 min/zlecenie (H7).
- **Decyzja EOW:** jakość studentów wystarczająca? (jeśli <50% akceptacji → twardsza kuracja/szablony przed płatnym).

### Tydzień 4 — Controlled beta na aplikacji
- **Cel:** przeprowadzić 3-5 firm i 8-10 studentów przez realne flow w apce (z asystą).
- **Produkt:** odblokować live Stripe / DNS / webhook (jeśli płatność tego tygodnia) lub zostać w test-mode; monitor drop-offów.
- **Sprzedaż:** onboarding firm do apki; ustawienie pakietów/zleceń.
- **Operacje:** wsparcie 1:1 przy rejestracji, akceptacji umów, escrow, dostawie, recenzji; Stripe Connect dla studentów.
- **Badania:** mierzyć completion rate każdego kroku.
- **Output:** ≥3 zlecenia przeprowadzone e2e w apce.
- **KPI:** completion rejestracji/briefu/aplikacji ≥70%; <2 błędy techniczne blokujące; czas brief→przypisanie <24h (H8).
- **Decyzja EOW:** apka nie gubi ludzi? (jeśli duży drop-off na kroku → napraw ten 1 krok przed płatnym).

### Tydzień 5 — Płatny pilot
- **Cel:** ≥2 realne płatności przez escrow.
- **Produkt:** live Stripe potwierdzony (test transakcji groszowej); ścieżka faktury/rachunku zweryfikowana.
- **Sprzedaż:** skrypt płatnego pilota (§18.3); domknięcie na płatność.
- **Operacje:** pełny cykl płatny e2e + pierwsza ewentualna reklamacja wg SOP.
- **Badania:** ankieta po płatnym zleceniu (§19).
- **Output:** ≥2 płatne zlecenia zrealizowane i wypłacone studentom.
- **KPI:** ≥30% firm z testu płaci (H2); 100% wypłat dotarło lub poprawnie wstrzymane z komunikatem.
- **Decyzja EOW:** ludzie płacą realnie? (jeśli 0 płatności mimo „tak" w rozmowach → problem WTP/zaufania, nie produktu).

### Tydzień 6 — Powtórne zamówienia + segment zapasowy
- **Cel:** udowodnić recurring i sprawdzić agencje.
- **Produkt:** drobne usprawnienia z feedbacku (tylko blokery).
- **Sprzedaż:** poproś zadowolone firmy o powtórne zamówienie + polecenie; 10 kontaktów do agencji.
- **Operacje:** obsługa powtórnych zleceń (mniej asysty = test skalowania).
- **Output:** ≥1 powtórne zamówienie (cel ≥2) + 2 rozmowy z agencjami.
- **KPI:** ≥1 repeat (H9); NPS/„poleciłbym" ≥7/10.
- **Decyzja EOW:** jest pull? → przejdź do skalowania niszy; brak pull → pivot segmentu/modelu.

### Tydzień 7-8 (opcjonalne) — Konsolidacja i decyzja go/no-go
- **Cel:** ustabilizować to, co działa; podjąć decyzję strategiczną (§23).
- **Zadania:** dopracuj 1 najlepszy pakiet i 1 cenę; zautomatyzuj najdroższy krok ręczny; udokumentuj playbook; przygotuj dane do decyzji.
- **Output:** decyzja go/no-go + plan kolejnej rundy.
- **KPI zbiorcze 8 tyg.:** ≥3 dostawy, ≥2 płatne, ≥1 repeat, ≥20 studentów, koszt ops/zlecenie maleje.

### Tabela skrócona

| Tydz. | Cel | Główny KPI | Decyzja EOW |
|---|---|---|---|
| 1 | Podaż + pakiety + CRM | ≥20 studentów, 3 pakiety | Podaż wystarczy? |
| 2 | Outreach + briefy | ≥15 rozmów, ≥60% ból | Segment trafiony? |
| 3 | Dostawy concierge | ≥70% akceptacji, ops<90min | Jakość OK? |
| 4 | Beta na apce | completion ≥70% | Apka nie gubi? |
| 5 | Płatny pilot | ≥2 płatności, ≥30% WTP | Płacą realnie? |
| 6 | Repeat + agencje | ≥1 repeat | Jest pull? |
| 7-8 | Konsolidacja + decyzja | ≥3/≥2/≥1 zbiorczo | Go / pivot / stop |

---

## 14. KPI i metryki

### Strona firm
| Metryka | Pomiar | Sukces | Ostrzeżenie |
|---|---|---|---|
| Rozmowy discovery | CRM | ≥15 | <8 |
| % potwierdzających ból | ankieta/notatki | ≥60% | <40% |
| Firmy z kontem | DB `company_profiles` | ≥5 | <3 |
| Firmy z briefem/zamówieniem | DB `offers`/`service_orders` | ≥5 | <3 |
| Firmy płacące | DB `payments`/contracts completed | ≥2 | 0 |
| Powtórne zamówienia | CRM/DB | ≥1 | 0 |
| Powody odmowy | tagowane w CRM | skatalogowane top-3 | brak danych |

### Strona studentów
| Metryka | Pomiar | Sukces | Ostrzeżenie |
|---|---|---|---|
| Zarejestrowani | DB `student_profiles` | ≥30 | <15 |
| Kompletne profile + próbki | manualnie/DB | ≥20 | <10 |
| Aplikacje/przypisania | DB `applications` | ≥15 | <8 |
| Czas reakcji na czacie | timestampy `messages` | mediana <12h | >24h |
| Jakość (akceptacja bez >1 poprawki) | QA | ≥70% | <50% |
| Rezygnacje w trakcie | CRM | <20% | >35% |

### Produkt
| Metryka | Pomiar | Sukces | Ostrzeżenie |
|---|---|---|---|
| Completion rejestracji | analytics/lejek | ≥70% | <50% |
| Completion briefu/zamówienia | lejek | ≥70% | <50% |
| Completion aplikowania | lejek | ≥70% | <50% |
| Błędy techniczne blokujące | Sentry | 0 krytycznych | ≥1 krytyczny |
| Czas brief→przypisanie | DB | <24h | >48h |
| Czas zlecenie→wybór studenta | DB | <48h | >5 dni |
| Liczba ręcznych interwencji/zlecenie | log ops | maleje tydz./tydz. | rośnie |

### Biznes
| Metryka | Pomiar | Sukces | Ostrzeżenie |
|---|---|---|---|
| Pierwszy przychód (GMV) | DB payments | >0 do tyg.5 | 0 |
| WTP (% akceptacji ceny) | sprzedaż | ≥30% | <15% |
| Śr. wartość zlecenia | DB | ≥ próg pakietu | poniżej kosztu ops |
| Koszt pozyskania rozmowy | czas/wydatki | malejący | rosnący |
| Koszt pozyskania zlecenia | czas/wydatki | < marża prowizji | > marża |
| Marża prowizji | 10/15/20% wg typu | zgodna z modelem | erozja przez rabaty |
| Powtarzalność | repeat/total | ≥20% | 0 |

### Operacje
| Metryka | Pomiar | Sukces | Ostrzeżenie |
|---|---|---|---|
| Czas ops na zlecenie | stoper | <90 min, malejący | >2h |
| % briefów wymagających ratunku | log | <30% | >60% |
| Czas QA/dostawę | stoper | <30 min | >1h |
| Reklamacje obsłużone w SLA | SOP | 100% w 48h | przeterminowane |

---

## 15. Analiza SWOT

### Strengths (mocne strony)
- **Produkt na poziomie wczesnej produkcji** — escrow, dwie umowy PDF, faktury/rachunki/PIT, payouty Connect, ledger, prowizja zmienna, panel admina — to realny moat wykonawczy względem „pomysłu na pitchu" (`JEST W KODZIE`, E2E 26/26).
- **Bezpieczeństwo i zgodność** — RLS na wszystkich tabelach, RPC SECURITY DEFINER, server-authoritative checkout, podpisany+kolejkowany+idempotentny webhook, dostęp do dokumentów per-strona, Turnstile, rate limiting.
- **Polski kontekst formalny** — CEIDG/GUS, PIT, rachunek/faktura, dwie umowy — rozwiązuje realny ból „jak rozliczyć studenta legalnie".
- **Dwa modele zamówień** — pakiety (niski friction) + custom briefy (elastyczność) na jednym rdzeniu kontraktu.
- **Escrow buduje zaufanie** — kluczowe przy sprzedaży „pracy studenta".

### Weaknesses (słabości)
- **Zero walidacji rynku** — brak dowodu popytu, WTP i jakości; produkt przerośnięty względem trakcji.
- **Pusty marketplace** — brak podaży i popytu jednocześnie.
- **Brak działającego self-service sporu/zwrotu** — `Zgłoś problem` to martwy przycisk; disputes tylko admin read-only (`CZĘŚCIOWO`). Ryzyko przy płatności.
- **Profil studenta bez realnego portfolio/próbek** (`CZĘŚCIOWO`) — utrudnia zaufanie i selekcję.
- **Rozjechana taksonomia** (landing 3 filary vs 12 vs ~38 kategorii) — niespójne pozycjonowanie i UX.
- **Zależność od jakości studentów** — całe USP stoi na ludziach, których trzeba kurować ręcznie.
- **Operacje ręczne** — matching/QA/spory nie skalują się bez ludzi.

### Opportunities (szanse)
- **Nisza e-commerce** — ciągły, powtarzalny popyt na opisy/grafiki/listingi.
- **Współpraca z uczelniami / kołami naukowymi** — tani, kuratorowany pipeline podaży i wiarygodność.
- **B2B outsourcing/staffing** — agencje i software house'y jako stały odbiorca (white-label).
- **Legalne rozliczanie studentów** jako wyróżnik vs szara strefa zleceń studenckich.
- **Recurring/subskrypcja** — „X opisów miesięcznie" dla sklepów.

### Threats (zagrożenia)
- **Useme / Fiverr / Upwork / Freelancer.pl** — istniejące marketplace z płynnością i zaufaniem; przewaga musi być w niszy/kuracji, nie w byciu „kolejnym Useme".
- **Agencje i freelancerzy** — bezpośrednia konkurencja cenowa/jakościowa.
- **Brak zaufania do „studenta"** — psychologiczna bariera zakupowa.
- **Ryzyko prawne** — odpowiedzialność za jakość/terminy, ochrona danych firm (dostęp do paneli sklepu), poprawność umów/PIT (`[DO WERYFIKACJI przez prawnika]`).
- **Ryzyko płatności/chargebacków** przy braku self-service sporu.
- **Sezonowość studentów** (sesje, wakacje) destabilizuje podaż.

---

## 16. Ryzyka i mitigacje

| Ryzyko | Prawdopod. | Wpływ | Mitigacja | Wczesny sygnał |
|---|---|---|---|---|
| Jakość studentów | Wysokie | Wysoki | Zadanie próbne + kuracja + szablony + QA przed wysyłką + 1 darmowa poprawka | <50% akceptacji bez poprawki |
| Brak zaufania firm | Wysokie | Wysoki | Escrow, darmowa próbka, opinie, piecza zespołu, gwarancja satysfakcji | >40% obiekcji o zaufanie |
| Prawne/formalne (umowy, RODO, dostęp do paneli) | Średnie | Wysoki | Audyt regulaminu/PIT przez prawnika przed płatnym; NDA; konta operatora o ograniczonych prawach | uwagi prawnika / incydent danych |
| Płatności / brak self-service sporu | Średnie | Wysoki | SOP ręcznej reklamacji + ręczny zwrot; ukryć martwy przycisk; escrow trzyma środki | pierwszy spór bez ścieżki |
| Opóźnienia dostaw | Średnie | Średni | Twarde deadline 72h, bufor studentów, monitoring czasu reakcji | reakcja >24h, ślizg terminu |
| Pusty marketplace | Wysokie | Wysoki | Najpierw kuracja podaży, potem popyt; concierge matching | brak dostępnych studentów do briefu |
| Zbyt szerokie pozycjonowanie | Wysokie | Średni | 1 nisza (e-commerce), 3 pakiety, ujednolicić taksonomię w komunikacji | „dla każdego" w rozmowach |
| Zły segment | Średnie | Wysoki | Scoring + tygodniowe decyzje go/pivot | <40% potwierdza ból |
| Overbuilding | **Wysokie** | Wysoki | **Zamrozić nowe funkcje; tylko blokery testu** | nowy PR z feature zamiast sprzedaży |
| Niska WTP | Średnie | Wysoki | Test 3 poziomów ceny; sprzedaż wartości nie ceny; większy pakiet zamiast niższej ceny | „tak, ale nie zapłacę" |
| Przeciążenie ops ręcznych | Średnie | Średni | Limit liczby równoległych zleceń; mierzyć min/zlecenie; automatyzować 1 krok | ops >2h/zlecenie, rosnący |

---

## 17. Checklist przed startem testów

**Gotowość produktu**
- [ ] Happy-path zweryfikowany na preview (rejestracja→oferta/pakiet→aplikacja→umowa→escrow→dostawa→recenzja→payout).
- [ ] 4–5 pakietów pierwszej fali (§11) utworzonych w `/app/admin/system-services/new` z poprawnymi cenami/prowizją.
- [ ] Klucz Resend podpięty (e-maile transakcyjne działają).
- [ ] Martwy przycisk „Zgłoś problem" ukryty LUB podmieniony na link do ręcznego kanału (e-mail/WhatsApp ops).
- [ ] (Dla płatnego) live Stripe `sk_live_`/`pk_live_`, webhook produkcyjny, DNS `student2work.pl` (A→`76.76.21.21`), Upstash, Sentry DSN.

**Gotowość puli studentów**
- [ ] ≥20 studentów po zadaniu próbnym (copy/grafika/ops).
- [ ] Każdy z 2-3 próbkami w portfolio (zbierane ręcznie, bo pole `CZĘŚCIOWO`).
- [ ] Stripe Connect onboarding zainicjowany (by nie blokować 1. wypłaty).
- [ ] Zasady uczestnictwa zaakceptowane (deadline 72h, komunikacja w apce).

**Gotowość outreachu do firm**
- [ ] Lista 60 firm e-commerce w CRM.
- [ ] Szablony wiadomości + skrypt rozmowy gotowe.
- [ ] Oferta „3 opisy gratis" zdefiniowana.

**Gotowość prawno-formalna**
- [ ] Regulamin i polityka prywatności przejrzane przez prawnika (przed płatnym).
- [ ] Wzór NDA dla zadań z dostępem do danych/paneli.
- [ ] Potwierdzona poprawność modelu PIT/rachunku z księgową.

**Gotowość trackingu**
- [ ] CRM testów (§20) gotowy z kolumnami.
- [ ] Zdefiniowane progi KPI i kto je raportuje.
- [ ] Dostęp do Sentry + podgląd DB/admina do metryk.

**Gotowość procesu wsparcia**
- [ ] SOP reklamacji/zwrotu spisany (krok po kroku, kto decyduje, w jakim SLA).
- [ ] Kanał wsparcia 1:1 (e-mail/WhatsApp) dla firm i studentów w pilocie.
- [ ] Operator przypisany do QA każdej dostawy.

---

## 18. Scenariusze rozmów

### 18.1 Wywiad z firmą (discovery, 15 min — słuchaj, nie sprzedawaj)
1. „Opowiedz, jak dziś powstają opisy i grafiki Twoich produktów?"
2. „Ile produktów dochodzi miesięcznie? Co się dzieje, gdy nie nadążasz?"
3. „Ile to kosztuje (czas/pieniądze)? Kto to robi?"
4. „Próbowałeś freelancerów/agencji? Co zawiodło?"
5. „Co musiałoby być prawdą, żebyś oddał to studentowi z platformy?"
6. „Gdybym dał Ci 30 obrobionych zdjęć + 10 grafik produktowych w 5 dni, ile to dla Ciebie warte?"
> Cel: potwierdzić H1/H6, wyłapać język klienta i realny budżet. Nie obiecuj funkcji.

### 18.2 Wywiad ze studentem (rekrutacja/jakość, 15 min)
1. „Pokaż 2 najlepsze prace (opisy/grafiki). Co w nich dobrego?"
2. „Ile godzin tygodniowo realnie masz? Jak reagujesz na deadline 72h?"
3. „Jak pracujesz z briefem — co robisz, gdy jest niejasny?"
4. „Czy możesz wystawić rachunek (umowa o dzieło przez platformę)?"
5. „Zadanie próbne: 2 opisy dla tego produktu do jutra — wchodzisz?"
> Cel: potwierdzić H4/H5, odsiać niedostępnych i niesamodzielnych.

### 18.3 Skrypt sprzedaży płatnego pilota
- **Hak:** „Zrobiliśmy Ci 3 opisy testowe — jak wypadły?"
- **Wartość:** „Pełny pakiet to np. 30 obrobionych zdjęć / 10 grafik / 4 rolki w 5 dni. Płacisz dopiero, gdy zaakceptujesz efekt — środki blokujemy w escrow, student dostaje wypłatę po Twojej akceptacji."
- **Cena (kotwiczenie):** „Pakiet kosztuje [X]. Dla pierwszych firm pilotażowych [X z rabatem / ten sam X + bonus]."
- **Domknięcie:** „Startujemy z 10 produktami w ten czwartek czy w poniedziałek?"
- **Redukcja ryzyka:** „Jak cokolwiek nie zagra — poprawiamy w zakresie lub zwracamy. Masz to na piśmie w umowie."

### 18.4 Follow-up (po ciszy, 2-3 dni)
> „Cześć [Imię], zostawiam decyzję Tobie — mam wolny slot studenta na [dzień] i mogę przypiąć Twoje 10 produktów. Rezerwuję czy odpuszczamy na teraz?"

---

## 19. Ankiety po testach (krótkie, 3-5 pytań)

**Po wywiadzie z firmą**
1. Jak duży jest dla Ciebie ten ból (1-10)?
2. Co musiałoby się zmienić, żebyś kupił?
3. Ile zapłaciłbyś za [pakiet]?
4. Czy chcesz darmową próbkę? (tak/nie)

**Po użyciu platformy przez firmę**
1. Jak oceniasz efekt (1-10)?
2. Co było najtrudniejsze w procesie?
3. Zamówisz ponownie? (tak/nie/może — dlaczego)
4. Poleciłbyś znajomemu (0-10, NPS)?
5. Jedna rzecz, którą mamy poprawić?

**Po aplikacji studenta**
1. Czy oferta/brief był jasny (1-10)?
2. Co Cię zniechęciło/zachęciło do aplikacji?
3. Czy proces w apce był zrozumiały? Gdzie utknąłeś?

**Po ukończeniu pracy przez studenta**
1. Czy stawka była adekwatna (1-10)?
2. Czy brief wystarczał do dobrej realizacji?
3. Wejdziesz w kolejne zlecenie? (tak/nie)
4. Co poprawić w procesie?

**Po porażce / drop-off (firma lub student)**
1. Co było głównym powodem rezygnacji?
2. Co musiałoby być inne, żebyś dokończył?
3. Czy wrócisz, gdy to naprawimy? (tak/nie)

---

## 20. Minimalny CRM testów

Jeden arkusz, 4 zakładki. Kolumny:

**Firmy:** nazwa · osoba · kanał · segment · status (lead/rozmowa/próbka/płatny/repeat/odpadł) · ból (1-10) · WTP (kwota) · obiekcje (tag) · pakiet · wynik · następna akcja · data follow-up.

**Studenci:** imię · kompetencja · próba (zdał/nie) · ocena próby (1-5) · dostępność h/tydz · Stripe Connect (ready?) · liczba zleceń · jakość (% akceptacji) · czas reakcji · status (aktywny/rezerwa/odpadł) · notatki.

**Pakiety:** nazwa · persona · cena testowa (poziom) · liczba ofert · liczba sprzedaży · % akceptacji ceny · % dostaw bez poprawki · śr. czas dostawy · marża · wniosek.

**Zlecenia:** id · firma · student · pakiet/brief · wartość · status (brief/przypisane/w toku/dostarczone/zaakceptowane/płatne/reklamacja) · czas brief→przypisanie · czas ops (min) · wynik QA · reklamacja (tak/nie) · powtórka (tak/nie).

---

## 21. Rekomendacje produktowe

**Naprawić przed testem (blokery zaufania/operacji):**
- Ukryć lub przekierować martwy przycisk **„Zgłoś problem"** (`ChatSidebar.tsx:157`) na realny kanał wsparcia — inaczej firma kliknie i straci zaufanie.
- Spiąć **Resend** (e-maile transakcyjne) — bez tego komunikacja zależy tylko od logowania do apki.
- Utworzyć **4–5 pakietów pierwszej fali** (§11) w system-services z poprawną prowizją.
- Zebrać **próbki do portfolio studentów** ręcznie (pole `CZĘŚCIOWO`) — krytyczne dla selekcji i sprzedaży.

**Zbudować później (po sygnale z testów):**
- Działający **self-service spór + zwrot** (user-initiated dispute → flow w apce, nie tylko admin read-only).
- **Portfolio/próbki** studenta jako pełna funkcja + ranking jakości.
- **Narzędzie matchingu** w panelu admina (dziś ręcznie).
- **Subskrypcja** „X opisów/miesiąc" dla recurring e-commerce.

**Czego NIE budować teraz:**
- Nowe kategorie/segmenty produktowo (prawne, tech-pod-inwestora) — przed walidacją niszy.
- Publiczna, samoobsługowa giełda gigów studenckich (`service_packages`) — generuje chaos podaży.
- Automatyzacja matchingu/QA — najpierw zrozum proces ręcznie.
- Ujednolicenie taksonomii w całej apce — na start wystarczy spójny komunikat w 1 niszy.

**Co obsłużyć ręcznie (concierge):**
- Matching popyt↔podaż, QA dostaw, zbieranie/ratowanie briefów, spory i zwroty, ustawianie pakietów pod konkretną firmę.

---

## 22. Rekomendacje biznesowe

- **Pozycjonowanie:** nie „kolejny Useme", tylko **„kuratorowani studenci dowożą opisy i grafiki produktów e-commerce — płacisz po akceptacji"**. Wąsko, konkretnie, z dowodem (escrow + opinie + próbka).
- **Pierwsza nisza / klin:** pakiety wejściowe (entry-package wedge). Główny target outreachu: e-commerce (retusz zdjęć + grafiki + listingi), bez SEO; równolegle te same pakiety do lokalnych MŚP, founderów i zespołów IT (§11).
- **Test cen:** 3 poziomy na pakiet, sprzedawać wartość (czas/sprzedaż), nie najniższą cenę; przy oporze — większy pakiet, nie niższa stawka.
- **Weryfikacja studentów:** zadanie próbne obowiązkowe + 2-3 próbki + ocena ≥4/5; sezonowość buforuj nadmiarem puli.
- **Onboarding firm:** maksymalnie concierge na start — brief za firmę, próbka gratis, ręczne domknięcie.
- **Komunikacja:** jeden kanał wsparcia 1:1 w pilocie (szybka reakcja > funkcje).
- **Mechanizmy zaufania:** escrow (jest), darmowa próbka, gwarancja satysfakcji/poprawki, widoczne opinie, „piecza zespołu nad jakością".

---

## 23. Decyzje go/no-go

Macierz decyzyjna na koniec 6-8 tygodni (czytaj wiersz po wierszu):

| Sytuacja po testach | Decyzja |
|---|---|
| ≥2 płatne + ≥1 repeat + jakość ≥70% + ops maleje | **GO — kontynuuj bez zmian**, skaluj niszę e-commerce, zacznij automatyzować najdroższy krok ręczny |
| Popyt OK, ale e-commerce słabo płaci / niska powtarzalność | **Pivot segmentu** → agencje/studia (zapasowy), te same pakiety |
| Firmy chcą, ale nie kupują pakietów (wolą własny brief) | **Pivot pakietu** → uprość/zmień zakres i nazwy; przesuń nacisk na ścieżkę custom z asystą |
| Działa tylko z ciężką ręczną asystą, apka mało używana | **Pivot na concierge-as-a-service** (usługa, nie marketplace) — sprzedawaj efekt, nie platformę |
| Jasny ból, „tak" w rozmowach, ale 0 realnych płatności | **Stop budowania, waliduj sprzedaż** — problem to WTP/zaufanie; nie dotykać kodu |
| <40% potwierdza ból, brak trakcji w obu segmentach | **Stop testu w tej formie** — wróć do problem-discovery / inna nisza |
| Jakość studentów <50% mimo kuracji | **Zawęź produkt** do 1 kategorii, w której jakość jest powtarzalna (np. tylko opisy) |

---

## 24. Następne kroki (najbliższe 7 dni)

1. **(PO, dziś)** Zamrozić rozwój nowych funkcji. Ukryć/przekierować martwy przycisk „Zgłoś problem"; spiąć klucz Resend; zweryfikować happy-path na preview.
2. **(PO/OPS, dzień 1-2)** Utworzyć 4–5 pakietów pierwszej fali (§11) w `/app/admin/system-services/new` z cenami (3 poziomy) i prowizją; spisać checklisty QA.
3. **(SALES, dzień 1-3)** Zbudować listę 60 firm e-commerce + CRM (§20); przygotować szablony (§9, §18); wysłać pierwsze 20 wiadomości z ofertą „3 opisy gratis".
4. **(OPS, dzień 1-5)** Rekrutacja studentów (cel 40-60 zgłoszeń), wysłać zadanie próbne, zebrać próbki, zakwalifikować ≥20.
5. **(SALES, dzień 3-7)** Umówić i przeprowadzić ≥5 wywiadów discovery (H1/H6); zacząć zbierać pierwsze briefy.
6. **(PO, dzień 4-6)** Spisać SOP ręcznej reklamacji/zwrotu; ustalić kanał wsparcia 1:1; potwierdzić z księgową/prawnikiem model PIT/rachunku i regulamin.
7. **(PO, dzień 7)** Przegląd KPI tygodnia 1 i decyzja: czy podaż i sygnał popytu pozwalają wejść w tydzień 2 (outreach + dostawy concierge).

---

> **Zasada nadrzędna tego dokumentu:** produkt jest gotowy wystarczająco. Najbliższe 8 tygodni to nie kodowanie — to sprzedaż, kuracja podaży i twarda walidacja, czy ktoś za to zapłaci powtarzalnie. Każda godzina włożona w nowy feature zamiast w rozmowę z firmą jest w tej fazie godziną straconą.
