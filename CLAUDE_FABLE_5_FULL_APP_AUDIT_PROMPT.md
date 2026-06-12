# Prompt dla Claude Fable 5: kompleksowy audyt i naprawa Student2Work

Poniższy blok wklej w całości do Claude Fable 5. Prompt zakłada, że Claude pracuje w repozytorium:

```text
C:\Users\Bartosz i Natalia\Desktop\Student-impact-antygraviti
```

---

## START PROMPT

Jesteś senior full-stack engineerem, product engineerem i audytorem bezpieczeństwa dla aplikacji Student2Work / Student Impact. Pracujesz w repozytorium Next.js/Supabase/Stripe i masz wykonać kompleksowy audyt oraz naprawy, które realnie poprawią działanie aplikacji przed pilotem i późniejszym go-live.

Nie traktuj tego jako zwykłego code review. Masz zweryfikować aplikację jak produkt, przez który mają przejść prawdziwe firmy i studenci: od rejestracji, przez wybór usługi, zlecenie, umowy, płatność testową, realizację, dostarczenie pracy, akceptację, wypłatę i dokumenty. Masz też znaleźć strony, które już nie działają albo nie są częścią aktualnego produktu i powinny zostać usunięte, ukryte z nawigacji albo przekierowane.

### 1. Kontekst biznesowy

Student2Work / Student Impact to polska platforma B2B2C łącząca firmy ze studentami przy zadaniach zleconych.

Model nie może tworzyć bezpośredniej relacji firma-student z pominięciem platformy:

```text
Firma -> płatność / escrow -> Student Impact -> wypłata dla studenta
Student -> wykonuje pracę -> przenosi IP na Student Impact -> Student Impact przenosi IP na firmę
```

Priorytetem jest Quick Task / gotowe pakiety. Marketplace i custom zlecenia mogą istnieć, ale nie mogą psuć ani rozmywać głównej ścieżki pilota.

Kluczowe zasady:

- Firma nie podpisuje bezpośredniej umowy ze studentem.
- Umowa A: Firma <-> Student Impact.
- Umowa B: Student <-> Student Impact.
- Płatności i Stripe secret keys są wyłącznie server-side.
- Kwoty do płatności i wypłat muszą pochodzić z bazy / kontraktu, nigdy z frontendu.
- RLS w Supabase jest obowiązkowe.
- Komunikaty użytkownika są po polsku.
- Stack trace i surowe błędy techniczne nie mogą trafiać do UI.
- Nie ujawniaj sekretów z `.env`, logów ani terminala.

### 2. Stack i ważne ścieżki

Stack:

- Next.js App Router, TypeScript.
- Tailwind + shadcn/ui.
- Supabase Auth, Postgres, Storage, RLS.
- Stripe Checkout / PaymentIntent / Connect Express, zależnie od aktualnej implementacji.
- Vercel, cron endpoints.

Najważniejsze obszary repo:

- `app/app/company/packages/*` - katalog Quick Task po stronie firmy.
- `app/app/orders/create/[packageId]/*` - tworzenie zamówienia pakietu.
- `app/app/services/dashboard/*` - dashboard zleceń usługowych.
- `app/app/company/orders/*` - widoki zleceń firmy.
- `app/app/deliverables/[id]/*` - realizacja, dostawy, dokumenty, statusy.
- `app/app/company/jobs/new/*` - custom zlecenie firmy.
- `app/app/jobs/*` - lista zleceń dla studentów.
- `app/app/offers/[id]/*` - szczegóły oferty i aplikowanie.
- `app/app/company/applications/*` - aplikacje po stronie firmy.
- `app/app/applications/*` - aplikacje po stronie studenta.
- `app/app/chat/*` - komunikacja i problem/dispute.
- `app/app/admin/*` - panel admina.
- `app/api/stripe/*` - Stripe checkout, webhook, verify payment, onboarding.
- `app/api/cron/*` - cron, auto-accept, cleanup, processing Stripe events.
- `app/api/documents/download/route.ts` - pobieranie dokumentów.
- `lib/stripe/*` - logika Stripe, event processing, payouty, Connect readiness.
- `lib/services/*` - logika domenowa usług, zamówień, propozycji, rozmów.
- `lib/pdf/*` - umowy, faktury/rachunki i PDF-y.
- `lib/supabase/*` - klient, server, admin.
- `supabase/migrations/*` - źródło prawdy dla zmian DB.
- `supabase/_archive/*` - archiwum starych/diagnostycznych SQL, nie traktuj jako aktywnego źródła prawdy.
- `scripts/mvp-scenario-suite.mjs` - scenariusze MVP.
- `scripts/production-readiness-check.mjs` - readiness gate.
- `scripts/validate-deploy-env.mjs` - walidacja env przed buildem.

### 3. Pierwsze komendy i zasady ostrożności

Zacznij od rozpoznania bez edycji:

```bash
git status --short
git branch --show-current
npm run lint
npm run build
```

Jeżeli build odpada na brakach env, nie obchodź zabezpieczeń na ślepo. Zidentyfikuj, który guard blokuje build i czy jest to oczekiwane dla lokalnego środowiska.

Zasady pracy:

- Nie rób `git reset --hard`, `git checkout -- .`, `supabase db reset`, masowego kasowania plików ani destrukcyjnych migracji.
- Working tree może zawierać zmiany innego agenta lub właściciela projektu. Nie cofaj ich.
- Przed edycją pliku sprawdź jego aktualny stan.
- Jeżeli usuwasz stronę, usuń albo popraw też wszystkie linki, importy, nawigację i testy/scenariusze, które do niej prowadzą.
- Nie dodawaj dużych nowych funkcji. Naprawiaj blokery, niespójności, bezpieczeństwo, broken routes i customer journey.
- Nie instaluj nowych bibliotek, chyba że istniejący stack naprawdę nie daje rozsądnego rozwiązania.
- Nie używaj `any`. Jeżeli typ jest niejasny, zdefiniuj typ domenowy albo użyj istniejących typów.
- Nie commituj automatycznie, chyba że użytkownik wyraźnie poprosi. Na końcu podaj sugerowane commity.

### 4. Dokumenty, które masz przeczytać na początku

Przeczytaj i wykorzystaj, ale nie traktuj ich bezkrytycznie jako aktualnej prawdy:

```text
CLAUDE_PRODUCTION_E2E_INSTRUCTIONS.md
CODEX_WYTYCZNE_PRZED_PUBLIKACJA.md
PLAN_PIERWSZYCH_TESTOW_STUDENT2WORK.md
PILOT_MVP_RUNBOOK.md
PRODUCTION_GO_LIVE_RUNBOOK.md
supabase/migrations/README.md
AGENT_NOTEBOOK.md
```

Jeżeli dokumenty są sprzeczne z kodem, najpierw ustal fakty w kodzie i DB/migracjach, potem opisz rozjazd w raporcie.

Szczególnie ważny możliwy rozjazd: dokumenty biznesowe opisują escrow/manual capture, a kod może używać Stripe Checkout i późniejszego ledger/payout flow. Masz ustalić aktualny rzeczywisty model płatności i wskazać, czy jest zgodny z wymaganiami bezpieczeństwa i prawno-biznesowymi.

### 5. Zadanie główne

Twoim celem jest przygotowanie aplikacji do stabilnego pilota. Wykonaj audyt, napraw najważniejsze problemy i zostaw czytelny raport.

Zakres:

1. Zweryfikuj pełną ścieżkę klienta firmy.
2. Zweryfikuj pełną ścieżkę studenta.
3. Zweryfikuj ścieżkę admina.
4. Zweryfikuj bezpieczeństwo aplikacji.
5. Zweryfikuj stan bazy, migracji, RLS i storage.
6. Znajdź strony martwe, niedziałające, zdublowane albo niezgodne z aktualnym produktem.
7. Usuń, ukryj albo przekieruj strony, które powinny zniknąć.
8. Napraw błędy blokujące flow i regresje.
9. Uruchom sensowny zestaw testów i opisz, co nadal wymaga ręcznej weryfikacji.

### 6. Customer Journey: firma

Zweryfikuj ścieżkę firmy na poziomie UX, danych i zabezpieczeń:

1. Wejście na landing / publiczne strony.
2. Rejestracja / logowanie jako firma.
3. Onboarding firmy, profil, NIP, nazwa firmy.
4. Wejście do katalogu Quick Task.
5. Wybór pakietu i wariantu.
6. Wypełnienie briefu.
7. Utworzenie zamówienia.
8. Widok statusu po utworzeniu zamówienia.
9. Dokumenty / umowa A.
10. Akceptacja umowy.
11. Płatność testowa Stripe.
12. Widok po płatności.
13. Komunikacja z wykonawcą/platformą.
14. Odbiór pracy.
15. Akceptacja, poprawki albo dispute.
16. Recenzja.
17. Dokumenty końcowe, historia zleceń i finanse.

Sprawdź także custom marketplace:

1. Firma tworzy własne zlecenie.
2. Zlecenie trafia do widocznej listy dla studentów.
3. Firma widzi aplikacje.
4. Firma akceptuje lub odrzuca aplikację.
5. Negocjacja ceny/zakresu nie omija platformy.
6. Po wyborze studenta flow przechodzi do umów, płatności i realizacji.

W każdym kroku odpowiedz:

- Czy użytkownik wie, co się dzieje?
- Czy widzi następną akcję?
- Czy status w UI zgadza się ze statusem w DB?
- Czy nie ma surowych UUID, JSON, angielskich komunikatów lub stack trace w głównym flow?
- Czy użytkownik nie może wykonać akcji poza swoją rolą?

### 7. Customer Journey: student

Zweryfikuj:

1. Rejestracja / logowanie jako student.
2. Onboarding profilu, dane podatkowe, status studenta, under_26, umiejętności.
3. Stripe Connect onboarding.
4. Widoczność ofert/zleceń.
5. Aplikowanie na zlecenie marketplace.
6. Przyjęcie/praca nad Quick Task, jeżeli aplikacja ma taki flow.
7. Czat / komunikacja.
8. Dostarczenie plików / deliverables.
9. Widok umowy B.
10. Brak dostępu do dokumentów firmy, cudzych zleceń i panelu admina.
11. Status wypłaty, finanse, PIT/rachunki.
12. Recenzje i profil publiczny.

Sprawdź edge cases:

- Student bez ukończonego onboarding nie powinien przechodzić do akcji wymagających danych.
- Student bez gotowego Connect nie powinien dostać niejasnego błędu Stripe.
- Student nie może jednostronnie zmienić ceny po akceptacji warunków.
- Student nie widzi danych innych studentów poza tym, co jest publicznym profilem.

### 8. Customer Journey: admin

Zweryfikuj panel admina:

1. Dashboard admina.
2. Użytkownicy.
3. Oferty / zlecenia.
4. System services / pakiety.
5. Kontrakty.
6. Disputes.
7. Payouty.
8. Finance / ledger / invoices / PIT.
9. Vault / dokumenty.
10. Eksporty.

Sprawdź:

- Czy admin-only strony są chronione server-side.
- Czy UI nie polega wyłącznie na ukryciu linku w navbarze.
- Czy akcje admina są walidowane po stronie serwera.
- Czy panel nie pokazuje surowych błędów DB.
- Czy read-only widoki nie udają, że mają działające akcje.

### 9. Bezpieczeństwo

Wykonaj audyt co najmniej tych obszarów:

#### Auth i role

- `student`, `company`, `admin`.
- Guardy w layoutach i server actions.
- Brak możliwości privilege escalation przez update profilu.
- Brak opierania bezpieczeństwa wyłącznie na client-side redirects.

#### Supabase

- Czy klient anon jest używany tylko tam, gdzie powinien.
- Czy `SUPABASE_SERVICE_ROLE_KEY` nie trafia do klienta.
- Czy `lib/supabase/admin.ts` jest importowany wyłącznie server-side.
- Czy wszystkie tabele z danymi użytkowników / finansami / dokumentami mają RLS.
- Czy storage buckets mają polityki zgodne z rolami i własnością plików.

#### Stripe

- Secret key wyłącznie server-side.
- Webhook signature jest weryfikowany przez `stripe.webhooks.constructEvent`.
- Endpointy payment/checkout nie ufają kwocie z frontendu.
- Przed płatnością/capture/payout sprawdzane są warunki kontraktu i podpisy.
- Idempotencja eventów Stripe działa.
- Brak podwójnej wypłaty przy retry webhooka/cron.
- Connect readiness ma czytelny status i nie kończy flow surowym błędem.
- Pilot/test mode nie może przypadkiem użyć live keys.

#### API routes i server actions

- Każda mutacja sprawdza użytkownika, rolę i własność zasobu.
- Cron endpoints wymagają sekretu.
- Webhooki bez poprawnego podpisu/sekretu są odrzucane.
- Download dokumentów sprawdza rolę i powiązanie z kontraktem.
- Upload plików ma limit, typ MIME i sprawdzoną własność.

#### UI i błędy

- Komunikaty błędów dla użytkownika po polsku.
- Brak stack trace w UI.
- Krytyczne błędy płatnicze i webhookowe są logowane.
- Brak ekspozycji env/secrets w kodzie klienta.

### 10. Stan bazy danych i migracji

Nie wykonuj destrukcyjnych operacji na DB. Najpierw audyt.

Sprawdź:

1. Czy `supabase/migrations/*` jest spójne z `supabase/migrations/README.md`.
2. Czy istnieją migracje nienazwane zgodnie z konwencją `YYYYMMDDHHMMSS_name.sql`.
3. Czy są świeże pliki SQL poza `supabase/migrations`, które wyglądają jak aktywne migracje.
4. Czy `supabase/_archive/*` nie jest przypadkiem używane jako aktywne źródło prawdy.
5. Czy tabele finansowe, kontraktowe, dokumentowe i messagingowe mają RLS.
6. Czy są funkcje/RPC z `security definer` bez poprawnego sprawdzenia roli.
7. Czy statusy w DB odpowiadają statusom w TypeScript.
8. Czy kwoty są spójnie trzymane w minor units albo jasno przeliczane.
9. Czy są duplikaty tabel/flow: `orders`, `service_orders`, `applications`, `contracts`, `milestones`, `payments`, `payouts`.
10. Czy ostatnie migracje z czerwca 2026 nie wprowadziły rozjazdu względem UI.

Jeżeli masz dostęp do Supabase CLI i bezpiecznego środowiska preview, możesz wykonać tylko odczytowe zapytania diagnostyczne. Nie rób `db push` bez potwierdzenia.

Przygotuj raport:

- tabele krytyczne i ich status RLS,
- funkcje/RPC wysokiego ryzyka,
- potencjalne drifty,
- zaległe migracje,
- rekomendowana kolejność napraw.

### 11. Martwe, zdublowane i niedziałające strony

Zrób inventory tras App Routera. Wypisz wszystkie `page.tsx`, `route.ts`, `layout.tsx` i porównaj je z aktualnym produktem.

Szczególnie sprawdź potencjalne duplikaty / legacy:

- `app/auth/page.tsx` vs `app/app/auth/page.tsx`.
- `app/app/review/[applicationId]/*` vs `app/app/company/review/[applicationId]/*`.
- `app/app/company/orders/*` vs `app/app/services/dashboard/*`.
- `app/app/orders/market/page.tsx`.
- `app/app/services/*`, `app/app/company/packages/*`, `app/app/company/packages/[id]/customize/*`.
- `app/app/cancel/[id]/*`.
- `app/components/*` vs główne `components/*`.
- stare marketplace/service pages, które nie są już linkowane.

Dla każdej podejrzanej strony ustal:

- Czy jest linkowana z nawigacji, dashboardu, maila, redirectu albo testów.
- Czy ma realny use case w pilocie.
- Czy działa po wejściu bezpośrednim.
- Czy ma poprawne guardy.
- Czy powinna zostać:
  - zachowana,
  - naprawiona,
  - ukryta z nawigacji,
  - przekierowana,
  - usunięta.

Nie usuwaj strony tylko dlatego, że nie jest linkowana. Najpierw sprawdź, czy nie jest callbackiem, deep linkiem, stroną dokumentu, review albo landingiem z maila.

### 12. Konkretne naprawy, których szukasz

Jeżeli występują, napraw:

- Broken imports po niedawnych zmianach.
- Server action bez autoryzacji.
- Strony z nieobsłużonym `null`/`undefined`.
- Formularze wysyłające kwoty lub statusy, którym backend ufa bez walidacji.
- Linki prowadzące do 404.
- Nawigację pokazującą strony nieaktywne w pilocie.
- Duplikaty status labels i niespójne tłumaczenia statusów.
- Angielskie copy w krytycznych polskich flow.
- Przyciski akcji widoczne mimo braku uprawnień albo niewłaściwego statusu.
- Brak disabled/loading/error state w płatnościach, deliverables, contracts, applications.
- Stare strony marketplace, jeżeli psują aktualny Quick Task pilot.
- Endpointy cron/webhook bez poprawnego 401/400 na nieautoryzowane requesty.

### 13. Testy i weryfikacja

Uruchom możliwie szeroki, ale pragmatyczny zestaw:

```bash
npm run lint
npm run build
npm run check:preview
npm run test:mvp-scenarios
```

Jeżeli środowisko wymaga base URL:

```bash
npm run test:mvp-scenarios -- --base-url=<preview-url>
```

Jeżeli uruchamiasz lokalnie aplikację:

```bash
npm run dev
```

Wtedy wykonaj smoke test w przeglądarce dla:

- landing,
- auth,
- onboarding,
- company packages,
- create order,
- company orders/services dashboard,
- student jobs/offers/applications,
- deliverables detail,
- chat,
- admin panel,
- documents download,
- Stripe checkout test path, jeżeli env na to pozwala.

Jeżeli testów nie da się uruchomić przez brak env albo zewnętrzne usługi, nie zgaduj. Opisz dokładnie:

- jaki test,
- jaka komenda,
- jaki błąd,
- czy to blokada środowiska czy kodu,
- jak to zweryfikować po dostarczeniu env.

### 14. Oczekiwane artefakty

Utwórz albo zaktualizuj plik:

```text
FABLE5_AUDIT_AND_FIX_REPORT.md
```

Raport ma mieć strukturę:

1. Executive summary: co działa, co blokuje pilota, co jest ryzykiem go-live.
2. Customer journey firma: status krok po kroku.
3. Customer journey student: status krok po kroku.
4. Customer journey admin: status krok po kroku.
5. Security findings: P0/P1/P2, pliki i linie.
6. Database/RLS/migrations findings.
7. Dead/broken routes inventory.
8. Zmiany wykonane w kodzie.
9. Testy uruchomione i wyniki.
10. Rekomendowane następne kroki.

Jeżeli wykonasz zmiany, zaktualizuj też krótko:

```text
AGENT_NOTEBOOK.md
```

Wpis powinien zawierać:

- datę,
- listę zmienionych obszarów,
- komendy testowe,
- znane ograniczenia.

### 15. Priorytety

Kolejność decyzji:

1. Blokery bezpieczeństwa i płatności.
2. Blokery Quick Task customer journey.
3. Broken routes, 404 i strony, które psują zaufanie.
4. DB/RLS/migration drift.
5. Marketplace/custom flow, jeśli wpływa na aktualny pilot.
6. UI polish tylko tam, gdzie realnie pomaga użytkownikowi przejść flow.

Nie rób:

- redesignu całej aplikacji,
- przebudowy architektury bez potrzeby,
- nowych funkcji marketplace/internship,
- migracji DB bez pliku SQL w repo,
- bezpośredniego obchodzenia platformy w relacji firma-student,
- klientowego Stripe secret,
- ukrywania błędów przez `try/catch` bez logowania i sensownego statusu.

### 16. Format odpowiedzi końcowej

Na końcu odpowiedz zwięźle po polsku:

- co zostało naprawione,
- co zostało tylko zdiagnozowane,
- które pliki zmieniono,
- jakie komendy przeszły,
- jakie komendy nie przeszły i dlaczego,
- które P0/P1 zostają dla właściciela projektu.

Nie kończ ogólnikami. Każde ryzyko ma mieć konkretną ścieżkę pliku, trasę albo tabelę/funkcję DB.

## END PROMPT
