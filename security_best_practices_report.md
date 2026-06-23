# Audyt bezpieczeństwa danych użytkowników - Student2Work

Data: 2026-06-13

Zakres: statyczny audyt kodu aplikacji, konfiguracji Next.js, server actions/API routes, migracji Supabase/RLS/Storage, Stripe oraz zależności npm. Nie czytałem lokalnych sekretów i nie wykonywałem pentestu na żywej produkcji. Ustalenia dla RLS/Storage należy potwierdzić w aktywnej bazie Supabase, bo migracje i stan produkcyjny mogą się różnić.

## Status po remediacji - 2026-06-14

Wdrozone w kodzie i migracji:

- S2W-SEC-001: dodano migracje usuwajaca szerokie SELECT RLS na profilach, nowe polityki own/admin/related oraz publiczne widoki `student_public_profiles` i `company_public_profiles`; publiczne widoki ofert/studentow/firm przepiete na widoki publiczne.
- S2W-SEC-002, S2W-SEC-003, S2W-SEC-004, S2W-SEC-010: dodano prywatne buckety, server-side endpoint uploadu, walidacje MIME/rozmiaru/roli/uczestnictwa, zapisy `storage://bucket/path`, endpoint signed download i usunieto aktywne typy HTML/JS/SVG/CSS z uploadow.
- S2W-SEC-005: migracja odbiera `calculate_pit_withholding` rolom `anon/authenticated` i zostawia wykonanie przez `service_role`.
- S2W-SEC-006: dodano ostatnia bramke przed Stripe Transfer - payout wymaga zaakceptowanego/zwolnionego etapu, aktywnego lub zakonczonego kontraktu i platnosci `payments.status = completed`. Istniejacy model pozostaje platform-custody Checkout + pozniejszy transfer, nie pelnym Stripe manual-capture escrow.
- S2W-SEC-007: rate limiter w produkcji jest fail-closed przy braku konfiguracji, dodano limiter uploadu i produkcyjny wymog Upstash w walidacji env.
- S2W-SEC-008: `npm audit` jest czysty; Next podniesiony do 16.2.9, globalny override wymusza `postcss >= 8.5.15`.
- S2W-SEC-009: eksporty CSV uzywaja escaping chroniacego przed formula injection, a eksport PIT pobiera e-maile tylko dla studentow objetych eksportem.
- S2W-SEC-011, S2W-SEC-012, S2W-SEC-013: CSP dla skryptow przeszlo na nonce bez produkcyjnego `unsafe-inline`, Origin guard nie ufa juz `req.nextUrl.origin` w produkcji, a crony zwracaja generyczne bledy.

Weryfikacja lokalna: `npx tsc --noEmit`, celowany `npx eslint` dla zmienionych plikow, `npm audit`, `npm run build`.

## Podsumowanie

Największe ryzyka dotyczą danych osobowych i dokumentów użytkowników: zbyt szerokie polityki SELECT na profilach, publiczny bucket `offer_attachments`, bezpośrednie uploady CV/załączników z klienta oraz funkcja `SECURITY DEFINER` do PIT dostępna dla każdego zalogowanego użytkownika. Dodatkowo flow płatności nie odpowiada opisanej architekturze escrow/manual capture, a rate limit działa fail-open bez Upstash.

Pozytywne elementy: webhook Stripe weryfikuje podpis na raw body (`app/api/stripe/webhook/route.ts:49-58`), `createAdminClient` ma `server-only` (`lib/supabase/admin.ts:1`), panel `/app/admin` ma wspólny guard (`app/app/admin/layout.tsx:12`), a krytyczne endpointy Stripe mają walidację użytkownika, ownership i Origin check (`app/api/stripe/create-checkout/route.ts:92-114`, `app/api/stripe/connect/onboarding/route.ts:15-39`).

## Krytyczne

### S2W-SEC-001: Szerokie RLS na profilach może ujawniać PII

Lokalizacja: `supabase/COMPLETE_DB_SETUP.sql:252-256`

Problem: migracja tworzy polityki:

```sql
CREATE POLICY "Profiles readable by auth" ON public.student_profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Profiles readable by auth comp" ON public.company_profiles FOR SELECT TO authenticated USING (true);
```

Jeżeli takie polityki są aktywne w produkcji, każdy zalogowany użytkownik z anon key może odpytać pełne wiersze `student_profiles` i `company_profiles`. W profilu studenta występują pola wrażliwe lub poufne, m.in. PESEL, data urodzenia, rezydencja podatkowa, status PIT/ZUS i `stripe_account_id`. Polityki RLS w Postgresie sumują się logicznie, więc jedna szeroka polityka `USING (true)` unieważnia późniejsze własnościowe ograniczenia SELECT.

Wpływ: masowy wyciek danych osobowych studentów i firm, ryzyko RODO, możliwość enumeracji danych finansowo-podatkowych.

Jak załatać:

```sql
BEGIN;

DROP POLICY IF EXISTS "Profiles readable by auth" ON public.student_profiles;
DROP POLICY IF EXISTS "Profiles readable by auth comp" ON public.company_profiles;

CREATE POLICY student_profiles_select_own
ON public.student_profiles
FOR SELECT TO authenticated
USING (user_id = auth.uid());

CREATE POLICY student_profiles_select_admin
ON public.student_profiles
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = auth.uid() AND p.role = 'admin'
  )
);

CREATE POLICY company_profiles_select_own
ON public.company_profiles
FOR SELECT TO authenticated
USING (user_id = auth.uid());

CREATE POLICY company_profiles_select_admin
ON public.company_profiles
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = auth.uid() AND p.role = 'admin'
  )
);

COMMIT;
```

Dla danych publicznych utworzyć osobne widoki/RPC z allowlistą kolumn, np. `student_public_profiles` bez PESEL, daty urodzenia, pól podatkowych i Stripe.

Weryfikacja w bazie:

```sql
SELECT schemaname, tablename, policyname, roles, cmd, qual
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('student_profiles', 'company_profiles');
```

### S2W-SEC-002: Publiczny bucket `offer_attachments` ujawnia załączniki ofert

Lokalizacje:
- `supabase/migrations/20260203_create_offer_attachments_bucket.sql:1-24`
- `app/app/company/jobs/new/new-offer-form.tsx:304-323`
- `app/app/admin/system-services/_components/SystemServiceForm.tsx:189-196`

Problem: bucket jest tworzony jako publiczny (`public = true`), a polityka SELECT pozwala czytać pliki każdemu (`TO public`). Kod uploaduje pliki z klienta i zapisuje `publicUrl`. Komentarz w migracji sam potwierdza, że UI ukrywa link, ale sam plik jest publiczny, jeśli ktoś zna URL.

Wpływ: poufne briefy firm, specyfikacje, dane kontaktowe lub materiały projektowe mogą być dostępne poza aplikacją. Publiczny odczyt omija akceptację aplikacji i role.

Jak załatać:

```sql
UPDATE storage.buckets
SET public = false
WHERE id = 'offer_attachments';

DROP POLICY IF EXISTS "Everyone can read offer attachments" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload offer attachments" ON storage.objects;

CREATE POLICY offer_attachments_insert_company_owner
ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'offer_attachments'
  AND owner = auth.uid()
);
```

Docelowo upload powinien iść przez server action/API route: walidacja typu i rozmiaru pliku, ścieżka `offers/{offer_id}/{uuid}`, zapis samej ścieżki w DB, a pobieranie tylko przez endpoint generujący krótki signed URL po sprawdzeniu roli firmy/studenta/admina.

## Wysokie

### S2W-SEC-003: CV są uploadowane z klienta i zwracane jako public URL

Lokalizacja: `app/app/offers/[id]/apply-card.tsx:145-165`

Problem: CV trafia bezpośrednio do bucketu `cvs` z klienta, bez server-side walidacji MIME/rozmiaru i z użyciem `getPublicUrl`. W migracjach jest komentarz o utwardzeniu bucketów prywatnych, ale linia ustawiająca `public = false` dla `cvs` jest zakomentowana (`supabase/migrations/20260324172434_harden_storage_rls_v2.sql:7`).

Wpływ: CV zawiera dane osobowe. Publiczny lub błędnie skonfigurowany bucket może prowadzić do wycieku dokumentów aplikacyjnych. Brak walidacji serwerowej pozwala też uploadować pliki niebędące CV.

Jak załatać:
- Wymusić prywatny bucket `cvs`.
- Wprowadzić endpoint/server action do uploadu CV.
- Dopuścić tylko PDF/DOC/DOCX, limit np. 5-10 MB, ścieżka `cvs/{user_id}/{uuid}`.
- W DB zapisywać bucket/path, nie public URL.
- Pobieranie CV tylko przez signed URL po sprawdzeniu: właściciel, firma powiązana z aplikacją albo admin.

### S2W-SEC-004: Załączniki realizacji można fałszować metadanymi i dopuszczają aktywne pliki

Lokalizacje:
- `app/app/deliverables/[id]/UploadForm.tsx:76-101`, `126-144`
- `app/app/deliverables/_actions.ts:336-402`
- `app/app/deliverables/_actions.ts:205-240`
- `app/app/deliverables/[id]/tabs/FilesTab.tsx:22-25`, `40-49`

Problem: klient tworzy JSON `filesJson`, a server action przyjmuje `bucket` i `path` z metadanych bez sprawdzenia, czy obiekt istnieje, należy do aktualnego użytkownika i znajduje się pod właściwym prefiksem. Dodatkowo klient dopuszcza `image/svg+xml`, `text/html`, `application/javascript`, `text/css`, `application/json`; signed URL bywa otwierany w nowej karcie bez wymuszonego downloadu.

Wpływ: fałszywe dowody dostawy, wskazywanie cudzych obiektów dostępnych przez RLS, ryzyko XSS/phishingu przez aktywne typy plików i malware w załącznikach.

Jak załatać:
- Nie przyjmować `bucket/path` z klienta jako źródła prawdy.
- Po uploadzie serwer powinien zweryfikować `storage.objects`: bucket `deliverables`, owner `auth.uid()`, prefiks `deliverables/{source_id}/...` albo `resources/{source_id}/...`, rozmiar i MIME.
- Odrzucać HTML/JS/SVG/CSS albo zawsze wymuszać `Content-Disposition: attachment` dla tych typów.
- Ograniczyć liczbę plików i łączny rozmiar po stronie serwera.
- Dodać skan antywirusowy/asynchroniczne oznaczanie plików przed udostępnieniem firmie.

### S2W-SEC-005: `calculate_pit_withholding` jest `SECURITY DEFINER` i dostępna dla `authenticated`

Lokalizacja: `supabase/migrations/20260416141000_add_calculate_pit_withholding_rpc.sql:24-116`

Problem: funkcja `SECURITY DEFINER` czyta `student_profiles` i wstawia do `pit_withholdings`, ale nie sprawdza `auth.uid()`, roli admina ani powiązania `p_contract_id/p_milestone_id/p_student_id`. Na końcu nadaje `GRANT EXECUTE ... TO authenticated`.

Wpływ: dowolny zalogowany użytkownik może potencjalnie tworzyć rekordy PIT dla arbitralnych studentów/kontraktów oraz pośrednio wnioskować o statusie ulgi PIT.

Jak załatać:

```sql
REVOKE EXECUTE ON FUNCTION public.calculate_pit_withholding(uuid, uuid, uuid, numeric)
FROM anon, authenticated;

GRANT EXECUTE ON FUNCTION public.calculate_pit_withholding(uuid, uuid, uuid, numeric)
TO service_role;
```

Jeśli funkcja ma pozostać callable z innych RPC, dodać wewnętrzne guardy: kontrakt musi istnieć, `student_id` musi być studentem kontraktu, milestone musi należeć do kontraktu, kwota musi wynikać z DB, a wywołujący musi być adminem albo wywołanie musi przechodzić wyłącznie przez zaufaną funkcję review/payout.

### S2W-SEC-006: Flow Stripe nie jest manual-capture escrow zgodnym z instrukcjami projektu

Lokalizacje:
- `app/api/stripe/create-checkout/route.ts:410-440`
- `lib/stripe/stripe-event-processor.ts:192-196`, `314-324`
- `lib/stripe/payouts.ts:108-122`

Problem: kod tworzy `checkout.sessions.create({ mode: "payment" })` bez `payment_intent_data.capture_method = "manual"`, bez `application_fee_amount` i bez `transfer_data.destination`. Webhook obsługuje `checkout.session.completed`, a później osobno tworzony jest `stripe.transfers.create`.

Wpływ: środki są pobierane od firmy od razu, a nie autoryzowane do późniejszego capture w modelu escrow opisanym w instrukcjach. To ryzyko finansowe, zgodnościowe i dispute-flow, bo nazewnictwo "depozyt/escrow" może nie odpowiadać rzeczywistemu stanowi środków.

Jak załatać:
- Jednoznacznie wybrać architekturę Stripe i opisać ją w kodzie oraz regulaminie.
- Jeśli obowiązuje flow z instrukcji projektu: tworzyć PaymentIntent/Checkout z manual capture, kwotami z DB, prowizją platformy i docelowym kontem Connect zgodnie z obsługiwanym modelem Stripe.
- Przed capture ponownie sprawdzać podpisane umowy, status, brak dispute i kwoty z DB.
- Nie wykonywać transferu/payoutu przed akceptacją, auto-akceptacją albo decyzją admina.
- Dodać test integracyjny: signed contracts -> payment authorized -> delivered -> accepted -> capture/transfer -> completed; dispute blokuje capture/transfer.

### S2W-SEC-007: Rate limiting działa fail-open bez Upstash

Lokalizacja: `lib/rate-limit.ts:17-27`, `74-80`

Problem: gdy brakuje `UPSTASH_REDIS_REST_URL` lub `UPSTASH_REDIS_REST_TOKEN`, `enforceRateLimit()` zwraca sukces z limitem `Number.MAX_SAFE_INTEGER`.

Wpływ: w źle skonfigurowanym deployu znikają limity dla logowania, checkoutu, aplikacji, wiadomości i webhooka notyfikacji. To zwiększa ryzyko brute force, spamowania, kosztów Stripe/Resend i DoS.

Jak załatać:
- W produkcji fail-closed: brak Redis powinien zwracać 503/429 dla limitowanych ścieżek albo blokować start/deploy.
- `validate-deploy-env.mjs` powinien zawsze wymagać Upstash w `VERCEL_ENV=production`, również przy pilotach testowych.
- Dodać alert/Sentry event, gdy limiter działa w fallbacku.

### S2W-SEC-008: Podatne zależności npm

Wynik: `npm audit --omit=dev --audit-level=moderate` wykazał 7 podatności: 2 high i 5 moderate. High dotyczy `next` i `fast-uri`; moderate obejmuje m.in. `postcss`, `ws`, `uuid`, `brace-expansion`.

Jak załatać:
- Uruchomić `npm audit fix`, sprawdzić diff `package-lock.json`.
- Podnieść Next.js do wersji z poprawkami dla advisory wskazanych przez audit.
- Po aktualizacji uruchomić: `npm run build`, `npm run check:preview`, `npm run test:mvp-scenarios`.

## Średnie

### S2W-SEC-009: Eksporty CSV są podatne na CSV/Excel formula injection i nadmiarowo pobierają dane

Lokalizacje:
- `app/api/admin/export/pit-csv/route.ts:79-81`, `106-119`
- `app/api/admin/export/invoices-zip/route.ts:128-142`

Problem: wartości są tylko ujmowane w cudzysłów. Excel nadal wykona formuły zaczynające się od `=`, `+`, `-`, `@`, tab lub CR/LF. Eksport PIT pobiera też `admin.auth.admin.listUsers()` dla wszystkich użytkowników, a nie tylko dla studentów z danego eksportu.

Wpływ: admin otwierający CSV może uruchomić formułę wykradającą dane lub wykonującą zewnętrzne żądania. Nadmiarowe pobieranie e-maili zwiększa blast radius błędu.

Jak załatać:

```ts
function csvCell(value: unknown) {
  const raw = String(value ?? "");
  const safe = /^[=+\-@\t\r\n]/.test(raw) ? `'${raw}` : raw;
  return `"${safe.replace(/"/g, '""')}"`;
}
```

Pobierać e-maile tylko dla `studentIds` objętych eksportem, dodać `export_audit_logs`, wymagać parametru `month` dla dużych eksportów i rozważyć zaszyfrowany ZIP dla danych podatkowych.

### S2W-SEC-010: Chat i załączniki mogą ładować publiczne lub zewnętrzne URL-e

Lokalizacje:
- `app/app/chat/[id]/ChatInput.tsx:62-73`
- `app/app/chat/_actions.ts:460-483`
- `app/app/chat/_components/FileBubble.tsx:20-28`

Problem: upload do `chat-attachments` zwraca `publicUrl`, a server action dopuszcza dowolny `https://` URL jako załącznik. Komponent dla obrazów ładuje URL przez `<img>`.

Wpływ: publiczne linki do prywatnych rozmów, phishing, tracking IP/user-agent odbiorcy przez zewnętrzne obrazy.

Jak załatać:
- `chat-attachments` jako prywatny bucket.
- W wiadomości przechowywać bucket/path, nie public URL.
- Dopuszczać tylko obiekty przesłane przez aktualnego uczestnika rozmowy.
- Zewnętrzne linki traktować jako zwykłe linki, nie jako inline image/file preview.

### S2W-SEC-011: CSP w produkcji dopuszcza `unsafe-inline`

Lokalizacja: `next.config.ts:44-57`

Problem: `script-src` zawiera `'unsafe-inline'` także poza developmentem.

Wpływ: CSP słabiej ogranicza skutki XSS; jeden błąd w renderowaniu danych użytkownika może łatwiej przejść w wykonanie skryptu.

Jak załatać:
- Przejść na nonce/hashes dla skryptów.
- Usunąć `'unsafe-inline'` z `script-src` w produkcji.
- Rozważyć `require-trusted-types-for 'script'` po przygotowaniu frontendu.

### S2W-SEC-012: Origin guard ufa originowi wynikającemu z requestu

Lokalizacja: `lib/security/request-origin.ts:13-24`

Problem: w allowliście Origin dodawane jest `req.nextUrl.origin`. W produkcji źródłem prawdy powinny być jawnie skonfigurowane domeny, nie host requestu.

Wpływ: przy błędnej konfiguracji hostów/proxy łatwiej osłabić CSRF guard.

Jak załatać:
- W produkcji akceptować tylko `NEXT_PUBLIC_APP_URL` i opcjonalnie `APP_ALLOWED_ORIGINS`.
- Nie dodawać `req.nextUrl.origin` w `NODE_ENV=production`.
- Dodać testy: obcy Origin -> 403, brak Origin w produkcji -> 403, poprawny Origin -> 200/expected.

### S2W-SEC-013: Endpointy cron zwracają surowe komunikaty błędów

Lokalizacje:
- `app/api/cron/auto-accept/route.ts:92-94`, `218-225`
- `app/api/cron/process-stripe-events/route.ts:20-23`
- `app/api/cron/cleanup-expired-sessions/route.ts:29-38`

Problem: odpowiedzi 500 zawierają `error.message` z RPC/DB.

Wpływ: przy wycieku `CRON_SECRET` albo widocznych logach można ujawnić nazwy funkcji, strukturę tabel lub szczegóły Stripe/DB.

Jak załatać:
- Do klienta zwracać generyczne `"Wystąpił błąd zadania cyklicznego."`.
- Szczegóły wysyłać do Sentry i `error_logs`.
- Rotować `CRON_SECRET` po każdym podejrzeniu ujawnienia.

## Niskie i obserwacje

- `components/image-upload.tsx:20-43` uploaduje obrazy po stronie klienta bez serwerowego limitu typu i rozmiaru. Dodać server-side walidację i bucket limits.
- `git ls-files` pokazał tylko `.env.example`; nie znalazłem śledzonych plików `.env`, `.env.local`, `.env.production` ani `.env.sentry-build-plugin`.
- `scripts/validate-deploy-env.mjs` i `scripts/production-readiness-check.mjs` są dobrym kierunkiem, ale powinny sprawdzać też publiczne flagi bucketów `cvs`, `offer_attachments`, `chat-attachments` oraz szerokie polityki profili.

## Priorytet napraw

1. Potwierdzić aktywne RLS w produkcji i natychmiast usunąć polityki `USING (true)` z profili.
2. Zmienić `offer_attachments`, `cvs` i `chat-attachments` na prywatne buckety; przestać zapisywać public URL-e dla danych użytkowników.
3. Cofnąć `GRANT EXECUTE` dla `calculate_pit_withholding` z `authenticated` i dodać guardy powiązań kontrakt/milestone/student.
4. Dodać server-side upload finalization dla CV, deliverables, resources, chat i offer attachments.
5. Uzgodnić i poprawić architekturę Stripe escrow/manual capture.
6. Wymusić rate limit w produkcji i zaktualizować zależności z `npm audit`.
7. Utwardzić CSV, CSP, Origin allowlist i odpowiedzi błędów z cronów.

## Checklista weryfikacji po poprawkach

```sql
SELECT tablename, policyname, roles, cmd, qual
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('student_profiles', 'company_profiles');

SELECT id, public, file_size_limit, allowed_mime_types
FROM storage.buckets
WHERE id IN ('cvs', 'offer_attachments', 'chat-attachments', 'deliverables', 'portfolio');

SELECT has_function_privilege('authenticated', 'public.calculate_pit_withholding(uuid, uuid, uuid, numeric)', 'execute');
```

Po stronie aplikacji:

```bash
npm audit --omit=dev --audit-level=moderate
npm run build
npm run check:preview
npm run test:mvp-scenarios
```
