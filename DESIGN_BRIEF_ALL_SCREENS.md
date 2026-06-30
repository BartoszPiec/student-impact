# Design Brief — mapa ekranów Student2Work

Brief dla Claude Design. Celem jest przygotowanie spójnych szablonów ekranów i komponentów UI dla aplikacji Student2Work, tak żeby później dało się je wdrożyć w istniejącym kodzie Next.js bez zmiany logiki biznesowej.

## 1. Kontekst

Student2Work to polska platforma B2B2C łącząca firmy ze studentami. Są trzy role:

- `student` — szuka zleceń, aplikuje, negocjuje, realizuje pracę, odbiera wypłaty.
- `company` — kupuje pakiety usług, publikuje oferty, wybiera studenta, akceptuje prace.
- `admin` — moderuje platformę, zarządza ofertami, użytkownikami, umowami, sporami i finansami.

Projekt musi zachować obecny model produktu:

- firma nie pracuje bezpośrednio ze studentem poza platformą,
- płatności i escrow są server-side,
- umowy są podpisywane przez obie strony,
- UI i komunikaty są po polsku,
- aplikacja ma charakter operacyjny, nie marketingowy.

## 2. Główne flow, które design musi pokryć

### Firma — Quick Task

1. Firma wchodzi w katalog pakietów.
2. Ogląda kartę pakietu i szczegóły usługi.
3. Wybiera wariant lub personalizuje pakiet.
4. Składa zamówienie / zapytanie.
5. Negocjuje warunki ze studentem lub czeka na przypisanie.
6. Akceptuje umowę i zasila escrow.
7. Odbiera pracę, akceptuje albo zgłasza problem.
8. Wystawia opinię i widzi dokumenty.

### Firma — Marketplace

1. Firma tworzy ofertę zlecenia lub stażu.
2. Widzi swoje ogłoszenia i statystyki aplikacji.
3. Otwiera listę aplikacji do oferty.
4. Akceptuje, odrzuca albo negocjuje zgłoszenie.
5. Po wyborze studenta przechodzi do panelu realizacji.

### Student

1. Student przegląda giełdę zleceń.
2. Otwiera szczegóły oferty.
3. Aplikuje, podaje wiadomość, CV i proponowaną stawkę.
4. Śledzi aplikacje, zapisane oferty i wymagane akcje.
5. Przyjmuje lub odrzuca kontrofertę.
6. Realizuje pracę w panelu zlecenia.
7. Wysyła pliki, uzupełnia zasoby/sekrety, komunikuje się przez chat.
8. Po zakończeniu widzi finanse, dokumenty i wystawia opinię.

### Admin

1. Widzi dashboard operacyjny.
2. Kontroluje oferty, użytkowników, aplikacje i usługi systemowe.
3. Obsługuje spory i legal vault.
4. Kontroluje księgę finansową, faktury, wypłaty, PIT i eksporty.

## 3. Szablony globalne

Claude Design powinien przygotować bazowy system dla tych elementów:

- `App Shell` — desktop top nav + mobile drawer + mobile bottom nav.
- `PremiumPageHeader` — ciemny nagłówek strony z badge, tytułem, opisem, ikoną i akcjami.
- `List Toolbar` — wyszukiwarka, filtry, sortowanie, zakładki, licznik wyników.
- `Action Required Card` — karta wymagająca decyzji, z banerem, ringiem, paskiem statusu i CTA.
- `Entity Card` — karta oferty, pakietu, aplikacji, zamówienia, dokumentu, użytkownika.
- `Detail Page Layout` — hero/snapshot u góry, treść główna, boczny panel akcji.
- `Workspace Tabs` — status, pliki, sekrety, chat.
- `Empty State` — brak danych, brak wyników, brak uprawnień.
- `Error State` — błąd ładowania, brak dostępu, nie znaleziono obiektu.
- `Loading/Skeleton` — listy, szczegóły, formularze, chat.
- `Modal/Sheet` — aplikowanie, płatność, review, confirm destructive action.
- `Toast` — sukces, błąd, ostrzeżenie, info.

## 4. Ekrany publiczne i wejściowe

### `/`

Landing publiczny. Ma wyjaśniać wartość platformy, ale pierwszy ekran powinien prowadzić do realnych akcji: rejestracja firmy, rejestracja studenta, przegląd usług/ofert.

Designer powinien pokryć:

- hero z jasnym podziałem dla firmy i studenta,
- sekcję kategorii usług Quick Task,
- sekcję „jak działa escrow / bezpieczeństwo”,
- CTA do logowania/rejestracji,
- wariant mobile.

### `/auth` i `/app/auth`

Logowanie/rejestracja Supabase Auth.

Designer powinien pokryć:

- wybór lub kontekst roli: student / firma,
- formularz logowania,
- formularz rejestracji,
- zgody: regulamin, polityka prywatności, marketing opcjonalnie,
- błędy walidacji po polsku,
- stan po wysłaniu linku / potwierdzeniu.

### `/app/onboarding`

Pierwsze ustawienie profilu po rejestracji.

Designer powinien pokryć:

- wybór roli lub potwierdzenie roli,
- minimalne dane firmy,
- minimalne dane studenta,
- kroki postępu,
- stan blokujący, jeśli profil jest niekompletny.

### `/regulamin`, `/polityka-prywatnosci`

Strony prawne.

Designer powinien pokryć:

- czytelny layout dokumentu,
- spis treści,
- wersję mobilną,
- linki powrotu do rejestracji/aplikacji.

## 5. Panel firmy

### `/app/company/packages`

Katalog usług Quick Task. To jest główny ekran MVP dla firmy.

Funkcje:

- lista/kafelki pakietów usług,
- kategorie i filtrowanie,
- wyszukiwarka,
- sortowanie,
- wyróżnienie rekomendowanych pakietów,
- CTA do szczegółów pakietu i zamówienia.

Szablony:

- karta pakietu,
- pasek kategorii,
- pusty stan po filtrach,
- karta „stwórz własne zlecenie”.

### `/app/company/packages/[id]`

Szczegóły pakietu.

Funkcje:

- opis usługi,
- warianty cenowe,
- zakres dostawy,
- proces realizacji,
- FAQ, opinie, porównanie rynkowe,
- CTA: zamów, personalizuj, wróć do katalogu.

Szablony:

- detail hero pakietu,
- pricing cards S/M/L,
- timeline procesu,
- sekcje porównania i FAQ,
- sticky CTA na mobile.

### `/app/company/packages/[id]/customize`

Personalizacja pakietu.

Funkcje:

- formularz wymagań,
- wybór wariantu,
- dodatkowe opcje,
- podsumowanie ceny i terminu,
- wysłanie zapytania/zamówienia.

Szablony:

- wizard lub formularz z bocznym podsumowaniem,
- stan błędów walidacji,
- stan sukcesu.

### `/app/company/offers`

Moje ogłoszenia firmy.

Funkcje:

- zakładki: ogłoszenia marketplace, usługi systemowe, zamówienia usług,
- karta oferty ze statystykami aplikacji,
- statusy: draft, published, archived, accepted, in progress, completed,
- akcje: zobacz, edytuj, aplikacje, realizacja.

Szablony:

- karta ogłoszenia,
- karta aktywnej realizacji,
- karta zakończona,
- puste stany dla każdej zakładki.

### `/app/company/offers/[id]`

Szczegóły oferty po stronie firmy.

Funkcje:

- kontekst oferty,
- lista aplikacji,
- status wyboru studenta,
- link do edycji,
- link do realizacji, jeśli wybrano studenta.

Szablony:

- detail header oferty,
- sekcja aplikacji z kartami,
- stan bez aplikacji,
- stan z zaakceptowanym studentem.

### `/app/company/offers/[id]/edit`

Edycja oferty.

Funkcje:

- formularz danych oferty,
- budżet/widełki,
- lokalizacja/praca zdalna,
- technologie/kategorie,
- opis i wymagania,
- publikacja lub zapis jako draft.

Szablony:

- pełny formularz edycji,
- walidacja,
- confirmation przed opuszczeniem ze zmianami.

### `/app/company/jobs/new`

Tworzenie oferty marketplace.

Funkcje:

- wizard tworzenia ogłoszenia,
- kroki: podstawy, zakres, budżet, wymagania, publikacja,
- rozróżnienie typów: micro task, job/internship,
- preview oferty.

Szablony:

- wizard krokowy,
- formularze pól długich,
- preview card,
- success state po publikacji.

### `/app/company/applications`

Aplikacje do ofert firmy.

Funkcje:

- lista zgłoszeń studentów,
- decyzje: akceptuj, odrzuć, negocjuj,
- porównanie budżetu firmy i propozycji studenta,
- wiadomość studenta i CV,
- link do chatu.

Szablony:

- karta `sent` — nowe zgłoszenie,
- karta `sent` z inną proponowaną stawką,
- karta `countered` — firma wysłała kontrofertę,
- karta zaakceptowana,
- karta odrzucona,
- karta w realizacji.

Uwaga: istnieje osobny brief `DESIGN_BRIEF_COMPANY_APPLICATIONS.md`, który uszczegóławia właśnie tę kartę.

### `/app/company/orders`

Zamówienia usług Quick Task po stronie firmy.

Funkcje:

- lista zamówień z katalogu,
- negocjacje ceny/zakresu,
- statusy realizacji,
- wymagane akcje firmy,
- link do workspace.

Szablony:

- karta zamówienia wymagająca akcji,
- karta oczekująca na studenta,
- karta w realizacji,
- karta dostarczona do odbioru,
- karta zakończona/anulowana.

### `/app/company/orders/[id]`

Szczegóły zamówienia firmy.

Funkcje:

- snapshot zamówienia,
- wymagania,
- status escrow/umowy,
- akcje: akceptuj, zasil depozyt, odbierz pracę, zgłoś problem,
- linki do dokumentów i chatu.

Szablony:

- detail page z bocznym panelem akcji,
- stan przed podpisaniem umowy,
- stan przed płatnością,
- stan delivered,
- stan disputed/completed.

### `/app/company/documents`

Dokumenty firmy.

Funkcje:

- lista umów i faktur,
- download PDF,
- status podpisów,
- filtrowanie po zamówieniu/statusie.

Szablony:

- tabela dokumentów,
- karta dokumentu na mobile,
- puste stany,
- status badges.

### `/app/company/review/[applicationId]` i `/done`

Ocena studenta po zakończeniu.

Funkcje:

- formularz oceny,
- gwiazdki/kryteria,
- komentarz,
- stan ukończenia.

Szablony:

- review form,
- confirmation done.

## 6. Panel studenta

### `/app/jobs`

Giełda zleceń.

Funkcje:

- lista ofert,
- filtry: kategoria, typ, zdalnie/lokalnie, technologie, stawka,
- status aplikowania,
- paginacja,
- CTA do szczegółów.

Szablony:

- karta oferty,
- toolbar filtrów,
- empty state,
- already applied state.

### `/app/offers/[id]`

Szczegóły oferty dla studenta.

Funkcje:

- hero z nazwą firmy i stawką,
- opis oferty,
- wymagania/milestones,
- zapisanie oferty,
- aplikowanie.

Szablony:

- offer detail,
- apply card,
- saved/unsaved button,
- unavailable/closed state.

### `/app/applications`

Moje aplikacje studenta.

Funkcje:

- zakładki: wymagają akcji, oczekują na firmę, zapisane, do oceny, archiwum,
- karta aplikacji,
- akceptacja/odrzucenie kontroferty,
- przejście do realizacji,
- status negocjacji.

Szablony:

- karta `sent` — czeka na firmę,
- karta `countered` — wymagana decyzja studenta,
- karta `in_progress`,
- karta `done` do oceny,
- karta rejected/cancelled,
- karta zapisanej oferty.

### `/app/saved`

Zapisane oferty.

Funkcje:

- lista zapisanych ofert,
- usuń z zapisanych,
- przejdź do szczegółów,
- empty state.

Szablony:

- saved offer card,
- empty saved list.

### `/app/services/my`

Usługi wystawione przez studenta.

Funkcje:

- lista własnych pakietów usług,
- status aktywna/ukryta,
- akcje: edytuj, podgląd, wyłącz,
- CTA do dodania usługi.

Szablony:

- karta własnej usługi,
- empty state,
- action menu.

### `/app/services/new` i `/app/services/[id]/edit`

Tworzenie/edycja usługi studenta.

Funkcje:

- nazwa, opis, kategoria,
- cena, termin,
- zakres dostawy,
- opcjonalne warianty,
- zapis/publikacja.

Szablony:

- service form,
- validation,
- preview card.

### `/app/services/dashboard`

Pulpit zleceń studenta z katalogu usług.

Funkcje:

- przychodzące zapytania/zamówienia,
- negocjacje,
- statusy realizacji,
- wymagane akcje studenta,
- przejście do workspace.

Szablony:

- karta zlecenia wymagająca decyzji,
- karta w realizacji,
- karta delivered/completed,
- filtry statusów.

### `/app/services/dashboard/[id]`

Szczegóły zlecenia usługowego dla studenta.

Funkcje i szablony analogiczne do workspace realizacji, ale w kontekście usługi studenta.

### `/app/finances`

Finanse studenta.

Funkcje:

- saldo / wypłaty / przychody,
- dokumenty finansowe,
- onboarding Stripe Connect,
- wykres przychodów,
- informacje PIT.

Szablony:

- finance dashboard,
- chart card,
- document panel,
- Stripe onboarding states: missing, pending, ready.

### `/app/review/[applicationId]`

Ocena firmy po zakończeniu.

Funkcje:

- formularz oceny firmy,
- komentarz,
- confirmation.

Szablony:

- review form dla studenta.

## 7. Ekrany wspólne

### `/app/deliverables/[id]`

Najważniejszy workspace realizacji. Używany przez firmę i studenta.

Funkcje:

- header z nazwą zlecenia, wartością, statusem i następną akcją,
- zakładki: Status, Pliki, Sekrety, Chat,
- status umów i milestones,
- podpisy umów,
- płatność/escrow,
- upload deliverables,
- odbiór pracy,
- feedback/revision/dispute,
- opinie po zakończeniu.

Szablony:

- workspace header,
- milestone timeline,
- contract acceptance card,
- escrow/payment card,
- deliverable upload form,
- delivered work review card,
- revision/dispute state,
- completed state,
- tabs responsive.

### `/app/chat`

Lista rozmów.

Funkcje:

- sidebar rozmów,
- ostatnia wiadomość,
- unread badge,
- filtrowanie lub wyszukiwanie,
- empty state.

Szablony:

- chat list desktop,
- chat list mobile,
- empty conversation state.

### `/app/chat/[id]`

Rozmowa.

Funkcje:

- nagłówek rozmowy z kontekstem oferty/zamówienia,
- wiadomości tekstowe,
- załączniki,
- eventy systemowe,
- karty ofert/stawek/terminów,
- zgłoszenie problemu,
- input wiadomości.

Szablony:

- message bubbles: moje/cudze/system,
- file attachment bubble,
- rate/deadline/inquiry card,
- sticky input,
- mobile full-screen chat.

### `/app/profile`

Profil zalogowanego użytkownika.

Funkcje:

- wariant student i wariant firma,
- procent uzupełnienia profilu,
- edycja danych,
- skills, edukacja, doświadczenie, linki,
- dane podatkowe studenta,
- Stripe onboarding,
- opinie.

Szablony:

- profile hero,
- completion card,
- form sections,
- stats cards,
- public preview hint,
- company profile form,
- student profile form.

### `/app/notifications`

Powiadomienia.

Funkcje:

- lista powiadomień,
- unread/read,
- akcje: oznacz jako przeczytane, przejdź do obiektu,
- empty state.

Szablony:

- notification item,
- unread highlight,
- empty state.

### `/app/cancel/[id]`

Anulowanie współpracy/zlecenia.

Funkcje:

- powód anulowania,
- ostrzeżenie o skutkach,
- potwierdzenie.

Szablony:

- destructive confirmation page,
- textarea reason,
- final confirmation.

### `/app/companies/[id]` i `/app/students/[id]`

Publiczne profile w aplikacji.

Funkcje:

- profil firmy/studenta,
- podstawowe dane,
- oceny,
- projekty/oferty,
- linki i portfolio.

Szablony:

- public profile hero,
- reviews section,
- project list,
- unavailable/private state.

## 8. Panel admina

### `/app/admin` i `/app/admin/analytics`

Dashboard i analityka.

Funkcje:

- KPI,
- funnel,
- aktywność platformy,
- statusy ofert/zleceń/finansów.

Szablony:

- admin dashboard,
- KPI cards,
- chart cards,
- filters/date range.

### `/app/admin/offers` i `/app/admin/offers/[id]`

Moderacja ofert.

Funkcje:

- lista ofert,
- statusy,
- kontekst firmy,
- aplikacje,
- kontrakty z oferty,
- akcje moderacyjne.

Szablony:

- admin table,
- offer detail,
- application summary cards.

### `/app/admin/users` i `/app/admin/users/[id]`

Zarządzanie użytkownikami.

Funkcje:

- lista użytkowników,
- role,
- profile,
- status weryfikacji,
- szczegóły aktywności.

Szablony:

- users table,
- user detail,
- verification/status badges.

### `/app/admin/contracts` i `/app/admin/contracts/[id]`

Umowy.

Funkcje:

- lista kontraktów,
- status podpisów,
- milestones,
- PDF dokumenty,
- szczegóły kontraktu.

Szablony:

- contracts table,
- contract detail,
- document cards.

### `/app/admin/disputes`

Spory.

Funkcje:

- lista sporów,
- statusy: open, under review, resolved,
- dowody,
- decyzja admina.

Szablony:

- disputes table,
- dispute detail/workspace,
- resolution panel.

### `/app/admin/system-services`

Usługi systemowe.

Funkcje:

- lista pakietów Quick Task zarządzanych przez platformę,
- aktywne/archiwalne/wszystkie,
- edycja prowizji,
- status aktywności,
- tworzenie i edycja usługi.

Szablony:

- service admin card,
- filters,
- system service form,
- commission editor.

### `/app/admin/finance/*`, `/app/admin/payouts`, `/app/admin/pit`, `/app/admin/exports`

Finanse i compliance.

Funkcje:

- księga transakcji,
- faktury,
- okresy rozliczeniowe,
- wypłaty,
- PIT,
- eksport CSV/ZIP.

Szablony:

- finance dashboard,
- ledger table,
- invoice table,
- payouts action table,
- PIT dashboard,
- exports panel.

### `/app/admin/vault`

Legal Vault.

Funkcje:

- archiwum dokumentów prawnych,
- dokumenty kontraktów,
- statusy akceptacji,
- download.

Szablony:

- vault table,
- document row actions.

## 9. Statusy, które muszą mieć warianty UI

### Aplikacje i marketplace

- `sent` — nowe zgłoszenie, czeka na firmę.
- `countered` — negocjacja, wymagana decyzja drugiej strony.
- `accepted` — student wybrany, przejście do kontraktu/realizacji.
- `in_progress` — praca trwa.
- `completed` — zakończone.
- `rejected` — odrzucone.
- `cancelled` — anulowane.

### Zlecenia i deliverables

- `pending_assignment` / `pending` — oczekuje.
- `awaiting_contract` — trzeba podpisać umowę.
- `awaiting_funding` — firma musi zasilić escrow.
- `funded` / `in_progress` — realizacja trwa.
- `delivered` — student dostarczył pracę, firma musi odebrać.
- `revision` — poprawki.
- `disputed` — spór.
- `completed` — zakończone.
- `cancelled` — anulowane.

### Dokumenty i płatności

- umowa niepodpisana,
- podpisana przez firmę,
- podpisana przez studenta,
- podpisana przez obie strony,
- escrow nieopłacone,
- escrow aktywne,
- payout pending,
- payout paid,
- payment/refund failed.

## 10. Priorytety dla Claude Design

### P0 — krytyczne dla MVP

1. Firma: katalog pakietów, szczegóły pakietu, personalizacja/zamówienie.
2. Firma: moje ogłoszenia, aplikacje do ofert, zamówienia usług.
3. Student: giełda zleceń, szczegóły oferty, aplikowanie, moje aplikacje.
4. Wspólne: workspace realizacji, chat, profile, onboarding.
5. Globalne: action required system, empty/error/loading states.

### P1 — operacyjne i compliance

1. Dokumenty firmy/studenta.
2. Finanse studenta.
3. Review flow.
4. Cancel/dispute states.
5. Powiadomienia.

### P2 — admin

1. Admin dashboard.
2. Oferty/użytkownicy/kontrakty/spory.
3. Finanse, PIT, eksporty.
4. Usługi systemowe.

## 11. Wymagania techniczne dla designu

- Projekt ma bazować na Tailwind + shadcn/ui.
- Komponenty powinny mieć warianty desktop i mobile.
- Nie projektować landing page jako głównego doświadczenia aplikacji; najważniejszy jest produkt operacyjny.
- Trzymać polskie etykiety i komunikaty.
- Każda lista powinna mieć: loading, empty, error, filtered empty.
- Każdy formularz powinien mieć: default, focused, error, disabled, submitting, success.
- Każda akcja finansowa/prawna powinna mieć confirmation state.
- Karty wymagające akcji muszą być mocno odróżnione od kart informacyjnych.
- Tabele admina muszą mieć wersję mobile jako karty lub responsywny układ.

## 12. Minimalny deliverable od Claude Design

1. Design system mini-kit:
   - nagłówki stron,
   - karty,
   - badge statusów,
   - przyciski,
   - formularze,
   - tabele,
   - tabs,
   - modale/sheety.
2. Mockupy P0:
   - `/app/company/packages`,
   - `/app/company/packages/[id]`,
   - `/app/company/orders`,
   - `/app/company/offers`,
   - `/app/company/applications`,
   - `/app/jobs`,
   - `/app/offers/[id]`,
   - `/app/applications`,
   - `/app/deliverables/[id]`,
   - `/app/chat/[id]`,
   - `/app/profile`,
   - `/app/onboarding`.
3. Tabela statusów:
   - status,
   - kolor,
   - badge label,
   - ikona,
   - czy wymaga akcji,
   - główne CTA,
   - komunikat banera.
4. Responsive rules:
   - desktop,
   - tablet,
   - mobile,
   - sticky actions.
5. Specyfikacja copy:
   - nazwy ekranów,
   - CTA,
   - komunikaty błędów,
   - empty states.
