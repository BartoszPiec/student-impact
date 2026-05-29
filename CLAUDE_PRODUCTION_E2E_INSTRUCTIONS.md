# Wytyczne Dla Claude: Student2Work Production / E2E

## 1. Obraz Aplikacji

Student2Work to polska platforma B2B2C laczaca firmy ze studentami przy platnych zadaniach zleconych. Platforma nie jest prostym marketplace'em firma-student. Docelowy model jest trojstronny:

```text
Firma -> placi platformie / escrow -> Student2Work -> rozlicza studenta
Student -> wykonuje dzielo -> przenosi IP na platforme -> platforma przenosi IP na firme
```

Firma nie powinna zawierac bezposredniej umowy ze studentem. Umowy i platnosci maja isc przez platforme. To jest kluczowy warunek biznesowy, prawny i produktowy.

Aplikacja ma dwa glowne tryby zlecen:

- **Quick Task / gotowe pakiety** - firma wybiera usluge systemowa z katalogu, wypelnia brief, a platforma prowadzi zlecenie przez umowy, platnosc, realizacje i akceptacje.
- **Custom Marketplace / wlasne zlecenie firmy** - firma tworzy swoje zlecenie, publikuje je dla studentow, zbiera kandydatury, wybiera studenta i moze negocjowac cene oraz zakres przed finalna umowa i platnoscia.

Priorytetem pilota pozostaje **Quick Task**, ale produkcyjny obraz aplikacji obejmuje rowniez custom zlecenia firm i wybor sposrod kandydatow.

Flow **Quick Task**:

1. Firma wybiera gotowa usluge systemowa z katalogu.
2. Firma wypelnia brief.
3. System tworzy zlecenie i przypisuje studenta.
4. Student widzi zlecenie w czytelnej formie, ze statusem i nastepna akcja.
5. Student przyjmuje zlecenie.
6. System generuje dokumenty/umowy.
7. Firma akceptuje umowe A: Firma <-> Student Impact.
8. Student akceptuje umowe B: Student <-> Student Impact.
9. Firma zasila depozyt przez Stripe Checkout.
10. Webhook Stripe aktywuje kontrakt i etapy.
11. Student dostarcza wynik.
12. Firma akceptuje wynik albo prosi o poprawki / dispute.
13. System tworzy payout dla studenta.
14. Stripe Connect wykonuje transfer albo zapisuje jasny status oczekiwania, jesli konto studenta nie jest gotowe.
15. Firma i student widza finalny status oraz dokumenty.

Flow **Custom Marketplace**:

1. Firma tworzy wlasne zlecenie z opisem, zakresem, budzetem i wymaganiami.
2. Zlecenie jest publikowane dla studentow.
3. Studenci przegladaja zlecenie i aplikuja.
4. Firma widzi kandydatow w czytelnej formie: profil, kompetencje, propozycje, cene i status.
5. Firma moze wybrac kandydata albo negocjowac cene/zakres.
6. Student moze zaakceptowac, odrzucic albo odpowiedziec propozycja negocjacyjna.
7. Po uzgodnieniu warunkow system tworzy kontrakt i umowy A/B.
8. Dalej flow jest wspolny z Quick Task: akceptacja umow, platnosc Stripe, realizacja, odbior, payout, dokumenty.

W tym trybie Claude ma szczegolnie pilnowac, zeby negocjacja nie tworzyla bezposredniej relacji firma-student poza platforma. Cena i zakres moga byc negocjowane, ale finalna umowa, platnosc, IP i rozliczenie musza isc przez Student Impact.

Internship jest poza zakresem pilota produkcyjnego, chyba ze jego kod blokuje albo psuje wspolne elementy aplikacji.

## 2. Stack I Glowne Moduly

Stack:

- Next.js App Router, TypeScript.
- Supabase: Postgres, Auth, Storage, RLS.
- Stripe: Checkout + Connect Express.
- Vercel: Preview/Production + Cron.
- UI: Tailwind/shadcn style.

Najwazniejsze obszary kodu:

- `app/app/company/packages/*` - katalog Quick Task i tworzenie zlecenia.
- `app/app/company/jobs/new/*` - tworzenie wlasnego zlecenia firmy.
- `app/app/jobs/*` - lista zlecen dla studentow.
- `app/app/offers/[id]/*` - szczegoly zlecenia i aplikowanie studenta.
- `app/app/company/applications/*` - kandydaci i wybor studenta przez firme.
- `app/app/applications/*` - aplikacje po stronie studenta.
- `app/app/company/orders/*` - widok zlecen firmy.
- `app/app/deliverables/[id]/*` - centrum realizacji, statusy, dokumenty, dostawy.
- `app/api/stripe/create-checkout/route.ts` - tworzenie sesji Checkout.
- `app/api/stripe/webhook/route.ts` - przyjecie webhookow Stripe.
- `lib/stripe/stripe-event-processor.ts` - kolejka i przetwarzanie eventow Stripe.
- `lib/stripe/payouts.ts` - payout / Stripe Transfer.
- `lib/stripe/connect-readiness.ts` - sprawdzanie gotowosci konta Connect.
- `app/api/stripe/connect/onboarding/route.ts` - onboarding studenta do Stripe Connect.
- `app/api/cron/*` - processing eventow, auto-akceptacja, cleanup.
- `supabase/migrations/*` - funkcje finansowe, RLS, umowy, payouty.
- `scripts/mvp-scenario-suite.mjs` - E2E baseline.
- `scripts/production-readiness-check.mjs` - readiness gate.
- `scripts/validate-deploy-env.mjs` - guard produkcyjnego buildu.

## 3. Cel Prac

Celem nie jest tylko to, zeby aplikacja "dzialala lokalnie". Celem jest stan, w ktorym:

- pierwsze firmy i studenci moga przejsc caly Quick Task flow bez dostepu admina,
- firma moze rowniez utworzyc wlasne zlecenie, zebrac aplikacje studentow, wybrac kandydata i uzgodnic cene/zakres przez platforme,
- firma moze zaplacic przez Stripe,
- umowy sa wygenerowane, zaakceptowane i pobieralne,
- student moze dostarczyc prace,
- firma moze zaakceptowac wynik,
- system tworzy payout,
- widoki sa czytelne, po polsku, bez surowych UUID/JSON/stack trace w glownym flow,
- status kazdego widoku odpowiada na pytania: "co sie dzieje?" i "co mam teraz zrobic?",
- CI/E2E wykrywa regresje przed wpuszczeniem uzytkownikow,
- production deploy nie przejdzie przypadkiem z testowymi kluczami lub z brakujacymi zabezpieczeniami.

## 4. Aktualny Stan

Preview po ostatnim hardeningu:

```text
https://student-impact-q1f4e47rz-bartoszs-projects-216e6600.vercel.app
```

Preview jest zielone dla:

- `npm run build`
- `npm run check:preview`
- `npm run test:mvp-scenarios`

Istnieje pelny, sprawdzony flow pilota na sandboxie Stripe. Payout record powstaje. Jesli testowe konto Connect nie ma capability `transfers`, system zapisuje jasny status oczekiwania zamiast surowego bledu Stripe.

Produkcja nadal jest **NO-GO** dopoki nie zostana uzupelnione zewnetrzne elementy:

- live Stripe keys,
- live Stripe webhook dla `https://student2work.pl/api/stripe/webhook`,
- DNS `student2work.pl` na Vercel,
- `UPSTASH_REDIS_REST_URL`,
- `UPSTASH_REDIS_REST_TOKEN`,
- `SENTRY_DSN`.

## 5. Zasady Pracy Dla Claude

Claude ma pracowac pragmatycznie, ale ostroznie:

- Nie kasowac ani nie resetowac istniejacych zmian w worktree.
- Nie robic `supabase db push`, bo historia migracji lokalna i remote moga byc rozjechane.
- Jesli trzeba zmienic DB, stosowac selektywne migracje albo pojedyncze `supabase db query --linked --file ...`.
- Nie ujawniac sekretow w logach, dokumentach ani odpowiedziach.
- Nie uzywac Stripe secret key po stronie klienta.
- Nie omijac RLS.
- Nie dodawac relacji firma-student z pominieciem platformy.
- Nie zmieniac modelu prawnego: IP i umowy ida przez Student Impact.
- Wszystkie komunikaty uzytkownika powinny byc po polsku.
- Surowe bledy techniczne moga isc do logow, nie do UI.
- Po zmianach w flow uruchomic co najmniej build, readiness preview i E2E suite.

## 6. Co Claude Ma Zweryfikowac

### A. Production Readiness

Uruchomic:

```bash
npm run build
npm run check:preview
npm run test:mvp-scenarios -- --base-url=https://student-impact-q1f4e47rz-bartoszs-projects-216e6600.vercel.app
npm run check:production -- --env-file=.vercel\env.production.local
```

Oczekiwane:

- preview: wszystko zielone,
- production: moze nadal byc czerwone tylko na brakach live env/DNS/webhook, nie na kodzie lub Supabase.

Jesli production check pokazuje nowe bledy kodowe, naprawic.

### B. Quick Task Happy Path

Zweryfikowac end-to-end:

1. Firma loguje sie.
2. Katalog pokazuje aktywna usluge `Pilot Sandbox - Quick Task`.
3. Firma tworzy zlecenie z briefem.
4. Student widzi zlecenie.
5. Student przyjmuje zlecenie.
6. Umowy A/B sa generowane.
7. Firma akceptuje umowe A.
8. Student akceptuje umowe B.
9. Checkout sandbox dziala.
10. Webhook aktywuje kontrakt bez recznej zmiany DB.
11. Student dostarcza wynik.
12. Firma akceptuje wynik.
13. Payout record istnieje.
14. Dokumenty sa widoczne/pobieralne dla wlasciwej roli.

### C. Negatywne Scenariusze Uprawnien

Zweryfikowac:

- firma nie widzi panelu admina,
- student nie widzi panelu admina,
- student nie pobiera umowy firmowej `contract_a`,
- firma nie pobiera umowy studenta `contract_b`,
- niezalogowany uzytkownik nie wywoluje checkout/onboarding,
- cron endpointy bez `CRON_SECRET` zwracaja `401`,
- webhook bez podpisu Stripe zwraca `400`,
- cudze zlecenia/dokumenty nie sa widoczne w UI.

### D. Custom Marketplace / Wlasne Zlecenie Firmy

Zweryfikowac end-to-end:

1. Firma tworzy nowe zlecenie z wlasnym opisem, budzetem i wymaganiami.
2. Zlecenie pojawia sie studentom na liscie ofert/zlecen.
3. Student aplikuje na zlecenie.
4. Firma widzi aplikacje i profil kandydata.
5. Firma moze zaakceptowac kandydata albo rozpoczac negocjacje ceny/zakresu.
6. Negocjacja pokazuje aktualna propozycje po polsku, bez surowych JSON/statusow.
7. Student moze zaakceptowac albo odpowiedziec kontroferta.
8. Po uzgodnieniu ceny system tworzy kontrakt, umowy A/B i przechodzi do wspolnego flow platnosci.
9. Checkout pobiera uzgodniona kwote z DB/kontraktu, nie z frontendu.
10. Firma i student widza spojny status oraz nastepna akcje.

Negatywne przypadki:

- student nie moze zaakceptowac zlecenia bez aplikacji,
- firma nie moze zaakceptowac aplikacji do cudzego zlecenia,
- student nie moze zmienic ceny jednostronnie po zaakceptowaniu warunkow,
- firma nie moze przejsc do platnosci, jesli warunki/umowy nie sa uzgodnione,
- negocjacja nie moze ominac Student Impact jako strony umow i platnosci.

### E. Stripe I Payouty

Zweryfikowac:

- checkout nie ufa kwotom z frontendu,
- dla Custom Marketplace checkout bierze kwote z zaakceptowanych warunkow/kontraktu po negocjacji,
- checkout wymaga zaakceptowanych umow,
- checkout wymaga gotowego konta Stripe Connect, jesli `STRIPE_PAYOUTS_ENABLED=true`,
- webhook zapisuje event do kolejki,
- preview moze uzyc inline processing tylko dla `sk_test` i `VERCEL_ENV=preview`,
- production nie ma inline processing,
- payout nie probuje transferu, jesli konto Connect nie ma aktywnej capability `transfers`,
- bledy payoutow sa po polsku i operacyjne.

### F. Dokumenty I Umowy

Zweryfikowac:

- powstaja `contract_a` i `contract_b`,
- timestamps akceptacji sa zapisane,
- IP/signature metadata nie ginie, jesli jest wspierane przez schemat,
- dokumenty sa dostepne tylko wlasciwej stronie,
- brak surowych ID i nazw tabel w glownych widokach.

### G. UI / UX Produkcyjny

Przejsc widoki:

- `/auth`,
- `/app/profile`,
- `/app/company/packages`,
- `/app/company/jobs/new`,
- `/app/jobs`,
- `/app/offers/[id]`,
- `/app/company/applications`,
- `/app/applications`,
- `/app/company/orders`,
- `/app/company/orders/[id]`,
- `/app/deliverables/[id]`,
- `/app/finances`,
- dokumenty firmy/studenta.

Dla kazdego widoku sprawdzic:

- status po polsku,
- jedna najwazniejsza nastepna akcja,
- brak stack trace, JSON, surowych statusow typu `pending_student_confirmation`,
- brak nieczytelnych UUID w glownym flow,
- brak mojibake / uszkodzonych polskich znakow.

## 7. Co Claude Ma Zrobic Jesli Znajdzie Problem

- Jesli problem jest w kodzie UI/API: naprawic od razu i uruchomic testy.
- Jesli problem jest w DB schema/RLS: dodac selektywna migracje i zastosowac tylko ja na linked Supabase.
- Jesli problem jest w env/live secrets/DNS: nie zgadywac sekretow; opisac jako blocker i zostawic dokladna instrukcje dla wlasciciela.
- Jesli E2E nie pokrywa scenariusza: rozszerzyc `scripts/mvp-scenario-suite.mjs`.
- Jesli CI wymaga sekretow: wypisac dokladne nazwy sekretow, bez wartosci.

## 8. CI I Sekrety

Workflow:

```text
.github/workflows/mvp-e2e.yml
```

Wymagane GitHub Secrets:

```text
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
STRIPE_SECRET_KEY
STRIPE_PUBLISHABLE_KEY
STRIPE_WEBHOOK_SECRET
CRON_SECRET
TEST_COMPANY_EMAIL
TEST_COMPANY_PASSWORD
TEST_STUDENT_EMAIL
TEST_STUDENT_PASSWORD
```

Repo variable:

```text
E2E_BASE_URL=https://student-impact-q1f4e47rz-bartoszs-projects-216e6600.vercel.app
```

Jesli GitHub CLI nie jest zalogowany, Claude nie ustawi sekretow sam. Wtedy poprosic wlasciciela o `gh auth login` albo `GH_TOKEN` z uprawnieniami do secrets/actions.

## 9. Produkcyjne Blockery Do Zamkniecia Przed GO

Przed produkcja trzeba:

1. Ustawic live Stripe keys w Vercel Production.
2. Utworzyc live webhook Stripe dla:

```text
https://student2work.pl/api/stripe/webhook
```

Wymagane eventy:

```text
checkout.session.completed
checkout.session.expired
account.updated
charge.refunded
refund.created
```

3. Ustawic `STRIPE_WEBHOOK_SECRET` z live webhooka.
4. Ustawic `STRIPE_PAYOUTS_ENABLED=true`.
5. Ustawic `STRIPE_WEBHOOK_PROCESS_INLINE=false`.
6. Ustawic Upstash env dla rate limitingu.
7. Ustawic Sentry runtime DSN.
8. Poprawic DNS:

```text
A student2work.pl 76.76.21.21
```

9. Uruchomic:

```bash
npm run check:production -- --env-file=.vercel\env.production.local
```

Produkcji nie promowac, dopoki ten check nie przejdzie na zielono.

## 10. Definicja Sukcesu

Claude moze uznac zadanie za zakonczone tylko jesli:

- preview build i E2E przechodza,
- production readiness pokazuje tylko znane braki zewnetrzne albo przechodzi w calosci,
- kazdy nowy problem znaleziony w kodzie zostal naprawiony,
- flow Quick Task nie wymaga recznych zmian w DB po rozpoczeciu zlecenia,
- firma i student moga przejsc swoje kroki bez panelu admina,
- statusy, dokumenty, platnosci i payout sa spojne w UI i DB.
