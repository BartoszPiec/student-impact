# Design Brief — Karta zgłoszenia w panelu FIRMY („Aplikacje do moich ofert")

> Brief dla agenta projektowego (Claude Design). Celem jest projekt (mockup + specyfikacja
> wizualna) karty zgłoszenia/negocjacji w panelu **firmy**, na podstawie którego inżynier
> poprawi istniejący kod. **Nie piszemy tu kodu produkcyjnego** — oczekujemy projektu wizualnego
> + jasnej specyfikacji stanów i tokenów.

---

## 1. Kontekst produktu

Student2Work to marketplace łączący firmy ze studentami. Istnieją **dwa bliźniacze widoki**
listy zgłoszeń, po dwóch stronach tej samej transakcji:

| Widok | Plik | Rola | Ocena |
|------|------|------|-------|
| **Student** — „Moje Aplikacje" | `app/app/applications/ApplicationList.tsx` | student śledzi swoje zgłoszenia i reaguje na kontroferty firmy | **lepszy — wzorzec do naśladowania** |
| **Firma** — „Aplikacje do moich ofert" | `app/app/company/applications/page.tsx` (`renderNowaCard`) | firma przegląda zgłoszenia studentów, akceptuje / odrzuca / negocjuje | dobry, ale ma być „trochę jak u studenta" |

Oba pokazują listę kart. Każda karta = jedno zgłoszenie z ceną i akcjami (akceptuj / odrzuć /
kontroferta / czat). Karta firmowa ma dodatkowo etap „w realizacji" i „zakończone", ale **brief
dotyczy karty wymagającej decyzji** (status `sent` = nowe zgłoszenie, `countered` = trwa negocjacja).

---

## 2. Cel

1. **Zbliżyć kartę firmy do karty studenta** — ten sam rytm, hierarchia, „premium" charakter.
2. **Dodać wyraźny wskaźnik / miejsce „WYMAGANA AKCJA"** — w widoku firmy ma być od razu widać,
   że dana karta czeka na reakcję firmy (to dziś najsłabszy punkt karty firmowej).

---

## 3. Co konkretnie działa w widoku STUDENTA (do przeniesienia)

Z `ApplicationList.tsx → ApplicationCard`:

1. **Pełnowysokościowy kolorowy pasek po lewej** (`md:w-2`), kolor zależny od stanu:
   bursztyn = negocjacja, indygo = praca/standard. Mocny, czytelny status na pierwszy rzut oka.
2. **Kontekstowy baner alertu na górze karty**, gdy potrzebna jest decyzja:
   „Firma zaproponowała kontrofertę: **1569 PLN** (Twoja poprzednia: 1700 PLN)" + po prawej
   pill **„WYMAGANA DECYZJA"**. To jest najważniejszy element, którego brakuje firmie.
3. **Podświetlenie całej karty obwódką** (`ring-2 ring-amber-300` + miękki bursztynowy cień),
   gdy karta czeka na akcję — karta „świeci".
4. **Czytelny układ poziomy**: po lewej informacje (tytuł + status-pill + meta + notatka),
   po prawej duża, pogrubiona cena z kolorem semantycznym (emerald = uzgodniona, bursztyn =
   kontroferta, indygo = propozycja) i pod nią akcje.
5. **Inline „Kontra:"** — kompaktowy formularz kontroferty w zaokrąglonym „pill" kontenerze
   (label + input kwoty + przycisk „Wyślij").
6. **Status-badge jako pill** (`rounded-full`, ikona + tekst), np. „Negocjacje", „W realizacji".

---

## 4. Stan obecny karty FIRMY (punkt wyjścia)

`renderNowaCard` (mikrozlecenie) ma już po ostatniej iteracji:
- cienki pasek akcentu po lewej (`border-l-4 border-l-indigo-500`),
- dwa kafelki metryk: **Budżet oferty** vs **Propozycja studenta**,
- panel decyzji (Akceptuj / Odrzuć + sekcja „Negocjuj / Zapytaj" z inputem),
- blok wiadomości od studenta, przycisk CV.

**Czego brakuje / co poprawić:**
- brak wyraźnego znacznika „wymagana akcja" (jest tylko mały `StatusBadge` w rogu — za słaby);
- brak kontekstowego banera typu „Student oczekuje na Twoją decyzję" / „Trwa negocjacja —
  Twoja ostatnia oferta: X";
- karta się nie wyróżnia, gdy czeka na firmę (brak ring/glow);
- układ kafelków + panel decyzji jest gęstszy i mniej „lekki" niż u studenta.

---

## 5. Wymagane stany karty firmy (projekt musi je pokryć)

1. **`sent` — nowe zgłoszenie, student akceptuje stawkę z oferty (brak kontrpropozycji)**
   - akcja: Akceptuj / Odrzuć. Sekcja negocjacji ukryta lub zwinięta.
2. **`sent` — nowe zgłoszenie, student zaproponował INNĄ stawkę**
   - widoczne porównanie: Budżet oferty ↔ Propozycja studenta (różnica wyróżniona).
   - akcje: Akceptuj / Odrzuć / Negocjuj (kontroferta inline) / Czat.
3. **`countered` — firma wysłała kontrofertę, trwa negocjacja**
   - baner: „Twoja kontroferta: X — czeka na studenta" (analogicznie do banera studenta).
   - akcje: Akceptuj propozycję / Odrzuć / Zmień kontrofertę / Czat.

Dla każdego stanu określ: kolor paska, treść i kolor banera akcji, etykietę pill „akcja",
czy karta ma `ring`/glow, układ i kolor ceny, zestaw przycisków.

> **Uwaga semantyczna kolorów (różnica vs student!):** u studenta „wymagana decyzja" = bursztyn.
> U firmy „nowe zgłoszenie do rozpatrzenia" warto rozróżnić od „negocjacji". Sugerowana paleta:
> **indygo/fiolet** = nowe zgłoszenie wymaga przejrzenia, **bursztyn** = negocjacja w toku
> (spójnie ze studentem). Zaproponuj finalną logikę kolorów i ją uzasadnij.

---

## 6. System wizualny (obowiązujący kierunek — trzymać się go)

Kierunek zaakceptowany przez właściciela; wzorce: `app/app/company/packages/page.tsx`
(katalog usług) oraz `app/app/applications/ApplicationList.tsx` (karta studenta).

- **Typografia:** `font-black` na nagłówkach/kwotach, kwoty z `tracking-tighter`;
  etykiety pomocnicze `text-[10px] font-black uppercase tracking-widest text-slate-400`.
- **Zaokrąglenia:** karty `rounded-3xl`; wewnętrzne kafelki/pill `rounded-2xl` / `rounded-xl`;
  duże panele do `rounded-[2.5rem]`.
- **Kafelki metryk:** `bg-slate-50/50 border border-slate-100 rounded-2xl` (etykieta + wartość `font-black`).
- **Pasek statusu po lewej:** pełna wysokość karty (`md:w-2`), nie cienki `border-l`.
- **Akcje (przyciski):** primary = gradient `bg-gradient-to-r from-emerald-500 to-teal-600`
  (akceptacja) lub `from-indigo-500 to-violet-600` (negocjacja), z kolorowym cieniem
  (`shadow-lg shadow-indigo-500/20`) i `hover:scale-[1.02]`; odrzucenie = subtelny outline czerwony.
- **Pill-badge:** `rounded-full ... font-black uppercase tracking-widest`, opcjonalnie z ikoną.
- **Baner akcji:** pełna szerokość treści karty, tło `bg-amber-50` / `bg-indigo-50`, ikona alertu,
  po prawej pill „WYMAGANA AKCJA".
- **Highlight karty wymagającej akcji:** `ring-2` w kolorze stanu + miękki kolorowy cień.
- **Komponenty:** shadcn/ui (`Card`, `Button`, `Badge`, `Input`), ikony `lucide-react`,
  Tailwind. `cn()` z `tailwind-merge` jest dostępne.
- **Język UI:** polski.

---

## 7. Element kluczowy — wskaźnik „WYMAGANA AKCJA"

Zaprojektuj **spójny system sygnalizacji akcji** dla karty firmy, łączący:
1. **pasek koloru** po lewej (stan),
2. **pill „WYMAGANA AKCJA"** (prawy górny róg lub w banerze),
3. **baner kontekstowy** mówiący CO firma ma zrobić („Nowe zgłoszenie — rozpatrz kandydata",
   „Student czeka na Twoją decyzję", „Trwa negocjacja — Twoja oferta: X"),
4. **ring/glow** całej karty.

Pokaż, jak ten system wygląda też dla kart **bez** wymaganej akcji (np. „w realizacji",
„zakończone"), żeby kontrast „akcja vs spokój" był czytelny na liście.

---

## 8. Oczekiwany deliverable od agenta projektowego

1. **Mockup** karty firmy w 3 stanach z §5 (statyczny HTML+Tailwind lub obraz/figma-like opis).
2. **Mapa stanów → tokeny**: tabela (stan → kolor paska / baner / pill / ring / cena / przyciski).
3. **Wytyczne „action required"** (§7) jako gotowa specyfikacja do implementacji.
4. Krótkie uzasadnienie kluczowych decyzji (zwłaszcza logiki kolorów z §5).
5. (Opcjonalnie) propozycja, jak ujednolicić nagłówek listy firmy z układem studenta
   (zakładki/filtry „Wszystkie / Praca / Mikrozlecenia").

**Poza zakresem:** logika serwerowa (server actions `acceptApplication`, `rejectApplication`,
`counterOffer` zostają bez zmian), zapytania do bazy, routing. Projekt ma być nakładką wizualną
na istniejące dane i akcje.

---

## 9. Ograniczenia techniczne (dla realności projektu)

- Dane dostępne w karcie: `offer.tytul`, `offer.stawka` (budżet), `proposed_stawka`
  (propozycja studenta), `counter_stawka` (kontroferta firmy), `agreed_stawka`, `status`,
  `created_at`, `message_to_company`, `cv_url`, nazwa studenta.
- Akcje to formularze `<form action={serverAction}>` — projekt musi zakładać przyciski typu submit
  w osobnych formularzach (Akceptuj / Odrzuć / Kontroferta / Czat).
- Karta renderowana też w trybie **embedded** wewnątrz strony oferty
  (`app/app/company/offers/[id]`) — projekt nie może zakładać pełnej szerokości ekranu.
