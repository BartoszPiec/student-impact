# Offer Creation UX + Data Plan

Date: 2026-03-28
Status: planned
Owner: Codex

## Cel

Domknac dwa watki naraz:
- szybki UX polish kreatora ogloszen firmy, bo aktualny ekran jest czytelny funkcjonalnie, ale wizualnie odstaje od reszty produktu
- repo-grounded decyzje o tym, jakie dane zbierac przy tworzeniu ogloszenia, zeby ulatwic wspolprace i nie zostawic dziur prawnych/logicznych przy przejsciu do applications -> contracts -> documents

## Co mamy dzisiaj w repo

### UI

Aktualny kreator:
- `app/app/company/jobs/new/page.tsx`
- `app/app/company/jobs/new/job-creation-wizard.tsx`
- `app/app/company/jobs/new/new-offer-form.tsx`

Widoczne problemy:
- lokalny miks typografii (`font-[Inter]`, agresywne uppercase + tracking)
- kontrast opisow i placeholderow jest nierowny
- wystepuje mojibake / debt encodingu w tekscie UI
- formularz jest gesty, ale nie hierarchizuje wyraznie danych "co to jest", "po co", "jak ocenimy wynik"

### Data / action layer

Aktualny zapis oferty:
- `app/app/company/jobs/new/_actions.ts`

Aktualnie zapisywane pola:
- `typ`
- `is_platform_service`
- `tytul`
- `kategoria`
- `opis`
- `technologies`
- `stawka`
- `salary_range_min`
- `salary_range_max`
- `contract_type`
- `location`
- `is_remote`
- `czas`
- `obligations`
- `wymagania`
- `benefits`

## Najwazniejsze ryzyka logiczne

### 1. "Contract type" moze obiecywac wiecej niz platforma realnie dowozi

Aktualne opcje:
- `B2B`
- `UoP`
- `UZ`
- `Staz`

Ryzyko:
- jesli platforma nie ma pelnego workflow dla `UoP`, to formularz tworzy oczekiwanie, ktore nie ma pelnego pokrycia w logice dalszych flow, dokumentach i odpowiedzialnosci operacyjnej

Wniosek:
- to wymaga osobnego audytu przed dalszym rozszerzaniem formularza

### 2. Brak osobnego miejsca na brief wspolpracy

Aktualny model ma `opis` i w mikro `obligations`, ale brakuje jawnych pol:
- po co zlecenie powstaje
- co jest rezultatem koncowym
- jak wyglada akceptacja pracy
- jakie materialy i ograniczenia daje firma

Skutek:
- wiecej doprecyzowania spada pozniej na chat / negocjacje / workspace

### 3. Brak jawnych sygnalow prawnych i operacyjnych

Brakuje informacji typu:
- czy jest wymagane przeniesienie praw autorskich
- czy wykonawca moze pokazywac efekt w portfolio
- czy projekt dotyczy materialow/licencji dostarczonych przez firme
- czy projekt dotyka danych osobowych lub dostepow do kont
- kto po stronie firmy akceptuje efekt

To sa dane, ktore nie zawsze musza stac sie finalnie polami w `offers`, ale musza byc swiadomie rozdzielone na:
- dane do briefu
- dane do kontraktu
- dane do compliance / manual review

## Rekomendowana kolejnosc

### Faza 0 — QA jako priorytet

Dodajemy QA do stalej listy priorytetow dla flow:
- firma tworzy oferte
- student aplikuje
- powstaje kontrakt
- generuja sie dokumenty
- dokumenty trafiaja do student/company/admin surfaces

Minimalny QA scope:
- smoke dla `company/jobs/new`
- smoke dla `offers -> applications -> contracts`
- smoke dla `contract_documents` i `invoices`

### Faza 1 — UX polish kreatora ogloszen

Bez migracji.

Cel:
- poprawic czytelnosc i spojnosc z reszta produktu

Scope:
- usunac lokalne wymuszanie fontu i przywrocic typografie zgodna z reszta app
- zmniejszyc nadmiar `uppercase` i `tracking`
- poprawic kontrast i placeholdery
- uporzadkowac mikrocopy i naprawic encoding debt
- wyeksponowac lepiej roznice miedzy:
  - czym jest zlecenie
  - jaki jest cel
  - jaki ma byc rezultat
  - jakie sa warunki wspolpracy

### Faza 2 — Audit danych do wspolpracy i umow

Evidence-first audit z Claude.

Pytania:
- ktore pola powinny nalezec do `offers`
- ktore pola powinny nalezec do `company_profiles`
- ktore pola powinny powstac dopiero na etapie `application / contract snapshot`
- czy `contract_type` ma dzisiaj sens w obecnym modelu
- jakie pola musimy zebrac dla `is_platform_service = true`
- gdzie sa potencjalne luki prawne / odpowiedzialnosciowe

### Faza 3 — Offer Brief v2

Po audycie dzielimy pola na 3 warstwy:

#### A. Pola briefu wspolpracy
- `cel_wspolpracy`
- `oczekiwany_rezultat`
- `kryteria_akceptacji`
- `materialy_wejsciowe`
- `osoba_prowadzaca`

#### B. Pola prawno-operacyjne
- `czy_przeniesienie_praw_autorskich`
- `czy_portfolio_do_zwolenia`
- `czy_poufnosc`
- `czy_dane_osobowe`
- `czy_dostepy_do_kont`
- `czy_materialy_firmy_sa_legalnie_udostepnione`

#### C. Dane, ktorych nie duplikujemy w ofercie
- dane identyfikacyjne firmy
- dane podatkowe i rozliczeniowe
- dane osobowe stron
- dane stricte kontraktowe generowane przy finalizacji wspolpracy

## Co powinno trafic do formularza juz na pewno

### Wersja "safe, high ROI"

Mozna rozwazyc nawet bez duzej przebudowy modelu:
- `cel_wspolpracy`
- `oczekiwany_rezultat`
- `kryteria_akceptacji`
- `materialy_wejsciowe`

To sa pola, ktore najmocniej zmniejszaja chaos w dalszej wspolpracy.

## Co wymaga szczegolnej ostroznosci

- `UoP` jako opcja bez pelnego workflow prawnego
- przetwarzanie danych osobowych przez studenta
- dostepy do kont / paneli / systemow zewnetrznych
- prawa autorskie i portfolio

## Rekomendowany nastepny praktyczny krok

1. UX polish `company/jobs/new`
2. Audit z Claude o field matrix + legal logic
3. Decyzja:
   - co wchodzi bez migracji
   - co wymaga migracji
   - co ma byc tylko flagiem do manual review
