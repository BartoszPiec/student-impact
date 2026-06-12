-- 20260606120000_entry_packages_v1.sql
-- Trzy nowe pakiety wejściowe (system services) w formacie wzorcowego
-- "Miesięczny Pakiet Social Media" (c9fea07e). Bez SEO, ceny zwalidowane rynkowo.
-- Idempotentne: stałe UUID + ON CONFLICT (id) DO UPDATE; szablony milestone re-seedowane.
-- Pakiety:
--   1) Retusz i obróbka zdjęć produktowych  (0a1b2c3d-0001-4001-8001-000000000001)
--   2) Korekta i redakcja tekstu (PL)        (0a1b2c3d-0002-4002-8002-000000000002)
--   3) Setup wizytówki Google (GBP)          (0a1b2c3d-0003-4003-8003-000000000003)

BEGIN;

-- =====================================================================
-- 1) RETUSZ I OBRÓBKA ZDJĘĆ PRODUKTOWYCH
-- =====================================================================
INSERT INTO public.service_packages
  (id, student_id, title, slug, category, type, is_system, status, commission_rate,
   price, price_max, delivery_time_days, requires_nda, description, variants, form_schema, faq,
   meta_title, meta_description, related_service_ids)
VALUES (
  '0a1b2c3d-0001-4001-8001-000000000001',
  NULL,
  'Retusz i obróbka zdjęć produktowych',
  'retusz-zdjec-produktowych',
  'Design',
  'platform_service',
  true,
  'active',
  0.25,
  299, 749, 3, false,
  $desc1$
## Opis usługi

Masz produkty i zdjęcia zrobione telefonem — ale każde wygląda inaczej: krzywe tło, różne kolory, cienie, bałagan. A profesjonalna sesja w studiu to wydatek 1 000–5 000 zł. Student grafiki/fotografii obrobi Twoje zdjęcia: wytnie tło (białe lub jednolite), wyrówna kolory i ekspozycję, usunie skazy i ujednolici kadry oraz wymiary pod Twój marketplace. Dostajesz spójną paczkę zdjęć gotowych do wgrania na sklep.

**Usługa to obróbka dostarczonych zdjęć — nie sesja zdjęciowa.** Student nie robi zdjęć ani nie projektuje grafik z tekstem. Pracuje na Twoich materiałach (telefon w zupełności wystarczy).

## Dla kogo

- **Sklep internetowy / e-commerce** — masz dziesiątki produktów ze słabymi zdjęciami blokującymi sprzedaż.
- **Sprzedawca Allegro / Shopify / WooCommerce** — potrzebujesz spójnych zdjęć na białym tle pod wymogi platformy.
- **Producent / hurtownia** — masz zdjęcia od dostawcy w różnym stylu i chcesz je ujednolicić.
- **Mała marka / rękodzieło** — chcesz, żeby produkty wyglądały profesjonalnie bez kosztów studia.

## Jak dbamy o jakość

Jakość i terminowość to największe obawy przy pracy z zewnętrznym wykonawcą. Dlatego każde zlecenie ma trzy punkty kontrolne:

- **Krok 1 — Próbka:** zanim student obrobi całą paczkę, dostajesz 1–2 zdjęcia testowe i zatwierdzasz styl (tło, kadr, kolor).
- **Krok 2 — Spójna obróbka:** cała paczka robiona jest w jednym, zatwierdzonym standardzie (batch).
- **Krok 3 — Gotowe pliki:** odbierasz komplet w docelowych wymiarach, z możliwością poprawek w ramach pakietu.

Czas realizacji liczony jest od momentu złożenia zamówienia z dostarczonymi zdjęciami.

## Co musisz dostarczyć

- Zdjęcia w najlepszej dostępnej jakości (telefon OK) — link do folderu (Google Drive/WeTransfer).
- Wskazanie platformy docelowej (Allegro / Shopify / WooCommerce) i wymiarów.
- Preferencje tła: białe lub konkretny kolor.
- 1 przykład „tak ma wyglądać" (jeśli masz).

## Czego pakiet NIE obejmuje

- Robienia zdjęć / sesji zdjęciowej (pracujemy na Twoich materiałach).
- Wizualizacji i modelowania 3D od zera (to osobna usługa).
- Grafik z tekstem, banerów reklamowych (to pakiet grafik social media).
- Wgrywania zdjęć i produktów na sklep (to osobna usługa wdrażania produktów).
- Zmian po zamknięciu rundy poprawek.
$desc1$,
  $var1$
[
  {
    "id": "starter", "name": "starter", "label": "S — 15 zdjęć", "price": 299,
    "price_label": "299 PLN brutto", "delivery_time_days": 3, "commission_rate": 0.25,
    "student_earnings": 224, "student_hours_estimate": 4, "is_recommended": false,
    "badge": "Pakiet testowy",
    "description": "Sprawdź jakość na małej paczce zanim zlecisz cały katalog.",
    "deliverables": [
      "15 zdjęć produktowych",
      "Białe / jednolite tło (usuwanie tła)",
      "Korekta koloru i ekspozycji",
      "1 platforma (docelowe wymiary)",
      "1 runda poprawek"
    ],
    "revision_rounds": 1, "max_revisions": 2
  },
  {
    "id": "standard", "name": "standard", "label": "M — 30 zdjęć", "price": 499,
    "price_label": "499 PLN brutto", "delivery_time_days": 5, "commission_rate": 0.25,
    "student_earnings": 374, "student_hours_estimate": 7, "is_recommended": true,
    "badge": "Najpopularniejszy",
    "description": "Optymalny wybór dla rosnącego sklepu.",
    "deliverables": [
      "30 zdjęć produktowych",
      "Białe lub jednolity kolor tła",
      "Korekta koloru i ekspozycji",
      "Retusz skaz",
      "2 platformy (docelowe wymiary)",
      "1 runda poprawek"
    ],
    "revision_rounds": 1, "max_revisions": 3
  },
  {
    "id": "pro", "name": "pro", "label": "L — 50 zdjęć", "price": 749,
    "price_label": "749 PLN brutto", "delivery_time_days": 7, "commission_rate": 0.25,
    "student_earnings": 562, "student_hours_estimate": 11, "is_recommended": false,
    "badge": "Pełny pakiet",
    "description": "Cały katalog produktów obrobiony w jednym standardzie.",
    "deliverables": [
      "50 zdjęć produktowych",
      "Tło + 1 dodatkowy wariant tła",
      "Pełny retusz",
      "2 platformy + miniatury",
      "2 rundy poprawek"
    ],
    "revision_rounds": 2, "max_revisions": null
  }
]
$var1$::jsonb,
  $form1$
{
  "version": "1.0",
  "sections": [
    {
      "id": "products", "title": "Informacje o produktach",
      "fields": [
        { "id": "products_count", "label": "Ile zdjęć / produktów chcesz obrobić?", "type": "text", "required": true, "max_length": 100 },
        { "id": "product_type", "label": "Co przedstawiają zdjęcia?", "hint": "np. odzież, kosmetyki, meble, elektronika", "type": "textarea", "required": true, "max_length": 300 }
      ]
    },
    {
      "id": "visual", "title": "Wytyczne wizualne",
      "fields": [
        { "id": "background", "label": "Jakie tło?", "type": "radio", "required": true,
          "options": [
            { "value": "white", "label": "Białe" },
            { "value": "solid", "label": "Jednolity kolor (podam)" },
            { "value": "advise", "label": "Dobierzcie sami" }
          ] },
        { "id": "platform", "label": "Platforma docelowa / wymiary", "hint": "np. Allegro 1:1, Shopify 2048px, WooCommerce", "type": "text", "required": true, "max_length": 200 },
        { "id": "reference", "label": "Przykład „tak ma wyglądać\" (link)", "type": "url", "required": false }
      ]
    },
    {
      "id": "materials", "title": "Materiały",
      "fields": [
        { "id": "photos_link", "label": "Link do folderu ze zdjęciami", "hint": "Google Drive / WeTransfer / Dropbox", "type": "url", "required": true }
      ]
    },
    {
      "id": "contact", "title": "Osoba kontaktowa",
      "fields": [
        { "id": "contact_person", "label": "Imię i nazwisko", "type": "text", "required": true, "max_length": 100 },
        { "id": "preferred_contact", "label": "Preferowany kanał kontaktu", "type": "radio", "required": true,
          "options": [ { "value": "platform", "label": "Platforma" }, { "value": "email", "label": "E-mail" } ] }
      ]
    }
  ]
}
$form1$::jsonb,
  $faq1$
[
  { "question": "Czy robicie zdjęcia produktów?", "answer": "Nie. Student obrabia zdjęcia, które dostarczysz (telefon w zupełności wystarczy). Nie prowadzimy sesji zdjęciowej." },
  { "question": "Kiedy zaczyna się liczenie czasu realizacji?", "answer": "Od momentu złożenia zamówienia z linkiem do zdjęć. Najpierw dostajesz 1–2 zdjęcia próbne do akceptacji stylu." },
  { "question": "Co jeśli mam więcej niż 50 zdjęć?", "answer": "Wybierz pakiet L i napisz w briefie ile dokładnie — nadwyżkę wycenimy jako osobne mikrozlecenie po tej samej stawce za sztukę." },
  { "question": "W jakich wymiarach dostanę pliki?", "answer": "W wymiarach platformy, którą wskażesz w briefie (np. Allegro 1:1, Shopify, WooCommerce). Pakiety M i L obejmują 2 platformy." },
  { "question": "Czy mogę dostać pliki źródłowe?", "answer": "Dostajesz gotowe pliki PNG/JPG w docelowych wymiarach. Pliki źródłowe (PSD) możesz dopytać w briefie." }
]
$faq1$::jsonb,
  'Retusz i obróbka zdjęć produktowych — gotowe zdjęcia do sklepu',
  'Obróbka zdjęć produktowych ręką studenta: białe tło, korekta koloru, retusz i wymiary pod Allegro, Shopify i WooCommerce.',
  ARRAY['0a1b2c3d-0002-4002-8002-000000000002','0a1b2c3d-0003-4003-8003-000000000003','c9fea07e-ba17-4dba-b15e-5b045cd267db']::uuid[]
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title, slug = EXCLUDED.slug, category = EXCLUDED.category, type = EXCLUDED.type,
  is_system = EXCLUDED.is_system, status = EXCLUDED.status, commission_rate = EXCLUDED.commission_rate,
  price = EXCLUDED.price, price_max = EXCLUDED.price_max, delivery_time_days = EXCLUDED.delivery_time_days,
  requires_nda = EXCLUDED.requires_nda, description = EXCLUDED.description, variants = EXCLUDED.variants,
  form_schema = EXCLUDED.form_schema, faq = EXCLUDED.faq, meta_title = EXCLUDED.meta_title,
  meta_description = EXCLUDED.meta_description, related_service_ids = EXCLUDED.related_service_ids,
  updated_at = now();

-- =====================================================================
-- 2) KOREKTA I REDAKCJA TEKSTU (PL)
-- =====================================================================
INSERT INTO public.service_packages
  (id, student_id, title, slug, category, type, is_system, status, commission_rate,
   price, price_max, delivery_time_days, requires_nda, description, variants, form_schema, faq,
   meta_title, meta_description, related_service_ids)
VALUES (
  '0a1b2c3d-0002-4002-8002-000000000002',
  NULL,
  'Korekta i redakcja tekstu (PL)',
  'korekta-redakcja-tekstu-pl',
  'Copywriting',
  'platform_service',
  true,
  'active',
  0.25,
  199, 599, 2, false,
  $desc2$
## Opis usługi

Masz tekst — stronę WWW, ofertę, e-book, regulamin, opisy — ale jest w nim chaos: literówki, przecinki w złych miejscach, kalki z angielskiego, zdania na pół strony. Wstyd to wysłać klientowi. Student filologii polskiej zrobi korektę (ortografia, interpunkcja, gramatyka) oraz redakcję (styl, spójność, czytelność). Dostajesz wersję z naniesionymi poprawkami (tryb zmian) oraz czystą wersję gotową do publikacji.

**Usługa to poprawa istniejącego tekstu — nie pisanie od zera.** Jeśli potrzebujesz nowych treści, sprawdź pakiet copywritingu.

## Dla kogo

- **Firma z tekstami na stronie / w ofercie** — chcesz, by komunikacja była profesjonalna i bez błędów.
- **Autor e-booka / poradnika** — potrzebujesz redakcji przed publikacją.
- **Startup / founder** — masz regulamin, politykę, pitch czy „o nas" do dopracowania.
- **Każdy, kto wysyła teksty klientom** — oferty, maile, dokumenty.

## Jak dbamy o jakość

- **Krok 1 — Zakres:** potwierdzamy objętość (liczba stron = 1800 znaków) i ton (formalny/luźny/ekspercki).
- **Krok 2 — Dwa przejścia:** najpierw korekta błędów, potem redakcja stylu — w trybie zmian, bez nadpisywania po cichu.
- **Krok 3 — Dwie wersje:** dostajesz plik ze śledzeniem zmian + czystą wersję gotową do publikacji.

Zachowujemy głos autora — redagujemy, nie przepisujemy.

## Co musisz dostarczyć

- Tekst w pliku edytowalnym (Word / Google Docs).
- Informację o odbiorcy i tonie (formalny / luźny / ekspercki).
- Ewentualny styl lub terminologię firmy (jeśli masz).

## Czego pakiet NIE obejmuje

- Pisania tekstu od zera (to copywriting).
- Tłumaczenia (to osobna usługa PL↔EN).
- Optymalizacji pod SEO (to inna kompetencja — nie obiecujemy pozycji w Google).
- Składu graficznego / DTP.
- Zmian po zamknięciu rundy poprawek.
$desc2$,
  $var2$
[
  {
    "id": "starter", "name": "starter", "label": "S — do 10 stron", "price": 199,
    "price_label": "199 PLN brutto", "delivery_time_days": 2, "commission_rate": 0.25,
    "student_earnings": 149, "student_hours_estimate": 2, "is_recommended": false,
    "badge": "Pakiet testowy",
    "description": "Krótki tekst — strona, oferta, mail.",
    "deliverables": [
      "Korekta do 10 stron (1 strona = 1800 znaków)",
      "Ortografia, interpunkcja, gramatyka",
      "Podstawowa redakcja stylistyczna",
      "Tryb zmian + wersja czysta",
      "1 runda poprawek"
    ],
    "revision_rounds": 1, "max_revisions": 1
  },
  {
    "id": "standard", "name": "standard", "label": "M — do 20 stron", "price": 349,
    "price_label": "349 PLN brutto", "delivery_time_days": 4, "commission_rate": 0.25,
    "student_earnings": 262, "student_hours_estimate": 4, "is_recommended": true,
    "badge": "Najpopularniejszy",
    "description": "Dłuższy dokument z pełną redakcją.",
    "deliverables": [
      "Korekta do 20 stron",
      "Ortografia, interpunkcja, gramatyka",
      "Pełna redakcja stylistyczna",
      "Ujednolicenie terminologii",
      "Tryb zmian + wersja czysta",
      "1 runda poprawek"
    ],
    "revision_rounds": 1, "max_revisions": 2
  },
  {
    "id": "pro", "name": "pro", "label": "L — do 40 stron", "price": 599,
    "price_label": "599 PLN brutto", "delivery_time_days": 6, "commission_rate": 0.25,
    "student_earnings": 449, "student_hours_estimate": 7, "is_recommended": false,
    "badge": "Pełny pakiet",
    "description": "E-book, raport, obszerna dokumentacja.",
    "deliverables": [
      "Korekta do 40 stron",
      "Pełna korekta + redakcja",
      "Ujednolicenie terminologii + mini słowniczek",
      "Tryb zmian + wersja czysta",
      "2 rundy poprawek"
    ],
    "revision_rounds": 2, "max_revisions": null
  }
]
$var2$::jsonb,
  $form2$
{
  "version": "1.0",
  "sections": [
    {
      "id": "text", "title": "Informacje o tekście",
      "fields": [
        { "id": "text_type", "label": "Co to za tekst?", "hint": "np. strona WWW, oferta, e-book, regulamin", "type": "text", "required": true, "max_length": 200 },
        { "id": "length", "label": "Szacowana objętość (liczba stron / znaków)", "type": "text", "required": true, "max_length": 100 }
      ]
    },
    {
      "id": "style", "title": "Styl i ton",
      "fields": [
        { "id": "tone", "label": "Ton komunikacji", "type": "radio", "required": true,
          "options": [
            { "value": "formal", "label": "Formalny" },
            { "value": "casual", "label": "Luźny" },
            { "value": "expert", "label": "Ekspercki" }
          ] },
        { "id": "terminology", "label": "Terminologia / styl firmy", "hint": "Słowa, których trzymać się lub unikać. Zostaw puste jeśli brak.", "type": "textarea", "required": false, "max_length": 300 }
      ]
    },
    {
      "id": "materials", "title": "Materiały",
      "fields": [
        { "id": "text_link", "label": "Link do tekstu (Word / Google Docs)", "type": "url", "required": true }
      ]
    },
    {
      "id": "contact", "title": "Osoba kontaktowa",
      "fields": [
        { "id": "contact_person", "label": "Imię i nazwisko", "type": "text", "required": true, "max_length": 100 },
        { "id": "preferred_contact", "label": "Preferowany kanał kontaktu", "type": "radio", "required": true,
          "options": [ { "value": "platform", "label": "Platforma" }, { "value": "email", "label": "E-mail" } ] }
      ]
    }
  ]
}
$form2$::jsonb,
  $faq2$
[
  { "question": "Czym różni się korekta od redakcji?", "answer": "Korekta to poprawa błędów (ortografia, interpunkcja, gramatyka). Redakcja to praca nad stylem, spójnością i czytelnością. W tym pakiecie dostajesz oba." },
  { "question": "Czy zmienicie sens mojego tekstu?", "answer": "Nie. Zachowujemy Twój głos i sens — poprawiamy formę. Każdą zmianę sensu student oznacza komentarzem do akceptacji." },
  { "question": "Jak liczycie strony?", "answer": "1 strona = 1800 znaków ze spacjami (standard rozliczeniowy). W briefie podaj przybliżoną objętość — dopasujemy pakiet." },
  { "question": "Czy napiszecie tekst od zera?", "answer": "Nie w tym pakiecie. To korekta i redakcja istniejącego tekstu. Nowe treści to osobna usługa copywritingu." },
  { "question": "Czy zoptymalizujecie tekst pod SEO?", "answer": "Nie. To osobna kompetencja i nie obiecujemy pozycji w Google. Skupiamy się na poprawności i czytelności języka." }
]
$faq2$::jsonb,
  'Korekta i redakcja tekstu (PL) — tekst bez błędów',
  'Profesjonalna korekta i redakcja tekstu po polsku: ortografia, interpunkcja, styl. Tryb zmian + wersja czysta.',
  ARRAY['0a1b2c3d-0001-4001-8001-000000000001','0a1b2c3d-0003-4003-8003-000000000003','c9fea07e-ba17-4dba-b15e-5b045cd267db']::uuid[]
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title, slug = EXCLUDED.slug, category = EXCLUDED.category, type = EXCLUDED.type,
  is_system = EXCLUDED.is_system, status = EXCLUDED.status, commission_rate = EXCLUDED.commission_rate,
  price = EXCLUDED.price, price_max = EXCLUDED.price_max, delivery_time_days = EXCLUDED.delivery_time_days,
  requires_nda = EXCLUDED.requires_nda, description = EXCLUDED.description, variants = EXCLUDED.variants,
  form_schema = EXCLUDED.form_schema, faq = EXCLUDED.faq, meta_title = EXCLUDED.meta_title,
  meta_description = EXCLUDED.meta_description, related_service_ids = EXCLUDED.related_service_ids,
  updated_at = now();

-- =====================================================================
-- 3) SETUP WIZYTÓWKI GOOGLE (GBP)
-- =====================================================================
INSERT INTO public.service_packages
  (id, student_id, title, slug, category, type, is_system, status, commission_rate,
   price, price_max, delivery_time_days, requires_nda, description, variants, form_schema, faq,
   meta_title, meta_description, related_service_ids)
VALUES (
  '0a1b2c3d-0003-4003-8003-000000000003',
  NULL,
  'Setup wizytówki Google (Google Business Profile)',
  'setup-wizytowki-google-gbp',
  'Marketing',
  'platform_service',
  true,
  'active',
  0.25,
  299, 449, 3, false,
  $desc3$
## Opis usługi

Klient szuka Cię w Google, a Ciebie tam nie ma — albo wizytówka jest pusta: brak godzin, brak zdjęć, zła kategoria. Tracisz lokalnych klientów na rzecz konkurencji, która ma to ogarnięte. Student marketingu założy lub zweryfikuje Twoją wizytówkę Google i uzupełni ją kompletnie: dane, kategorie, godziny, opis, usługi, zdjęcia i pierwsze posty. Dostajesz gotową wizytówkę oraz prostą instrukcję, jak nią zarządzać.

**To proceduralna konfiguracja wizytówki — nie „pozycjonowanie lokalne".** Nie obiecujemy konkretnej pozycji w Google; porządkujemy i kompletujemy Twój profil tak, by działał.

## Dla kogo

- **Lokalna firma usługowa** — fryzjer, warsztat, gabinet, restauracja, sklep stacjonarny.
- **Firma bez wizytówki** — nie istniejesz w Mapach Google i chcesz to zmienić.
- **Firma z zaniedbaną wizytówką** — masz profil, ale pusty lub z błędnymi danymi.
- **Nowy oddział / nowa lokalizacja** — potrzebujesz świeżej, kompletnej wizytówki.

## Jak dbamy o jakość

- **Krok 1 — Dane i dostęp:** zbieramy dane firmy i ustalamy dostęp/weryfikację profilu (kod od Google bywa wąskim gardłem — uprzedzimy Cię).
- **Krok 2 — Kompletne uzupełnienie:** kategorie, godziny, opis, usługi, zdjęcia, pierwsze posty — wszystko spójne z Twoją stroną i social mediami.
- **Krok 3 — Przekazanie:** dostajesz gotowy profil z dostępem właścicielskim i 1-stronicową instrukcją zarządzania.

## Co musisz dostarczyć

- Dane firmy: nazwa, adres, telefon, godziny otwarcia.
- Dostęp do konta Google firmy (lub zgodę na założenie).
- Zdjęcia (lub zgodę na użycie dostępnych materiałów).
- Krótki opis: czym się zajmujesz i kogo obsługujesz.

## Czego pakiet NIE obejmuje

- Pozycjonowania lokalnego / „local SEO" (nie obiecujemy pozycji w wynikach).
- Reklam Google Ads.
- Stałego prowadzenia wizytówki (można jako osobna usługa cykliczna).
- Budowy strony WWW (to osobna usługa).
$desc3$,
  $var3$
[
  {
    "id": "basic", "name": "basic", "label": "Basic — konfiguracja", "price": 299,
    "price_label": "299 PLN brutto", "delivery_time_days": 3, "commission_rate": 0.25,
    "student_earnings": 224, "student_hours_estimate": 4, "is_recommended": true,
    "badge": "Najczęściej wybierany",
    "description": "Kompletna, uzupełniona wizytówka gotowa do działania.",
    "deliverables": [
      "Założenie / weryfikacja profilu",
      "Uzupełnienie danych (kategorie, godziny, usługi)",
      "Opis firmy (treść)",
      "Do 10 zdjęć",
      "Instrukcja zarządzania (1 strona)",
      "1 runda poprawek"
    ],
    "revision_rounds": 1, "max_revisions": 1
  },
  {
    "id": "plus", "name": "plus", "label": "Plus — konfiguracja + posty", "price": 449,
    "price_label": "449 PLN brutto", "delivery_time_days": 7, "commission_rate": 0.25,
    "student_earnings": 337, "student_hours_estimate": 6, "is_recommended": false,
    "badge": "Pełny start",
    "description": "Wizytówka + pierwsze posty i szablony odpowiedzi na opinie.",
    "deliverables": [
      "Wszystko z Basic",
      "Do 20 zdjęć + uporządkowanie",
      "4 posty na start",
      "Szablony odpowiedzi na opinie",
      "1 runda poprawek"
    ],
    "revision_rounds": 1, "max_revisions": 1
  }
]
$var3$::jsonb,
  $form3$
{
  "version": "1.0",
  "sections": [
    {
      "id": "company", "title": "Dane firmy",
      "fields": [
        { "id": "company_name", "label": "Nazwa firmy", "type": "text", "required": true, "max_length": 150 },
        { "id": "address", "label": "Adres", "type": "text", "required": true, "max_length": 200 },
        { "id": "phone", "label": "Telefon", "type": "text", "required": true, "max_length": 50 },
        { "id": "hours", "label": "Godziny otwarcia", "type": "textarea", "required": true, "max_length": 300 },
        { "id": "what_you_do", "label": "Czym się zajmujesz i kogo obsługujesz?", "type": "textarea", "required": true, "max_length": 400 }
      ]
    },
    {
      "id": "access", "title": "Dostęp i status",
      "fields": [
        { "id": "profile_status", "label": "Status wizytówki Google", "type": "radio", "required": true,
          "options": [
            { "value": "none", "label": "Nie mam — załóżcie" },
            { "value": "exists", "label": "Mam — trzeba uzupełnić" },
            { "value": "unsure", "label": "Nie wiem" }
          ] },
        { "id": "access_note", "label": "Jak przekażesz dostęp do konta Google?", "hint": "np. dodanie jako menedżer, wspólne ustalenie", "type": "text", "required": false, "max_length": 200 }
      ]
    },
    {
      "id": "materials", "title": "Materiały",
      "fields": [
        { "id": "photos_link", "label": "Zdjęcia (link do folderu)", "hint": "Zostaw puste jeśli użyjemy dostępnych materiałów", "type": "url", "required": false },
        { "id": "website_url", "label": "Strona WWW (jeśli jest)", "type": "url", "required": false }
      ]
    },
    {
      "id": "contact", "title": "Osoba kontaktowa",
      "fields": [
        { "id": "contact_person", "label": "Imię i nazwisko", "type": "text", "required": true, "max_length": 100 },
        { "id": "preferred_contact", "label": "Preferowany kanał kontaktu", "type": "radio", "required": true,
          "options": [ { "value": "platform", "label": "Platforma" }, { "value": "email", "label": "E-mail" } ] }
      ]
    }
  ]
}
$form3$::jsonb,
  $faq3$
[
  { "question": "Czy to jest pozycjonowanie w Google?", "answer": "Nie. To proceduralna konfiguracja i kompletne uzupełnienie wizytówki. Nie obiecujemy konkretnej pozycji — porządkujemy profil tak, by działał i był wiarygodny." },
  { "question": "Jak przekażę dostęp do mojego konta Google?", "answer": "Najczęściej dodajesz studenta jako menedżera wizytówki (bez podawania hasła) albo ustalamy to wspólnie w czacie. Jeśli wizytówki nie ma — założymy ją na Twoje konto." },
  { "question": "Dlaczego realizacja może się wydłużyć?", "answer": "Google weryfikuje nowe wizytówki (pocztówką, telefonem lub e-mailem) i to bywa wąskim gardłem niezależnym od nas. Uprzedzimy Cię i poprowadzimy przez ten krok." },
  { "question": "Czy będziecie prowadzić wizytówkę na stałe?", "answer": "Ten pakiet to jednorazowa konfiguracja. Regularne posty i odpowiedzi na opinie możemy poprowadzić jako osobną usługę cykliczną." },
  { "question": "Nie mam zdjęć — co wtedy?", "answer": "Napisz w briefie. Wykorzystamy dostępne materiały lub doradzimy, jakie zdjęcia szybko zrobić telefonem, by profil wyglądał profesjonalnie." }
]
$faq3$::jsonb,
  'Setup wizytówki Google (GBP) — Twoja firma w Mapach Google',
  'Konfiguracja i kompletne uzupełnienie wizytówki Google: dane, kategorie, zdjęcia, opis i posty. Bez ściemy o pozycjach.',
  ARRAY['0a1b2c3d-0001-4001-8001-000000000001','0a1b2c3d-0002-4002-8002-000000000002','c9fea07e-ba17-4dba-b15e-5b045cd267db']::uuid[]
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title, slug = EXCLUDED.slug, category = EXCLUDED.category, type = EXCLUDED.type,
  is_system = EXCLUDED.is_system, status = EXCLUDED.status, commission_rate = EXCLUDED.commission_rate,
  price = EXCLUDED.price, price_max = EXCLUDED.price_max, delivery_time_days = EXCLUDED.delivery_time_days,
  requires_nda = EXCLUDED.requires_nda, description = EXCLUDED.description, variants = EXCLUDED.variants,
  form_schema = EXCLUDED.form_schema, faq = EXCLUDED.faq, meta_title = EXCLUDED.meta_title,
  meta_description = EXCLUDED.meta_description, related_service_ids = EXCLUDED.related_service_ids,
  updated_at = now();

-- =====================================================================
-- Szablony milestone (1 domyślny milestone na pakiet, jak we wzorcu)
-- =====================================================================
DELETE FROM public.service_package_milestone_templates
WHERE package_id IN (
  '0a1b2c3d-0001-4001-8001-000000000001',
  '0a1b2c3d-0002-4002-8002-000000000002',
  '0a1b2c3d-0003-4003-8003-000000000003'
) AND variant_key IS NULL;

INSERT INTO public.service_package_milestone_templates
  (package_id, variant_key, position, title, acceptance_criteria, amount_percent, due_days, active)
VALUES
  ('0a1b2c3d-0001-4001-8001-000000000001', NULL, 1, 'Realizacja pakietu',
   'Komplet zdjęć obrobionych w spójnym standardzie, w docelowych wymiarach, zaakceptowany przez firmę.', 100, 3, true),
  ('0a1b2c3d-0002-4002-8002-000000000002', NULL, 1, 'Realizacja pakietu',
   'Tekst po korekcie i redakcji (tryb zmian + wersja czysta), zaakceptowany przez firmę.', 100, 2, true),
  ('0a1b2c3d-0003-4003-8003-000000000003', NULL, 1, 'Realizacja pakietu',
   'Wizytówka zweryfikowana i kompletnie uzupełniona, instrukcja przekazana, zaakceptowana przez firmę.', 100, 3, true);

COMMIT;
