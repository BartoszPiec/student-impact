# Sprint Entry Guide - 2026-04-08

Ten plik jest krótkim przewodnikiem wejściowym do nowego sprintu.
Ma pomóc szybko zrozumieć:

- jak uruchomić i sprawdzić system lokalnie
- gdzie poruszać się po plikach
- jak bezpiecznie logować się do aplikacji
- jak współpracować z Claude
- które wewnętrzne pliki są źródłem prawdy przy planowaniu i weryfikacji zmian

## 1. Start w 10 minut

Kolejność wejścia:

1. Przeczytaj [SPRINT_LIVE_BOARD.md](/C:/Users/Bartosz%20i%20Natalia/Desktop/Student-impact-antygraviti/SPRINT_LIVE_BOARD.md).
2. Przeczytaj [SPRINT_COMMAND_CENTER_2026-03-26.md](/C:/Users/Bartosz%20i%20Natalia/Desktop/Student-impact-antygraviti/SPRINT_COMMAND_CENTER_2026-03-26.md).
3. Przeczytaj [CLAUDE_COLLAB_INSTRUCTIONS.md](/C:/Users/Bartosz%20i%20Natalia/Desktop/Student-impact-antygraviti/CLAUDE_COLLAB_INSTRUCTIONS.md).
4. Przeczytaj [CHAT_REPORT_TEMPLATES.md](/C:/Users/Bartosz%20i%20Natalia/Desktop/Student-impact-antygraviti/CHAT_REPORT_TEMPLATES.md).
5. Na koniec przeczytaj [AGENT_NOTEBOOK.md](/C:/Users/Bartosz%20i%20Natalia/Desktop/Student-impact-antygraviti/AGENT_NOTEBOOK.md).

Ta kolejność jest ważna:

- `SPRINT_LIVE_BOARD.md` = kanoniczny live status sprintu
- `SPRINT_COMMAND_CENTER_2026-03-26.md` = baseline, priorytety i model pracy
- `CLAUDE_COLLAB_INSTRUCTIONS.md` = kontrakt współpracy z Claude
- `CHAT_REPORT_TEMPLATES.md` = format raportów i handoffów
- `AGENT_NOTEBOOK.md` = pamięć długoterminowa, nie live board

## 2. Uruchomienie lokalne

Repo to aplikacja `Next.js 16` z `Supabase` i `Stripe`.

Najważniejsze komendy:

```powershell
npm install
npm run dev
```

Jeżeli lokalnie zniknie `next` albo `node_modules` będzie puste:

```powershell
npm install
```

Do szybkiej walidacji TypeScript:

```powershell
npx.cmd tsc --noEmit
```

Do pełniejszej walidacji przed większym zamknięciem batcha:

```powershell
npm run build
```

Domyślny lokalny adres:

- `http://localhost:3000`

Jeżeli port `3000` jest zajęty, Next może podnieść się na `3001`.

## 3. Logowanie do systemu

Ekran logowania jest w:

- [app/auth/page.tsx](/C:/Users/Bartosz%20i%20Natalia/Desktop/Student-impact-antygraviti/app/auth/page.tsx)

Ścieżka w aplikacji:

- `/auth`

Rejestracja z preselected rolą:

- `/auth?role=company`
- `/auth?role=student`

Zasady:

- używaj dedykowanych kont QA, nie prywatnych kont roboczych
- danych logowania nie zapisujemy w repo
- haseł i tokenów nie wklejamy do chatów ani do markdownów sprintowych
- jeśli konto QA nie działa, użyj resetu hasła z poziomu `/auth`, a nie ręcznego patchowania flow w połowie testu

Techniczny kontekst auth:

- klient przeglądarkowy Supabase: [client.ts](/C:/Users/Bartosz%20i%20Natalia/Desktop/Student-impact-antygraviti/lib/supabase/client.ts)
- klient serwerowy Supabase: [server.ts](/C:/Users/Bartosz%20i%20Natalia/Desktop/Student-impact-antygraviti/lib/supabase/server.ts)
- lokalne env: `.env.local`

Nie wolno:

- commitować `.env.local`
- przenosić `service_role` do `NEXT_PUBLIC_*`
- wpisywać sekretów do dokumentów sprintowych

## 4. Jak poruszać się po repo

Najprostsza mapa katalogów:

- `app/` = routing i główne widoki aplikacji
- `components/` = współdzielone komponenty UI
- `lib/` = logika domenowa, helpery i integracje
- `supabase/migrations/` = zmiany schematu i data patches
- `types/` = typy współdzielone
- pliki `SPRINT_*`, `CLAUDE_*`, `*_PLAN.md`, `*_CHECKLIST.md` = dokumentacja operacyjna sprintu

Najważniejszy podział w `app/`:

- `app/auth` = logowanie i rejestracja
- `app/app` = wszystko po zalogowaniu

Szybkie ścieżki domenowe:

- firma: `app/app/company/...`
- student: `app/app/...`
- admin: `app/app/admin/...`
- oferty publiczne: `app/app/offers/...`
- workspace / realizacja: `app/app/deliverables/...`

## 5. Gdzie leżą zmiany dla usług systemowych

Jeżeli pracujemy nad usługami systemowymi, czyli domyślnymi pakietami platformy, najważniejsze pliki są tutaj:

- lista pakietów firmy: [page.tsx](/C:/Users/Bartosz%20i%20Natalia/Desktop/Student-impact-antygraviti/app/app/company/packages/page.tsx)
- strona główna pojedynczego pakietu: [page.tsx](/C:/Users/Bartosz%20i%20Natalia/Desktop/Student-impact-antygraviti/app/app/company/packages/[id]/page.tsx)
- ekran konfiguracji firmy: [page.tsx](/C:/Users/Bartosz%20i%20Natalia/Desktop/Student-impact-antygraviti/app/app/company/packages/[id]/customize/page.tsx)
- formularz briefu i wariantów: [customize-form.tsx](/C:/Users/Bartosz%20i%20Natalia/Desktop/Student-impact-antygraviti/app/app/company/packages/[id]/customize/customize-form.tsx)
- zapis / update oferty: [_actions.ts](/C:/Users/Bartosz%20i%20Natalia/Desktop/Student-impact-antygraviti/app/app/company/packages/_actions.ts)
- logika briefu pakietów: [package-customization.ts](/C:/Users/Bartosz%20i%20Natalia/Desktop/Student-impact-antygraviti/lib/services/package-customization.ts)
- adminowy katalog usług systemowych: [page.tsx](/C:/Users/Bartosz%20i%20Natalia/Desktop/Student-impact-antygraviti/app/app/admin/system-services/page.tsx)

Dodatkowo:

- dane i poprawki treści często siedzą także w `supabase/migrations/`
- dla tego typu zmian trzeba patrzeć jednocześnie na kod i na rekord pakietu w bazie

## 6. Jak sprawdzać zmiany tego typu

Przy zmianach w ofertach / pakietach systemowych pracuj według tej kolejności:

1. Ustal, czy zmiana dotyczy usługi systemowej, a nie oferty firmy lub usługi studenta.
2. Sprawdź widok firmy na stronie produktu:
   [page.tsx](/C:/Users/Bartosz%20i%20Natalia/Desktop/Student-impact-antygraviti/app/app/company/packages/[id]/page.tsx)
3. Sprawdź widok briefu / konfiguracji:
   [customize/page.tsx](/C:/Users/Bartosz%20i%20Natalia/Desktop/Student-impact-antygraviti/app/app/company/packages/[id]/customize/page.tsx)
4. Sprawdź, czy zapis opiera się o ten sam `form_schema`:
   [package-customization.ts](/C:/Users/Bartosz%20i%20Natalia/Desktop/Student-impact-antygraviti/lib/services/package-customization.ts)
   [\_actions.ts](/C:/Users/Bartosz%20i%20Natalia/Desktop/Student-impact-antygraviti/app/app/company/packages/_actions.ts)
5. Sprawdź migrację albo patch danych dla tego pakietu w `supabase/migrations/`.
6. Uruchom lokalnie aplikację i przejdź realny flow jako firma.
7. Potwierdź TypeScript:
   `npx.cmd tsc --noEmit`
8. Przy większej zmianie uruchom:
   `npm run build`

Jeżeli dochodzi warstwa studencka:

- sprawdź, czy instrukcja dla studenta nie miesza się z widokiem firmy
- jeśli treść jest data-driven, sprawdź `locked_content` albo analogiczne pole źródłowe

## 7. Współpraca z Claude

Źródło zasad:

- [CLAUDE_COLLAB_INSTRUCTIONS.md](/C:/Users/Bartosz%20i%20Natalia/Desktop/Student-impact-antygraviti/CLAUDE_COLLAB_INSTRUCTIONS.md)

Model pracy:

- Codex = owner sprintu i główny integrator
- Claude = planner, verifier, auditor, comparator, handoff writer
- Bartosz = decyzje końcowe, akceptacja priorytetów, approval środowiskowy

Najważniejsze zasady:

- `SPRINT_LIVE_BOARD.md` wygrywa przy konflikcie informacji
- główne repo wygrywa z osobnymi worktree Claude
- Claude nie powinien szeroko implementować w tym samym scope plików, które aktywnie zmienia Codex, chyba że dostanie wyraźnie ograniczony zakres
- Claude ma raportować krótko, konkretnie i z dowodami
- każda większa odpowiedź powinna rozdzielać `CONFIRMED`, `RISK`, `BLOCKER`, `RECOMMENDATION` albo trzymać się template
- założenia mają być oznaczane jako `INFERENCE`

Nie traktuj jako source of truth:

- `.claude/worktrees/...`

To materiał referencyjny, nie zmergowany stan repo.

## 8. Wewnętrzne pliki operacyjne, które naprawdę warto znać

### Źródła prawdy sprintu

- [SPRINT_LIVE_BOARD.md](/C:/Users/Bartosz%20i%20Natalia/Desktop/Student-impact-antygraviti/SPRINT_LIVE_BOARD.md)
- [SPRINT_COMMAND_CENTER_2026-03-26.md](/C:/Users/Bartosz%20i%20Natalia/Desktop/Student-impact-antygraviti/SPRINT_COMMAND_CENTER_2026-03-26.md)
- [AGENT_NOTEBOOK.md](/C:/Users/Bartosz%20i%20Natalia/Desktop/Student-impact-antygraviti/AGENT_NOTEBOOK.md)

### Współpraca i raportowanie

- [CLAUDE_COLLAB_INSTRUCTIONS.md](/C:/Users/Bartosz%20i%20Natalia/Desktop/Student-impact-antygraviti/CLAUDE_COLLAB_INSTRUCTIONS.md)
- [CHAT_REPORT_TEMPLATES.md](/C:/Users/Bartosz%20i%20Natalia/Desktop/Student-impact-antygraviti/CHAT_REPORT_TEMPLATES.md)
- [CLAUDE_HANDOVER.md](/C:/Users/Bartosz%20i%20Natalia/Desktop/Student-impact-antygraviti/CLAUDE_HANDOVER.md)

### QA i weryfikacja zmian

- [QA_RUN_TEMPLATE.md](/C:/Users/Bartosz%20i%20Natalia/Desktop/Student-impact-antygraviti/QA_RUN_TEMPLATE.md)
- [QA_MARKETPLACE_DOCUMENTS_PLAYBOOK.md](/C:/Users/Bartosz%20i%20Natalia/Desktop/Student-impact-antygraviti/QA_MARKETPLACE_DOCUMENTS_PLAYBOOK.md)
- [FINAL_FUNDED_QA_CHECKLIST.md](/C:/Users/Bartosz%20i%20Natalia/Desktop/Student-impact-antygraviti/FINAL_FUNDED_QA_CHECKLIST.md)
- [PRE_SPRINT_CLOSEOUT_CHECKLIST.md](/C:/Users/Bartosz%20i%20Natalia/Desktop/Student-impact-antygraviti/PRE_SPRINT_CLOSEOUT_CHECKLIST.md)

### Deploy i środowisko

- [DEPLOY_CHECKLIST.md](/C:/Users/Bartosz%20i%20Natalia/Desktop/Student-impact-antygraviti/DEPLOY_CHECKLIST.md)

### Plany i task-specific dokumenty

Zasada jest prosta:

- `*_PLAN.md` = plan / zakres / architektura
- `CLAUDE_*_INSTRUCTIONS.md` = instrukcja wejściowa dla Claude do konkretnego batcha
- `*_CHECKLIST.md` = walidacja i QA

## 9. Minimalne zasady bezpieczeństwa i higieny

- nie zapisuj sekretów w repo
- nie commituj `.env.local`
- nie traktuj ręcznego patchowania danych w połowie QA jako poprawnego testu
- nie omijaj blockerów przez bezpośrednie grzebanie w bazie podczas runu QA
- przy problemie z flow zapisuj dokładnie:
  - trasę
  - rolę
  - ostatni działający krok
  - ekran / błąd / dowód

## 10. Szybki prompt wejściowy dla Claude

Do rozpoczęcia nowego zadania z Claude można użyć takiego szablonu:

```text
Pracujemy dalej z Codexem w głównym repo.

Najpierw przeczytaj:
1. C:\\Users\\Bartosz i Natalia\\Desktop\\Student-impact-antygraviti\\SPRINT_LIVE_BOARD.md
2. C:\\Users\\Bartosz i Natalia\\Desktop\\Student-impact-antygraviti\\SPRINT_COMMAND_CENTER_2026-03-26.md
3. C:\\Users\\Bartosz i Natalia\\Desktop\\Student-impact-antygraviti\\CLAUDE_COLLAB_INSTRUCTIONS.md
4. C:\\Users\\Bartosz i Natalia\\Desktop\\Student-impact-antygraviti\\CHAT_REPORT_TEMPLATES.md
5. C:\\Users\\Bartosz i Natalia\\Desktop\\Student-impact-antygraviti\\AGENT_NOTEBOOK.md

Zasady:
- SPRINT_LIVE_BOARD jest źródłem prawdy
- main workspace jest ważniejszy niż .claude/worktrees
- raportuj krótko, z evidence i zgodnie z template
- oznaczaj założenia jako INFERENCE

Zadanie:
[tu wklej konkretny scope]

Na końcu podaj:
- co jest CONFIRMED
- jakie są RISKS / BLOCKERS
- jakie pliki / trasy / migracje zostały sprawdzone
- NEXT ACTION albo DECISION REQUESTED
```

## 11. Najkrótsza wersja dla nowej osoby

Jeśli ktoś ma wejść naprawdę szybko, wystarczy:

1. przeczytać `SPRINT_LIVE_BOARD.md`
2. przeczytać `CLAUDE_COLLAB_INSTRUCTIONS.md`
3. odpalić `npm run dev`
4. zalogować się przez `/auth` na dedykowane konto QA
5. sprawdzać zmiany w `app/app/...`, a nie w `.claude/worktrees/...`
6. raportować według `CHAT_REPORT_TEMPLATES.md`

