-- =============================================
-- Seed: WZORCOWA Service Packages (37 packages)
-- Auto-generated from DOCX files
-- =============================================

-- Delete old system packages to avoid duplicates
DELETE FROM public.service_packages WHERE is_system = true AND type = 'platform_service';

-- #01: Pakiet treści do Social Media
INSERT INTO public.service_packages (
  title, description, locked_content, price, price_max,
  variants, delivery_time_days, category,
  requires_nda, commission_rate, is_system, type, status, student_id
) VALUES (
  'Pakiet treści do Social Media',
  'Pakiet treści do Social Media
12 gotowych postów (grafika + tekst) na Facebook i Instagram
O co chodzi
Student przygotuje 12 postów na Twój firmowy Facebook i Instagram — każdy post to gotowa grafika plus tekst do skopiowania i opublikowania. Dostajesz też harmonogram, który mówi kiedy co wrzucić.
To nie jest prowadzenie social mediów w ciągłym trybie. Nie logujemy się na Twoje konto, nie odpowiadamy na komentarze, nie uruchamiamy reklam. Dostajesz paczkę materiałów — co z nimi zrobisz, zależy od Ciebie. Możesz wrzucać ręcznie albo zaplanować przez Creator Studio.
Dla kogo to ma sens: Małe firmy, które wiedzą, że powinny być obecne w social mediach, ale nie mają czasu ani pomysłu na regularne posty. Zamiast wrzucać coś raz na 3 tygodnie, masz plan na cały miesiąc.
Co dokładnie dostajesz
Czego ten pakiet nie obejmuje
Żebyś nie musiał się domyślać — oto rzeczy, które nie wchodzą w cenę:
Publikowanie postów na Twoim koncie — dostajesz materiały, sam je wrzucasz
Odpowiadanie na komentarze i wiadomości prywatne
Reklamy płatne (Facebook Ads, promowanie postów) — to osobna usługa
Sesja zdjęciowa — pracujemy na Twoich zdjęciach lub darmowych stockach (Unsplash/Pexels)
Reelsy, stories, karuzele — pakiet obejmuje wyłącznie posty na feed
Strategia marketingowa, analiza wyników, raportowanie
Bieżące zmiany w trakcie miesiąca (po jednorazowej rundzie poprawek pakiet jest zamknięty)
Co musisz dostarczyć (bez tego nie zaczniemy)
Logo firmy w dobrej jakości (PNG, SVG lub PDF wektorowy)
Kolory firmowe — jeśli masz brand book, to idealnie. Jeśli nie, podaj choćby kolor z logo
Krótki opis: czym się zajmujesz, kto jest Twoim klientem, jak chcesz być postrzegany
Zdjęcia produktów/usług/zespołu — im więcej, tym lepiej. Jeśli nie masz, użyjemy stocków
2-3 przykłady profili firmowych, które Ci się podobają (nie muszą być z Twojej branży)
Jak ustaliliśmy cenę
Dla kontekstu — oto, ile kosztują podobne usługi na rynku w 2025 roku:
Cena jest niższa, bo wykonawcą jest student, nie doświadczony freelancer. Studenci mają mniej doświadczenia, ale mają aktualne know-how z uczelni, znają narzędzia (Canva, trendy SM) i pracują z instrukcją platform. Wynik nie będzie identyczny jak od agencji za 3 000 PLN — ale dla małej firmy, która dotychczas nie robiła nic, to ogromna różnica.
Jak wygląda proces
Dzień 1: Wypełniasz krótki brief (ankieta online, 10 min). Student zadaje pytania, jeśli czegoś brakuje.
Dni 2-3: Student analizuje Twoją branżę, sprawdza co robi konkurencja, proponuje tematy 12 postów. Dostajesz listę do akceptacji — możesz zmienić/zamienić tematy.
Dni 4-6: Powstają grafiki i teksty. Student pracuje w Canva z szablonem dopasowanym do Twoich kolorów.
Dzień 7: Dostajesz komplet: 12 grafik PNG, teksty, harmonogram, link do edytowalnych szablonów Canva. Masz 48h na feedback — 1 runda do 5 zmian.
Masz pytania? Napisz do nas przez platformę — odpowiadamy w ciągu 24h.',
  'Ta sekcja nie jest widoczna dla firmy-zleceniodawcy. Zawiera instrukcję realizacji, wynagrodzenie i wewnętrzne wskazówki.
Twoje wynagrodzenie
Dla porównania: mediana stawki studenckiej w Polsce to ok. 25-30 PLN/h (praca dorywcza). Ta usługa powinna dać Ci lepszą stawkę, pod warunkiem że nie przekroczysz 14h. Jeśli regularnie wychodzisz ponad to — daj nam znać, pomożemy zoptymalizować proces.
Instrukcja realizacji — dzień po dniu
Dzień 1: Brief i onboarding (~1h)
Zaraz po przyjęciu zlecenia wyślij firmie link do briefu (szablon Google Forms — znajdziesz go w zasobach platformy, ID: BRIEF-SM-01). Brief zawiera pytania o:
Branża, główne produkty/usługi, grupa docelowa (wiek, lokalizacja, zainteresowania)
Ton komunikacji — formalny, luźny, ekspercki, przyjacielski
Istniejące profile SM — linki (jeśli są)
3-5 przykładów profili, które im się podobają
Logo, kolory, czcionki (lub informacja, że ich nie mają)
Zdjęcia produktów/zespołu — link do folderu Google Drive
Ważne: Jeśli firma nie odeśle briefu w ciągu 48h, wyślij grzeczne przypomnienie. Jeśli po 72h nadal cisza — zgłoś to na platformie. Timer 7 dni roboczych startuje od momentu otrzymania kompletnego briefu, nie od momentu zlecenia.
Dzień 2: Research i plan tematów (~2h)
Przejrzyj profile konkurencji firmy (min. 3). Zanotuj: jakie posty mają najwięcej reakcji, jakie formaty używają, jaki jest ich ton
Sprawdź aktualne trendy w branży: Google Trends, hashtagi w Instagram Explore, TikTok (nawet jeśli pakiet nie obejmuje TikToka — trendy się przenikają)
Ułóż plan 12 postów w Google Sheets: numer, temat, typ (edukacyjny/ofertowy/angażujący/wizerunkowy), sugerowana data
Wyślij plan firmie do akceptacji przez platformę. Daj im 24h na odpowiedź. Jeśli nie odpowiedzą w 24h — przyjmij, że plan jest zaakceptowany i jedź dalej
Rozkład typów postów (12 szt.):
Dzień 3: Szablon graficzny w Canva (~2h)
Otwórz Canva (konto Pro — platforma zapewnia dostęp). Stwórz Brand Kit z kolorami i logo firmy
Zaprojektuj master template 1080×1080px. Potrzebujesz 3-4 wariantów layoutu (nie rób 12 identycznych grafik, ale zachowaj spójność)
Wariant 1: tekst na tle jednolitego koloru (na edukacyjne). Wariant 2: zdjęcie produktu + tekst overlay (na ofertowe). Wariant 3: duży tekst/pytanie na kolorowym tle (na angażujące). Wariant 4: zdjęcie zespołu/behind the scenes + drobny tekst (na wizerunkowe)
Czcionki: max 2 (nagłówek + body). Użyj Google Fonts, które są dostępne w Canva. Unikaj: Comic Sans, Papyrus, Impact
Wyślij 1 przykładową grafikę do firmy jako "podgląd stylu" — lepiej złapać błąd teraz niż po zrobieniu wszystkich 12
Dni 4-5: Produkcja grafik i tekstów (~4-5h)
Teraz idzie fabryka. Masz zatwierdzony plan tematów i styl graficzny — wyprodukuj 12 kompletów (grafika + tekst).
Grafiki:
Zdjęcia stockowe: Unsplash, Pexels (darmowe, bez atrybuji). NIE używaj zdjęć z Google Images — prawa autorskie
Każda grafika musi być czytelna na telefonie (tekst min. 24pt w Canva). Zrób podgląd na mobile
Eksport: PNG 1080×1080px. Nie kompresuj poniżej 300KB — Instagram i tak skompresuje
Teksty postów:
Max 150-200 słów. Pierwsze 2 linijki muszą być hook — to jedyne co widać bez kliknięcia "więcej"
Każdy post kończy się CTA: pytanie, link do strony, zachęta do zapisu/kontaktu
5-8 hashtagów per post. Mix: 2-3 branżowe + 2-3 lokalne + 1-2 ogólne. Nie wrzucaj 30 hashtagów — algorytm to karze
Pisz jak człowiek, nie jak robot. Bez: "Zapraszamy do zapoznania się z naszą ofertą". Tak: "Masz pytanie? Napisz DM — odpowiemy dziś"
Dzień 6: Kompletacja i harmonogram (~1h)
Przygotuj harmonogram w Google Sheets: data | godzina | platforma | typ posta | tekst | link do grafiki
Sugerowane godziny publikacji (ogólna zasada, nie branżowa): pon-pt 12:00-13:00 i 18:00-20:00, sob-nd 10:00-12:00
Sugerowana częstotliwość: 3 posty/tydzień (pon, śr, pt lub wt, czw, sob). Nie wrzucaj 12 postów w 5 dni
Przygotuj folder dostarczalny: a) folder Google Drive z 12 PNG, b) Google Sheets z tekstami + harmonogramem, c) link do edytowalnych szablonów Canva
Dzień 7: Oddanie i poprawki (~1h)
Wyślij link do folderu przez platformę z wiadomością podsumowującą: co jest w środku, ile postów, jak korzystać z szablonów
Firma ma 48h na feedback. Poprawki: max 5 zmian (np. zamiana zdjęcia, korekta tekstu, zmiana koloru). Jeśli proszą o więcej — grzecznie informuj, że to poza zakresem
Po akceptacji (lub po 48h bez odpowiedzi) — zamknij zlecenie na platformie
Narzędzia (wszystkie darmowe lub zapewnione przez platformę)
Najczęstsze problemy i jak je rozwiązać
Firma nie wysyła materiałów. Przypomnij po 48h. Po 72h — eskaluj na platformie. Nie czekaj w nieskończoność.
Firma chce 20 poprawek zamiast 5. Pokaż zakres z karty usługi. Zaproponuj dodatkowe poprawki jako oddzielne micro-zlecenie.
Firma nie ma logo ani kolorów. Zaproponuj 2-3 palety z Coolors.co. Użyj czystego, nowoczesnego fontu. Nie próbuj projektować logo — to osobna usługa.
Nie wiesz, co pisać o branży, której nie znasz. Przeczytaj 5-10 postów konkurencji. Przejrzyj FAQ na stronie firmy. Zapytaj firmę o 3 najczęstsze pytania klientów — to Twoje najlepsze tematy.
Grafiki wyglądają amatorsko. Trzymaj się szablonu. Max 2 czcionki, max 3 kolory. Dużo białej przestrzeni. Mniej = lepiej.
Checklist przed oddaniem
Nie wysyłaj materiałów firmie, zanim nie odhaczysz każdego punktu:
12 grafik PNG w 1080×1080, czytelnych na telefonie
12 tekstów z hashtagami, CTA i hookiem w pierwszych 2 linijkach
Harmonogram z datami, godzinami i przypisaniem do platformy
Link do edytowalnych szablonów Canva (upewnij się, że firma ma dostęp)
Korekta tekstów (LanguageTool) — zero literówek
Wszystko w jednym folderze Google Drive z jasną strukturą
Wiadomość podsumowująca: co jest w środku + jak korzystać
Student2Work — Łączymy ambicje studentów z potrzebami firm',
  549, NULL,
  NULL, 7, 'Marketing',
  false, 0.25, true, 'platform_service', 'active', NULL
);

-- #04: Projekt logo + mini-księga znaku
INSERT INTO public.service_packages (
  title, description, locked_content, price, price_max,
  variants, delivery_time_days, category,
  requires_nda, commission_rate, is_system, type, status, student_id
) VALUES (
  'Projekt logo + mini-księga znaku',
  'Projekt logo + mini-księga znaku
Profesjonalne logo w 3 wariantach z plikami do druku, internetu i social mediów
O co chodzi
Otwierasz firmę, zmieniasz nazwę albo po prostu masz logo które wygląda jak zrobione w Paincie w 2012 roku. Potrzebujesz nowego — profesjonalnego, czytelnego, które będzie działać na wizytówce, stronie internetowej, social mediach i na szyldzie.
Student zaprojektuje Twoje logo od zera: zacznie od briefu (czym się zajmujesz, do kogo mówisz, co chcesz komunikować), przygotuje 3 różne propozycje, a po Twoim wyborze — dopracuje finalny projekt i dostarczy komplet plików gotowych do użycia wszędzie. Dodatkowo dostajesz mini-księgę znaku — krótki dokument z zasadami używania logo (kolory, czcionki, co wolno a czego nie).
To NIE jest: pełna identyfikacja wizualna (wizytówki, papier firmowy, szablony social media, key visual, Brand Book). To jest sam projekt logo z mini-księgą. Pełna identyfikacja to oddzielne zlecenie.
Co dokładnie dostajesz
Czego ten pakiet nie obejmuje
Projekt wizytówki, papieru firmowego, koperty, teczki (to oddzielne zlecenie lub pakiet identyfikacji)
Szablony do social mediów (okładka FB, szablon posta IG)
Key visual (system wizualny marki — wzory, grafiki, styl zdjęć)
Animacja logo (motion design)
Naming (wymyślanie nazwy firmy) — logo projektujemy do nazwy którą już masz
Rejestracja znaku towarowego w UPRP — to procedura prawna, nie graficzna
Co musisz dostarczyć
Nazwa firmy (i ewentualny slogan/podtytuł, np. "Kowalski Transport — przewozy krajowe")
Branża i krótki opis: czym się zajmujesz, kto jest Twoim klientem (B2B/B2C), w jakim stylu chcesz być postrzegany
2-3 logo które Ci się podobają (z dowolnej branży) — żebyśmy wiedzieli w jakim kierunku iść
2-3 logo które Ci się NIE podobają — równie ważne
Preferencje kolorystyczne (jeśli masz) lub informacja "dobierzcie sami"
Stare logo (jeśli istnieje) — żeby wiedzieć czego unikać lub co ewentualnie zachować
Im więcej powiesz na starcie, tym celniejsze będą propozycje. Brief wypełnisz w 15 minut — to oszczędzi kilka dni iteracji.
Jak ta cena wygląda na tle rynku
Za 699 PLN dostajesz to, co freelancer sprzedaje za 1 500-2 000 PLN: kilka propozycji, pliki wektorowe do druku, wersje kolorystyczne i mini-księgę. Różnica: wykonawcą jest student grafiki, który buduje portfolio. Nie ma 10 lat doświadczenia w brandingu, ale umie projektować w Illustratorze/Figmie i zna zasady typografii, kompozycji i koloru — bo to jest jądro jego studiów.
Jak wygląda proces
Dzień 1-2: Wypełniasz brief (15 min). Student analizuje branżę, konkurencję i Twoje preferencje. Może wrócić z 2-3 pytaniami doprecyzowującymi.
Dzień 3-5: Student przygotowuje 3 propozycje logo. Każda na mockupach (wizytówka, strona, szyld) — żebyś widział jak logo działa w realu, nie tylko jako obrazek.
Dzień 6: Wybierasz 1 koncepcję. Masz 48h na decyzję. Jeśli żadna nie pasuje — student przygotuje 1 dodatkową (na podstawie Twojego feedbacku).
Dzień 7-8: 2 rundy poprawek (do 5 zmian/rundę). Dopracowanie detali: kolor, proporcje, grubość linii, odstępy.
Dzień 9-10: Eksport finalnych plików (PNG, SVG, PDF, AI) + mini-księga znaku. Gotowe.
Masz pytania? Napisz do nas przez platformę — odpowiadamy w ciągu 24h.',
  'Ta sekcja nie jest widoczna dla firmy-zleceniodawcy. Zawiera instrukcję realizacji, wynagrodzenie i wewnętrzne wskazówki.
Twoje wynagrodzenie
Rozkład czasu: ~1h brief + ~2h research/moodboard + ~5-7h projektowanie 3 koncepcji + ~2-3h poprawki + ~1-2h eksport plików i księga. Kluczowe: dobry brief = mniej poprawek = szybciej skończone.
Instrukcja realizacji — dzień po dniu
Dni 1-2: Brief i research (~2-3h)
Wyślij firmie brief (szablon Google Forms, ID: BRIEF-LOGO-04). Musisz ustalić:
Nazwa firmy + slogan (dokładna pisownia! „Kowalski” czy „KOWALSKI” czy „kowalski” — to zmienia wszystko)
Branża, klienci, styl (formalny/nowoczesny/zabawny/minimalistyczny/premium)
Logo powinno mieć sygnetu (ikonę), czy wystarczy sam logotyp (tekst)?
Gdzie logo będzie używane najczęściej? (strona, social media, druk, szyld, samochody firmowe)
Kolory: preferencje lub „dobierzcie”
Inspiracje: 2-3 logo które się podobają, 2-3 które się nie podobają
Research (~1h, nie pomijaj!):
Sprawdź 5-10 konkurentów firmy — jakie mają logo, jakie kolory dominują w branży. NIE kopiuj, ale bądź świadomy kontekstu
Przejrzyj Dribbble, Behance, LogoLounge szukając "[branża] logo" — zbierz 10-15 inspiracji do moodboardu
Zapisz w Miro/Figma: paleta kolorów, style czcionek, kierunki wizualne. To będzie Twój punkt wyjścia
Dni 3-5: Projektowanie 3 koncepcji (~5-7h)
Każda koncepcja powinna być INNA:
Koncepcja A: bezpieczna — klasyczna, czytelna, bliska temu co firma opisawała w briefie
Koncepcja B: kreatywna — bardziej odważna, z sygnetem lub nietypowym układem
Koncepcja C: minimalistyczna — sam tekst (logotyp) z wyrazistym krojem czcionki
Zasady projektowania logo — wiesz to ze studiów, ale checklist:
Projektuj w wektorze (Illustrator, Figma z komponentami, Affinity Designer). Nigdy w Photoshopie — logo musi być skalowalne
Testuj w małym rozmiarze: logo musi być czytelne w 32px (favicon) i 16mm (wizytówka). Jeśli jest nieczytelne — upraszczaj
Max 2 czcionki. Często 1 wystarczy. Unikaj czcionek za darmo z wątpliwym licencjonowaniem — Google Fonts, Adobe Fonts, Fontesk są bezpieczne
Max 2-3 kolory. Wybieraj z myślą o kontraście — logo musi działać na białym I ciemnym tle
Nie używaj clipartów, ikon z Flaticon, elementów Canvy. Logo musi być unikalne — inaczej firma nie może go zarejestrować
Testuj w czarno-białej wersji — jeśli logo nie działa bez koloru, jest źle zaprojektowane
Pole ochronne: min. wielkość litery „O” z logotypu dokoła całego logo. Żadne elementy nie mogą wchodzić w to pole
Prezentacja propozycji:
NIE wysyłaj 3 logo na białym tle. Pokaż każde na mockupach — to robi OGROMNĄ różnicę w percepcji. Darmowe mockupy: Mockup World, Ls.Graphics, Anthony Boyd.
Mockup wizytówki (smartmockups.com — free)
Mockup strony/nagłówka (screenshot placeholder + logo)
Mockup szyldu lub torby (opcjonalnie — zależy od branży)
Wyślij prezentację PDF (nie osobne pliki!). Każda koncepcja na osobnej stronie: logo + mockupy + krótkie uzasadnienie (2-3 zdania dlaczego taki kierunek).
Złota zasada: firma nie wybiera logo — firma wybiera MOCKUP. Jeśli logo na mockupie wygląda profesjonalnie, klient kupi. Jeśli wyślesz same logotypy na białym tle — klient powie „nie wiem, wszystkie są jakby takie same”.
Dni 7-8: Poprawki (~2-3h)
Firma wybrała koncepcję — zapytaj CO dokładnie chce zmienić. Nie „czuż” zmian — pytaj wprost
Runda 1: do 5 zmian. Typowe: „inny odcień niebieskiego”, „czuć grubsza”, „lemek bardziej geometryczny”, „odstęp między literami”
Runda 2: do 5 zmian. To są detale — finalne dopasowanie
Jeśli firma chce więcej — „Możemy zrobić kolejną rundę jako dodatkowe micro-zlecenie”
Najczęstszy problem: firma mówi „nie wiem co zmienić, coś mi nie pasuje”. Odpowiedź: „Czy chodzi o kształt, kolor, czcionkę czy układ?” — zawęź pytanie. Nigdy nie pytaj „co Pan myśli?” — pytaj „czy kształt ikony jest ok, czy chce Pan go zmienić?”
Dni 9-10: Eksport i księga (~2h)
Eksport plików — checklist:
Każdy plik w 4 wersjach: kolor + czarno-biały + na jasne tło + na ciemne tło. Razem: ~16-20 plików. Uporządkuj w foldery: /kolor, /czarno-bialy, /jasne-tlo, /ciemne-tlo.
Mini-księga znaku (PDF, 2-4 strony):
Narzędzia
Najczęstsze problemy i jak je rozwiązać
Firma mówi „zróbcie coś fajnego” bez żadnych wskazówek. Nie zaczynaj bez briefu. Powiedz: „żebyśmy trafili w Państwa gust, potrzebuję 15 minut na kilka pytań. Bez tego ryzykujemy, że zrobimy 3 propozycje i żadna nie będzie blisko.” Wyślij brief i poczekaj na odpowiedzi.
Firma chce logo „jak Apple / Nike / Coca-Cola”. Grzecznie: „Te logo działają, bo za nimi stoją miliardy dolarów marketingu, nie dlatego że sam kształt jest magiczny. Zaprojektuję coś, co będzie równie czyste i profesjonalne, ale unikalne dla Państwa firmy.”
Żadna z 3 propozycji nie pasuje. Zapytaj: „Co dokładnie nie pasuje? Kształt, kolor, czcionka, styl?” Na podstawie feedbacku zrób 1 dodatkową koncepcję. Jeśli po 4 propozycjach nadal nie pasuje — problem jest w briefie, nie w projekcie. Wróć do briefu.
Firma chce użyć konkretnej czcionki która jest płatna. Sprawdź licencję. Jeśli firma ma licencję — użyj. Jeśli nie — zaproponuj darmową alternatywę (Google Fonts, Fontesk). NIE używaj pirackich fontów — firma może dostać wezwanie.
Nie umiesz eksportować do CMYK / AI. Figma nie eksportuje CMYK natywnie. Rozwiązanie: projektuj w Figmie, finalny eksport do druku zrób w Affinity Designer (wersja próbna 30 dni) lub poproś kolegę z Illustratorem o konwersję. Alternatywnie: SVG + informacja o kolorach CMYK w księdze znaku — drukarnia sobie przekonwertuje.
Firma prosi o niekończące się poprawki. „W ramach zlecenia mamy 2 rundy po 5 zmian. Też zależy mi na idealnym efekcie — jeśli potrzeba więcej, możemy otworzyć dodatkowe micro-zlecenie.” Dokumentuj każdą rundę (data + lista zmian).
Checklist końcowy
3 koncepcje zaprezentowane na mockupach (nie na białym tle!)
Finalny projekt zaakceptowany przez firmę (screenshot/mail potwierdzający)
Pliki: PNG (przezroczyste), SVG, PDF (wektor/CMYK), AI/EPS — w 4 wersjach kolorystycznych
Pliki nazwane spójnie: logo_[firma]_[we',
  699, NULL,
  NULL, 10, 'Design',
  false, 0.25, true, 'platform_service', 'active', NULL
);

-- #06: Teksty na stronę firmową — 5 podstron
INSERT INTO public.service_packages (
  title, description, locked_content, price, price_max,
  variants, delivery_time_days, category,
  requires_nda, commission_rate, is_system, type, status, student_id
) VALUES (
  'Teksty na stronę firmową — 5 podstron',
  'Teksty na stronę firmową — 5 podstron
Strona główna, O nas, Oferta, FAQ, Kontakt — napisane językiem korzyści, nie językiem właściciela
O co chodzi
Masz stronę internetową. Teksty na niej napisałeś sam w 2019 roku. Albo pisał informatyk, który robił stronę. Albo skopiowałeś z konkurencji i pozamieniałeś nazwy. Efekt: Twoja strona mówi o firmie, ale nie mówi do klienta. „Firma XYZ została założona w 2015 roku i oferuje szeroki wachlarz usług...” — tak zaczyna się 90% stron polskich MŚP. I 90% klientów zamyka taką stronę po 5 sekundach.
Student napisze od zera teksty na 5 kluczowych podstron Twojej strony firmowej. Każdy tekst napisany językiem korzyści — nie „co robimy”, tylko „co z tego masz”. Bez korporacyjnego żargonu, bez lania wody, bez „jesteśmy liderem na rynku”.
Typowe sytuacje: otwierasz nową firmę i potrzebujesz tekstów na stronę, odświeżasz stronę bo obecne teksty są słabe, zamawiasz landing page (#10) i potrzebujesz treści, tłumaczysz stronę na polski i chcesz naturalne teksty (nie google translate).
Co dokładnie dostajesz
Łącznie: ~7 000-11 500 znaków ze spacjami gotowego tekstu, dostarczanego w Google Docs (do łatwego komentowania) + końcowy eksport do DOCX.
Dodatkowo: dla każdej podstrony student zaproponuje meta title (<60 znaków) i meta description (<160 znaków) — to teksty, które pojawiają się w Google. Podstawowe SEO, żeby strona miała szansę się wyświetlać.
Poprawki: 1 runda (do 5 zmian) — zmiana tonu, dodanie akapitu, skrócenie sekcji, korekta faktów.
Czego ten pakiet nie obejmuje
Wstawianie tekstów na stronę (CMS, WordPress) — dostajesz gotowy tekst, wstawiasz sam lub Twój webmaster
Artykuły blogowe / content marketing — to oddzielne zlecenie
Tłumaczenie na inne języki
Zaawansowane SEO (analiza słów kluczowych, link building, audyt techniczny)
Zdjęcia, grafiki, ikony do strony
Teksty dłuższe niż 3 500 zzs na podstronę — jeśli potrzebujesz rozbudowanej oferty (np. 10 usług) to oddzielne zlecenie
Co musisz dostarczyć
Krótki opis firmy: czym się zajmujesz, od kiedy, co Cię wyróżnia, kim są Twoi klienci
Lista usług/produktów które chcesz opisać na stronie Oferta
Obecna strona (link) — jeśli istnieje, żeby student widział punkt wyjścia
2-3 strony konkurencji lub firm z branży które Ci się podobają (pod kątem tekstów, nie designu)
Ton komunikacji: formalny („Szanowni Państwo”) czy swobodny („Cześć, dobrze że tu jesteś”)? B2B czy B2C?
FAQ: spisz 5-8 pytań które klienci zadają najczęściej (przez telefon, maila, na spotkaniach). Student dopisze 3-4 dodatkowe
Jak ta cena wygląda na tle rynku
Student dziennikarstwa lub marketingu umie pisać — to jest dosłownie to, czego się uczy. Na zajęciach z copywritingu, retoryki, języka reklamy. Nie napisze tekstu na poziomie agencji z 20-letnim stażem, ale napisze tekst 10x lepszy niż „Firma XYZ została założona w 2015 roku”.
Jak wygląda proces
Dzień 1: Wypełniasz brief (15 min). Student analizuje firmę, branżę, konkurencję. Może zadzwonić z 2-3 pytaniami.
Dzień 2-3: Student pisze strona główną + O nas. Wysyła do przeglądu w Google Docs.
Dzień 4-5: Student pisze Ofertę + FAQ + Kontakt. Całość udostępniona do komentowania.
Dzień 6-7: Feedback i poprawki (1 runda, do 5 zmian). Finalne meta tagi. Eksport do DOCX.
Masz pytania? Napisz do nas przez platformę — odpowiadamy w ciągu 24h.',
  'Ta sekcja nie jest widoczna dla firmy-zleceniodawcy. Zawiera instrukcję realizacji, wynagrodzenie i wewnętrzne wskazówki.
Twoje wynagrodzenie
Rozkład: ~1h brief + ~2h research/analiza + ~5-7h pisanie + ~1-2h poprawki + ~1h meta tagi i formatowanie.
Instrukcja realizacji — dzień po dniu
Dzień 1: Brief i research (~2-3h)
Wyślij firmie brief (ID: BRIEF-COPY-06). Kluczowe pytania:
Kim jest Twój klient? (wiek, płeć, problem który rozwiązujesz, co go frustruje, czego szuka)
Co wyróżnia Cię od konkurencji? (jeśli firma mówi „nic” — szukaj sam: cena, szybkość, lokalizacja, podejście, specjalizacja)
Jaki ton? Formalny (kancelaria, B2B) czy swobodny (kawiarnia, e-commerce B2C)?
Czy są słowa/frazy które muszą się pojawić? (nazwa produktu, slogan, nazwa technologii)
CTA — co chcesz, żeby klient zrobił po przeczytaniu strony? (zadzwonił? wypełnił formularz? kupił?)
Research konkurencji (~1h):
Przejrzyj 3-5 stron konkurencji. Zanotuj: jak piszą, jakie CTA, co działa, co źle wygląda
Przejrzyj 2-3 strony z branży które firma wskazała jako inspirację
Zanotuj 3-5 słów kluczowych które klienci firmy prawdopodobnie wpisują w Google (np. „naprawa laptopów Warszawa”, „księgowa dla JDG”). Użyj AnswerThePublic lub Google autocomplete
Dni 2-5: Pisanie (~5-7h)
Zasada nadrzędna: pisz do KLIENTA firmy, nie do firmy. Każde zdanie musi odpowiadać na pytanie „co z tego mam?”.
Podstrona 1: Strona główna (hero + 4-5 sekcji)
Podstrona 2: O nas
Nie pisz CV firmy. Pisz historię która odpowiada na pytanie „Dlaczego mam Wam zaufać?”
Formuła: Problem (z czym się mierzyłem) → Rozwiązanie (co zrobiłem) → Efekt (co działa dziś). To jest storytelling, nie opis z KRS
Pokaż ludzi, nie firmę. „Anna, która od 8 lat prowadzi dział obsługi” > „Nasz zespół składa się z doświadczonych specjalistów”
Wartości: max 3, konkretne, z przykładem. NIE: „Profesjonalizm”. TAK: „Odpowiadamy na maile tego samego dnia — bo wiemy jak frustrujące jest czekanie”
Podstrona 3: Oferta / Usługi
Każda usługa: nagłówek (korzyść) + 2-3 zdania opisu + dla kogo + co dostajesz. Format: korzyść > cechy, nie odwrotnie
Unikaj branżowego żargonu. Nie „implementacja rozwiązań ERP” ale „porządkujemy pracę Twojej firmy w jednym systemie”
Każda usługa kończy się CTA: „Zapytaj o wycenę”, „Umów się na rozmowę”
Podstrona 4: FAQ (8-12 pytań)
Weź pytania z briefu (firma daje 5-8). Dopisz 3-4 własne na podstawie researchu (Google autocomplete, konkurencja, fora)
Odpowiedzi: krótkie (2-4 zdania), konkretne, bez lania wody. Każda kończy się action itemem jeśli to możliwe
SEO bonus: FAQ z pytaniami zaczynającymi się od „Jak...”, „Ile kosztuje...”, „Czy...” — to są frazy które ludzie wpisują w Google
Podstrona 5: Kontakt
Nie tylko dane adresowe. Napisz 2-3 zdania zachęcające: „Masz pytanie? Zadzwoń lub napisz — odpowiadamy w ciągu 2h w dniach roboczych”
Podpowiedz firmie: dodaj godziny pracy, mapkę, formularz kontaktowy
CTA: „Napisz do nas” albo „Zadzwoń teraz” — jasne, widoczne
Lista słów i fraz ZAKAZANYCH
Te frazy NIE MAJĄ się pojawić w tekście. To są puste słowa, które nic nie mówią:
Każde puste słowo to stracona okazja, żeby powiedzieć klientowi coś konkretnego. Jeśli nie możesz zamienić frazy na LICZBĘ, FAKT lub DOWOD — usuń ją.
Narzędzia
Najczęstsze problemy
Firma mówi „napisz co chcesz, znasz się”. Nie zaczynaj bez briefu. „Potrzebuję 15 min Państwa czasu żeby trafić w ton i fakty. Bez tego ryzykuję przepisywanie tekstów 3 razy.”
Firma chce „bardziej profesjonalnie” (= nieszczerze i sztywno). „Profesjonalnie to nie znaczy sztywno. Apple, Allegro, InPost piszą prosto i nikt ich nie uważa za nieprofesjonalnych.” Jeśli firma upiera się — pisz formalniej, ale bez korporacyjnego bełkotu.
Firma nie ma żadnych opinii klientów do social proof. Pomiń sekcję opinii. Zamiast tego użyj liczb: lata działalności, ilość klientów, ilość realizacji. Jeśli nic nie ma — CTA „Zobacz nasze realizacje” (nawet 2-3 wystarczy).
Nie wiesz nic o branży firmy. 1h researchu wystarczy. Przejrzyj 5 stron konkurencji, 3 artykuły branżowe, forum/Facebook grupy. Nie musisz być ekspertem — musisz pisać tak, żeby klient firmy się odnalazł.
Firma chce tekst 100% pod SEO (naszpikowany słowami kluczowymi). „Naturalne użycie słów kluczowych jest skuteczniejsze niż nafaszerowanie. Google od lat karze za keyword stuffing. Wplatę frazy naturalnie w nagłówki i treść.”
Checklist końcowy
5 podstron napisanych i sformatowanych w Google Docs
Każda podstrona: nagłówki (H1, H2), akapity, CTA
Meta title (<60 znaków) i meta description (<160 znaków) dla każdej podstrony
Żadnych słów z listy zakazanych („witamy”, „szeroki wachlarz”, „lider” itd.)
Tekst sprawdzony w LanguageTool (zero błędów ortograficznych/gramatycznych)
Czytelność sprawdzona (krótkie zdania, prosty język, dużo białej przestrzeni)
Eksport do DOCX jako finalna dostawa
Wiadomość podsumowująca na platformie
Student2Work — Łączymy ambicje studentów z potrzebami firm',
  599, NULL,
  NULL, 7, 'Copywriting',
  false, 0.25, true, 'platform_service', 'active', NULL
);

-- #07: Montaż Reels / TikTok — pakiet 4 rolek
INSERT INTO public.service_packages (
  title, description, locked_content, price, price_max,
  variants, delivery_time_days, category,
  requires_nda, commission_rate, is_system, type, status, student_id
) VALUES (
  'Montaż Reels / TikTok — pakiet 4 rolek',
  'Montaż Reels / TikTok — pakiet 4 rolek
Dynamiczne krótkie wideo z Twojego materiału — gotowe do publikacji na Instagramie, TikToku i YouTube Shorts
O co chodzi
Wiesz, że powinieś wrzucać Reelsy i TikToki. Widzisz, że konkurencja to robi. Ale: nie umiesz montować, nie masz czasu, albo Twoje próby wyglądają jak nagranie z rodzinnego grilla. A algorytm promuje wideo — posty ze zdjęciami mają 3x mniejszy zasięg niż Reels.
Wysyłasz surowy materiał wideo (nagrany telefonem — to wystarczy), a student zamienia go w 4 profesjonalne, dynamiczne rolki gotowe do publikacji. Z cięciami, napisami, muzyką, formatem 9:16 i hookiem który zatrzyma kciuk.
Ważne: student MONTUJE Twój materiał — nie nagrywa, nie jest aktorem, nie przyjeżdża z kamerą. Nagrywasz Ty (telefonem!) albo Twój pracownik, a student robi z tego gotową rolkę.
Co dokładnie dostajesz
Czego ten pakiet nie obejmuje
Nagrywanie materiału (Ty nagrywasz telefonem, my montujemy)
Scenariusz / scenopis (ale student zaproponuje strukturę jeśli potrzebujesz)
Aktorzy, lektorzy, voiceover profesjonalny
Animacje 2D/3D, motion graphics zaawansowane
Publikacja na kontach firmy (dostajesz gotowy plik, wrzucasz sam)
Strategia social media, harmonogram, analityka
Co musisz dostarczyć
Surowy materiał wideo — minimum 2-5 minut surowego materiału na każdą rolkę (lepiej więcej). Nagrany telefonem w pionie (9:16), dobry dźwięk, przyzwoite światło
Temat / cel każdej rolki: co chcesz pokazać? (produkt, poradnik, behind-the-scenes, opinia klienta, efekt przed/po)
Logo firmy (PNG, przezroczyste tło) — do watermarku/końcówki
Kolory marki i czcionka (jeśli masz identyfikację wizualną) — żeby napisy były spójne z marką
Przykłady rolek które Ci się podobają (2-3 linki) — żebyśmy trafili w styl
„Nagrywanie telefonem” to nie wada — 80% viralowych Reelsów jest nagranych iPhone’em. Liczy się treść, dynamika i montaż, nie rozdzielczość 4K.
Jak ta cena wygląda na tle rynku
Za cenę jednej rolki u freelancera dostajesz 4 od studenta. Student montuje od lat — na własne kanały, dla znajomych, na zaliczenie. Zna DaVinci Resolve, CapCut, Premiere. Zna trendy, bo sam scrolluje TikToka 2h dziennie.
Jak wygląda proces
Dzień 1: Wypełniasz brief: temat każdej rolki, przykłady, styl. Wysyłasz surowy materiał wideo (Google Drive / WeTransfer).
Dzień 2-4: Student montuje 4 rolki. Cięcia, napisy, muzyka, hook, format 9:16.
Dzień 5-6: Podgląd do akceptacji. Feedback: 1 runda na rolkę, do 3 zmian.
Dzień 7: Finalne pliki: MP4 (1080x1920, 30fps). Gotowe do wrzucenia.',
  'Ta sekcja nie jest widoczna dla firmy-zleceniodawcy. Zawiera instrukcję realizacji, wynagrodzenie i wewnętrzne wskazówki.
Twoje wynagrodzenie
Rozkład: ~0.5h brief/komunikacja + ~1-2h selekcja materiału + ~5-7h montaż 4 rolek + ~1-2h poprawki + ~0.5h eksport.
Instrukcja realizacji — dzień po dniu
Dzień 1: Brief i odbiór materiału (~1h)
Wyślij firmie brief (ID: BRIEF-REELS-07). Kluczowe pytania:
Cel każdej rolki: co chcesz pokazać/osiągnąć? (sprzedaż, świadomość marki, edukacja, rozrywka)
Temat/scenariusz: co jest nagrane? (rozmowa do kamery, produkt, proces, behind-the-scenes, efekt przed/po)
Grupa docelowa: kto ma to oglądać? (wiek, platforma, zainteresowania)
Styl: dynamiczny/szybki (TikTok energy) czy spokojniejszy (estetyczny IG)? Linki do 2-3 rolek-inspiracji
Branding: logo, kolory, czcionka. Jeśli brak — użyjesz neutralnych
Odbiór materiału:
Poprosi o wysyłkę przez Google Drive (najlepiej folder z oddzielnymi plikami per rolka)
Sprawdź jakość: czy jest dźwięk? Czy w pionie (9:16)? Czy wystarczająco dużo materiału? (min. 2-5 min surowego na 1 rolkę 15-60s)
Jeśli materiał jest słabej jakości (ciemno, szum, zły dźwięk) — powiedz firmie OD RAZU. Lepiej poprosić o ponowne nagranie niż montować zły materiał
Najważniejsze pytanie: „Co chcesz, żeby widz ZROBIŁ po obejrzeniu?” Odpowiedź na to pytanie definiuje cały montaż — od hooka po CTA.
Dni 2-4: Montaż (~5-7h, ~1.5-2h/rolka)
Struktura każdej rolki (szablon):
Zasady montażu krótkich form — checklist techniczny:
Cięcia co 2-4 sekundy. Dłuższe ujęcie = widz scrolluje dalej. Wyjątek: dramatyczny moment, reveal, efekt WOW
Napisy ZAWSZE. 85% ogląda bez dźwięku. Napisy dynamiczne (słowo po słowie, highlight kluczowych frąz). Styl CapCut/Alex Hormozi: duża czcionka, kontrastowy kolor, animacja wejścia
Muzyka/beat: dopasuj cięcia do beatu. Szybka muzyka = szybkie cięcia. Spokojny content = ambient/piano. Używaj royalty-free: CapCut library, Pixabay Music, Mixkit
Zoom-in na detale: jeśli mówca tłumaczy coś ważnego → zoom do twarzy. Produkt → zoom do detalu. Tekst na ekranie → zoom
Korekcja koloru: podstawowa. Jasność, kontrast, nasycenie. Nie potrzebujesz LUTów filmowych — Reels mają wyglądać naturalnie, nie jak film Tarantino
Dźwięk: usuń szum (DaVinci: Fairlight, CapCut: noise reduction), wyrównaj głośność, dodaj efekty dźwiękowe (swoosh, pop, ding) na przejściach
Format eksportu: MP4, H.264, 1080x1920 (9:16), 30fps, bitrate 10-15 Mbps. Plik <100MB (limit IG Reels)
10 typów rolek które działają dla firm MŚP
Dni 5-6: Poprawki (~1-2h)
Wyślij podgląd (Google Drive, unlisted YouTube, lub plik MP4). NIE przez WhatsApp — kompresja zabija jakość
1 runda poprawek na rolkę, max 3 zmiany: tempo, muzyka, napis, kolejność ujęć, długość
Typowe poprawki: „przyspiesz środek”, „inny font napisów”, „dodaj logo na końcu”, „usuń ten fragment”
Dzień 7: Eksport i dostawa (~0.5h)
Eksport: MP4, H.264, 1080x1920, 30fps
Nazewnictwo: rolka_01_[temat].mp4, rolka_02_[temat].mp4 itd.
Folder Google Drive z 4 plikami + okładki (jeśli były) osobno
Wiadomość: „Rolki gotowe. Rekomenduję publikować 1 na 2-3 dni (nie wszystkie naraz) o 18:00-21:00.”
Narzędzia
Najczęstsze problemy
Materiał jest słabej jakości (ciemno, rozmyte, szum dźwięku). Powiedz firmie natychmiast: „Materiał ma problem z [oświetleniem/dźwiękiem]. Montaż nie poprawi tego w 100%. Rekomenduję: nagraj ponownie przy oknie/świetle dziennym, mikrofon bliżej. Zajmie 10 minut, a różnica będzie ogromna.”
Materiału jest za mało na 4 rolki. Komunikuj wcześnie: „Z tego materiału zrobię 2 dobre rolki, nie 4. Czy możesz nagrać jeszcze [temat X i Y]? Wyślę Ci wskazówki co nagrać.”
Firma chce „tak jak u [influencera z 1M followerów]”. Część efektów wymaga profesjonalnego sprzętu/oświetlenia/aktora. Powiedz: „Przygotuję montaż w tym stylu — dynamika, cięcia, napisy będą podobne. Różnica będzie w jakości nagrania — to kwestia sprzętu, nie montażu.”
Firma chce użyć popularnego utworu (np. Dua Lipa, Drake). „Na profilu firmowym komercyjna muzyka może zostać zablokowana lub wyciszona. Rekomenduję royalty-free albo trending sound bezpośrednio z IG/TikToka — te są bezpieczne i algorytm je promuje.”
Nie wiesz jaki styl napisów. Domyślnie: CapCut auto-captions (highlight słów kluczowych, duża czcionka, tło kontrastowe). Działa w 90% przypadków. Alternatywnie: napis ręczny pośrodku kadru (styl Hormozi/Gary Vee).
Checklist końcowy
4 rolki zmontowane, każda 15-60 sekund
Format: MP4, 1080x1920 (9:16), 30fps, <100MB/plik
Każda rolka ma hook (pierwsze 1-3 sek. przyciągające)
Napisy dynamiczne na całym filmie (czytelne, spójne ze styl.)
Muzyka royalty-free (lub trending sound z platformy)
Logo firmy widoczne (watermark lub outro)
Korekcja koloru: jasność/kontrast spójne między ujęciami
Dźwięk: brak szumów, głośność wyrównana
Pliki nazwane spójnie, w folderze Google Drive
Wiadomość podsumowująca na platformie + rekomendacja publikacji
Student2Work — Łączymy ambicje studentów z potrzebami firm',
  499, NULL,
  NULL, 7, 'Multimedia',
  false, 0.25, true, 'platform_service', 'active', NULL
);

-- #08: Audyt strony internetowej — techniczny + UX
INSERT INTO public.service_packages (
  title, description, locked_content, price, price_max,
  variants, delivery_time_days, category,
  requires_nda, commission_rate, is_system, type, status, student_id
) VALUES (
  'Audyt strony internetowej — techniczny + UX',
  'Audyt strony internetowej — techniczny + UX
Sprawdź, co jest nie tak z Twoją stroną — i dostanie konkretne instrukcje jak to naprawić
O co chodzi
Masz stronę internetową, ale: ładuje się wolno, nie widać jej w Google, na telefonie wygląda źle, nie wiesz czy jest bezpieczna (SSL), nie wiesz dlaczego klienci wchodzą i od razu wychoszą. Agencja SEO za audyt weźmie 2 000-5 000 PLN. Ty nie wiesz nawet od czego zacząć.
Student informatyki przeskanuje Twoją stronę narzędziami których używają profesjonaliści, przejrzy ją ręcznie pod kątem użyteczności (UX) i dostarczy raport: co jest źle, jak ważny jest każdy problem (priorytet), i co dokładnie zrobić żeby to naprawić. Raport jest napisany prostym językiem — nie musisz być informatykiem, żeby go zrozumieć.
To NIE jest: pełny audyt SEO z analizą słów kluczowych, link buildingiem i strategią contentową. To jest audyt techniczny + UX — „czy strona działa poprawnie i czy jest wygodna dla użytkownika”. Pełne pozycjonowanie to inna usługa.
Co dokładnie dostajesz
Format raportu: PDF, 15-25 stron. Każdy problem: screenshot + opis problemu + priorytet (krytyczny / ważny / drobny) + instrukcja naprawy. Streszczenie na 1 stronę z TOP 5 priorytetów.
Poprawki: 1 runda (do 5 zmian w raporcie: dodanie komentarza, wyjaśnienie punktu, zmiana priorytetu).
Czego ten pakiet nie obejmuje
Naprawa/wdrożenie zmian na stronie (raport mówi CO naprawić, ale nie naprawiamy — to robi Twój webmaster lub osobne zlecenie)
Analiza słów kluczowych i strategia SEO (nie dobieramy fraz, nie planujemy contentu)
Link building / off-page SEO
Audyt sklepu internetowego >50 podstron (to większe zlecenie)
Testy użyteczności z użytkownikami (eye-tracking, A/B testing, user interviews)
Audyt bezpieczeństwa / penetration testing
Co musisz dostarczyć
Adres strony internetowej (URL)
Dostęp do Google Search Console i Google Analytics (opcjonalnie, ale bardzo ułatwia audyt)
Cel strony: co chcesz żeby odwiedzający zrobił? (zadzwonił, kupił, wypełnił formularz, przeczytał)
Informacja o CMS: WordPress, Wix, Shopify, custom? (student ustali sam jeśli nie wiesz)
Jak ta cena wygląda na tle rynku
Nie zastąpimy agencji SEO z 10-letnim stażem. Ale dostarczymy to, czego firma MŚP naprawdę potrzebuje: jasny raport „co jest źle i jak to naprawić”, napisany prostym językiem, z priorytetami i screenshotami. Student informatyki używa tych samych narzędzi co agencja — PageSpeed, Screaming Frog, Lighthouse, WAVE.
Jak wygląda proces
Dzień 1: Brief: student otrzymuje URL, cel strony, dostęp do Analytics/GSC (opcjonalnie). Pierwsze skany automatyczne.
Dzień 2-4: Audyt techniczny: PageSpeed, mobile, SSL, meta tagi, 404, sitemap, nagłówki. Audyt UX: nawigacja, CTA, formularze, czytelność.
Dzień 5-6: Pisanie raportu: każdy problem + screenshot + priorytet + instrukcja naprawy. Streszczenie TOP 5.
Dzień 7: Dostarczenie raportu PDF. Feedback: 1 runda, do 5 zmian.',
  'Ta sekcja nie jest widoczna dla firmy-zleceniodawcy. Zawiera instrukcję realizacji, wynagrodzenie i wewnętrzne wskazówki.
Dlaczego właśnie student informatyki / politechniki?
Na 2-3 roku informatyki, inżynierii oprogramowania lub pokrewnych kierunków masz już:
HTML/CSS/JavaScript — rozumiesz strukturę strony, DOM, DevTools
Podstawy sieci — HTTP/HTTPS, statusy (200, 301, 404, 500), SSL/TLS
Podstawy UX/HCI — heurystyki Nielsena, użyteczność, nawigacja
Narzędzia deweloperskie — Chrome DevTools, Lighthouse, console
Programowanie — możesz napisać skrypt do przeskanowania linków/meta tagów
To są dokładnie umiejętności potrzebne do audytu technicznego strony. Nie potrzebujesz 5 lat doświadczenia w SEO — potrzebujesz systematyczności i dobrych narzędzi.
Twoje wynagrodzenie
Instrukcja realizacji — dzień po dniu
Dzień 1: Setup i skany automatyczne (~1-2h)
Przyjmij brief (ID: BRIEF-AUDIT-08). Zapisz: URL, cel strony, CMS, dostęp do GSC/GA.
Uruchom narzędzia (wszystkie darmowe):
Zrób screenshoty wyników każdego narzędzia. Będziesz ich potrzebować w raporcie.
Dni 2-4: Audyt ręczny (~4-6h)
Checklist audytu technicznego:
Checklist audytu UX (przegląd ręczny):
Dni 5-6: Pisanie raportu (~3-4h)
Struktura raportu (PDF, 15-25 stron):
Najważniejsza sekcja to PLAN DZIAŁANIA. Firma nie płaci za listę problemów — płaci za odpowiedź „CO MAM ZROBIĆ i W JAKIEJ KOLEJNOŚCI”. Każdy punkt: problem + instrukcja naprawy + kto powinien to zrobić (właściciel / webmaster / informatyk).
Najczęstsze problemy
Strona na Wix/Squarespace — nie masz dostępu do kodu. Audyt dalej ma sens! PageSpeed, mobile, UX, meta tagi, obrazy — to wszystko można sprawdzić z zewnątrz. W raporcie napisz: „poprawka wymaga edycji w panelu Wix → Settings → SEO” zamiast „edytuj robots.txt”.
Firma nie ma Google Analytics / Search Console. Zrób audyt bez nich — 90% sprawdzeń działa z zewnątrz. W raporcie dodaj rekomendację: „Załóż GSC i GA4 — to darmowe i konieczne do monitorowania strony. Instrukcja: [link]”.
Strona ma 50+ podstron (poza zakresem). Przeskanuj Screaming Frogiem całą stronę, ale ręcznie sprawdź 20 najważniejszych podstron (strona główna, oferta, kontakt, top produkty). Resztę oceń na podstawie skanów automatycznych.
Nie wiesz jak wyjaśnić problem nietechnicznej osobie. Zasada: każdy problem = 1 screenshot + 1 zdanie „co jest źle” + 1 zdanie „co to znaczy dla Twoich klientów”. Np. „Strona ładuje się 6.2 sek. na telefonie. Badania pokazują, że 53% użytkowników opuszcza stronę jeśli ładuje się >3 sek.”
Wszystko wygląda dobrze — brak poważnych błędów. To też wartościowy wynik! Firma dowiaduje się, że strona jest ok. Skup się na drobnych usprawnieniach UX i optymalizacji szybkości. Raport będzie krótszy ale równie użyteczny.
Checklist końcowy
Skany wykonane: PageSpeed, Lighthouse, Screaming Frog, WAVE, SSL Labs
Ręczny przegląd UX na 3 urządzeniach (desktop + mobile + tablet)
Każdy problem: screenshot + opis + priorytet (krytyczny/ważny/drobny) + instrukcja naprawy
Streszczenie na 1 stronę z TOP 5 priorytetów
Plan działania posortowany priorytetem z przypisaniem (kto ma to zrobić)
Raport sformatowany (PDF, spis treści, numer stron, logo firmy)
Raport napisany prostym językiem (nie żargonem IT)
Wiadomość podsumowująca na platformie
Student2Work — Łączymy ambicje studentów z potrzebami firm',
  449, NULL,
  NULL, 7, 'Programowanie i IT',
  false, 0.25, true, 'platform_service', 'active', NULL
);

-- #09: Tłumaczenie i lokalizacja strony PL→EN
INSERT INTO public.service_packages (
  title, description, locked_content, price, price_max,
  variants, delivery_time_days, category,
  requires_nda, commission_rate, is_system, type, status, student_id
) VALUES (
  'Tłumaczenie i lokalizacja strony PL→EN',
  'Tłumaczenie i lokalizacja strony PL→EN
Angielska wersja Twojej strony — nie dosłowne tłumaczenie, a naturalny tekst który brzmi jak napisany przez native speakera
O co chodzi
Chcesz sprzedawać za granicę, obsługiwać klientów anglojęzycznych albo po prostu wyglądać profesjonalnie z angielską wersją strony. Wrzucasz tekst do Google Translate — i dostajesz coś, co technicznie jest po angielsku, ale żaden native speaker tego nie kupi. Bo tłumaczenie maszynowe nie rozumie kontekstu, tonu marki, kulturowych niuansów ani języka korzyści.
Student filologii angielskiej nie tłumaczy słowo po słowie — adaptuje. Przepisuje Twoje teksty tak, żeby brzmiały naturalnie po angielsku, z zachowaniem tonu marki i języka korzyści. To się nazywa lokalizacja marketingowa — i jest warta 2-3x więcej niż zwykłe tłumaczenie.
Typowe sytuacje: eksportujesz produkty/usługi, masz klientów z UK/US/EU, aplikujesz do międzynarodowego programu, szukasz inwestorów zagranicznych, prowadzisz hotel/restaurację/turystykę w Polsce.
Co dokładnie dostajesz
Czego ten pakiet nie obejmuje
Tłumaczenie przysięgłe (to wymaga uprawnień — student ich nie ma)
Wstawianie tekstów na stronę (CMS/WordPress) — dostajesz gotowy tekst
Tłumaczenie z EN na PL (pakiet działa w kierunku PL→EN)
Teksty >12 000 zzs (większe zlecenia wyceniamy indywidualnie)
Tłumaczenie dokumentów prawnych, medycznych, technicznych (to wymaga specjalizacji)
Inne języki niż angielski
Co musisz dostarczyć
Teksty źródłowe po polsku (DOCX, Google Docs, link do strony) — finalne, zatwierdzone wersje
Kontekst: do kogo mówisz po angielsku? (UK, US, EU, global?) — bo angielski brytyjski ≠ amerykański
Ton: formalny (B2B, korporacja) czy swobodny (B2C, startup)?
Terminologia branżowa: czy są specyficzne terminy które muszą być przetłumaczone dokładnie? (np. nazwy produktów, technologii)
Czy masz już jakąś wersję angielską? (do wykorzystania lub do poprawy)
Jak ta cena wygląda na tle rynku
Student filologii angielskiej po 2-3 roku pisze lepiej po angielsku niż większość dorosłych Polaków. Zna idiomy, zna ton, zna różnice UK/US. Nie jest tłumaczem z 20-letnim stażem, ale napisze tekst który jest 10x lepszy niż Google Translate i spójny z tonem Twojej marki.
Jak wygląda proces
Dzień 1: Brief: student otrzymuje teksty PL, kontekst, ton, terminologię. Ustala: UK vs US English, poziom formalności.
Dzień 2-4: Lokalizacja tekstów: adaptacja każdej podstrony. Nie tłumaczenie 1:1 — przepisanie po angielsku z zachowaniem sensu, tonu i CTA.
Dzień 5-6: Korekta, spójność terminologii, meta tagi EN. Udostępnienie w Google Docs.
Dzień 7: Feedback i poprawki (1 runda, do 5 zmian). Eksport do DOCX.',
  'Ta sekcja nie jest widoczna dla firmy-zleceniodawcy. Zawiera instrukcję realizacji, wynagrodzenie i wewnętrzne wskazówki.
Dlaczego właśnie student filologii angielskiej?
Na 2-3 roku filologii angielskiej / lingwistyki stosowanej masz:
Poziom C1-C2 (CAE/CPE) — pisanie akademickie i kreatywne po angielsku
Zajęcia z tłumaczenioznawstwa — wiesz czym jest ekwiwalencja dynamiczna vs formalna
Zajęcia z pragmatyki / socjolingwistyki — rozumiesz różnice kulturowe UK/US
Praktykę pisania — eseje, artykuły, tłumaczenia — setki stron po angielsku
Wyczucie języka — wiesz kiedy coś „brzmiałoby dziwnie” dla native speakera
To jest dokładnie to, czego potrzeba do lokalizacji marketingowej. Nie tłumaczysz słów — przepisujesz sens.
Twoje wynagrodzenie
Instrukcja realizacji — dzień po dniu
Dzień 1: Brief i przygotowanie (~1-2h)
Brief (ID: BRIEF-TLEN-09). Kluczowe ustalenia:
UK English czy US English? (colour vs color, analyse vs analyze, kerb vs curb). Ustal raz i bądź konsekwentny
Ton: formal (B2B, korporacja: „We provide comprehensive solutions”) czy casual (B2C: „We’ve got you covered”)?
Terminologia branżowa: czy firma ma słowniczek? Czy są nazwy własne które NIE są tłumaczone?
CTA: co ma zrobić anglojęzyczny klient? (ta sama akcja co na PL, ale może inny kontekst)
Odbiorca: turysta w Polsce? Klient B2B z Niemiec? Inwestor z US? — to zmienia WSZYSTKO
Przygotowanie:
Przeczytaj CAŁY tekst PL zanim zaczniesz cokolwiek pisać. Zrozum logikę, flow, ton
Sprawdź 3-5 stron konkurencji firmy po angielsku. Jak oni piszą? Jakie słowa używają?
Zrób listę terminów branżowych PL→EN które się powtarzają — będź spójny
Dni 2-4: Lokalizacja (~5-7h)
Zasada nadrzędna: NIE tłumacz zdanie po zdaniu. Czytaj akapit, zamknij polski tekst, napisz to samo po angielsku swoimi słowami.
5 zasad lokalizacji marketingowej:
Sens, nie słowa. „Szeroki wachlarz usług” ≠ „a wide range of services” (banalne). Lepiej: „Everything you need, under one roof” lub po prostu lista usług
CTA po angielsku jest BARDZIEJ bezpośrednie. PL: „Zapraszamy do kontaktu”. EN: „Get in touch”, „Let’s talk”, „Book a free call”. Krócej, konkretniej
Unikaj polskich kalki. „We are a company that...” — native speaker nigdy tak nie zacznie. Lepiej: „We help [kto] [zrobić co]”
Social proof po angielsku: „Trusted by 500+ companies”, „4.9 on Google Reviews”. Liczby są uniwersalne
Jednostki i formaty: PLN → EUR/USD (albo zostaw PLN z dopiskiem „(approx. €/$ X)”), daty: DD.MM.YYYY → Month DD, YYYY (US) lub DD Month YYYY (UK), adresy: format międzynarodowy
Typowe pułapki tłumaczenia marketingowego PL→EN
Zasada: jeśli polskie zdanie jest puste (nie niesie informacji), nie tłumacz go — usuń lub zamień na coś konkretnego po angielsku.
Dni 5-6: Korekta i meta tagi (~2h)
Przeczytaj CAŁY tekst angielski na głos. Czy brzmi naturalnie? Czy native speaker powiedziałby to tak?
Sprawdź spójność terminologii (jeden termin = jedno tłumaczenie wszędzie)
Sprawdź: UK vs US konsekwencja (nie mieszaj colour z customize)
LanguageTool / Grammarly (darmowe) — korekta gramatyczna i stylistyczna
Meta title (<60 znaków EN) + meta description (<160 znaków EN) dla każdej podstrony. Naturalnie użyj angielskich słów kluczowych
Narzędzia
Najczęstsze problemy
Firma mówi „po prostu przetłumacz”. „Dosłowne tłumaczenie tekstów marketingowych brzmi nienaturalnie po angielsku. Dlatego ADAPTUJĘ — sens zostaje ten sam, ale angielski tekst brzmi jak napisany przez native speakera. To się nazywa lokalizacja i dzięki niej Państwa strona będzie działać na anglojęzycznych klientów.”
Tekst PL jest pełen pustych fraz („szeroki wachlarz”, „lider na rynku”). Nie tłumacz pustych fraz — zamień na konkrety. Jeśli PL tekst mówi „najwyższa jakość” a Ty nie wiesz co dokładnie jest wysokiej jakości — zapytaj firmę: „co konkretnie wyróżnia Państwa produkt?” Odpowiedź tłumaczysz, nie frazę.
Firma chce tłumaczenie dokumentów prawnych/technicznych. Odmawiam grzecznie: „Nie jestem tłumaczem przysięgłym i nie specjalizuję się w tekstach prawnych. Mogę zlokalizować Państwa stronę i materiały marketingowe.”
Nie znasz terminologii branży firmy po angielsku. 1h researchu: przejrzyj 3-5 angielskich stron z tej samej branży. Zanotuj terminy. Zapytaj firmę czy używają angielskich nazw (np. w eksporcie). Zrób mini-glossary przed rozpoczęciem.
Firma chce użyć tekstu jako „oficjalnego tłumaczenia”. Wyjaśnij: „To jest lokalizacja marketingowa, nie tłumaczenie przysięgłe. Do celów urzędowych potrzebują Państwo tłumacza przysięgłego.”
Checklist końcowy
5 podstron zlokalizowanych i sformatowanych w Google Docs
Spójność: UK lub US English konsekwentnie (nie mieszane)
Spójność terminologii branżowej (jeden termin = jedno tłumaczenie wszędzie)
Meta title (<60 zn.) i meta description (<160 zn.) EN dla każdej podstrony
Tekst sprawdzony w Grammarly/LanguageTool (zero błędów)
Tekst przeczytany na głos — czy brzmi naturalnie?
Żadnych kalki językowych z polskiego
CTA przełożone na naturalny angielski (nie dosłowne tłumaczenie)
Eksport do DOCX jako finalna dostawa
Wiadomość podsumowująca na platformie
Student2Work — Łączymy ambicje studentów z potrzebami firm',
  449, NULL,
  NULL, 7, 'Tłumaczenia',
  false, 0.25, true, 'platform_service', 'active', NULL
);

-- #10: Landing Page — strona pod kampanię lub zbieranie leadów
INSERT INTO public.service_packages (
  title, description, locked_content, price, price_max,
  variants, delivery_time_days, category,
  requires_nda, commission_rate, is_system, type, status, student_id
) VALUES (
  'Landing Page — strona pod kampanię lub zbieranie leadów',
  'Landing Page — strona pod kampanię lub zbieranie leadów
Jedna strona, jeden cel: formularz kontaktowy, zapis na newsletter albo prezentacja oferty
O co chodzi
Student zaprojektuje i postawi Ci działającą stronę internetową — jedną stronę (nie wielostronicowy serwis), która ma robić jedną konkretną rzecz. Najczęściej to: zbierać zapytania przez formularz kontaktowy, prezentować nową usługę lub produkt pod kampanię reklamową, albo zbierać zapisy na newsletter/event.
Strona będzie responsywna (działa na telefonie, tablecie, komputerze), będzie miała formularz kontaktowy, będzie podpięta pod Twoją domenę z certyfikatem SSL. Student postawi ją na jednej z platform: WordPress + Elementor, Webflow lub Framer — zależnie od tego, co lepiej pasuje do Twojej sytuacji.
Czym to nie jest: To nie jest rozbudowana strona firmowa z blogiem, sklepem, logowaniem użytkowników czy systemem płatności. To jedna strona z jednym celem. Jeśli potrzebujesz strony wielostronicowej — mamy osobną usługę (Strona wizytówka WordPress, 5 podstron).
Co dokładnie dostajesz
Czego ten pakiet nie obejmuje
Żebyś wiedział, za co płacisz — i za co nie płacisz:
Zakup domeny i hostingu — to Twój koszt (ok. 50-150 PLN/rok). Student doradzi gdzie kupić i pomoże skonfigurować
Sklep internetowy, koszyk, płatności online — to zupełnie inna kategoria projektu
Blog, podstrony, system logowania — landing page = jedna strona
Bieżące utrzymanie, aktualizacje, zmiany po zamknięciu zlecenia
Sesja zdjęciowa — pracujemy na Twoich materiałach lub darmowych stockach
Kampanie reklamowe (Google Ads, Facebook Ads) — to osobna usługa, ale landing page jest pod nie przygotowany
Zaawansowane SEO — strona ma podstawowe meta tagi, ale nie robimy pozycjonowania
Animacje, efekty parallax, wideo w tle — utrzymujemy prostotę, żeby strona szybko się ładowała
Co musisz dostarczyć
Bez tych rzeczy nie zaczniemy. Im szybciej je dostarczysz, tym szybciej dostaniesz stronę.
Cel strony — co ma się stać, kiedy ktoś na nią wejdzie? (formularz? telefon? zapis?)
Opis oferty — co sprzedajesz, komu, dlaczego warto. Nie musi być idealny — student dopieści tekst
Logo w dobrej jakości (PNG przezroczyste tło, SVG lub PDF wektorowy)
Zdjęcia produktu/usługi/zespołu — jeśli nie masz, powiedz, użyjemy stocków
Dostęp do domeny (panel DNS) i hostingu — lub informacja, że trzeba je dopiero kupić
2-3 strony internetowe, które Ci się wizualnie podobają (z dowolnej branży)
Jak ta cena wygląda na tle rynku
Nasza cena jest poniżej stawki freelancera za indywidualny projekt — bo wykonawcą jest student, nie ktoś z 5-letnim portfolio. Student pracuje z instrukcją platformy, korzysta z nowoczesnych narzędzi (Figma, Webflow/Elementor) i ma wsparcie mentorskie. Dla firmy testującej nowy pomysł, uruchamiającej kampanię lub potrzebującej po prostu ładnej strony z formularzem — to wystarczający poziom.
Jak wygląda proces
Dzień 1-2: Wypełniasz brief (ankieta, 15 min). Student analizuje materiały, zadaje pytania, ustala szczegóły techniczne (domena, hosting, platforma).
Dzień 3-5: Student projektuje makietę w Figma — widzisz jak strona będzie wyglądać na desktop i mobile. Dostajesz link do przejrzenia. Masz 48h na feedback.
Dzień 6-8: Po akceptacji makiety student wdraża stronę na wybranej platformie. Podpina domenę, SSL, formularz kontaktowy. Testuje na 3 rozdzielczościach.
Dzień 9-10: Dostajesz link do działającej strony. Masz 48h na ostatnią rundę poprawek (do 5 zmian). Po akceptacji — zamknięcie zlecenia + instrukcja edycji.
Ważne: Timer 10 dni roboczych startuje od momentu otrzymania kompletnego briefu z materiałami, nie od momentu zlecenia.
Masz pytania? Napisz do nas przez platformę — odpowiadamy w ciągu 24h.',
  'Ta sekcja nie jest widoczna dla firmy-zleceniodawcy. Zawiera instrukcję realizacji, wynagrodzenie i wewnętrzne wskazówki.
Twoje wynagrodzenie
To jest realistyczna stawka pod warunkiem, że nie przekroczysz 22h. Jeśli regularnie wychodzisz ponad to — znaczy, że gdzieś tracisz czas (najczęściej: za dużo poprawek, zbyt wolny feedback od firmy, albo walka z nieznaną platformą). Daj znać na platformie — pomożemy.
Instrukcja realizacji — dzień po dniu
Dni 1-2: Brief, hosting i przygotowanie (~2-3h)
Jak tylko przyjmiesz zlecenie, wyślij firmie link do briefu (szablon Google Forms, ID: BRIEF-LP-10). Co musisz ustalić:
Cel strony (lead generation? prezentacja oferty? event?) — od tego zależy cała architektura
Kto jest odbiorcą strony (B2B? konsument? lokalny klient?) — od tego zależy ton i design
Jakie materiały firma ma (logo, zdjęcia, teksty) — a czego brakuje
Czy firma ma domenę i hosting? Jeśli tak — poproś o dane dostępowe do panelu DNS. Jeśli nie — zaproponuj zakup (LH.pl, home.pl, OVH — najtańszy hosting ~50-100 PLN/rok, domena .pl ~70 PLN/rok)
Wybór platformy — to decyzja techniczna, Ty ją podejmujesz:
Domyślny wybór: WordPress + Elementor (jeśli firma ma hosting) lub Webflow (jeśli nie ma). Nie kombinuj z custom code, chyba że naprawdę wiesz co robisz.
Dni 3-5: Projekt w Figma (~5-6h)
To najważniejsza faza. Dobrze zrobiona makieta = szybkie wdrożenie. Źle zrobiona makieta = niekończące się poprawki.
Struktura strony (6 sekcji — w tej kolejności):
1. Hero: Nagłówek (max 8 słów), podtytuł (1-2 zdania), CTA button, zdjęcie/grafika. To 80% sukcesu strony — jeśli hero nie zainteresuje, nikt nie scrolluje dalej
2. Problem / Dla kogo: Krótki opis problemu, który rozwiązuje oferta firmy. 2-3 bullet pointy.
3. Rozwiązanie / Korzyści: Co firma oferuje i dlaczego to działa. Ikony + krótkie opisy (3-4 elementy)
4. Social proof: Opinie klientów (jeśli firma ma) lub dane liczbowe (np. "200+ zadowolonych klientów"). Jeśli nie ma nic — pomiń tę sekcję i zrób 5 zamiast 6
5. FAQ: 3-5 najczęstszych pytań. Rozwijalny accordion. Znakomity sposób na rozwianie wątpliwości bez zaśmiecania strony
6. Footer: Formularz kontaktowy + dane firmy (NIP, adres, telefon) + linki do social media (jeśli istnieją)
Zasady projektowania:
Max 2 czcionki (nagłówek + body). Bezpieczny wybór: Inter, DM Sans, Plus Jakarta Sans (Google Fonts)
Max 3 kolory: kolor główny (z logo), kolor akcentu (CTA button), szary/biały (tło i tekst)
Projektuj mobile-first. 70%+ ruchu będzie z telefonu. Jeśli na mobile wygląda dobrze — desktop się ułoży
Dużo białej przestrzeni. Nie upychaj wszystkiego. Lepiej mniej treści, niż więcej zagubionej
CTA button musi być widoczny bez scrollowania (above the fold) — zarówno na mobile jak desktop
Zdjęcia z Unsplash/Pexels. Unikaj stockowych "ludzi w garniturach przy laptopie" — wyglądają sztucznie
Wyślij firmie link do Figma z komentarzem: "Oto projekt strony. Proszę o feedback w ciągu 48h — co zmienić, co podoba się, co nie pasuje. Po akceptacji zaczynam wdrożenie."
Dni 6-8: Wdrożenie (~6-8h)
Masz zaakceptowaną makietę. Teraz buduj stronę.
Checklist wdrożenia:
Zainstaluj platformę (WP+Elementor: instalator hostingu. Webflow: stwórz projekt). Motyw Astra lub Kadence dla WP
Odtwórz makietę sekcja po sekcji. Nie improwizuj — trzymaj się projektu
Formularz: WPForms (WP) lub natywny formularz (Webflow/Framer). Testuj, czy maile dochodzą na adres firmy!
Zdjęcia: kompresuj przed wrzuceniem (TinyPNG). Max 200KB/zdjęcie. Lazy loading włączony
SSL: Let''s Encrypt (hostingi dodają automatycznie) lub Cloudflare
Domena: DNS A record lub CNAME na hosting. Jeśli firma nie umie — poproś o dane dostępowe i zrób to sam
Favicon: wrzuć logo firmy jako 32x32 PNG
Open Graph: ustaw tytuł + opis + obrazek, żeby link ładnie wyglądał gdy ktoś go udostępni na FB/LinkedIn
Po wdrożeniu przetestuj na BrowserStack (darmowy trial) lub po prostu na swoim telefonie + laptopie + poproś kolegę o test na innym urządzeniu.
Dzień 9: Testy i optymalizacja (~1-2h)
PageSpeed Insights (mobile) — cel: >80/100. Jeśli poniżej: kompresuj obrazy, włącz cache, wywal zbędne wtyczki
Przetestuj formularz — wyślij 3 testowe zgłoszenia. Sprawdź czy dochodzą
Sprawdź wszystkie linki (social media, telefon, email)
Sprawdź stronę w trybie incognito (czy nie wymaga logowania, czy nie ma błędów cache)
Sprawdź meta tagi: title (<60 zn.), description (<160 zn.) — w Google Search Console po indeksacji
Dzień 10: Oddanie (~1h)
Wyślij firmie link do działającej strony z wiadomością: co jest gotowe, jak edytować, dane dostępowe
Dołącz instrukcję edycji (PDF 1-2 strony: jak zmienić tekst, zdjęcie, numer telefonu)
Firma ma 48h na feedback. Max 5 zmian w ostatniej rundzie. Jeśli chcą więcej — osobne micro-zlecenie
Po akceptacji (lub po 48h bez odpowiedzi) — zamknij zlecenie na platformie. Przekaż wszystkie dostępy.
Narzędzia
Najczęstsze problemy i jak je rozwiązać
Firma nie ma hostingu i nie wie co to jest. Nie tłumacz teorii. Powiedz: "Muszę kupić dla Pana miejsce na serwerze, to kosztuje ok. 100 PLN/rok. Mogę to zrobić, potrzebuję tylko dane do płatności lub żeby Pan kupił wg instrukcji, którą wyślę." Link do LH.pl/home.pl.
Firma ciągle zmienia zdanie po akceptacji makiety. Grzecznie, ale konkretnie: "Makieta została zaakceptowana w dniu X. Zmiany poza zakresem poprawek mogę wycenić jako dodatkowe micro-zlecenie." Udokumentuj akceptację (screenshot wiadomości).
PageSpeed wynik poniżej 60. Największe żarłocze: nieskompresowane zdjęcia (>500KB), zbyt dużo wtyczek WP (max 5-7), nieoptymalny motyw. Użyj Astra/Kadence (lekkie), WP Super Cache, i kompresuj wszystko przez TinyPNG.
Formularz nie wysyła maili. Na WP: zainstaluj WP Mail SMTP (free) i skonfiguruj przez Gmail SMTP. Na Webflow: natywny formularz działa out of box. Testuj w trybie incognito.
Nie umiesz w Figma / nigdy nie projektowałeś strony. Obejrzyj: "Figma UI Design Tutorial" (DesignCourse na YouTube, 1h). Użyj gotowego UI kit (Untitled UI — darmowy). Nie wymyślaj koła na nowo — korzystaj z wzorców landing page na Dribb',
  899, NULL,
  NULL, 10, 'Programowanie i IT',
  false, 0.25, true, 'platform_service', 'active', NULL
);

-- #11: Wizualizacja 3D produktu — 3 ujęcia
INSERT INTO public.service_packages (
  title, description, locked_content, price, price_max,
  variants, delivery_time_days, category,
  requires_nda, commission_rate, is_system, type, status, student_id
) VALUES (
  'Wizualizacja 3D produktu — 3 ujęcia',
  'Wizualizacja 3D produktu — 3 ujęcia
Profesjonalne rendery Twojego produktu bez sesji zdjęciowej — do sklepu, katalogu i social mediów
O co chodzi
Chcesz pokazać produkt na stronie, w sklepie internetowym, na Instagramie albo w katalogu — ale nie masz profesjonalnych zdjęć. Sesja zdjęciowa ze studiem to 1 000-5 000 PLN. Fotograf produktowy w Warszawie bierze 100-300 PLN za zdjęcie. A Ty masz prototyp, rysunek techniczny albo nawet tylko fizyczny produkt.
Student stworzy trójwymiarowy model Twojego produktu i wyrenderuje 3 profesjonalne ujęcia — packshoty na białym/neutralnym tle gotowe do użycia wszędzie. Wizualizacja 3D wygląda jak zdjęcie studyjne, ale daje więcej: możesz później zamawiać kolejne ujęcia, zmieniać kolory produktu, obracać go o 360° — bez ponownej sesji.
To NIE jest: wizualizacja wnętrza, budynku, osiedla, ani pełna animacja 3D. To jest render PRODUKTU — opakowanie, mebel, urządzenie, gadżet, element wyposażenia. Obiekty o umiarkowanej złożoności geometrycznej.
Co dokładnie dostajesz
Jakie produkty możemy zwizualizować
NIE wizualizujemy: wnętrz, budynków, postaci ludzkich/zwierząt, organicznych form o złożonej geometrii (np. odzież na manekinie), pełnych scen (np. produkt w ażurowej aranżacji). To są osobne, droższe usługi.
Co musisz dostarczyć
Zdjęcia produktu z minimum 4 stron (przód, tył, bok, góra) — telefonem wystarczy, byle dobrze doswietlone
Wymiary produktu (wysokość, szerokość, głębokość) w mm lub cm
Rysunek techniczny / plik CAD (jeśli istnieje) — ogromnie przyspiesza pracę
Informacja o materiałach: metal matowy/błyszczący? plastik? drewno jakie? kolor RAL/Pantone?
Logo / grafika na produkcie (plik wektorowy lub PNG wysoka rozdzielczość)
Przykłady renderów które Ci się podobają (styl, oświetlenie, kąt) — 2-3 linki
Czego ten pakiet nie obejmuje
Animacja 3D / obrót 360° (to osobna usługa, od 800 PLN)
Wizualizacja produktu w aranżacji / scenie (np. butelka na stole w kuchni)
Modelowanie złożonych form organicznych (odzież, postacie, rośliny)
Wizualizacja wnętrz / architektury
Druk 3D — model jest wizualizacyjny, nie produkcyjny (brak tolerancji, niekoniecznie watertight)
Retusz / postprodukcja zdjęć (to osobna usługa)
Jak ta cena wygląda na tle rynku
Wizualizacja 3D daje przewagę nad zdjęciem: raz stworzony model możesz wykorzystać wielokrotnie — nowe kąty, nowe kolory, nowe tła — bez ponownej sesji. Student dostarcza plik .blend, więc każda przyszła modyfikacja jest możliwa.
Jak wygląda proces
Dzień 1-2: Brief: zdjęcia, wymiary, materiały, styl. Student analizuje geometrię produktu i planuje modelowanie.
Dzień 3-5: Modelowanie 3D: budowa modelu, nanoszenie materiałów i tekstur. Podgląd surowego modelu do akceptacji kształtu.
Dzień 6-7: Oświetlenie i rendering: ustawienie sceny studyjnej, 3 ujęcia + 1 wariant koloru. Wysyłka do podglądu.
Dzień 8-9: Poprawki: 2 rundy (kąt, światło, kolor, detal). Max 5 zmian na rundę.
Dzień 10: Eksport: PNG (przezroczyste tło) + JPG (białe tło) + plik .blend. Paczka ZIP na Google Drive.',
  'Ta sekcja nie jest widoczna dla firmy-zleceniodawcy. Zawiera instrukcję realizacji, wynagrodzenie i wewnętrzne wskazówki.
Dlaczego właśnie student wzornictwa / grafiki 3D?
Na 2-3 roku wzornictwa przemysłowego, grafiki komputerowej lub architektury masz:
Blender / 3ds Max / Rhino / KeyShot — modelowanie i rendering od min. 1 roku
Podstawy materiałów PBR (Principled BSDF, metallic/roughness workflow)
Oświetlenie studyjne — three-point lighting, HDRI, studio setup
Kompozycja kadru — reguła trzeci, złoty podział, prowadzenie oka
Portfolio z 5-15 renderami zrobionych na zajęciach lub własnych projektach
Kluczowa umiejętność: nie chodzi o fotorealizm na poziomie studia VFX. Chodzi o czyste, profesjonalne packshoty — poprawne proporcje, dobre światło, właściwe materiały. To poziom osiągalny po 2 roku studiów z dobrym portfoliem.
Twoje wynagrodzenie
Instrukcja realizacji — dzień po dniu
Dni 1-2: Brief i reference gathering (~1-2h)
Brief (ID: BRIEF-3DVIZ-11). Kluczowe pytania:
Czy masz fizyczny produkt, prototyp, czy to jest dopiero koncept? (od tego zależy skąd bierzesz wymiary)
Wymiary: H x W x D w mm. Jeśli firma nie ma dokładnych — zmierz ze zdjęcia z miarkiem/linijką
Materiały: metal (matowy/polerowany/szczotkowany?), plastik (błyszczący/matowy?), drewno (dąb/sosna/orzech?), szkło (przezroczyste/matowe?), tkanina?
Kolor: RAL, Pantone, HEX, albo przynajmniej zdjęcie z dobrym światłem
Logo/grafika na produkcie: plik wektorowy (AI/SVG/EPS) lub PNG min. 1000px
Styl renderów: czyste packshoty (białe tło) czy lifestyle (kontekst użycia)?
Przeznaczenie: sklep online, katalog drukowany, social media, prezentacja?
Reference gathering (~30 min):
Poprosi firmę o 2-3 przykłady renderów które się podobają
Sprawdź Behance/Dribbble: „product 3D visualization [kategoria]”
Sprawdź jak wyglądają produkty konkurencji na ich stronach/sklepach
Zrób moodboard w PureRef lub Figma: styl, oświetlenie, kąty
Dni 3-5: Modelowanie 3D (~5-8h)
Workflow modelowania produktu:
Krok 1: Reference setup. Wczytaj zdjęcia jako background images w Blenderze (N-panel → Background Images). Ustaw na odpowiednich osiach (front, side, top). Skaluj do rzeczywistych wymiarów.
Krok 2: Blockout. Zbuduj podstawowy kształt z prymitywów (Cube, Cylinder, Sphere). Dopasuj proporcje do reference. NIE dodawaj detali na tym etapie. Wyślij podgląd do firmy: „Czy proporcje się zgadzają?”
Krok 3: Detailing. Dodaj fazy (Bevel), otwory, przełączniki, guziki, tekstury surface. Używaj Subdivision Surface (Ctrl+2) dla gładkich powierzchni. Dbaj o clean topology — quady, nie trójkąty/n-gony na widocznych powierzchniach.
Krok 4: UV unwrap. Zaznacz szwy (Mark Seam), unwrap (U → Smart UV Project dla prostych form, U → Unwrap dla złożonych). Potrzebujesz UV do nałożenia etykiet, logo, tekstu.
WAŻNE: Po blockoucie wyślij render poglądowy (GL render, 30 sek.) do firmy z pytaniem: „Czy kształt i proporcje są OK?”. Lepiej złapać błąd na tym etapie niż po 5h detailingu.
Materiały PBR — quick reference:
Dni 6-7: Oświetlenie i rendering (~3-4h)
Studio lighting setup (Blender Cycles / EEVEE):
HDRI studio: pobierz z Poly Haven (polyhaven.com/hdris → „studio”). Darmowe, 16-bit EXR. „Studio Small 09”, „Photo Studio 01” działają świetnie
Alternatywnie: three-point lighting ręczne. Key light (Area, 45° od frontu, lekko wyżej). Fill light (słabsza, z drugiej strony). Rim/back light (za produktem, kontur)
Tło: biała płaszczyzna (Plane + Principled BSDF, Base Color = biały, Roughness = 0.5) lub przezroczyste (Film → Transparent w Render Properties)
Kamera: ogniskowa 80-120mm (packshot nie zniekształca proporcji). Depth of Field wyłączony (cały produkt ostry)
Ustawienia renderingu (Blender Cycles):
Jeśli nie masz mocnego GPU: użyj EEVEE Next (Blender 4.x) zamiast Cycles. Dla produktów bez szkła i złożonego SSS różnica jest minimalna, a render trwa 10x krócej. Możesz też użyć darmowej renderfarmy: SheepIt (sheepit-renderfarm.com).
Dni 8-9: Poprawki (~1-2h)
Wyślij rendery do podglądu (Google Drive, nie WhatsApp — kompresja!)
Runda 1: typowe poprawki — „inny kąt”, „ciemniejszy kolor”, „mniej cieni”, „zoom na logo”
Runda 2: drobne korekty — „odrobinę jaśniej”, „logo bardziej widoczne”
Jeśli firma mówi „coś nie pasuje ale nie wiem co”: zapytaj konkretnie: „Czy chodzi o kształt, kolor, materiał, światło, kąt, czy tło?”
Dzień 10: Eksport i dostawa (~0.5h)
Checklist eksportu:
Nazewnictwo plików: [firma]_[produkt]_ujecie01_front.png, [firma]_[produkt]_ujecie02_34.png itd. Foldery: /rendery_finalne, /pliki_zrodlowe. Paczka ZIP na Google Drive.
Narzędzia
Najczęstsze problemy
Firma dostarcza złej jakości zdjęcia (ciemne, rozmazane, z jednej strony). Wyślij instrukcę: „Potrzebuję zdjęć z 4 stron przy dobrym świetle dziennym. Może być telefon, ale: pod oknem, na jednolitym tle (kartka A3), z linijką w kadrze dla skali.”
Produkt ma złożoną geometrię (skomplikowane krzywe, organiczne formy). Oceń ZANIM zaakceptujesz zlecenie. Jeśli widzisz, że to 20+ godzin pracy — powiedz firmie: „Ten produkt wymaga więcej pracy niż standardowy pakiet. Rekomenduję wycenę indywidualną.” Nie bierz zleceń które Cię przerastą.
Render wygląda „plastikowo” / nienaturalnie. 3 najczęstsze przyczyny: 1) Złe Roughness — świat rzeczywisty nie jest ani idealnie gładki, ani idealnie matowy. Dodaj subtilną roughness map. 2) Złe oświetlenie — użyj HDRI zamiast point lights. 3) Brak niedoskonałości — dodaj fingerprints, mikro-zadrapania, dust (subtelnie!).
Nie masz mocnego GPU (rendering trwa godziny). Użyj EEVEE Next dla prostych materiałów. Dla Cycles: SheepIt (darmowa renderfarma), zmniejsz samples do 128 + Denoising, renderuj w mniejszej rozdzielczości i skaluj w Photoshopie.
Firma chce „tak jak zdjęcie — nie do odróżnienia od prawdziwego”. „Profesjonalny packshot będzie wyglądał bardzo realistycznie, ale pełny fotorealizm to poziom studia VFX i 10x większy budżet. Dostarczam czyste, spójne rendery które świetnie wyglądają w sklepie i na social media.”
Firma prosi o animację / obrót 360°. „Animacja to osobna usługa z in',
  649, NULL,
  NULL, 10, 'Multimedia',
  false, 0.25, true, 'platform_service', 'active', NULL
);

-- #12: Rysunek techniczny CAD — digitalizacja i dokumentacja
INSERT INTO public.service_packages (
  title, description, locked_content, price, price_max,
  variants, delivery_time_days, category,
  requires_nda, commission_rate, is_system, type, status, student_id
) VALUES (
  'Rysunek techniczny CAD — digitalizacja i dokumentacja',
  'Rysunek techniczny CAD — digitalizacja i dokumentacja
Twój szkic, prototyp lub stary rysunek → profesjonalna dokumentacja CAD 2D/3D gotowa dla producenta
O co chodzi
Masz szkic na kartce, stary wyblakły rysunek techniczny, prototyp w ręku albo zdjęcia części — i potrzebujesz to zamienić na profesjonalną dokumentację cyfrową, którą możesz wysłać do producenta, warsztatu CNC, firmy laserowej albo drukarki 3D.
Student politechniki przerysuje Twój projekt w programie CAD (AutoCAD, SolidWorks, Fusion 360), doda wymiary zgodnie z normami ISO, przygotuje rzuty, przekroje i — opcjonalnie — prosty model 3D. Dostajesz pliki DWG/DXF/STEP, które każdy warsztat i każda maszyna CNC otwiera bez problemu.
To NIE jest: projektowanie od zera (student nie projektuje Ci maszyny ani konstrukcji nośnej). To jest DIGITALIZACJA — przerysowanie istniejącego projektu do formatu cyfrowego z pełną dokumentacją wymiarową.
Co dokładnie dostajesz
Typowe zlecenia — przykłady
Co musisz dostarczyć
Szkic / rysunek / zdjęcie tego co chcesz zdigitalizować — odręczny na kartce, stary rysunek techniczny, skan, PDF, zdjęcie prototypu z linijką
Wymiary — wszystkie znane. Jeśli nie masz pełnych: zaznacz co wiesz, student dopyta o brakujące
Materiał części (stal, aluminium, drewno, plastik, itp.) — wpisujemy do tabelki rysunkowej
Tolerancje — jeśli znasz (np. otwór Ø20 H7). Jeśli nie: student zastosuje tolerancje ogólne wg ISO 2768
Przeznaczenie rysunku: warsztat ręczny? CNC? laser? druk 3D? dokumentacja patentowa? — od tego zależy co dokładnie przygotować
Czego ten pakiet NIE obejmuje
Projektowanie od zera (obliczenia wytrzymałościowe, dobór materiałów, projektowanie konstrukcji nośnej) — to wymaga inżyniera z uprawnieniami
Złożone zespoły (>10 części w jednym assembly) — wycena indywidualna
Dokumentacja budowlana / architektoniczna (odrębna specjalizacja, odrębne przepisy)
Projekty instalacji elektrycznych, sanitarnych, HVAC
Reverse engineering złożonych części (skanowanie 3D, pomiary CMM)
Certyfikacja / pieczątka inżynierska — student nie ma uprawnień zawodowych
Jak ta cena wygląda na tle rynku
Student mechaniki po 2 roku ma za sobą 20–30 rysunków technicznych na zaliczeniach. Zna normy ISO, wymiarowanie, rzuty, przekroje. Używa tych samych narzędzi co biuro konstrukcyjne — SolidWorks, AutoCAD, Fusion 360 — z darmową licencją edukacyjną.
Jak wygląda proces
Dzień 1: Brief: student otrzymuje szkic/zdjęcia/stary rysunek + wymiary + informację o materiale i przeznaczeniu. Ustala skalę, format arkusza, styl wymiarowania.
Dzień 2–3: Modelowanie / rysowanie: tworzenie modelu 3D (jeśli potrzebny) i/lub bezpośrednio rysunku 2D. Podgląd surowej geometrii do akceptacji proporcji i kształtu.
Dzień 4–5: Wymiarowanie, przekroje, tabelka rysunkowa. Komplet rzutów na arkuszu. Eksport DWG + DXF + PDF.
Dzień 6–7: Poprawki (2 rundy, max 5 zmian/rundę). Finalne pliki: DWG, DXF, PDF + opcjonalnie STEP/STL. Paczka ZIP na Google Drive.',
  'Ta sekcja nie jest widoczna dla firmy-zleceniodawcy. Zawiera instrukcję realizacji, wynagrodzenie i wewnętrzne wskazówki.
Dlaczego właśnie student mechaniki / politechniki?
Na 2–3 roku mechaniki, mechatroniki, inżynierii produkcji lub budownictwa masz:
Zapis konstrukcji / Grafika inżynierska — obowiązkowy przedmiot od 1 semestru. Rzuty prostokątne, aksonometria, przekroje, wymiarowanie wg ISO
AutoCAD 2D — warstwy (layers), bloki, wymiarowanie, style linii, layout + arkusze (paper space vs model space)
SolidWorks / Inventor / Fusion 360 — modelowanie parametryczne (sketch → feature), rysunek techniczny z modelu (drawing from part), złożenia (assembly)
Normy ISO: 128 (rodzaje linii), 129 (wymiarowanie), 1101 (tolerancje geometryczne), 2768 (tolerancje ogólne), 7083 (symbole obróbki)
20–30 rysunków technicznych wykonanych na zaliczeniach — wałki, tuleje, koła zębate, obudowy, połączenia gwintowe, spawane
Metrologia techniczna — rozumiesz tolerancje, pasowania, chropowatość powierzchni
To jest CORE SKILL studenta politechniki. Rysunek techniczny to coś, co robisz od pierwszego tygodnia studiów. Żaden inny kierunek nie daje tak silnej bazy w tym zakresie.
Twoje wynagrodzenie
Instrukcja realizacji — dzień po dniu
Dzień 1: Brief i analiza materiału wejściowego (~1–2h)
Brief (ID: BRIEF-CAD-12). Kluczowe ustalenia:
Co dostajesz od firmy? Szkic odręczny? Stary rysunek papierowy? Zdjęcie prototypu? PDF/JPG? Plik CAD starej wersji?
Czy wymiary są kompletne? Zaznacz na kopii szkicu które wymiary masz, których brakuje. Wyślij firmę listę brakujących wymiarów — z wyjaśnieniem DLACZEGO są potrzebne
Materiał: stal (S235JR? S355J2? nierdzewna 304/316?), aluminium (6061? 7075?), drewno (dąb/buk/sklejka?), tworzywo (ABS? PA? PETG?) — to idzie do tabelki rysunkowej i wpływa na tolerancje
Przeznaczenie: (a) warsztat ręczny → rysunek warsztatowy z wymiarami ogólnymi, (b) CNC frezowanie → rysunek z tolerancjami H7/g6, chropowatością, (c) laser/waterjet → DXF z konturami cięcia, (d) druk 3D → STL + zalecenia orientacji wydruku
Skala: na jaki arkusz? A4 (210×297) czy A3 (297×420)? Skala 1:1, 1:2, 2:1?
Czy firma ma własną tabelkę rysunkową (template)? Jeśli tak — użyj. Jeśli nie — użyj standardowej wg ISO
ZANIM zaczniesz rysować: upewnij się że masz WSZYSTKIE wymiary. Rysowanie z niepewnymi wymiarami = pewne poprawki. Lepiej strać 1 dzień na ustalenia niż 3 dni na przerabianie.
Dni 2–3: Modelowanie i rysowanie (~4–7h)
Dwa ścieżki pracy — wybierz odpowiednią:
Ścieżka A: Model 3D → rysunek (REKOMENDOWANA)
Użyj gdy: część jest trójwymiarowa, firma potrzebuje model STEP/STL, lub potrzebujesz wielu rzutów.
Otwórz SolidWorks / Fusion 360 / Inventor
Rozpocznij od szkicu (Sketch) na płaszczyźnie głównej. Narysuj kontur bazowy i nanieś wymiary (Dimension)
Wyciągnij (Extrude / Boss-Extrude). Buduj feature po feature: otwory (Hole Wizard), fazowania (Chamfer), zaokrąglenia (Fillet)
Każdy feature = osobny krok. Nie rysuj wszystkiego w jednym szkicu!
Kiedy model gotowy: File → Make Drawing from Part. Wstaw rzuty: Front, Right, Top + izometria. Autodimension jako punkt wyjścia, potem ręcznie uporządkuj
Ścieżka B: Rysunek 2D bezpośrednio (AutoCAD)
Użyj gdy: firma potrzebuje TYLKO 2D (np. DXF do lasera), część jest płaska, lub to przerysowanie starego rysunku 1:1.
Otwórz AutoCAD. Ustaw jednostki: Format → Units → mm, precyzja 0.01
Ustaw warstwy (Layers): 0-KONTURY (gruba, biała), 1-WYMIARY (cienka, zielona), 2-OSIE (kreska-kropka, czerwona), 3-PRZEKROJE (średnia, niebieska), 4-TEKST (cienka, żółta)
Rysuj w Model Space w skali 1:1 (ZAWSZE). Skalowanie robi się na etapie Layout/Paper Space
Użyj DIMSTYLE do ustawienia stylu wymiarowania zgodnego z ISO (strzałki 2.5mm, tekst 3.5mm, precyzja 0.1mm)
Paper Space (Layout): wstaw ramkę, tabelkę rysunkową, viewport z modelem w odpowiedniej skali
Po zakończeniu geometrii — WYŚLIJ PODGLĄD firmie: „Czy kształt się zgadza? Czy proporcje są OK?”. Niech potwierdzą ZANIM zaczniesz wymiarować.
Dni 4–5: Wymiarowanie i dokumentacja (~2–4h)
Zasady wymiarowania wg ISO 129:
Tabelka rysunkowa — co wpisać:
Dni 6–7: Poprawki i eksport (~1–2h)
Checklist przed wysyłką:
Wszystkie wymiary naniesione (nie brakuje żadnego wymiaru potrzebnego do wykonania)
Wymiary nie kolidują ze sobą (linie wymiarowe się nie krzyżują)
Przekroje oznaczone (A-A, B-B) i umieszczone na rysunku
Tabelka rysunkowa wypełniona kompletnie
Tolerancje ogólne w tabelce + indywidualne przy krytycznych wymiarach
Linie: konturowe (grube 0.5mm), wymiarowe (cienkie 0.25mm), osiowe (kreska-kropka 0.18mm)
Skala zgodna z viewport (wydrukuj na PDF i zmierz linijką!)
Eksport plików:
Narzędzia
Najczęstsze problemy i jak sobie z nimi radzić
Firma dostarcza nieczytelny szkic (bazgroły na kartce, brak wymiarów). Nie zgaduj! Wyślij wiadomość: „Proszę o uzupełnienie brakujących wymiarów — zaznaczyłem na załączonym zdjęciu których mi brakuje (czerwone znaki zapytania). Bez nich nie jestem w stanie zagwarantować poprawności rysunku.” Oznacz brakujące wymiary na kopii szkicu.
Wymiary się nie zgadzają (np. 3 wymiary cząstkowe nie sumują się do wymiaru całkowitego). NIGDY nie „naprawiaj” sam — zawsze pytaj firmę: „Wymiary A + B + C = 152mm, ale wymiar całkowity podany jako 150mm. Który wymiar jest poprawny?”. Zanotuj odpowiedź na chacie platformy (audyt trail).
Firma prosi o „projekt” (zaprojektuj mi maszynę / konstrukcję). Grzecznie odmów: „Ta usługa obejmuje digitalizację istniejącego projektu do CAD. Projektowanie od zera wymaga inżyniera z obliczeniami wytrzymałościowymi. Mogę przerysować i zwymiarować to, co już Państwo zaprojektowali.”
Część jest zbyt złożona (>20 feature’ów, złożone krzywe, assembly wieloczęściowe). Oceń ZANIM zaakceptujesz: policz feature’y, szacuj czas. Jeśli >15h — napisz: „Ten element przekracza zakres standardowego pakietu. Rekomenduję wycenę indywidualną.” Nie bierz zleceń które Cię przerastą — to szkodzi Tobie i platformie.
Firma potrzebuje DXF do lasera, ale wysyłasz rysunek z wymiarami. DXF do maszyny CNC/laser = TYLKO kontury c',
  549, NULL,
  NULL, 7, 'Programowanie i IT',
  false, 0.25, true, 'platform_service', 'active', NULL
);

-- #13: Prezentacja firmowa PowerPoint — 3 pakiety
INSERT INTO public.service_packages (
  title, description, locked_content, price, price_max,
  variants, delivery_time_days, category,
  requires_nda, commission_rate, is_system, type, status, student_id
) VALUES (
  'Prezentacja firmowa PowerPoint — 3 pakiety',
  'Prezentacja firmowa PowerPoint — 3 pakiety
Profesjonalna prezentacja ofertowa, sprzedażowa lub inwestorska — wybierz rozmiar który pasuje do Twojej potrzeby
O co chodzi
Potrzebujesz prezentacji na spotkanie z klientem, dla inwestora, na konferencję, na targi albo po prostu chcesz wysłać ofertę mailem w formacie który robi wrażenie. Problem: PowerPoint masz, ale Twoje slajdy wyglądają jak z 2008 roku — ściany tekstu, cliparty, brak spójności.
Student stworzy profesjonalną prezentację od zera: spójny design dopasowany do Twojej marki, przejrzystą strukturę przekazu i slajdy które wspierają Twoją wypowiedź — nie zastępują jej. Dostajesz edytowalny plik PPTX, który możesz sam aktualizować.
Wybierz pakiet
Dodatkowy slajd poza pakietem: +30 PLN/slajd.
Co dostajesz w każdym pakiecie
Spójny design — kolorystyka, czcionki, styl ikon dopasowane do Twojej marki (logo, strona www, brandbook). Jeśli nie masz brandbooku — student zaproponuje styl na podstawie logo
Zdjęcia i ikony z legalnych źródeł (Unsplash, Pexels, Flaticon — free for commercial use). Żadnych clipartów
Edytowalny plik PPTX — możesz sam zmieniać tekst, zdjęcia, kolory. Fonty osadzone w pliku
PDF do wysłania mailem lub wydruku (wysokiej jakości)
Wizualizacja danych — wykresy, infografiki, diagramy (ilość zależy od pakietu). Dane musisz dostarczyć, student je wizualizuje
Typowe zastosowania
Co musisz dostarczyć
Treść merytoryczną — co chcesz powiedzieć na slajdach: tekst w Wordzie, notatki, konspekt, stara prezentacja do odświeżenia, albo rozmowa z briefem
Logo firmy (plik wektorowy AI/SVG/EPS lub PNG min. 1000px na przezroczystym tle)
Kolory firmowe — HEX, RGB lub Pantone. Jeśli nie masz: student dobierze na podstawie logo
Kontekst: kto będzie oglądał prezentację? Czy będziesz prezentować na żywo czy wysyłasz mailem?
Przykłady prezentacji które Ci się podobają — 2–3 linki (styl, nie treść)
Czego pakiety NIE obejmują
Pisanie treści od zera (student wizualizuje Twoją treść, nie pisze jej za Ciebie — chyba że dokupisz usługę #06 Teksty)
Złożone animacje, interaktywność, osadzanie wideo, prezentacje Prezi/Flash
Druk prezentacji (dostarczamy plik cyfrowy)
Coaching prezentacyjny / przygotowanie do wystąpienia
Tłumaczenie na inne języki (patrz usługa #09 Lokalizacja PL→EN)
Jak te ceny wyglądają na tle rynku
Student2Work: ~33 PLN/slajd (pakiet M) — 30–50% taniej niż doświadczony freelancer, z gwarancją procesu i szablonem edytowalnym.
Jak wygląda proces
Dzień 1–2: Brief: student otrzymuje treść, logo, kolory, kontekst. Ustala strukturę prezentacji. Przesyła koncept(y) stylistyczny(e) do akceptacji.
Dzień 3–5 (S) / 3–6 (M) / 3–8 (L): Projektowanie: po wyborze stylu — projektuje wszystkie slajdy. Wizualizacja danych, dobór zdjęć/ikon, układ treści.
Dzień +1: Podgląd i poprawki: wysyłka pełnej prezentacji (PDF). Runda poprawek.
Dzień +1: Finalizacja: ostatnie poprawki + eksport PPTX + PDF (+ Google Slides w pakiecie L).',
  'Ta sekcja nie jest widoczna dla firmy-zleceniodawcy. Zawiera instrukcję realizacji, wynagrodzenie i wewnętrzne wskazówki.
Dlaczego właśnie student zarządzania / marketingu / grafiki?
Na 2–3 roku zarządzania, marketingu lub grafiki użytkowej masz:
Komunikacja wizualna / projektowanie graficzne — zajęcia z układu treści, typografii, teorii koloru
PowerPoint / Canva / Google Slides — narzędzia używane na co dzień (prezentacje na zaliczenia, projekty grupowe)
Storytelling / marketing — rozumiesz co to hook, CTA, pain point, benefit
Praca z klientem — briefy, feedbacki, iteracje — to chleb powszedni na zarządzaniu
Portfolio: 10–20 prezentacji zrobionych na studia. Przebuduj najlepsze jako case studies
Kluczowe: nie chodzi o „ładne slajdy”. Chodzi o PRZEKAZ — co widz zapamięta z każdego slajdu? Dobra prezentacja działa nawet bez prezentera.
Twoje wynagrodzenie w zależności od pakietu
Dodatkowy slajd: +30 PLN (z czego Twoje: +23 PLN).
Instrukcja realizacji — dzień po dniu
Dni 1–2: Brief i koncepty stylistyczne (~2–3h)
Brief (ID: BRIEF-PRES-13). Kluczowe ustalenia:
Cel prezentacji: sprzedaż? inwestor? wizerunek? raport? szkolenie?
Odbiorca: klient B2B? inwestor? zarząd? publiczność konferencyjna? pracownicy?
Kontekst: prezentacja na żywo (mniej tekstu) czy wysyłana mailem (więcej tekstu, musi działać bez prezentera)?
Marka: logo (plik), kolory (HEX/RGB), czcionki firmowe, brandbook (jeśli jest)
Treść: co firma chce przekazać? Tekst? Stara prezentacja? Notatki?
Dane: czy są liczby/wykresy do zwizualizowania?
Inspiracje: 2–3 przykłady prezentacji które się podobają
Koncepty stylistyczne:
Pakiet S: 1 koncept (slajd tytułowy + 1 merytoryczny). Pakiet M/L: 2 koncepty w różnych stylach (np. ciemny minimalistyczny vs jasny korporacyjny). Wyślij do firmy: „Który kierunek bliższy?”
NIGDY nie projektuj całości bez akceptacji stylu. Koncepty na początku = zero przerabiania później.
Projektowanie — struktura slajdów
Pakiet S (8 slajdów) — struktura minimalna:
Pakiet M (12 slajdów) — struktura standardowa:
Jak S, ale dodajesz: slajd z agendą, 2 slajdy z danymi/wykresami, rozbudowane case studies (2 zamiast 1), slajd z zespołem lub wartościami firmy.
Pakiet L (18 slajdów) — struktura pełna:
Jak M, ale dodajesz: sekcję „rynek / kontekst”, rozbudowany cennik/pakiety, więcej case studies, slajd z FAQ, slajd z timeline / historią, dodatkowe wizualizacje danych.
7 zasad dobrego slajdu
Szablon edytowalny (Slide Master) — pakiet M i L
Firma chce móc SAMA dodawać nowe slajdy w spójnym stylu. Dlatego tworzysz Slide Master:
Pakiet M (4 layouty): Tytułowy, Treść (nagłówek + tekst + ikona), Dwie kolumny (tekst + obraz), Dane / wykres.
Pakiet L (6 layoutów): Jak M + Pełne zdjęcie z overlay tekstem + Cytat / testimonial.
PowerPoint: View → Slide Master → projektuj layouty z placeholderami. Firma klika „New Slide”, wybiera layout — slajd jest już spójny.
Narzędzia
Najczęstsze problemy
Firma nie ma treści („nie wiem co na slajdach”). Nie pisz za firmę. Wyślij formularz: „O czym jest slajd 1? Co odbiorca ma zapamiętać?”. 8/12/18 pytań = tyle slajdów. Jeśli naprawdę nie mają treści — zaproponuj dokupić #06 Teksty.
Firma chce „wszystko na jednym slajdzie”. „Prezentacja wspiera wystąpienie, nie zastępuje go. Rozbiję to na 2–3 slajdy — efekt będzie dużo lepszy.”
Logo w złej jakości (JPG 200px z Facebooka). Sprawdź stronę firmy (stopka), poproś o plik od grafika, w ostateczności: vectorizer.ai (SVG trace).
Firma chce animacje / wideo. „Subtelne przejścia (fade, appear) dodę w cenie. Złożone animacje i wideo to osobna wycena.”
Prezentacja wygląda inaczej u firmy (fonty, układ). ZAWSZE osadzaj fonty: File → Options → Save → Embed fonts → Embed all. Bezpieczna alternatywa: Calibri/Arial (preinstalowane).
Firma zmienia zdanie po każdej rundzie. „Pakiet obejmuje X rund po 5 zmian. Dodatkowa runda: +50 PLN.” Pilnuj zakresu.
Checklist końcowy
Wszystkie slajdy zaprojektowane i wypełnione treścią
Spójny design: te same fonty, kolory, odstępy, styl ikon na każdym slajdzie
Max 30 słów/slajd (na żywo) lub 50 (mailem)
Wykresy/infografiki (nie surowe tabele!) — ilość zgodna z pakietem
Zdjęcia/ikony z legalnych źródeł (Unsplash, Pexels, Flaticon)
Slide Master z layoutami (jeśli pakiet M lub L)
Fonty osadzone w pliku PPTX (File → Options → Save → Embed)
Eksport: PPTX + PDF (+ Google Slides jeśli pakiet L)
Test kompatybilności: otwarte na innym komputerze (fonty, układ, kolory)
Nazewnictwo: [firma]_prezentacja_[typ]_v1.pptx
Paczka ZIP na Google Drive
Wiadomość podsumowująca na platformie
Student2Work — Łączymy ambicje studentów z potrzebami firm',
  299, 549,
  '[{"name": "S", "label": "Pakiet S", "price": 299, "delivery_time_days": 5, "scope": "8 slajdów"}, {"name": "M", "label": "Pakiet M", "price": 399, "delivery_time_days": 8, "scope": "12 slajdów"}, {"name": "L", "label": "Pakiet L", "price": 549, "delivery_time_days": 12, "scope": "18 slajdów"}]'::jsonb, 5, 'Design',
  false, 0.25, true, 'platform_service', 'active', NULL
);

-- #14: Krótkie wideo animowane — motion graphics
INSERT INTO public.service_packages (
  title, description, locked_content, price, price_max,
  variants, delivery_time_days, category,
  requires_nda, commission_rate, is_system, type, status, student_id
) VALUES (
  'Krótkie wideo animowane — motion graphics',
  'Krótkie wideo animowane — motion graphics
Animowane spoty promocyjne, produktowe i wizerunkowe — bez kamery, bez aktorów, bez studia
O co chodzi
Wideo dominuje w social media — posty z wideo generują 3× więcej zaangażowania niż statyczna grafika. Problem: produkcja wideo kojarzy się z kamerą, oświetleniem, aktorami i budżetem 5 000–20 000 PLN.
Motion graphics to inna droga: student tworzy profesjonalne wideo z Twoich materiałów (logo, zdjęcia produktu, tekst, dane) — animując je z muzyką, przejściami i efektami ruchu. Zero kamery. Zero studia. Efekt: dynamiczny spot gotowy na Instagram, Facebook, LinkedIn, stronę www lub reklamę płatną.
Wybierz pakiet
Dodatkowe wideo 15 sek w ramach istniejącego stylu: +279 PLN.
Co dostajesz w każdym pakiecie
Motion graphics — animowane elementy: tekst, ikony, kształty, zdjęcia, logo. Wszystko „ożywa” na ekranie z płynnymi przejściami
Spójny design — kolorystyka i typografia dopasowane do Twojej marki (logo, strona www, brandbook)
Muzyka royalty-free — licencja komercyjna, legalna do użytku w reklamach i social media (Artlist, Epidemic Sound, Pixabay Music)
Plik MP4 gotowy do publikacji — FullHD 1080p, H.264, odpowiedni format dla docelowej platformy
Storyboard przed produkcją — widzisz plan wideo ZANIM student zacznie animować (akceptujesz lub zmienasz kierunek)
Typowe zastosowania
Co musisz dostarczyć
Logo firmy — plik wektorowy (AI/SVG/EPS) lub PNG min. 1000px na przezroczystym tle
Zdjęcia produktu / usługi — im wyższa jakość, tym lepszy efekt. Min. 1000px szerokości
Tekst / przekaz — co chcesz powiedzieć w wideo: hasło, CTA, kluczowe cechy. Max 30–50 słów na 15 sek wideo
Kolory firmowe — HEX, RGB lub Pantone. Bez tego: student dobierze na podstawie logo
Przykłady wideo które Ci się podobają — 2–3 linki (styl, dynamika, nastrój)
Kontekst: gdzie wideo będzie publikowane? Instagram? Strona? Reklama Google? To wpływa na format i tempo.
Czego pakiety NIE obejmują
Nagrywanie materiału wideo kamerą (to motion graphics — animacja z grafik, nie film z planu zdjęciowego)
Montaż gotowego materiału filmowego (patrz usługa #07 Montaż Reels/TikTok)
Animacja postaci 2D/3D (np. postacie mówiące, chodzące — to zaawansowana animacja, osobna wycena)
Lektor / voiceover (możliwy jako dodatek: +150 PLN za lektor AI, +350 PLN za lektora żywego)
Scenariusz od zera (student wizualizuje Twój przekaz — jeśli nie masz treści, dokupić #06 Teksty)
Jak te ceny wyglądają na tle rynku
Student2Work: 30–50% taniej niż doświadczony freelancer, z gwarancją procesu i storyboardem do akceptacji.
Jak wygląda proces
Dzień 1–2: Brief + storyboard: student zbiera materiały (logo, zdjęcia, tekst, kontekst). Tworzy storyboard (4–8 klatek kluczowych) z układem i stylem. Wysyła do akceptacji.
Dzień 3–4 (S) / 3–5 (M) / 3–7 (L): Produkcja: po akceptacji stylu — animacja elementów, dobieranie muzyki, synchronizacja ruchu z rytmem. Rendering w odpowiednich formatach.
Dzień +1: Podgląd i poprawki: wysyłka wideo (wersja robocza MP4). Runda poprawek.
Dzień +1: Finalizacja: ostatnie poprawki + eksport finalnych plików MP4 (+ GIF + projekt źródłowy w pakiecie L).',
  'Ta sekcja nie jest widoczna dla firmy-zleceniodawcy. Zawiera instrukcję realizacji, wynagrodzenie i wewnętrzne wskazówki.
Dlaczego właśnie student multimediów / grafiki / filmu?
Na 2–3 roku multimediów, grafiki użytkowej lub realizacji film/TV masz:
Motion design / animacja — zajęcia z After Effects, DaVinci Resolve, podstawy animacji (keyframing, easing, timing)
Kompozycja wizualna — kadry, typografia w ruchu, hierarchia wizualna, teoria koloru w kontekście wideo
Montaż i postprodukcja — cięcia, przejścia, synchronizacja dźwięku z obrazem
Narzędzia: After Effects, CapCut, Canva (animacje), DaVinci Resolve, Premiere Pro — używane na co dzień
Portfolio: projekty studenckie (intro, spoty, animacje na zaliczenie). Przebuduj najlepsze jako case studies
Kluczowe: nie chodzi o „fażne efekty”. Chodzi o PRZEKAZ — 3 sekundy na zatrzymanie scrollowania. Każda klatka musi pracować.
Twoje wynagrodzenie w zależności od pakietu
Dodatkowe wideo: +279 PLN (z czego Twoje: +209 PLN). Lektor AI: +150 PLN (Twoje: +113 PLN).
Instrukcja realizacji — dzień po dniu
Dni 1–2: Brief i storyboard (~2–3h)
Brief (ID: BRIEF-VIDEO-14). Kluczowe ustalenia:
Cel wideo: sprzedaż? wizerunek? edukacja? reklama płatna? post organiczny?
Odbiorca: klient B2B? konsument? followers? pracownicy?
Platforma docelowa: Instagram Reels (9:16)? Facebook Feed (1:1)? LinkedIn (16:9)? YouTube (16:9)? Strona www (16:9, loop)?
Marka: logo (plik), kolory (HEX/RGB), czcionki firmowe, przykłady wideo które się podobają
Materiały: zdjęcia produktu, tekst/hasła, dane liczbowe do zwizualizowania
Ton: dynamiczny/energetyczny? spokojny/profesjonalny? zabawny? minimalistyczny?
Storyboard:
Stworzysz 4–8 klatek kluczowych (key frames) pokazujących: co się dzieje na ekranie w każdym momencie. Narzędzia: Canva (szybkie mockupy), Figma (bardziej precyzyjne), PowerPoint (też działa). Format: PDF lub obraz z opisem każdej klatki.
NIGDY nie animuj całości bez akceptacji storyboardu. Storyboard = zero przerabiania później.
Struktura wideo — jak budować przekaz
Spot 15 sek (Pakiet S) — 5 klatek:
Spot 30 sek (Pakiet M) — jak S, ale:
Więcej przestrzeni na rozwinięcie każdej klatki. Dodajesz: scenę „jak to działa” (3–4 kroki z animacją), rozbudowaną wizualizację danych, lub krótki scenariusz narracyjny (problem → rozwiązanie → efekt).
Seria 3×15 sek (Pakiet L):
3 odrębne spoty w spójnym stylu (te same kolory, fonty, animacje, muzyka). Każdy ma inny przekaz. Przykład: Spot 1 = problem, Spot 2 = rozwiązanie, Spot 3 = społeczny dowód + CTA. Albo: 3 różne produkty/usługi.
7 zasad dobrego motion graphics
Formaty wideo — co eksportować
Narzędzia
Najczęstsze problemy
Firma nie ma zdjęć produktu w dobrej jakości. Poprosić o zdjęcia ze strony www (PPM → Zapisz obraz). Jeśli brak — użyć mockupów (Smartmockups, Placeit) lub stock photo jako substytutu. Zawsze poinformować firmę.
Firma chce „wszystko w 15 sekundach” (za dużo treści). „15 sekund = 1 przekaz. Wybierzmy najważniejszą rzecz, a resztę zróbmy w serii (pakiet L).” Nie upychaj 5 punktów w 15 sek.
Wideo wygląda „amatorsko” (brak ease, złe tempo). Sprawdź: czy ease in/out jest na KAŻDYM elemencie? Czy zmiany klatek są zsynchronizowane z muzyką? Czy jest biała przestrzeń? Zazwyczaj problem to zbyt dużo elementów na ekranie.
Muzyka nie pasuje do tempa wideo. Dobieraj muzykę PRZED animowaniem, nie po. BPM muzyki = tempo zmian klatek. 120 BPM = zmiana co 0.5 sek.
Plik jest za duży (>50 MB za 30 sek). Eksport: H.264, 1080p, bitrate 8–12 Mbps. Jeśli nadal duży: HandBrake (darmowy kompres). Dla www: max 5 MB (użyć niższy bitrate lub krótszy loop).
Firma zmienia kierunek po zaakceptowanym storyboardzie. „Storyboard został zaakceptowany — zmiany koncepcji na tym etapie to nowe zlecenie. Mogę wprowadzić drobne korekty w ramach poprawek.”
Checklist końcowy
Storyboard zaakceptowany przez firmę PRZED animowaniem
Wszystkie elementy animowane z ease in/out (zero linear motion)
Zmiany klatek zsynchronizowane z muzyką (beat matching)
Max 5–7 słów na ekranie w danym momencie
Hook w pierwszych 3 sekundach (ruch, kontrast, pytanie)
CTA na ostatniej klatce — jasny, konkretny, jeden
Spójne kolory, fonty, styl animacji przez całe wideo
Logo animowane na intro i/lub outro
Muzyka royalty-free z legalnego źródła (zapisać licencję!)
Eksport: MP4 H.264 FullHD, odpowiedni format (9:16 / 16:9 / 1:1)
Podgląd na telefonie (!) — większość ogląda na mobile. Tekst czytelny?
Napisy — jeśli wideo ma dźwięk, dodaj napisy (80%+ ogląda bez dźwięku)
Nazewnictwo: [firma]_spot_[typ]_[format]_v1.mp4
Paczka ZIP na Google Drive: MP4 + GIF (jeśli pakiet M/L) + projekt źródłowy (jeśli L)
Wiadomość podsumowująca na platformie
Student2Work — Łączymy ambicje studentów z potrzebami firm',
  399, 899,
  '[{"name": "S", "label": "Pakiet S", "price": 399, "delivery_time_days": 5, "scope": ""}, {"name": "M", "label": "Pakiet M", "price": 649, "delivery_time_days": 8, "scope": ""}, {"name": "L", "label": "Pakiet L", "price": 899, "delivery_time_days": 12, "scope": ""}]'::jsonb, 5, 'Multimedia',
  false, 0.25, true, 'platform_service', 'active', NULL
);

-- #15: Dashboard analityczny — Twoje dane w jednym widoku
INSERT INTO public.service_packages (
  title, description, locked_content, price, price_max,
  variants, delivery_time_days, category,
  requires_nda, commission_rate, is_system, type, status, student_id
) VALUES (
  'Dashboard analityczny — Twoje dane w jednym widoku',
  'Dashboard analityczny — Twoje dane w jednym widoku
Interaktywny raport z wykresami i filtrami w Excel, Google Sheets lub Power BI
O co chodzi
Masz dane w Excelu — sprzedaż, koszty, leady, magazyn, cokolwiek — ale nie masz z nich żadnych wniosków. Otwierasz plik z tysiącami wierszy i zamykasz go po 10 sekundach. Student zamieni te surowe dane w czytelny dashboard: wykresy, kluczowe liczby (KPI), filtry do przeglądania po okresach, produktach czy regionach. Otwierasz jeden arkusz i od razu widzisz, jak idzie biznes.
To nie jest zaawansowana analityka, data science ani machine learning. To uporządkowanie Twoich istniejących danych w formę, którą da się zrozumieć w 30 sekund. Dashboard odświeża się automatycznie — wrzucasz nowe dane do tabeli źródłowej, wykresy się aktualizują.
Typowe zastosowania: raport sprzedaży miesięcznej z podziałem na produkty i handlowców, monitoring kosztów operacyjnych, analiza leadów z CRM, śledzenie stanów magazynowych, raport HR (absencje, rotacja). Jeśli masz dane i pytanie — student zbuduje odpowiedź w formie dashboardu.
Co dokładnie dostajesz
Czego ten pakiet nie obejmuje
Budowa bazy danych, ETL, integracja z systemami (ERP, CRM, API) — pracujemy na pliku, który nam dasz
Zbieranie danych — nie logujemy się do Twoich systemów. Dostajesz dashboard na podstawie danych, które wyeksportujesz
Zaawansowana statystyka, modelowanie predykcyjne, machine learning
Automatyczne pobieranie danych z internetu (web scraping)
Bieżące aktualizowanie dashboardu co miesiąc — to jednorazowe zlecenie, nie abonament
Interpretacja biznesowa wyników — pokazujemy dane, ale decyzje podejmujesz Ty
Co musisz dostarczyć
Bez danych nie ma dashboardu. Oto co potrzebujemy:
Plik z danymi — Excel (.xlsx), CSV lub Google Sheets. Im więcej danych (miesięcy, rekordów), tym lepszy dashboard
Opis co jest w kolumnach — jeśli nazwy kolumn są niejasne (np. "KOL_A", "STATUS_3"), wyjaśnij co znaczą
Co chcesz widzieć — jakie pytania ma odpowiedzieć dashboard? (np. "Który produkt sprzedaje się najlepiej?")
3-6 KPI, które są dla Ciebie ważne — jeśli nie wiesz jakie, student zaproponuje na podstawie danych
Preferencja narzędzia: Excel, Google Sheets, czy Power BI? Jeśli nie wiesz — student dobierze najlepsze
Najczęstszy problem: firma wysyła plik z bałaganem (puste wiersze, pomieszane formaty, daty jako tekst). To normalne — student to oczyści. Ale jeśli dane są w 15 rozrzuconych plikach, scalenie ich to dodatkowa praca. Uprzedź o tym z góry.
Jak ta cena wygląda na tle rynku
Student z kierunku finanse, zarządzanie lub data science ma wiedzę o tabelach przestawnych, wykresach i KPI — to standardowa część programu studiów. Nie dostaniesz zaawansowanej analizy na poziomie firmy konsultingowej, ale dostaniesz uporządkowane dane i czytelny raport, z którego wyciągniesz wnioski w 30 sekund zamiast godziny.
Jak wygląda proces
Dzień 1-2: Wysyłasz dane i brief. Student przegląda plik, zadaje pytania o brakujące informacje, proponuje strukturę dashboardu (jakie KPI, jakie wykresy, jakie filtry). Dostajesz listę do akceptacji.
Dzień 3-4: Czyszczenie danych i budowa tabeli źródłowej. To nudna, ale kluczowa robota — bez czystych danych wykresy kłamią.
Dzień 5-6: Budowa dashboardu: KPI, wykresy, filtry, formatowanie. Student testuje czy wszystko się odświeża poprawnie.
Dzień 7: Dostajesz gotowy plik + instrukcję PDF. Masz 48h na feedback — 1 runda, do 5 zmian.
Masz pytania? Napisz do nas przez platformę — odpowiadamy w ciągu 24h.',
  'Ta sekcja nie jest widoczna dla firmy-zleceniodawcy. Zawiera instrukcję realizacji, wynagrodzenie i wewnętrzne wskazówki.
Twoje wynagrodzenie
Czas mocno zależy od jakości danych. Czyste dane z jednego pliku = 10h. Bałagan z 5 plików z różnymi formatami = 15h+. Jeśli czyszczenie danych zajmuje >5h — sygnalizuj na platformie, może kwalifikować się na dopłatę.
Instrukcja realizacji — dzień po dniu
Dni 1-2: Odbiór danych i planowanie (~2h)
Po przyjęciu zlecenia wyślij firmie checklist (szablon, ID: BRIEF-DASH-15):
Plik(i) z danymi — w jakim formacie, ile wierszy, ile kolumn, jaki zakres czasowy
Słownik kolumn — co znaczą nagłówki, jakie wartości przyjmują
Pytania biznesowe — co firma chce widzieć?
KPI — jeśli firma nie wie, zaproponuj. Typowe: przychód, liczba transakcji, średnia wartość zamówienia, marża, konwersja
Preferencja narzędzia — Excel, Google Sheets, czy Power BI?
Wybór narzędzia — Twoja decyzja:
Domyślny wybór: Excel (jeśli firma nie ma preferencji). Największa kompatybilność, firma na pewno go otworzy.
Dni 3-4: Czyszczenie danych (~3-5h)
To jest 50% całej pracy. Nie pomijaj tego kroku — brudne dane = kłamiący dashboard.
Checklist czyszczenia:
Usuń puste wiersze i kolumny (Ctrl+End w Excelu sprawdza rzeczywisty zakres danych)
Duplikaty: zaznacz kolumny kluczowe → Dane → Usuń duplikaty. Zanotuj ile usunąłeś
Daty: upewnij się, że WSZYSTKIE daty są w jednym formacie. Jeśli część jest tekstem — DATEVALUE() lub Text to Columns
Kwoty: usuń spacje, zamień przecinki na kropki, upewnij się, że to liczby. Test: czy SUM() działa?
Kategorie: ustandaryzuj nazwy ("Warszawa", "warszawa", "Wwa" → jedno). Find & Replace lub TRIM(UPPER())
Braki danych: usuń wiersz, wpisz "brak" albo interpoluj. Nie zostawiaj pustych komórek w kolumnach filtrowanych
Zbuduj jedną tabelę źródłową (Ctrl+T w Excelu) — to fundament pivotów i wykresów
Złota zasada: nigdy nie edytuj danych oryginalnych. Skopiuj do nowego arkusza "dane_czyste" i pracuj na kopii.
Dni 5-6: Budowa dashboardu (~4-6h)
Struktura arkusza (Excel/Sheets):
Arkusz 1: "Dashboard" — to co widzi firma. KPI na górze, wykresy poniżej, filtry po boku
Arkusz 2: "Dane" — tabela źródłowa (czyste dane). Firma tu wrzuca nowe wiersze
Arkusz 3: "Obliczenia" (ukryty) — tabele pomocnicze, pivoty, formuły pośrednie
Budowa KPI (3-6 wskaźników na górze):
Duże liczby, czytelna czcionka (min. 20pt). Każdy KPI: etykieta + wartość + opcjonalnie zmiana % vs poprzedni okres
Kolorystyka: zielony = dobrze (wzrost), czerwony = źle (spadek), szary = neutralne. Formatowanie warunkowe
Typowe KPI: łączny przychód, liczba transakcji, średnia wartość zamówienia, top produkt, marża %, dynamika m/m
Budowa wykresów (3-5 wizualizacji):
Wykres liniowy: trend w czasie (przychód/miesiąc, leady/tydzień). Najważniejszy wykres — zawsze go dołącz
Wykres słupkowy: porównanie kategorii (sprzedaż per produkt, per handlowiec, per region)
Wykres kołowy/donut: udziały %. Max 5-6 kategorii, resztę zgrupuj jako "inne"
Bar chart (poziomy): ranking TOP 5/TOP 10 (najlepsze produkty, najlepsi klienci)
Formatowanie — zasady:
Max 3 kolory + biały/szary tło. Spójna kolorystyka w całym dashboardzie
Ukryj linie siatki na arkuszu Dashboard (Widok → odznacz Linie siatki)
Wyrównaj elementy — wykresy tej samej wysokości, równe marginesy
Czcionka: Calibri lub Segoe UI. Jedna czcionka w całym pliku
Nie używaj 3D wykresów. Nigdy. Są nieczytelne i wyglądają amatorsko
Slicery (Excel): wstaw do każdego pivota → timeline slicer (daty) + zwykły slicer (kategorie)
Dzień 7: Testowanie i oddanie (~1-2h)
Dodaj 5 testowych wierszy → odśwież pivoty (Ctrl+Alt+F5) → sprawdź czy KPI i wykresy się zaktualizowały
Usuń testowe dane. Upewnij się, że dane źródłowe są oryginalne
Sprawdź obliczenia: policz ręcznie 2-3 KPI i porównaj z dashboardem
Sprawdź filtry — każdy slicer musi działać poprawnie
Ukryj arkusz "Obliczenia", zablokuj komórki z formułami
Przygotuj instrukcję PDF: jak dodać dane, odświeżyć, filtrować, co znaczą KPI
Narzędzia
Najczęstsze problemy i jak je rozwiązać
Dane są w 5 różnych plikach z różnymi formatami. Power Query (Excel) potrafi połączyć pliki automatycznie. Jeśli to >3h pracy — poinformuj firmę, że scalanie jest poza standardowym zakresem.
Firma mówi "zrób dashboard" ale nie wie co chce zobaczyć. Zaproponuj standard: przychód/miesiąc (liniowy), TOP 10 produktów (bar), struktura kosztów (donut), KPI: przychód, transakcje, średnia wartość. 90% firm powie "tak, to jest to".
Dane mają 200 tys. wierszy — Excel zwalnia. Power Query → ładuj tylko potrzebne kolumny. Albo przejdź na Power BI. Nie buduj dashboardu na surowych danych — zawsze na agregatach.
Firma chce dashboard "jak z raportu McKinseya". Pokaż realne przykłady dashboardów z Excela. Ustal oczekiwania na początku. Nasz dashboard będzie czytelny i funkcjonalny, ale nie interaktywna aplikacja webowa.
KPI nie zgadza się z tym, co firma liczy ręcznie. Zawsze pokaż formułę. Niezgodność KPI = zero zaufania do dashboardu. Dostosuj definicję do tego, jak firma liczy.
Checklist końcowy
Dashboard czytelny — KPI widoczne bez scrollowania, wykresy zrozumiałe bez wyjaśniania
Filtry/slicery działają poprawnie
Odświeżanie działa — nowe dane → nowe wyniki
Obliczenia zweryfikowane ręcznie (2-3 KPI)
Arkusz "Obliczenia" ukryty, formuły zablokowane
Instrukcja PDF przygotowana
Plik przetestowany na czystej kopii (zamknij i otwórz ponownie)
Kolorystyka spójna, wykresy wyrównane, brak 3D
Wiadomość podsumowująca wysłana na platformie
Student2Work — Łączymy ambicje studentów z potrzebami firm',
  649, NULL,
  NULL, 7, 'Analiza danych',
  false, 0.25, true, 'platform_service', 'active', NULL
);

-- #16: Raport konkurencji — benchmark Twojej branży
INSERT INTO public.service_packages (
  title, description, locked_content, price, price_max,
  variants, delivery_time_days, category,
  requires_nda, commission_rate, is_system, type, status, student_id
) VALUES (
  'Raport konkurencji — benchmark Twojej branży',
  'Raport konkurencji — benchmark Twojej branży
Dowiedz się, co robi konkurencja — zanim podejmiesz kolejną decyzję biznesową
O co chodzi
Wiesz, że masz konkurencję. Ale czy wiesz, jakie mają ceny? Jak wyglądają ich strony? Co piszą w social media? Jakie opinie mają na Google? Jak komunikują swoją ofertę?
Większość firm MŚP podejmuje decyzje „na czuja” — bo nie ma czasu na research. Student przygotuje dla Ciebie profesjonalny raport: zbierze dane o konkurentach, porówna ich z Twoją firmą, wskaże Twoje mocne strony i luki do wypełnienia. Dostajesz konkretne rekomendacje — nie teorię, a listę działań.
Wybierz pakiet
Dodatkowy konkurent poza pakietem: +99 PLN.
Co dostajesz w każdym pakiecie
Profil każdego konkurenta — kto to, co oferuje, ile kosztuje, jak się komunikuje, jakie ma opinie
Tabela porównawcza — Twoja firma vs konkurenci, kolumna po kolumnie. Widzisz dokładnie gdzie wygrywasz, a gdzie przegrywasz
Benchmark cenowy — porównanie cen głównych produktów/usług. Odpowiedź na pytanie: czy jesteś za drogi, za tani, czy w sam raz?
Rekomendacje działań — konkretna lista: „zrób to, zmień to, dodaj to”. Nie teoria, a działania
Raport PDF — profesjonalnie sformatowany dokument gotowy do wysłania wspólnikowi, inwestorowi, zespołowi
Typowe zastosowania
Co musisz dostarczyć
Branża / segment rynku — „jedziemy o salony kosmetyczne w Krakowie” albo „sklepy z odzieżą sportową online w Polsce”
Listę konkurentów (jeśli znasz) — lub student sam wyszuka na podstawie branży i lokalizacji
Twoją ofertę / cennik — żeby student mógł porównać Cię z resztą
Pytania kluczowe — co chcesz się dowiedzieć? („czy jestem za drogi?”, „co robią w social media?”, „dlaczego klienci idą do nich?”)
Kontekst decyzji — dlaczego teraz potrzebujesz tego raportu? To pomaga studentowi ustawić priorytety.
Czego pakiety NIE obejmują
Danych poufnych — student korzysta wyłącznie z źródeł publicznych (strony www, social media, Google Maps, portale branżowe, KRS, GUS). Żadnego „byłego pracownika” ani „kontaktu w firmie”
Analizy SEO / SEM — to osobna specjalizacja (narzędzia płatne, doświadczenie). Raport obejmuje widoczność ogólną, nie audyt SEO
Analizy finansowej (przychody, zyski, marże) — chyba że firma publikuje dane w KRS/sprawozdaniach. Student nie szacuje finansów
Wdrożenia rekomendacji — raport mówi CO zrobić, nie robi tego za Ciebie (ale inne usługi Student2Work mogą!)
Badań ankietowych / wywiadów z klientami konkurencji
Jak te ceny wyglądają na tle rynku
Student2Work: 20–35% taniej niż freelancer z doświadczeniem, z ustandaryzowanym procesem i jasnym formatem raportu.
Jak wygląda proces
Dzień 1–2: Brief: student ustala z firmą branżę, listę konkurentów (lub sam wyszukuje), kluczowe pytania i kontekst decyzji. Potwierdza zakres.
Dzień 3–5 (S) / 3–7 (M) / 3–10 (L): Desk research: zbieranie danych z publicznych źródeł — strony www, social media, Google Maps, portale branżowe, KRS, cenniki. Wypełnianie tabeli porównawczej.
Dzień +2–3: Analiza i pisanie raportu: wnioski, SWOT, benchmark cenowy, rekomendacje. Formatowanie PDF.
Dzień +1: Poprawki: firma sprawdza raport, student wprowadza korekty.',
  'Ta sekcja nie jest widoczna dla firmy-zleceniodawcy. Zawiera instrukcję realizacji, wynagrodzenie i wewnętrzne wskazówki.
Dlaczego właśnie student zarządzania / ekonomii / marketingu?
Na 2–3 roku zarządzania, ekonomii lub marketingu masz:
Analiza strategiczna — zajęcia z zarządzania strategicznego, analizy otoczenia, modele Portera, SWOT, PESTEL
Badania rynku — metodologia desk research, źródła danych (GUS, KRS, raporty branżowe), analiza porównawcza
Marketing — segmentacja rynku, pozycjonowanie, analiza 4P konkurencji, benchmarking
Prezentacja danych — wykresy, tabele, wizualizacja wniosków w raporcie. Umiejętność pisania konkluzji
Narzędzia: Excel/Google Sheets (tabele, wykresy), Word/Google Docs (raport), Canva (wykresy, infografiki)
Portfolio: case studies z uczelni, projekty grupowe z analizy rynku. Przebuduj najlepsze jako przykłady.
Kluczowe: nie chodzi o „opisaną teorię”. Firma płaci za KONKRETY — fakty, liczby, porównania i rekomendacje działań.
Twoje wynagrodzenie w zależności od pakietu
Dodatkowy konkurent: +99 PLN (z czego Twoje: +74 PLN, ~1.5–2h pracy).
Instrukcja realizacji — krok po kroku
Krok 1: Brief (~1h)
Brief (ID: BRIEF-BENCHMARK-16). Kluczowe ustalenia:
Branża + lokalizacja: „salony fryzjerskie w Warszawie”, „sklepy z meblami online w Polsce”, „software house’y SaaS B2B w PL”
Lista konkurentów: firma podaje (najlepiej) lub student wyszukuje na podstawie Google, Google Maps, branżowych katalogów
Oferta / cennik firmy: żeby było co porównywać. Jeśli firma nie ma cennika online — poprosić o orientacyjne ceny
Kluczowe pytania: „czy jestem za drogi?”, „co reszta robi w social media?”, „dlaczego klienci chodzą do X a nie do mnie?”
Kontekst decyzji: co firma zamierza z raportem zrobić? (zmiana cen, nowy produkt, pitch, strategia)
Krok 2: Desk research (~5–15h zależnie od pakietu)
Dla KAŻDEGO konkurenta zbierasz dane w ustandaryzowanej tabeli:
ŹRÓDŁA: Strona www konkurenta, Google Maps, Facebook/Instagram/LinkedIn, KRS (rejestr.io), GUS (stat.gov.pl), portale branżowe, Ceneo/Allegro (jeśli e-commerce). NIE używaj płatnych narzędzi SEO — to nie jest audyt SEO.
Krok 3: Analiza i raport (~3–6h)
Struktura raportu (template):
1. Streszczenie wykonawcze (1 strona) — Najważniejsze wnioski i 3 kluczowe rekomendacje. Firma czyta TO PIERWSZĄ — jeśli tu nie ma wartości, reszta nie ma znaczenia.
2. Metodologia (0.5 strony) — Jakie źródła, jakie kryteria, jaki zakres czasowy. Buduje wiarygodność.
3. Profile konkurentów (1–2 strony na firmę) — Każdy konkurent: profil, oferta, ceny, strona, social, opinie. Struktura identyczna dla każdego — łatwo porównać.
4. Tabela porównawcza (1–2 strony) — Macierz: wiersze = kryteria, kolumny = firmy. Kolorowanie: zielony = mocny, żółty = ok, czerwony = słaby.
5. Benchmark cenowy (1 strona) — Wykres: oś X = firmy, oś Y = cena głównego produktu/usługi. Gdzie jest firma klienta na tle reszty?
6. SWOT (1 strona, pakiet M/L) — Silne strony, słabe strony, szanse, zagrożenia — firma klienta NA TLE konkurencji.
7. Rekomendacje (1–2 strony) — Konkretne działania z priorytetem: [WYSOKI] [ŚREDNI] [NISKI]. Format: „Co zrobić → Dlaczego → Efekt”.
Narzędzia
Najczęstsze problemy
Firma nie wie kto jest konkurencją. Wyszukaj w Google: „[usługa] [miasto]”, „alternatywy dla [firma]”, Google Maps kategoria + lokalizacja. Zapytaj firmę: „do kogo odchodzą Twoi klienci?”
Konkurent nie ma cennika online. Wyciągnij z: ofert w social media, portali branżowych (np. Oferteo, Fixly), archiwalnych postów, komentarzy klientów. Jeśli brak — napisz „brak danych”, nie wymyślaj.
Raport wygląda jak praca zaliczeniowa (za dużo teorii). Zasada: ZERO teorii. Każde zdanie = fakt, liczba, porównanie lub rekomendacja. Firma nie płaci za definicję SWOT — płaci za wnioski z JEJ SWOT.
Firma chce „analizę całego rynku” (zbyt szeroki zakres). „Pakiet obejmuje X konkurentów. Pełna analiza rynku to projekt za 5 000–10 000 PLN. Skupmy się na najważniejszych rywalach.”
Dane są niespójne (różne źródła mówią różne rzeczy). Zawsze podawaj źródło i datę. Jeśli dane się różnią — napisz to wprost: „według Google Maps 4.2, według Facebook 4.6”. Transparentność > pozorna precyzja.
Firma oczekuje „strategii” a nie „raportu”. „Raport zawiera rekomendacje działań z priorytetami. Pełna strategia (z budżetem, harmonogramem, KPI) to osobne zlecenie.”
Checklist końcowy
Brief zaakceptowany — lista konkurentów, pytania kluczowe, kontekst decyzji ustalony
Dane zebrane z publicznych źródeł — każde twierdzenie ma źródło i datę
Tabela porównawcza wypełniona — identyczna struktura dla każdego konkurenta
Benchmark cenowy — z wykresem, nie tylko tabelą
SWOT (pakiet M/L) — konkretny, nie ogólnikowy. „Niska cena vs konkurent X” > „konkurencyjne ceny”
Rekomendacje — każda ma priorytet [WYSOKI/ŚREDNI/NISKI] i format „Co → Dlaczego → Efekt”
Streszczenie wykonawcze — na pierwszej stronie, 3 kluczowe wnioski
Zero teorii — żadnych definicji SWOT, Portera, segmentacji. Tylko fakty i wnioski
Formatowanie: PDF profesjonalny — spójne fonty, kolory, numeracja stron, spis treści
Excel (pakiet M/L) — surowe dane do samodzielnej analizy przez firmę
PPTX (pakiet L) — prezentacja 10–15 slajdów z kluczowymi wnioskami
Nazewnictwo: [firma]_raport_konkurencji_v1.pdf
Paczka ZIP na Google Drive
Wiadomość podsumowująca na platformie
Student2Work — Łączymy ambicje studentów z potrzebami firm',
  499, 1099,
  '[{"name": "S", "label": "Pakiet S", "price": 499, "delivery_time_days": 8, "scope": "3 firmy"}, {"name": "M", "label": "Pakiet M", "price": 799, "delivery_time_days": 14, "scope": "5 firm"}, {"name": "L", "label": "Pakiet L", "price": 1099, "delivery_time_days": 20, "scope": "8 firm"}]'::jsonb, 7, 'Analiza danych',
  false, 0.25, true, 'platform_service', 'active', NULL
);

-- #17: Pakiet grafik social media i materiałów marketingowych
INSERT INTO public.service_packages (
  title, description, locked_content, price, price_max,
  variants, delivery_time_days, category,
  requires_nda, commission_rate, is_system, type, status, student_id
) VALUES (
  'Pakiet grafik social media i materiałów marketingowych',
  'Pakiet grafik social media i materiałów marketingowych
Gotowe grafiki do publikacji — spójne z Twoją marką, dopasowane do platform
O co chodzi
Masz logo, masz stronę, masz plan postów — ale brakuje Ci grafik. Każdy post potrzebuje wizuala: zdjęcia z tekstem, infografiki, karuzeli, baneru, stories. Robisz to sam w Canvie i wygląda… średnio. Albo nie robisz wcale.
Student grafik przygotuje Ci paczkę gotowych grafik — spójnych stylistycznie, dopasowanych do Twojej marki i formatów platform. Dostajesz pliki gotowe do publikacji + edytowalne szablony, żebyś mógł sam tworzyć kolejne.
Wybierz pakiet
Dodatkowe grafiki poza pakietem: +29 PLN / szt.
Co dostajesz w każdym pakiecie
Gotowe grafiki — w rozmiarach dopasowanych do platform (Instagram, Facebook, LinkedIn, TikTok, Google Ads, druk)
Spójny styl wizualny — kolory, fonty, układ konsekwentne w całej paczce. Wyglądasz profesjonalnie.
Pliki PNG/JPG — gotowe do wrzucenia. Żadnego „jeszcze muszę przeciąć”.
Organizacja plików — foldery nazwane wg platformy i typu (np. IG_feed_01.png, IG_stories_01.png).
Paczka ZIP na Google Drive — wszystko w jednym miejscu.
Co możesz zamówić
1 karuzela = 1 grafika (niezależnie od ilości slajdów, max 10). 1 baner w 3 rozmiarach = 1 grafika.
Co musisz dostarczyć
Logo (najlepiej w wersji wektorowej: AI, SVG, PDF — lub przynajmniej PNG na przezroczystym tle)
Kolory i fonty marki — jeśli masz księgę znaku / brand guide, wyślij. Jeśli nie masz — student dopasuje na podstawie strony www / social media
Treści do grafik — hasła, teksty, CTA. Student projektuje GRAFIKI, nie pisze tekstów (chyba że krótkie hasła)
Zdjęcia / materiały — zdjęcia produktów, zespołu, biura. Jeśli nie masz — student użyje stockowych (Unsplash, Pexels) lub mockupów
Przykłady stylu „podoba mi się” — 3–5 screenshoty profili, grafik, stron które Ci się podobają. To najlepsza droga do zrozumienia oczekiwań.
Lista grafik — jakie grafiki potrzebujesz? (np. „8 postów feed + 2 stories” lub „5 karuzel + 3 banery reklamowe”)
Czego pakiety NIE obejmują
Copywritingu — student nie pisze długich tekstów do postów (patrz usługa #06 Teksty). Krótkie hasła i CTA — tak, artykuły i opisy — nie.
Animacji / wideo — to osobna usługa (#14 Motion Graphics, #07 Montaż Reels). Grafiki są statyczne.
Sesji zdjęciowej — student korzysta z materiałów, które dostarczysz lub ze stocków.
Publikacji postów — student tworzy grafiki, nie prowadzi profilu. Publikujesz sam lub zamawiasz #01 Social Media.
Druku — student przygotuje plik PDF do druku, ale nie zamawia druku. Polecamy drukarnie online (np. Chroma, Dfruk).
Jak te ceny wyglądają na tle rynku
Student2Work: 20–35% taniej niż freelancer grafik, a efekt porównywalny — bo studenci grafiki i designu to robią codziennie.
Jak wygląda proces
Dzień 1: Brief: student zbiera logo, kolory, fonty, przykłady stylu, listę grafik, treści/hasła. Ustala zakres.
Dzień 2: Moodboard / propozycja stylu: student przygotowuje 1–2 propozycje wizualne (styl, kolorystyka, układ). Firma wybiera kierunek.
Dzień 3–4 (S) / 3–6 (M) / 3–9 (L): Produkcja: student projektuje grafiki w wybranym stylu. Kolejność: najpierw 3–5 grafik do akceptacji, potem reszta.
Dzień +1–2: Poprawki: firma sprawdza, student koryguje. Po akceptacji — paczka ZIP na Drive.',
  'Ta sekcja nie jest widoczna dla firmy-zleceniodawcy. Zawiera instrukcję realizacji, wynagrodzenie i wewnętrzne wskazówki.
Twoje wynagrodzenie
Dodatkowe grafiki: +29 PLN / szt. (z czego Twoje: +22 PLN, ~20–30 min pracy gdy masz styl ustalony).
Instrukcja realizacji — krok po kroku
Krok 1: Brief i materiały (~1h)
Zbierz od firmy:
Logo — AI/SVG/PDF (wektor) lub PNG (minimum 1000 px). Jeśli firma nie ma wektora — poprosić o najlepszy plik jaki mają.
Kolory marki — kody HEX, RGB lub Pantone. Jeśli nie znają — pobierz ze strony www narzędziem (np. ColorZilla, Adobe Color).
Fonty — jeśli firma używa niestandardowych fontów, poprosić o pliki. Jeśli nie — zaproponuj Google Fonts.
Treści/hasła — co ma być na grafice? Hasło, CTA, numer telefonu, adres www? Poprosić o GOTOWE teksty — nie wymyślaj za firmę.
Zdjęcia — produktowe, zespołu, biura. Jeśli brak — użyj Unsplash/Pexels (darmowe) lub Freepik (premium jeśli masz).
Przykłady „podoba mi się” — min. 3 screenshoty. To jest KLUCZ do dobrego briefu. Bez tego strzelasz w ciemno.
Lista grafik — ile postów, ile stories, ile karuzel, ile banerów? Rozpisz w tabeli.
ZASADA: Nigdy nie zaczynaj projektować bez zaakceptowanego moodboardu. Inaczej spędzisz 3x więcej czasu na poprawkach.
Krok 2: Moodboard i styl (~1–2h)
Przygotuj moodboard (tablica inspiracji) w Canvie, Figmie lub Milanote:
Paleta kolorów — kolory główne marki + 2–3 kolory uzupełniające (tła, akcenty)
Fonty — nagłówek + tekst (max 2–3 fonty w całym projekcie)
Styl zdjęć — jasne/ciemne, nasycone/pastelowe, z ludźmi/bez
Układ typowy — jak wygląda przykładowy post (rozmieszczenie logo, tekstu, CTA)
Elementy graficzne — ramki, ikony, kształty, pattern — albo minimalizm
3–5 przykładowych grafik w proponowanym stylu (nie finalnych, ale pokazujących kierunek)
Wyślij firmie do akceptacji. CZEKAJ na odpowiedź zanim zaczniesz produkcję. Jeśli firma milczy > 48h — ping na platformie.
Krok 3: Produkcja grafik (~4–18h zależnie od pakietu)
Zasady efektywnej produkcji:
Zrób NAJPIERW 3–5 grafik (mix typów) i wyślij do akceptacji. Dopiero po OK robimy resztę. To chroni Cię przed „przerabianiem 30 grafik od zera”.
Pracuj na szablonach — zrób 2–3 layouty bazowe i zmieniaj treści/zdjęcia. Nie projektuj każdej grafiki od nowa.
Rozmiary ZAWSZE wg specyfikacji platformy — nigdy na oko. Tabela rozmiarów poniżej.
Hierarchia informacji: najważniejsze hasło = najwyżej / największe. CTA = najniżej / najbardziej widoczne. Logo = róg (nie centrum).
Max 5–7 słów na głównym haśle — nikt nie czyta esejów na Instagramie.
Biała przestrzeń (whitespace) — lepiej za dużo niż za mało. Oddech = profesjonalizm.
Spójność > kreatywność — firma chce rozpoznawalny styl, nie 30 różnych „pomysłów”.
Tabela rozmiarów platform (2025/2026)
Narzędzia
7 zasad dobrej grafiki social media
1. Spójność > kreatywność. Feed firmy to nie galeria sztuki — to narzędzie marketingowe. Każda grafika musi wyglądać jakby pochodziła z tej samej marki. Ten sam styl, te same kolory, te same fonty.
2. Mniej tekstu = więcej uwagi. Max 5–7 słów na głównym haśle. Detale idą w opis posta, nie na grafikę. Jeśli musisz zmniejszyć font żeby tekst się zmieścił — tekstu jest za dużo.
3. Kontrast = czytelność. Jasny tekst na ciemnym tle lub ciemny na jasnym. Nigdy szary na szarym, biały na żółtym, czerwony na zielonym. Testuj: zmruż oczy — jeśli tekst znika, kontrast jest za słaby.
4. Hierarchia: co najważniejsze = co najwyżej/największe. Oko skanuje od góry do dołu, od lewej do prawej. Najważniejsze hasło = góra/środek/duży font. CTA = dół/przycisk. Logo = róg.
5. Whitespace to Twój przyjaciel. Pusta przestrzeń nie jest „marnowaniem miejsca” — to oddech. Grafika bez whitespace wygląda jak ulotka z bazaru.
6. Zdjęcia: jakość > ilość. Jedno dobre zdjęcie > pięć kiepskich. Jeśli zdjęcia firmy są słabe — użyj stockowych lub mockupów. Nigdy nie rozciągaj małych zdjęć.
7. Eksportuj poprawnie. Social media: PNG (grafiki z tekstem) lub JPG high quality (zdjęcia). Druk: PDF z CMYK, 300 DPI, spadami 3mm. Nigdy nie dawaj klientowi pliku .PSD jako finalu.
Najczęstsze problemy
Firma nie ma logo w wektorze. Poprosić o najlepszy plik jaki mają. Jeśli to JPG 200px — użyj narzędzia do wektoryzacji (Vectorizer.ai) lub umieść logo mało (róg), żeby pikseloza nie była widoczna.
Firma nie wie czego chce („zrób ładnie”). Moodboard ratuje życie. Zapytaj: „pokaż mi 3 profile które Ci się podobają”. To wystarczy.
Firma chce „więcej tekstu na grafice”. „Na social media krótkie hasła działają lepiej. Dłuższe treści rekomenduję umieścić w opisie posta.” Pokaż przykłady: dużo tekstu vs mało tekstu — który wygląda lepiej?
Firma nie dostarcza zdjęć. Użyj stocków (Unsplash, Pexels) + mockupów. Poinformuj firmę: „Użyłem zdjęć stockowych — rekomenduję w przyszłości sesję zdjęciową dla lepszych efektów.”
Firma chce zmiany po „ostatecznej akceptacji”. „Pakiet obejmuje X rund poprawek. Dodatkowe zmiany: +29 PLN/grafika.” Uprzedź o tym NA POCZĄTKU — nie po fakcie.
Grafiki wyglądają „Canvowo” (amatorsko). Unikaj: domyślnych szablonów Canva (są zużyte), nadmiaru elementów, złych kombinacji fontów, neonowych kolorów. Mniej = więcej. Inspiruj się profilami marek (Apple, Nike, Ikea — prostota).
Struktura plików do przekazania
Organizuj pliki tak:
[NazwaFirmy]_grafiki_social/
├── 01_IG_feed/
│   ├── IG_feed_01.png
│   ├── IG_feed_02.png
├── 02_IG_stories/
├── 03_FB_post/
├── 04_banery/
├── 05_szablony_canva/  (link do Canvy)
├── 06_pliki_zrodlowe/  (Figma / PSD / AI)
└── README.txt  (krótki opis + fonty + kolory HEX)
Checklist końcowy
Brief zaakceptowany — lista grafik, treści, materiały zebrane
Moodboard zaakceptowany — styl, kolory, układ potwierdzone przez firmę
Pierwsze 3–5 grafik zaakceptowane — dopiero potem reszta
Wszystkie grafiki w poprawnych rozmiarach — sprawdzone wg tabeli platform
Spójność wizualna — kolory, fonty, styl jednolity w całej paczce
Tekst czytelny — kontrast, rozmiar, hierarchia. Zmruż oczy — widoczny?
Logo obecne — na każdej grafice, ale dyskretnie (róg, nie centrum)
Pliki wyeksportowane po',
  399, 949,
  '[{"name": "S", "label": "Pakiet S", "price": 399, "delivery_time_days": 6, "scope": ""}, {"name": "M", "label": "Pakiet M", "price": 699, "delivery_time_days": 12, "scope": ""}, {"name": "L", "label": "Pakiet L", "price": 949, "delivery_time_days": 18, "scope": ""}]'::jsonb, 5, 'Design',
  false, 0.25, true, 'platform_service', 'active', NULL
);

-- #18: Projekt UX/UI — makiety strony lub aplikacji w Figmie
INSERT INTO public.service_packages (
  title, description, locked_content, price, price_max,
  variants, delivery_time_days, category,
  requires_nda, commission_rate, is_system, type, status, student_id
) VALUES (
  'Projekt UX/UI — makiety strony lub aplikacji w Figmie',
  'Projekt UX/UI — makiety strony lub aplikacji w Figmie
Zaprojektuj swoją stronę lub aplikację ZANIM zaczniesz ją kodować
O co chodzi
Każda złotówka wydana na dobry design oszczędza 100 złotych na poprawkach w kodzie. To nie slogan — to statystyka (Forrester Research). Jeśli budujesz lub przebudowujesz stronę www albo aplikację, NAJPIERW zaprojektuj ją wizualnie, POTEM oddaj do programowania.
Student UX/UI przygotuje Ci profesjonalne makiety w Figmie — wireframe’y (szkielet), UI mockupy (wizualny projekt każdego ekranu) i klikalny prototyp, który możesz przetestować zanim wydasz ani złotówki na programistę.
Wybierz pakiet
Dodatkowy ekran poza pakietem: +99 PLN / szt.
Co to jest „ekran”?
Ekran = jeden unikalny widok w Twojej stronie lub aplikacji. Przykłady:
Popup, modal, dropdown = NIE są osobnym ekranem (są elementem ekranu na którym się pojawiają). Wariant desktop i mobile tego samego ekranu = 1 ekran (NIE 2).
Jak te ceny wyglądają na tle rynku
Student2Work: 4–5× taniej niż freelancer z doświadczeniem, 20–50× taniej niż agencja UX. Kompromis: brak badań użytkowników i testów A/B — ale makiety na poziomie, który programista może wdrożyć.
Co musisz dostarczyć
Cel projektu — „przebudowa strony firmowej”, „nowa aplikacja do zarządzania zleceniami”, „landing page pod kampanię”
Lista ekranów — jakie podstrony/widoki potrzebujesz? (student pomoże je zdefiniować jeśli nie wiesz)
Branding — logo, kolory, fonty. Jeśli masz księgę znaku — świetnie. Jeśli nie — student zaproponuje palety.
Treści — jakie teksty, zdjęcia, dane mają się pojawić na ekranach? Bez treści makieta będzie pełna „Lorem ipsum”.
Przykłady „podoba mi się” — 3–5 stron/appek które Ci się podobają (wygląd, styl, UX). To KLUCZ do dobrego briefu.
Informacja o użytkownikach — kto będzie korzystać z tej strony/appki? Wiek, cele, urządzenia (desktop/mobile/oba).
Czego pakiety NIE obejmują
Programowania / wdrożenia — student projektuje WYGLĄD, nie koduje. Makiety to instrukcja dla programisty (patrz usługa #10 Landing Page).
Badań użytkowników — brak wywiadów, testów użyteczności, analityki behawioralnej. To zakres agencji UX za 10 000+ PLN.
Copywritingu — student nie pisze treści na stronę (patrz #06 Teksty). Używa treści dostarczonych przez firmę lub placeholderów.
Animacji / micro-interactions zaawansowanych — prototyp pokazuje przejścia, nie pełne animacje CSS.
Utrzymania / dalszych zmian — projekt Figma jest Twój. Kolejne ekrany możesz zamówić jako dodatkowe (+99 PLN/ekran).
Jak wygląda proces
Dzień 1–2: Brief i analiza: student ustala cel, listę ekranów, branding, przykłady inspiracji, grupę docelową. Przegląda obecną stronę (jeśli istnieje) i 3–5 konkurentów.
Dzień 3–5: Wireframes (szkielety): szaro-białe układy ekranów — bez kolorów, bez zdjęć, tylko struktura i hierarchia treści. Firma akceptuje układ ZANIM student zacznie projektować wizualnie.
Dzień 6–10 (S) / 6–12 (M) / 6–16 (L): UI Mockupy: pełny projekt wizualny w kolorach, z fontami, zdjęciami, ikonami. Każdy ekran wygląda jak gotowa strona/appka.
Dzień +2–3 (M/L): Prototyp klikalny: ekrany połączone w interaktywny flow — można „przeklikać” stronę/appkę w przeglądarce.
Dzień +2: Poprawki i handoff: firma sprawdza, student koryguje, eksportuje specyfikacje dla programisty.',
  'Ta sekcja nie jest widoczna dla firmy-zleceniodawcy. Zawiera instrukcję realizacji, wynagrodzenie i wewnętrzne wskazówki.
Twoje wynagrodzenie
Dodatkowy ekran: +99 PLN (Twoje: +74 PLN, ~2–3h pracy bo styl już ustalony).
UWAGA: Stawki /h niższe niż w mniejszych usługach — ale kwota absolutna NAJWYŻSZA w katalogu. Pakiet L = 1 199 PLN netto — to NAJLEPSZA usługa do budowania portfolio i doświadczenia.
Instrukcja realizacji — krok po kroku
Krok 1: Brief i analiza (~2–3h)
Zbierz od firmy:
Cel projektu: „redesign strony firmowej” vs „nowa aplikacja od zera” vs „landing page pod kampanię”. To fundamentalnie zmienia podejście.
Lista ekranów: razem z firmą ustal ZAMKNIĘTĄ listę ekranów. Zapisz ją w briefie. To Twój „kontrakt” — chroni przed scope creep.
Branding: logo (wektor!), kolory HEX, fonty. Jeśli firma nie ma — zaproponuj 2–3 palety (Coolors.co, Adobe Color).
Treści: najważniejsze hasła, opisy, CTA. Jeśli firma nie da treści — użyj realisti cznych placeholderów, NIE „Lorem ipsum”.
Przykłady inspiracji: poprosić firmę o 3–5 URL-i stron/appek które się podobają. Analiza: co dokładnie im się podoba? Kolory? Układ? Styl zdjęć?
Użytkownicy: kto korzysta? Wiek, cele, urządzenia. To wpływa na wielkość fontów, złożoność nawigacji, priorytet mobile vs desktop.
Zrób krótką analizę 3–5 konkurentów — 30 min scrollowania ich stron. Co robią dobrze? Co źle? Daj firmie 3–5 insightów. To buduje zaufanie.
Krok 2: Wireframes (~3–8h zależnie od pakietu)
Wireframe = szkielet ekranu. Szaro-biały, bez zdjęć, bez kolorów. Pokazuje STRUKTURĘ i HIERARCHIĘ treści.
Używaj prostych kształtów: prostokąty = sekcje, linie = tekst, iksy = zdjęcia. Nie ozdabiaj wireframe’ów.
Każdy wireframe ma JEDNO pytanie do firmy: „Czy ten układ jest ok?”. Firma mówi TAK/NIE zanim przejdziesz do UI.
Utrzymuj spójną siatkę (grid): 12-kolumnowy grid to standard. Auto-layout w Figmie = Twój najlepszy przyjaciel.
Numeruj ekrany: WF-01, WF-02… żeby firma mogła się odwoływać do konkretnych widoków.
Oznacz interakcje: strzałki „kliknięcie przycisku → przenosi do ekranu X”. Nawet w wireframie.
ZASADA: NIGDY nie zaczynaj UI bez zaakceptowanych wireframe’ów. Inaczej będziesz przerabiać wizualne projekty z powodu złego układu.
Krok 3: UI Mockupy (~8–25h zależnie od pakietu)
UI Mockup = pełny projekt wizualny. Kolory, fonty, zdjęcia, ikony, shadowy — wygląda jak gotowa strona/appka.
Zacznij od 2–3 ekranów — wyślij firmie do akceptacji stylu. Dopiero po OK robimy resztę.
Design system od początku: zdefiniuj kolory (primary, secondary, success, error, gray scale), fonty (heading + body), spacing (4/8/16/24/32/48/64 px), border-radius, shadow. Używaj komponentów Figma.
Komponenty > copy-paste: przyciski, inputy, karty, nawigacja — zrób jako komponenty (components). Zmiana w jednym = zmiana we wszystkich. Oszczędza GODZINY.
Mobile-first (jeśli firma targetuje mobile): projektuj NAJPIERW wersję mobilną, potem rozszerzaj na desktop. Nie odwrotnie.
Ikony: Phosphor Icons, Lucide, Heroicons — spójny zestaw. NIGDY nie mieszaj stylów ikon.
Zdjęcia: jeśli firma nie dostarczyła — Unsplash/Pexels, ale dobierz spójną estetykę (nie 5 różnych stylów zdjęć).
Dostępność (accessibility): kontrast WCAG AA minimum (4.5:1 dla tekstu). Użyj pluginu Contrast — sprawdza automatycznie.
Krok 4: Prototyp klikalny (pakiet M/L, ~3–6h)
Prototyp = połączone ekrany, które można „przeklikać” w przeglądarce.
Użyj natywnych Figma Prototyping: „On click → Navigate to”. Proste przejścia między ekranami.
Animacje: ease-in-out, 300ms — standard. Nie przesadzaj z animacjami — to prototyp, nie produkcja.
Główny flow: zidentyfikuj 1–2 główne ścieżki użytkownika („kupuję produkt”, „składam zapytanie”) i zrób je klikalne. Nie każdy przycisk musi działać.
Link do prototypu: udostępnij firmie jako link Figma Prototype — otwierają w przeglądarce, klikają, testują.
Smart Animate (pakiet L): dla płynnych przejść między stanami (hover, toggle, accordion). Dodaje „wow effect”.
Krok 5: Developer handoff (pakiet M/L, ~2–4h)
Handoff = dokumentacja dla programisty. Programista NIE powinien zgadywać jak wygląda projekt.
Figma Dev Mode: włącz Dev Mode — programista widzi CSS, spacing, kolory, fonty automatycznie.
Eksport assetów: ikony SVG, zdjęcia @1x @2x, logo. Przygotuj w folderze „Assets”.
Naming convention: warstwy w Figmie nazwane logicznie: „Header/Nav/Logo”, „Hero/CTA Button”. NIE „Frame 47”, „Rectangle 12”.
Breakpointy: desktop (1440px), tablet (768px), mobile (375px). Oznacz jasno w projekcie.
README w projekcie Figma: strona „ Documentation” z opisem: kolory, fonty, grid, spacing, breakpointy, flow.
Narzędzia
7 zasad dobrego UX/UI (Student2Work)
1. Wireframe PRZED UI. Zawsze. Bez wyjątku. Firma musi zaakceptować układ zanim zobaczą kolory. Inaczej zmiana układu = przera bianie całego UI.
2. Komponenty od dnia 1. Przyciski, inputy, karty, nawigacja — robimy jako Figma Components od początku. Zmiana = propagacja. Oszczędzasz godziny.
3. Auto-layout ZAWSZE. Każdy frame używa auto-layout. Bez tego responsive jest niemożliwy. Figma bez auto-layout = Photoshop z 2010.
4. 8px grid system. Wszystkie wymiary (padding, margin, gap) są wielokrotnością 8: 8, 16, 24, 32, 48, 64. Spójne i łatwe do wdrożenia.
5. Mniej > więcej. Każdy ekran ma JEDNO główne działanie (CTA). Jeśli użytkownik nie wie co kliknąć w 3 sekundy — ekran jest za skomplikowany.
6. Kontrast = dostępność. WCAG AA minimum: 4.5:1 dla tekstu, 3:1 dla dużego tekstu. Nie „wygląda ok na moim monitorze” — sprawdź pluginem Contrast.
7. Naming = profesjonalizm. Warstwy: „Header/Nav/Logo”, nie „Frame 184”. Programista otwiera Twój plik — jeśli widzi bałagan, traci zaufanie do całego projektu.
Najczęstsze problemy
Firma chce „jeszcze jeden ekran” (scope creep). Pokaż brief z zamkniętą listą ekranów. „Dodatkowy ekran: +99 PLN. Chętnie go dodam po akceptacji obecnego zakresu.”
Firma nie dostarcza treści („wstaw coś”). Użyj REALISTYCZNYCH placeholderów, nie Lorem ipsum. Np. „Usługi księgowe dla MŚP od 299 zł/mies.” zamiast „Lorem ipsum dolor sit amet”. ',
  799, 1599,
  '[{"name": "S", "label": "Pakiet S", "price": 799, "delivery_time_days": 15, "scope": ""}, {"name": "M", "label": "Pakiet M", "price": 1199, "delivery_time_days": 28, "scope": ""}, {"name": "L", "label": "Pakiet L", "price": 1599, "delivery_time_days": 40, "scope": ""}]'::jsonb, 10, 'Design',
  false, 0.25, true, 'platform_service', 'active', NULL
);

-- #19: Katalog firmowy / broszura — profesjonalny skład DTP
INSERT INTO public.service_packages (
  title, description, locked_content, price, price_max,
  variants, delivery_time_days, category,
  requires_nda, commission_rate, is_system, type, status, student_id
) VALUES (
  'Katalog firmowy / broszura — profesjonalny skład DTP',
  'Katalog firmowy / broszura — profesjonalny skład DTP
Profesjonalnie złożony katalog produktów, folder ofertowy lub broszura — gotowe do druku lub dystrybucji cyfrowej
O co chodzi
Katalog firmowy to Twój handlowiec, który pracuje 24/7. Leży na biurku klienta, jeździ na targi, trafia do partnerow B2B. Jeśli wygląda amatorsko — firma wygląda amatorsko. Jeśli wygląda profesjonalnie — buduje zaufanie zanim padnie pierwsze słowo.
Student grafiki/DTP złoży Ci profesjonalny katalog produktów, folder ofertowy lub broszurę firmową. Dostajesz plik PDF gotowy do wysłania do drukarni (CMYK, spady, 300 DPI) ORAZ wersję cyfrową do rozesłania mailem lub umieszczenia na stronie www.
Wybierz pakiet
Dodatkowa strona poza pakietem: +59 PLN / szt.
Popularne formaty katalogów
Student zaproponuje optymalny format na podstawie treści i budżetu. Standard: A4 pionowy. Jeśli nie wiesz — nie musisz decydować sam.
Jak te ceny wyglądają na tle rynku
Student2Work: 15–30% taniej niż freelancer z doświadczeniem, 3–7× taniej niż agencja kreatywna. Pełen projekt graficzny + DTP, nie sam skład tekstu.
Co musisz dostarczyć
Treści — teksty do każdej strony (opisy produktów, hasła, CTA, dane kontaktowe). Student NIE pisze tekstów (patrz usługa #06 Teksty).
Zdjęcia — zdjęcia produktów, zespołu, biura, realizacji. MINIMUM 300 DPI / 2000px dłuższy bok. Jeśli nie masz — student użyje stocków (Unsplash/Pexels) lub mockupów.
Logo — najlepiej wektor (AI, SVG, PDF). Minimum: PNG na przezroczystym tle, min. 1000px.
Branding — kolory (HEX/Pantone), fonty, księga znaku (jeśli masz). Jeśli nie — student dopasuje na podstawie strony www.
Struktura / spis treści — jakie sekcje ma mieć katalog? (np. O firmie → Produkty → Cennik → Kontakt). Jeśli nie wiesz — student zaproponuje.
Przykłady „podoba mi się” — 2–3 katalogi innych firm które Ci się podobają. Styl, układ, kolorystyka.
Informacja o druku — drukarnia (jeśli masz), nakład, papier, oprawa (zszywki/klej/spirala). Student doradzi jeśli nie wiesz.
Czego pakiety NIE obejmują
Copywritingu — student składa DOSTARCZONE teksty, nie pisze nowych. Potrzebujesz tekstów? Patrz usługa #06.
Sesji zdjęciowej — student korzysta ze zdjęć które dostarczysz lub ze stocków. Sesja produktowa = osobne zlecenie.
Druku — student przygotuje plik PDF gotowy do drukarni, ale nie zamawia druku. Polecamy drukarnie online: Dfruk.pl, Chroma.pl, Drukomat.pl.
Tłumaczeń — potrzebujesz wersji angielskiej? Patrz usługa #09 Lokalizacja.
Dystrybucji — student nie rosyła katalogów do klientów. Dostajesz pliki, reszta po Twojej stronie.
Typowe zastosowania
Jak wygląda proces
Dzień 1–2: Brief: student zbiera treści, zdjęcia, branding, przykłady inspiracji, ustala format i strukturę katalogu.
Dzień 3–4: Propozycja layoutu: student przygotuje 1–2 koncepcje układu (okładka + 2–3 przykładowe strony wnętrza). Firma wybiera kierunek.
Dzień 5–7 (S) / 5–10 (M) / 5–14 (L): Skład DTP: student układa wszystkie strony — wstawia teksty, zdjęcia, grafiki, infografiki. Całość w spójnym stylu.
Dzień +1–2: Poprawki: firma sprawdza PDF przeglądowy, zgłasza uwagi. Student koryguje.
Dzień +1: Finalizacja: eksport PDF do druku (CMYK, spady) + PDF cyfrowy (RGB, lekki). Paczka na Google Drive.',
  'Ta sekcja nie jest widoczna dla firmy-zleceniodawcy. Zawiera instrukcję realizacji, wynagrodzenie i wewnętrzne wskazówki.
Twoje wynagrodzenie
Dodatkowa strona: +59 PLN (Twoje: +44 PLN, ~1–1.5h gdy styl ustalony).
Instrukcja realizacji — krok po kroku
Krok 1: Brief i materiały (~1–2h)
Zbierz od firmy:
Treści: pełne teksty do każdej strony (Word/Google Docs). Jeśli firma da „opisy z Excela” — ok, ale MUSZĄ być kompletne. NIE piszesz za firmę.
Zdjęcia: minimum 300 DPI / 2000px dłuższy bok. Sprawdz KAZDE zdjęcie: jeśli poniżej 1500px = nie nadaje się do druku A4. Poinformuj firmę.
Logo: wektor (AI/SVG/EPS/PDF). Jeśli mają tylko JPG — użyj Vectorizer.ai lub poprosić o lepszy plik.
Branding: kolory (kody HEX + Pantone jeśli znają), fonty. Jeśli firma nie ma brand guide — wyciągnij kolory ze strony www (ColorZilla) i zaproponuj paletaę.
Struktura: ustal spis treści/stron ZANIM zaczniesz projekt. Np.: Okładka (1) → O firmie (2–3) → Produkty (4–11) → Cennik (12–13) → Realizacje (14–15) → Kontakt (16).
Format i oprawa: A4 pionowy (standard), A5 (broszura), kwadrat (premium). Oprawa: zszywki (do 48 stron), klej (grubsze), spirala (instrukcje/cenniki).
Drukarnia: jeśli firma ma preferowaną — sprawdź specyfikację techniczną PRZED projektem (spady, format pliku, profil koloru). Większość polskich drukarni: PDF/X-1a lub PDF/X-4, CMYK, 300 DPI, spady 3mm.
Krok 2: Propozycja layoutu (~2–4h)
Zaprojektuj 1–2 koncepcje wizualne — OKŁADKA + 2–3 przykładowe strony wnętrza (np. strona produktowa + strona „O firmie” + strona z cennikiem).
Grid: ustal siatkę (2, 3 lub 4 kolumny). Cały katalog na JEDNYM gridzie — spójność.
Marginesy: wewnętrzny (przy grzbiecie) WIĘKSZY niż zewnętrzny — minimum 15mm. Przy zszywkach/klejeniu tekst przy grzbiecie jest nieczytelny jeśli margines za mały.
Typografia: max 2–3 fonty. Nagłówek (display) + tekst główny (body) + ewentualnie accent. Nie mieszaj więcej.
Hierarchia: nagłówki > podtytuły > tekst > podpisy. Każdy poziom wizualnie oddzielony (rozmiar, grubość, kolor).
Zdjęcia: full-bleed (na całą stronę) + kadrowane + wyłączone w ramki. Minimum 2 style w całym katalogu.
Numeracja stron: zawsze. Minimalna, dyskretna, spójna.
ZASADA: NIGDY nie zaczynaj składać całego katalogu bez zaakceptowanego layoutu. Firma musi zobaczyć styl ZANIM ukłożysz 16–24 stron.
Krok 3: Skład DTP (~8–28h zależnie od pakietu)
Składasz cały katalog w zaakceptowanym stylu. Strona po stronie.
Pracuj na SZABLONACH STRON (master pages / strony wzorcowe): strona produktowa, strona wizerunkowa, strona cennikowa. Nie projektuj każdej strony od zera.
Zdjęcia: ZAWSZE w trybie CMYK jeśli do druku. RGB wygląda inaczej po wydrukowaniu (kolory są bledsze). Konwertuj w Photoshopie lub użyj profilu drukarni.
Spady (bleed): 3mm z każdej strony. Każdy element który dochodzi do krawędzi strony MUSI wystać 3mm poza nią. Inaczej drukarnia odrzuci plik.
Rozdzielczość: 300 DPI minimum dla druku. 72 DPI = tylko ekran. Sprawdź KAŻDE zdjęcie.
Fonty: osadzaj (embed) lub zamień na krzywe (outline). Drukarnia nie ma Twoich fontów — jeśli nie osadzisz, tekst się zmieni.
Linie cięcia (crop marks): dodaj przy eksporcie. Drukarnia ich potrzebuje.
Spójność: kolory, fonty, odstępy, styl zdjęć IDENTYCZNE na każdej stronie. Katalog to NIE kolaż.
Krok 4: Eksport i finalizacja (~1–2h)
Przygotuj DWA pliki PDF:
PDF do druku: PDF/X-1a lub PDF/X-4, CMYK, 300 DPI, spady 3mm, linie cięcia, osadzone fonty. Rozmiar strony = format + spady (np. A4 = 216 × 303 mm z spadami).
PDF cyfrowy: RGB, 72–150 DPI (mniejszy plik), bez spadów, z klikalnymi linkami (email, www, telefon). Format strony = docelowy (210 × 297 mm).
Narzędzia
7 zasad dobrego katalogu firmowego
1. Layout PRZED składem. Firma akceptuje styl (okładka + 2–3 strony wnętrza) ZANIM złożysz całość. Inaczej „zmień wszystko” po 16 stronach = katastrofa.
2. Grid = spójność. Cały katalog na jednej siatce (2/3/4 kolumny). Różne układy na różnych stronach, ale zawsze w ramach tego samego gridu.
3. Master pages oszczędzają godziny. Zrób 3–4 szablony stron (produktowa, wizerunkowa, cennikowa, pełna zdjęcie). Układaj treści w szablonach, nie projektuj każdej strony od zera.
4. CMYK od początku. Jeśli do druku — pracuj w CMYK od pierwszego dnia. Konwersja RGB→CMYK na końcu = „dlaczego kolory są inne niż na ekranie?”.
5. Mniej tekstu > więcej whitespace. Katalog to nie esej. Krótkie hasła, bullet pointy, infografiki. Biała przestrzeń = profesjonalizm. Tłok = bazar.
6. Zdjęcia robią 80% roboty. Jedno dobre zdjęcie > 100 słów opisu. Retuszuj, kadruj, dbaj o spójną estetykę. Złe zdjęcia = zły katalog, nawet z świetnym układem.
7. Preflight PRZED eksportem. Sprawdź: rozdzielczość zdjęć (≥300 DPI), tryb kolorów (CMYK), fonty osadzone, spady 3mm, linie cięcia. InDesign: Window → Output → Preflight. To ratuje przed odrzuceniem przez drukarnię.
Najczęstsze problemy
Firma nie dostarcza treści („wstaw coś”). Nie piszesz za firmę. Wyślij komunikat: „Potrzebuję kompletnych tekstów do każdej strony — bez nich nie mogę układać katalogu. Mogę polecić usługę copywritingu.”
Zdjęcia mają za małą rozdzielczość. „Zdjęcie ma 600px — w druku A4 będzie rozmazane. Potrzebuję minimum 2000px. Czy masz większą wersję? Jeśli nie — użyję zdjęcia stockowego lub zmniejszę je na stronie.”
Firma chce „więcej tekstu na stronie”. „W katalogu krótkie teksty i dużo białej przestrzeni działają lepiej. Dłuższe opisy rekomenduję przenieść na stronę www lub dołączyć jako załącznik.”
Drukarnia odrzuca plik. Checklist: PDF/X-1a lub X-4, CMYK (nie RGB!), 300 DPI (nie 72!), spady 3mm, fonty osadzone, linie cięcia. Zadzwoń do drukarni PRZED eksportem i zapytaj o specyfikację.
Firma zmienia treści po zatwierdzeniu layoutu. „Pakiet obejmuje X rund poprawek. Zmiana treści po zatwierdzeniu layoutu to dodatkowa praca: +59 PLN/strona której zmiana dotyczy.” Uprzedź NA POCZĄTKU.
Katalog wygląda jak „PowerPoint” (amatorsko). Unikaj: za dużo fontów, za dużo kolorów, za mało whitespace, niespójne zdjęcia, brak gridu. Mniej = więcej. Inspiruj się katalogami IKE',
  699, 1499,
  '[{"name": "S", "label": "Pakiet S", "price": 699, "delivery_time_days": 12, "scope": ""}, {"name": "M", "label": "Pakiet M", "price": 1099, "delivery_time_days": 22, "scope": ""}, {"name": "L", "label": "Pakiet L", "price": 1499, "delivery_time_days": 32, "scope": ""}]'::jsonb, 7, 'Design',
  false, 0.25, true, 'platform_service', 'active', NULL
);

-- #20: Pełna identyfikacja wizualna — księga znaku i system marki
INSERT INTO public.service_packages (
  title, description, locked_content, price, price_max,
  variants, delivery_time_days, category,
  requires_nda, commission_rate, is_system, type, status, student_id
) VALUES (
  'Pełna identyfikacja wizualna — księga znaku i system marki',
  'Pełna identyfikacja wizualna — księga znaku i system marki
Spójny system wizualny Twojej firmy — od logo po wizytówkę, od social media po prezentację
O co chodzi
Logo to dopiero początek. Firma która ma logo, ale nie ma systemu wizualnego, to jak człowiek w garniturze i klapkach — pierwsze wrażenie dobre, ale całość się nie składa.
Pełna identyfikacja wizualna to SYSTEM: jakie kolory używać (i jakich NIE), jakie fonty, jak umieszczać logo, jak wygląda wizytówka, papier firmowy, stopka email, profil na LinkedIn, prezentacja dla klienta. Wszystko spójne, profesjonalne, rozpoznawalne.
Student grafiki/brandingu stworzy Ci profesjonalną księgę znaku i zaprojektuje szablony materiałów firmowych. Dostajesz dokument PDF + pliki edytowalne (Figma/Canva/InDesign) — gotowe do użycia przez Ciebie, Twoich pracowników i każdego przyszłego grafika.
Czym to się różni od usługi #04 (Logo)?
Typowa ścieżka: firma zamawia #04 (logo) → po kilku miesiącach zamawia #20 (pełna identyfikacja). Lub: firma JUŻ MA logo i od razu zamawia #20.
Wybierz pakiet
Jak te ceny wyglądają na tle rynku
Student2Work: 2–3× taniej niż początkujący freelancer, 5–10× taniej niż agencja. Kompromis: brak strategii marki i warsztatów — ale pełen system wizualny który działa.
Co musisz dostarczyć
Logo — pliki wektorowe (AI, SVG, EPS lub PDF). Minimum: PNG na przezroczystym tle ≥ 2000px. BEZ logo nie zaczynamy.
Kolory marki — jeśli masz ustalone (kody HEX / Pantone). Jeśli nie — student zaproponuje paletaę na bazie logo.
Fonty — jeśli używasz konkretnych. Jeśli nie — student dobierze z Google Fonts (darmowe, legalne).
Opis firmy — branża, grupa docelowa, ton komunikacji (formalny/luźny), wartości marki. 5–10 zdań wystarczy.
Przykłady „podoba mi się” — 3–5 marek / stron które Ci się podobają wizualnie. Co dokładnie: kolory? układ? styl?
Lista materiałów — jakie szablony potrzebujesz? (wizytówka, papier firmowy, social media, prezentacja…)
Czego pakiety NIE obejmują
Projektu logo — ta usługa WYMAGA gotowego logo. Potrzebujesz logo? Patrz #04.
Strategii marki — brak warsztatów, person, pozycjonowania. To zakres agencji za 15 000+ PLN. Student projektuje SYSTEM WIZUALNY, nie strategię.
Copywritingu — student nie pisze tekstów na materiały (slogany, opisy). Patrz #06.
Wdrożenia — student przygotuje szablony, ale nie wdraża ich na stronie, w systemie CRM, ani w drukarni.
Druku — pliki PDF do druku są gotowe, ale druk zamawiasz sam.
Jak wygląda proces
Dzień 1–2: Brief: student zbiera logo, kolory, fonty, opisy, przykłady inspiracji, listę materiałów. Analizuje obecne użycie marki (strona, social media, materiały).
Dzień 3–4: Moodboard + propozycja systemu: student przygotowuje 1–2 koncepcje wizualne (paleta, fonty, styl, przykładowe mockupy). Firma wybiera kierunek.
Dzień 5–8 (S) / 5–12 (M) / 5–16 (L): Projektowanie: student tworzy księgę znaku, projektuje szablony materiałów, przygotowuje mockupy.
Dzień +2–3: Poprawki: firma sprawdza, student koryguje.
Dzień +1: Finalizacja: eksport PDF księgi + pliki edytowalne + assety. Paczka na Google Drive.',
  'Ta sekcja nie jest widoczna dla firmy-zleceniodawcy. Zawiera instrukcję realizacji, wynagrodzenie i wewnętrzne wskazówki.
Twoje wynagrodzenie
Najwyższe stawki absolutne w katalogu. Pakiet L = 1 499 PLN netto. A stawki godzinowe są świetne (31–53 PLN/h) — bo księga znaku to głównie „system” i „porządek”, nie projektowanie od zera.
Instrukcja realizacji — krok po kroku
Krok 1: Brief i analiza (~2–3h)
Zbierz logo we WSZYSTKICH formatach które firma ma. Często mają więcej niż myślą (projektant logo powinien był dostarczyć AI/SVG/EPS).
Sprawdź obecne użycie: strona www, social media, wizytówki, materiały. Zbierz 10–15 screenshotow. To pokaże co jest źle (niespójne kolory, złe użycie logo, mieszane fonty).
Ustal ton marki: formalny (kancelaria) vs luźny (startup) vs premium (jubiler). To wpływa na każdy wybór: kolory, fonty, styl zdjęć.
Przykłady inspiracji: poprosić firmę o 3–5 marek które im się podobają. Analiza: co dokładnie się podoba? Styl? Kolory? Minimalizm?
Krok 2: System kolorów (~1–2h)
Primary colors: wyciągnij z logo (1–2 kolory główne). Podaj WSZYSTKIE kody: HEX, RGB, CMYK, Pantone (najbliższy).
Secondary / accent: 1–2 kolory uzupełniające (kontrast do primary). Użyj Coolors.co lub Adobe Color.
Neutral / grayscale: biały, czarny, 3–4 odcienie szarości. Każda marka potrzebuje „cichych” kolorów do tła i tekstów.
Functional (pakiet L): success (zielony), warning (żółty), error (czerwony), info (niebieski). Dla firm z produktami cyfrowymi.
Każdy kolor: swatch + HEX + RGB + CMYK + Pantone (najbliższy). Tabela w księdze.
Krok 3: Typografia (~1–2h)
Heading font: wyrazisty, rozpoznawalny. Może być bold, display. Używany w nagłówkach, hasłach.
Body font: czytelny, neutralny. Używany w długich tekstach, opisach, emailach.
Accent font (opcjonalnie): do cytatów, CTA, wyróżnień. Max 3 fonty w całym systemie.
Hierarchia: H1 (36–48px) > H2 (24–32px) > H3 (18–24px) > Body (16px) > Small (14px) > Caption (12px). Podaj wagi (Regular, Medium, Bold).
Google Fonts: darmowe, legalne, działają wszędzie. Inter, Manrope, DM Sans, Poppins, Playfair Display — bezpieczne wybory.
Krok 4: Warianty logo i zasady użycia (~2–4h)
Warianty: pełny kolor, monochromatyczny (czarny), negatyw (biały), na jasnym tle, na ciemnym tle, mini-wersja (favicon/app icon).
Pole ochronne: minimalna przestrzeń wokół logo gdzie NIC się nie pojawia. Standard: ½ wysokości logo z każdej strony.
Minimalny rozmiar: poniżej jakiego rozmiaru logo jest nieczytelne? Podaj w px (ekran) i mm (druk).
Błędne użycia (DO NOT): NIE rozciągaj, NIE zmieniaj kolorów, NIE dodawaj cieni, NIE obracaj, NIE umieszczaj na zajętym tle. Pokaż 6–8 przykładów z czerwonym X.
Tła: na jakich tłach logo działa (białe, czarne, kolorowe, zdjęcie). Na jakich NIE działa.
Krok 5: Szablony materiałów (~4–16h zależnie od pakietu)
Projektuj w Figma lub Canva (edytowalne dla firmy). Każdy szablon = spójny z systemem wizualnym.
Wizytówka (wszystkie pakiety): dwustronna, 90×50mm + 3mm spady, 300 DPI, CMYK. Standard: front (logo + imię + stanowisko), back (dane kontaktowe + logo mini).
Stopka email (S): HTML lub grafika. Logo + dane + kolory marki. Max 600px szerokości.
Papier firmowy (M/L): A4, nagłówek (logo) + stopka (dane firmy, NIP, KRS). PDF + Word/Docs edytowalny.
Social media kit (M/L): avatar (okrągły), cover (Facebook + LinkedIn), szablon posta (1080×1080). W kolorach i fontach marki.
Prezentacja (L): szablon PPTX/Google Slides — okładka, spis treści, strona treściowa, strona z cytatem, strona kontaktowa. 5–7 master slajdów.
Teczka firmowa (L): A4, z nacięciem na wizytówkę. Projekt okładki.
Ulotka szablon (L): A5 lub DL, dwustronna. Szablon który firma może wypełnić własnymi treściami.
Krok 6: Mockupy (~2–4h)
Mockupy = logo i materiały nałożone na realistyczne zdjęcia. Pokazują firmie jak marka wygląda „w akcji”.
Użyj MockupWorld, Placeit, Smartmockups (darmowe / freemium).
Minimum: wizytówka na biurku, logo na ekranie laptopa, logo na koszulce/kubku.
Pakiet M: + social media na telefonie, papeteria na biurku, szyld na budynku.
Pakiet L: + samochód firmowy, opakowanie, roll-up, outdoor billboard, strona www na monitorze.
Spójność: wszystkie mockupy w JEDNYM stylu (jasne, czyste, minimalistyczne). Nie mieszaj stylów.
Struktura księgi znaku (szablon)
Kolejność stron w dokumencie PDF:
Okładka: nazwa marki + „Księga znaku” / „Brand Guidelines” + rok
Spis treści
O marce: 1 strona — krótko: kto, co, dla kogo, jakie wartości (tekst od firmy!)
Logo: warianty, konstrukcja, pole ochronne, minimalny rozmiar, błędne użycia, użycie na tłach
Kolory: pełna paleta z kodami (HEX, RGB, CMYK, Pantone), proporcje użycia
Typografia: fonty, hierarchia, rozmiary, przykłady zastosowań
Elementy graficzne (M/L): pattern, ikony, styl zdjęć
Materiały firmowe: wizytówka, papier firmowy, stopka, social media, prezentacja…
Mockupy: marka w akcji
Zasady i instrukcje: DOs and DON’Ts — jak używać, jak NIE używać
Najczęstsze problemy
Firma nie ma logo w wektorze („mam tylko JPG”). Poprosić o kontakt z projektantem logo. Jeśli brak — użyj Vectorizer.ai do konwersji (jakość zależy od złożoności). Uprzedź: „wektoryzacja automatyczna może nie być idealna”.
Firma chce „nowe logo” w ramach tej usługi. „Ta usługa obejmuje system wizualny dla ISTNIEJĄCEGO logo. Nowe logo to usługa #04 (699 PLN). Możemy zamówić oba.”
Firma nie wie czego chce („zrób ładnie”). Moodboard ratuje życie. Pokaż 2 skrajne kierunki: minimalistyczny vs ekspresyjny, jasny vs ciemny. Firma WYBIERA — nie projektuje.
Księga wygląda jak „praca zaliczeniowa”. ZERO teorii. Żadnych definicji „co to identyfikacja wizualna”. Każda strona = konkretna informacja. Profesjonalny układ: dużo whitespace, mało tekstu, dużo wizualizacji.
Firma zmienia zdanie po zatwierdzeniu systemu kolorów. „Zmiana kolorów na tym etapie oznacza przeprojektowanie wszystkich materiałów. To dodatkowa runda poprawek.” Dlatego: moodboard → akceptacja → dopiero potem projektowanie.
Checklist końcowy
Brief zaakceptowany — logo, kolory, fonty, ton, przykłady zebrane
Moodboard z',
  999, 1999,
  '[{"name": "S", "label": "Pakiet S", "price": 999, "delivery_time_days": 14, "scope": "—"}, {"name": "M", "label": "Pakiet M", "price": 1499, "delivery_time_days": 24, "scope": "✔ pattern / textura + styl zdjęć"}, {"name": "L", "label": "Pakiet L", "price": 1999, "delivery_time_days": 36, "scope": "✔ pattern + ikonografia autorska + styl ilustracji"}]'::jsonb, 10, 'Design',
  false, 0.25, true, 'platform_service', 'active', NULL
);

-- #21: Raport analityczny z danych firmowych
INSERT INTO public.service_packages (
  title, description, locked_content, price, price_max,
  variants, delivery_time_days, category,
  requires_nda, commission_rate, is_system, type, status, student_id
) VALUES (
  'Raport analityczny z danych firmowych',
  'Raport analityczny z danych firmowych
Twoje dane zamienione w czytelne wykresy, wnioski i rekomendacje biznesowe
 Bezpieczeństwo Twoich danych
Rozumiemy, że dane firmowe są wrażliwe. Dlatego każde zlecenie analityczne jest chronione wielopoziomowym systemem bezpieczeństwa:
1. Umowa NDA (obowiązkowa) Każdy student podpisuje Umowę o Zachowaniu Poufności PRZED otrzymaniem jakichkolwiek danych. Kara umowna za naruszenie: 10 000 PLN. Szablon NDA dostarczamy — firma nie musi pisać własnego.
2. Anonimizacja danych (wymagana) Firma USUWA dane osobowe (imiona, nazwiska, emaile, telefony, PESEL, NIP osób fizycznych) ZANIM wyśle dane studentowi. Student pracuje na: "Klient #001", "Klient #002" — nie na prawdziwych danych. Dostarczamy checklistę anonimizacji.
3. Minimalny zakres danych Student dostaje TYLKO te kolumny które są niezbędne do analizy. Przykład: do analizy sprzedaży potrzebne są: data, produkt, ilość, wartość, region. NIE potrzebne: imię klienta, adres, NIP.
4. Bezpieczny transfer Pliki wyłącznie przez platformę Student2Work lub Google Drive z ograniczonym dostępem. Nigdy przez email ani WeTransfer.
5. Kasowanie po zakończeniu Po oddaniu raportu student MA OBOWIĄZEK skasować WSZYSTKIE dane źródłowe firmy. Potwierdzenie kasowania — oświadczenie na platformie.
To standard rynkowy — tak samo działa każda firma konsultingowa i agencja analityczna. Różnica: u nas jest to wbudowane w proces, nie opcjonalne.
O co chodzi
Masz dane. Dużo danych. W Excelach, w CRM, w Google Analytics, w systemie sprzedażowym. Problem: nikt ich nie analizuje. Leżą w plikach i nikt nie wie co z nich wynika.
Student analityki biznesowej weźmie Twoje dane, oczyści je, uporządkuje, zwizualizuje i — co najważniejsze — wyciągnie WNIOSKI. Nie dostaniesz tabelki z liczbami. Dostaniesz raport z wykresami, trendami, anomaliami i konkretnymi rekomendacjami biznesowymi.
Co można analizować
Sprzedaż: trendy miesięczne/kwartalne, TOP/FLOP produkty, sezonowość, średnia wartość zamówienia, segmentacja klientów, konwersja
Marketing: efektywność kampanii, koszt pozyskania klienta (CAC), ROI kanałów, źródła ruchu, konwersja landing page, open rate maili
Operacje: czas realizacji zamówień, reklamacje wg kategorii, obciążenie zespołu, produktywność, koszty operacyjne vs przychody
HR (zanonimizowane): rotacja pracowników, absencje wg działów, czas rekrutacji, koszty szkoleń vs retencja
Finanse: przepływy pieniężne (cash flow), struktura kosztów, marżowość produktów/usług, prognoza przychodów
E-commerce: koszyk, porzucenia, ścieżki zakupowe, LTV klienta, kohorty, retencja
Wybierz pakiet
Jak te ceny wyglądają na tle rynku
Student2Work: 2–5× taniej niż freelancer analityk, 8–30× taniej niż firma badawcza. Kompromis: brak badań pierwotnych (ankiety, wywiady) — ale pełna analiza DANYCH KTÓRE JUŻ MASZ.
Co musisz dostarczyć
Dane w formacie Excel (.xlsx), CSV lub eksport z systemu (CRM, ERP, Google Analytics, Meta Ads, etc.)
Opis danych — co oznaczają kolumny, za jaki okres, skąd pochodzą
Cel analizy — co chcesz się dowiedzieć? Jakie pytania biznesowe Cię nurtują?
Kontekst — branża, wielkość firmy, co się zmieniło ostatnio (nowy produkt, zmiana cen, kampania)
ANONIMIZACJA — PRZED wysłaniem USUŃ dane osobowe klientów (imiona, emaile, telefony, PESEL). Dostarczamy checklistę.
Nie masz danych w Excelu? Student może pomóc z eksportem z Google Analytics, Meta Ads, Shopify — jeśli dasz dostęp (przez dedykowane konto z ograniczonymi uprawnieniami).
Czego pakiety NIE obejmują
Zbierania danych pierwotnych — student analizuje dane KTÓRE JUŻ MASZ. Nie przeprowadza ankiet, wywiadów, badań rynkowych.
Wdrażania rekomendacji — raport mówi CO zrobić. Wdrożenie (zmiana cen, kampania, reorganizacja) to po Twojej stronie.
Zaawansowanego modelowania — brak machine learning, predykcji statystycznych, modeli ekonometrycznych. To zakres data science za 5 000+ PLN.
Stałego monitoringu — to jednorazowy raport, nie ciągła usługa. Chcesz dashboard na stałe? Patrz #15.
Audytu systemów IT — student analizuje DA',
  'Ta sekcja nie jest widoczna dla firmy-zleceniodawcy. Zawiera instrukcję realizacji, wynagrodzenie i wewnętrzne wskazówki.
Twoje wynagrodzenie
 BEZPIECZEŃSTWO DANYCH — OBOWIĄZKOWE
PRZECZYTAJ TO ZANIM ZACZNIESZ. Naruszenie = ban z platformy + kara 10 000 PLN z NDA.
PODPISZ NDA zanim dostaniesz jakiekolwiek dane. Platforma generuje NDA automatycznie — podpisujesz elektronicznie.
NIGDY nie kopiuj danych na pendrive, dysk zewnętrzny, chmurę osobistą (Google Drive prywatny, Dropbox). Pracuj TYLKO na komputerze lokalnie lub na dedykowanym folderze platformy.
NIGDY nie udostępniaj danych nikomu — współlokatorowi, koledze ze studiów, nikomu. Dane są WYŁĄCZNIE Twoje na czas zlecenia.
NIGDY nie używaj danych w portfolio, pracy dyplomowej, prezentacji uczelnianej. Nawet zanonimizowanych. Chyba że firma pisemnie wyrazi zgodę.
Po oddaniu raportu: SKASUJ WSZYSTKIE pliki źródłowe (Excel, CSV, kopie robocze). Opróżnij kosz. Potwierdź kasowanie na platformie.
Jeśli zauważysz w danych informacje osobowe które firma ZAPOMNIAŁA zanonimizować — NATYCHMIAST poinformuj firmę i platformę. Nie analizuj tych danych.
Checklista anonimizacji — wyślij firmie PRZED transferem danych
Firma musi usunąć lub zamienić na identyfikatory (Klient #001, Pracownik #A) następujące dane:
Imiona i nazwiska (klientów, pracowników, kontrahentów)
Adresy email
Numery telefonów
Adresy zamieszkania / dostawy (można zostawić miasto/województwo)
PESEL, NIP osób fizycznych, numery dowodów
Numery kont bankowych
Dane medyczne, wyznaniowe, polityczne
CO MOŻNA zostawić: daty, kwoty, nazwy produktów, kategorie, regiony, statusy, ilości. To nie są dane osobowe.
Instrukcja realizacji — krok po kroku
Krok 1: Brief + NDA (~1h)
Podpisz NDA (platforma generuje automatycznie).
Zapytaj firmę: Jaki jest cel analizy? Jakie pytania biznesowe? Co się zmieniło ostatnio? Kto będzie czytał raport?
Ustal: jakie dane firma ma (Excel, CRM eksport, GA4, Meta Ads), za jaki okres, w jakim formacie.
Wyślij checklistę anonimizacji.
Krok 2: Odbiór i walidacja danych (~1–2h)
Sprawdź kompletność: czy są wszystkie kolumny? Czy okres się zgadza? Czy format jest czytelny?
Sprawdź anonimizację: czy usunięto dane osobowe? Jeśli nie — STOP. Poinformuj firmę.
Policz: ile wierszy, ile kolumn, ile braków (null/puste). To określa złożoność.
Jeśli dane są niekompletne lub nieczytelne — napisz DO FIRMY konkretnie czego brakuje. Nie zgaduj.
Krok 3: Czyszczenie danych (~2–6h zależnie od pakietu)
Duplikaty: usuń identyczne wiersze. Sprawdź „prawie-duplikaty” (ta sama transakcja, różna data o 1 dzień).
Braki (null/puste): policz ile, w których kolumnach. Decyzja: usuń wiersz / wstaw średnią / zostaw i oznacz. NIGDY nie wstawiaj zmyslonych danych.
Formaty: daty do jednego formatu (RRRR-MM-DD), kwoty do jednej waluty i formatu (1234.56), kategorii do spójnych nazw („Warszawa” = „warszawa” = „Wwa”).
Outliery: zidentyfikuj ekstremalnie odstające wartości. Zamówienie za 1 PLN lub 999 999 PLN — błąd czy realny? Zapytaj firmę.
Pakiet M/L: łączenie zbiorów (JOIN) — po wspólnym kluczu (ID produktu, data, kategoria). Sprawdź czy klucze się pokrywają.
Krok 4: Analiza (~3–10h zależnie od pakietu)
Statystyki opisowe: średnia, mediana, odchylenie standardowe, min/max, percentyle. Dla KAŻDEGO kluczowego wskaźnika.
Trendy czasowe: miesiąc do miesiąca, kwartał do kwartału, rok do roku. Czy rośnie? Spada? Stagnacja?
Segmentacja: pogrupuj dane (produkty, regiony, typy klientów). Który segment rośnie najszybciej? Który spada?
Anomalie: co się wybiło? Nagle wzrost/spadek — kiedy, dlaczego? Spójne z kontekstem od firmy?
Korelacje (M/L): czy marketing wpływa na sprzedaż? Czy cena wpływa na ilość? Scatter ploty + korelacja Pearsona.
TOP/FLOP: 10 najlepszych i 10 najgorszych (produktów, klientów, kanałów, regionów). Pareto: czy 20% produktów generuje 80% przychodu?
Krok 5: Wizualizacja (~2–5h)
Wykresy dobieraj do TYPU danych: liniowy = trend w czasie, słupkowy = porównanie kategorii, kołowy = udziały (max 5–7 kategorii!), scatter = korelacja, waterfall = rozkład zmian.
ZASADA: 1 wykres = 1 insight. Jeśli wykres nie mówi nic nowego — usuń go.
Kolory: spójne z marką firmy (jeśli znasz). Jeśli nie — paleta neutralna (niebieski/szary + 1 accent color).
Etykiety: ZAWSZE opis osi, tytuł wykresu, jednostki (PLN, szt., %). Bez etykiet wykres jest bezwartościowy.
Dashboard Excel (M/L): pivot tables + slicery (filtry klikalne) + wykresy dynamiczne. Firma może sama filtrować i eksplorować.
Krok 6: Raport PDF (~2–4h)
Struktura raportu:
Strona tytułowa: nazwa firmy, tytuł raportu, data, „Przygotowano przez Student2Work”
Executive Summary (1 strona): 3–5 NAJWAŻNIEJSZYCH wniosków. Dyrektor czyta TYLKO to. Musi być KONKRETNE: „Sprzedaż spadła o 12% w Q3, głównie przez produkt X w regionie Y”
Metodologia (0.5 strony): jakie dane, za jaki okres, co oczyszczono, jakie założenia
Analiza szczegółowa (5–20 stron): każda sekcja = wykres + opis + wniosek. NIE: „Wykres 1 pokazuje sprzedaż”. TAK: „Sprzedaż rosła stabilnie +5%/mies do czerwca, po czym spadła o 18% w lipcu — korelacja z końcem kampanii Facebook”
Rekomendacje (1–3 strony): co firma POWINNA zrobić na podstawie danych. Priorytetyzowane: pilne / ważne / opcjonalne. Każda rekomendacja: co, dlaczego, oczekiwany efekt
Załączniki: tabele surowe, dodatkowe wykresy, słownik wskaźników
ZASADA RAPORTU: Pisz dla DYREKTORA który ma 5 minut. Nie dla profesora na uczelni. Zero teorii, zero definicji, same konkrety i wnioski.
Krok 7: Finalizacja + kasowanie danych (~0.5h)
Oddaj: raport PDF, dashboard Excel (M/L), prezentacja PPTX (L), plik z oczyszczonymi danymi.
SKASUJ: wszystkie pliki źródłowe, kopie robocze, dane na dysku. Opróżnij kosz.
POTWIERDŹ kasowanie na platformie (checkbox + data).
Wiadomość podsumowująca na platformie: co dostarczono, kluczowe wnioski, potwierdzenie kasowania danych.
Narzędzia
Excel / Google Sheets podstawa — pivot tables, wykresy, formuły (VLOOKUP, INDEX/MATCH, SUMIFS). 90% zleceń ogarniasz w Excelu.
Python (pandas + matplotlib/seaborn) zaawansowane czyszcze',
  699, 1499,
  '[{"name": "S", "label": "Pakiet S", "price": 699, "delivery_time_days": 12, "scope": ""}, {"name": "M", "label": "Pakiet M", "price": 1099, "delivery_time_days": 22, "scope": ""}, {"name": "L", "label": "Pakiet L", "price": 1499, "delivery_time_days": 34, "scope": ""}]'::jsonb, 7, 'Analiza danych',
  true, 0.25, true, 'platform_service', 'active', NULL
);

-- #22: Setup email marketingu — konfiguracja + szablony + automatyz
INSERT INTO public.service_packages (
  title, description, locked_content, price, price_max,
  variants, delivery_time_days, category,
  requires_nda, commission_rate, is_system, type, status, student_id
) VALUES (
  'Setup email marketingu — konfiguracja + szablony + automatyzacja',
  'Setup email marketingu — konfiguracja + szablony + automatyzacja
Gotowy system do wysyłki newsletterów i sekwencji email — od zera do pierwszej kampanii
O co chodzi
Masz bazę klientów (lub potencjalnych), ale nie wysyłasz im nic. Albo wysyłasz „ręcznie” z Gmaila. Albo założyłeś konto w Mailchimp pół roku temu i nie wysłałeś ani jednego maila.
Student marketingu skonfiguruje Ci profesjonalne narzędzie do email marketingu (MailerLite lub Mailchimp), zaprojektuje szablony maili w kolorach Twojej marki, stworzy sekwencje automatyczne (welcome, oferta, follow-up) i wyśle pierwszą kampanię. Dostajesz DZIAŁAJĄCY system — nie instrukcję „jak to zrobić”.
Email marketing ma średni ROI 36:1 (36 PLN przychodu na każdą 1 PLN wydatków). Żaden inny kanał marketingowy nie jest tak efektywny.
Wybierz pakiet
Jak te ceny wyglądają na tle rynku
Student2Work: 2–4× taniej niż freelancer, 4–8× taniej niż agencja. Kompromis: jednorazowy setup, nie ciągła obsługa. Ale firma dostaje DZIAŁAJĄCY system i instrukcję jak go używać samodzielnie.
Narzędzie (MailerLite Free): 500 subskrybentów, 12 000 maili/mies. — DARMOWE. Firma nie płaci za narzędzie. Płaci tylko za nasz setup.
Co musisz dostarczyć
Logo + kolory marki — żeby szablony były spójne z Twoją marką
Baza kontaktów — Excel/CSV z emailami (imię + email minimum). ZGODA RODO — kontakty muszą być zebrane legalnie (opt-in)!
Dostęp do domeny — żeby skonfigurować SPF/DKIM (wysyłka z Twojej domeny, nie z @gmail.com)
Treści — o czym chcesz pisać? Jakie produkty/usługi promować? Jakie aktualności? Student NIE pisze treści za Ciebie (patrz #06).
Cel — sprzedaż? Budowanie relacji? Informowanie? Edukacja? To wpływa na typ sekwencji i szablonów.
Czego pakiety NIE obejmują
Pisania treści/copywritingu — student konfiguruje SYSTEM i tworzy SZABLONY. Treści (teksty newsletterów) pisze firma lub zamawiasz #06.
Stałej obsługi — to jednorazowy setup. Student NIE wysyła co tydzień newsletterów. Dostajesz instrukcję jak to robić samodzielnie.
Budowania bazy od zera — student NIE zbiera adresów email. Pozyskiwanie leadów to osobny proces (reklamy, strona, social media).
Zaawansowanego marketing automation — brak integracji z CRM, lead scoringu AI, dynamic content zaawansowanego. To zakres agencji za 5 000+ PLN/mies.
Kampanii SMS — tylko email. SMS to osobna usługa.
Jak wygląda proces
Dzień 1–2: Brief: student zbiera logo, kolory, bazę kontaktów, cel, przykłady newsletterów które się podobają. Ustala dostęp do domeny (DNS).
Dzień 2–3: Konfiguracja konta: założenie MailerLite/Mailchimp, weryfikacja domeny (SPF/DKIM), import i czyszczenie bazy, segmentacja (M/L).
Dzień 3–5 (S) / 3–8 (M) / 3–12 (L): Projektowanie szablonów + automatyzacji: szablony w kolorach marki, formularze zapisu, sekwencje automatyczne.
Dzień +1–2: Pierwsza kampania: student przygotowuje i wysyła testowy newsletter (+ test A/B w pakiecie L).
Dzień +1–2: Poprawki + instrukcja: firma sprawdza, student koryguje, dostarcza instrukcję obsługi (PDF + screencast M/L).',
  'Ta sekcja nie jest widoczna dla firmy-zleceniodawcy.
Twoje wynagrodzenie
Instrukcja realizacji — krok po kroku
Krok 1: Konfiguracja konta (~2–3h)
Załóż konto MailerLite (rekomendowane — lepszy darmowy plan) lub Mailchimp (jeśli firma preferuje). Konto na EMAIL FIRMOWY, nie Twój.
Domena wysyłki: skonfiguruj SPF i DKIM w DNS domeny firmy. Bez tego maile lądują w spamie. Potrzebujesz dostępu do panelu DNS (np. nazwa.pl, OVH, Cloudflare).
SPF: dodaj rekord TXT: v=spf1 include:mlsend.com ~all (MailerLite) lub v=spf1 include:servers.mcsv.net ~all (Mailchimp).
DKIM: MailerLite/Mailchimp generuje klucz DKIM — dodaj go jako rekord CNAME w DNS.
Logo + stopka: wgraj logo, ustaw kolory marki, skonfiguruj stopkę (adres firmy + RODO link do rezygnacji).
Wysłij email testowy do siebie — sprawdź czy NIE ląduje w spamie. Jeśli tak — sprawdź SPF/DKIM.
Krok 2: Import i segmentacja bazy (~1–2h)
Import CSV/Excel: imię + email minimum. Jeśli firma ma więcej (firma, stanowisko, data zakupu) — importuj TEŻ.
CZYSZCZENIE: usuń duplikaty, puste emaile, nieprawidłowe formaty. Użyj MailerLite clean-up lub narzędzia jak NeverBounce (darmowy tier).
RODO: upewnij się że firma MA ZGODĘ na wysyłkę (opt-in). Jeśli nie — STOP. Wysyłka bez zgody = naruszenie RODO = kary.
Segmentacja (M/L): podziel bazę na grupy: klienci aktywni / leady / VIP / nieaktywni / nowi. Tagi: źródło pozyskania, kategoria produktów, data ostatniego zakupu.
Krok 3: Szablony emaili (~3–8h zależnie od pakietu)
Użyj drag-and-drop edytora MailerLite/Mailchimp. NIE projektuj w Figmie i konwertuj na HTML — to nie działa responsywnie.
Każdy szablon: logo na górze, kolory marki, czytelna typografia, 1 główny CTA (przycisk), stopka z danymi firmy i linkiem rezygnacji.
Mobile-first: 60%+ osób czyta maile na telefonie. Testuj KAŻDY szablon na mobile preview.
Szablon newsletter: nagłówek + hero image + 2–3 sekcje treściowe + CTA + stopka.
Szablon oferta: krótki headline + oferta + cena/rabat + CTA „Zamów teraz”.
Szablon informacyjny: minimalistyczny, tekst-heavy, bez nadmiaru grafik (lepsza deliverability).
Pakiet M/L dodatkowe: zaproszenie na event, follow-up po zakupie, rekomendacja produktów, reaktywacja, porzucony koszyk, ankieta satysfakcji, email urodzinowy.
ZASADA: Każdy email ma JEDEN cel i JEDEN przycisk CTA. Newsletter z 10 linkami = żaden nie zostanie kliknięty.
Krok 4: Formularze zapisu (~1–2h)
Embed form: formularz zapisu na stronę www (HTML embed lub plugin WordPress). Minimum: imię + email.
Pop-up (M/L): wyświetla się po X sekundach lub przy zamykaniu strony (exit intent). Lead magnet: „Pobierz darmowego e-booka”, „10% zniżki na pierwszy zakup”.
Landing page zapisu (L): osobna strona w MailerLite — headline + opis wartości + formularz. Link do udostępniania na social media.
Double opt-in: WŁĄCZ. Subskrybent musi potwierdzić email. RODO wymaga. Dostój email potwierdzający (subject, treść, przycisk).
Krok 5: Sekwencje automatyczne (~2–8h)
Sekwencja = seria maili wysyłanych automatycznie po wyzwalaczu (trigger). Student konfiguruje w automation builder.
Welcome (wszystkie pakiety): Trigger: nowy subskrybent. Mail 1 (natychmiast): „Dziękujemy za zapis! Oto co u nas znajdziesz”. Mail 2 (dzień 2): „Nasz TOP produkt/usługa”. Mail 3 (dzień 5): „Specjalna oferta na start”.
Oferta/Onboarding (M/L): Trigger: zakup lub rejestracja. Mail 1: potwierdzenie + co dalej. Mail 2: tip/porada. Mail 3: polecenie dodatkowego produktu. Mail 4: prośba o opinię.
Reaktywacja (L): Trigger: brak otwarcia >90 dni. Mail 1: „Tęsknimy!”. Mail 2: specjalna oferta. Mail 3: „Ostatnia szansa — czy chcesz pozostać na liście?” (czyszczenie bazy).
Porzucony koszyk (L): Trigger: dodanie do koszyka bez zakupu (wymaga integracji e-commerce). Mail 1 (1h): przypomnienie. Mail 2 (24h): rabat 5–10%. Mail 3 (72h): ostatnie przypomnienie.
Krok 6: Pierwsza kampania + test A/B (~1–2h)
Przygotuj pierwszy PRAWDZIWY newsletter: realna treść (nie „test”), realny temat, realne CTA.
Wysłij do siebie i firmy jako test. Sprawdź: mobile, desktop, Gmail, Outlook, spam score.
Po akceptacji firmy: wysłij do całej bazy (lub segmentu).
Test A/B (pakiet L): 2 warianty tematu emaila. 20% bazy dostaje wariant A, 20% wariant B, 60% dostaje zwycięzcę (wyższy open rate).
Po wysyłce: raport (open rate, click rate, unsubscribes). Komentarz: „Open rate 28% to dobry wynik; średnia branżowa to 20–25%”.
Krok 7: Instrukcja obsługi + przekazanie (~1–2h)
PDF instrukcja: jak wysłać nowy newsletter (krok po kroku ze screenshotami), jak edytować szablon, jak sprawdzić statystyki, jak dodać nowego subskrybenta.
Screencast (M/L): nagranie ekranu 15–20 min — „Pokażę Ci jak wysyłasz newsletter w 10 minut”. Loom lub Google Meet recording.
Videocall szkoleniowy (L): 1h na żywo — firma zadaje pytania, student pokazuje na żywo.
Przekazanie konta: firma ma pełny dostęp (Owner). Student usunie swój dostęp po zakończeniu zlecenia.
Narzędzia
MailerLite (rekomendowane) Darmowy plan: 500 sub, 12 000 maili/mies. Interfejs PL. Drag-and-drop builder. Automatyzacje. Najlepszy stosunek jakość/cena.
Mailchimp Darmowy plan: 500 sub, 1 000 maili/mies (gorszy). Znany brand. Bardziej zaawansowany, ale droższy i mniej intuicyjny.
GetResponse (alternatywa PL) Polska firma. Darmowy plan: 500 sub, 2 500 maili/mies. Webinary + landing pages + AI. Dobra alternatywa jeśli firma preferuje polskie narzędzie.
Canva Grafiki do newsletterów (hero images, banery). Darmowe szablony email-friendly.
Mail Tester (mail-tester.com) Bezpłatny test spam score — wysyłasz testowy email i dostajesz ocenę 0–10. Cel: 8+/10.
Najczęstsze problemy
Firma nie ma dostępu do DNS („nie wiem co to SPF”). Zapytaj: „Kto zarządza Twoją domeną? nazwa.pl? OVH? Poprosić ich o dostęp do panelu DNS.” Jeśli firma nie może — alternatywa: wysyłka z subdomeny MailerLite (gorsza deliverability, ale działa).
Baza kontaktów nie ma zgody RODO. STOP. Nie wysyłaj do bazy bez opt-in. Zaproponuj: „Możemy wysłać kampanię reaktywacyjną z prośbą o potwierdzenie zgody. Kto nie potwierdzi — usuwamy z bazy.”
Mai',
  599, 1299,
  '[{"name": "S", "label": "Pakiet S", "price": 599, "delivery_time_days": 10, "scope": ""}, {"name": "M", "label": "Pakiet M", "price": 899, "delivery_time_days": 18, "scope": ""}, {"name": "L", "label": "Pakiet L", "price": 1299, "delivery_time_days": 30, "scope": ""}]'::jsonb, 7, 'Marketing',
  false, 0.25, true, 'platform_service', 'active', NULL
);

-- #23: Projekt opakowania / etykiety produktu
INSERT INTO public.service_packages (
  title, description, locked_content, price, price_max,
  variants, delivery_time_days, category,
  requires_nda, commission_rate, is_system, type, status, student_id
) VALUES (
  'Projekt opakowania / etykiety produktu',
  'Projekt opakowania / etykiety produktu
Profesjonalna etykieta lub opakowanie które wyróżni Twój produkt na półce — pliki gotowe do drukarni
O co chodzi
Twój produkt może być świetny — ale jeśli wygląda jak „domowa robota”, klient go nie kupi. 70% decyzji zakupowych zapada przy półce sklepowej. Etykieta i opakowanie to Twój sprzedawca nr 1.
Student grafiki zaprojektuje profesjonalną etykietę lub opakowanie Twojego produktu — spójne z marką, wyróżniające się na półce, zgodne z wymaganiami drukarni. Dostajesz pliki gotowe do druku (PDF/AI, CMYK, 300 DPI, spady) + mockupy do marketingu.
Dla kogo ta usługa
Żywność i napoje: dżemy, sosy, miody, piwa rzemieślnicze, kawa, herbata, soki, oliwy, przetwory, słodycze
Kosmetyki: kremy, szampony, olejki, świece zapachowe, mydła naturalne, perfumy niszowe
Suplementy diety: witaminy, białka, adaptogeny, probiotyki
Alkohole: wódki, likiery, nalewki, piwa kraftowe, wina
Produkty domowe: środki czystości, świece, dyfuzory, herbaty sypane
E-commerce / DTC: marki własne na Amazon, Allegro, własny sklep — opakowanie = pierwsze wrażenie klienta
Wybierz pakiet
Jak te ceny wyglądają na tle rynku
Student2Work: 1.5–2× taniej niż freelancer, 3–5× taniej niż studio, 4–10× taniej niż agencja. Kompromis: brak badania rynku i strategii półkowej — ale profesjonalny projekt graficzny gotowy do druku.
Co musisz dostarczyć
Logo — wektor (AI/SVG/PDF). Minimum: PNG na przezroczystym tle ≥ 2000px.
Wymiary opakowania/etykiety — dokładne wymiary w mm. Jeśli masz wykrojnik od drukarni — prześlij.
Treści na etykietę — nazwa produktu, opis, skład, wartość odżywcza, waga/pojemność, dane producenta, kod EAN, ostrzeżenia, certyfikaty (BIO, vegan, etc.).
Zdjęcia produktu — jeśli masz (surowce, składniki, gotowy produkt). Jeśli nie — student użyje stocków.
Branding — kolory marki, fonty, styl (premium/naturalny/nowoczesny/retro).
Przykłady „podoba mi się” — 3–5 etykiet/opakowań które Ci się podobają. Co dokładnie: styl, kolory, układ?
Informacja o drukarni — jeśli masz drukarzą: specyfikacja techniczna (format, materiał, uszlachetnienia). Jeśli nie — student doradzi.
Nie masz wymiarów? Powyślij do drukarni — dają wykrojnik za darmo. Albo podaė studentowi typ opakowania (słoik 250ml, butelka 0.5l, pudełko 10x10x15cm) — znajdzie standardowe wymiary.
Czego pakiety NIE obejmują
Druku — student przygotuje pliki GOTOWE do druku, ale druk zamawiasz sam. Polecamy: Etykieciarz.pl, LabelDruk.pl, Pakology.pl.
Copywritingu — student NIE pisze treści (opisów, haseł marketingowych). Układa DOSTARCZONE teksty. Patrz #06.
Sesji zdjęciowej — student użyje dostarczonych zdjęć lub stocków. Profesjonalna sesja produktowa = osobne zlecenie.
Certyfikacji / zgodności prawnej — student NIE weryfikuje czy etykieta spełnia wymogi prawne (np. rozporządzenie UE o informacji żywnościowej). Firma odpowiada za zgodność treści z przepisami.
Produkcji opakowań — student projektuje GRAFIKĘ, nie produkuje fizycznych pudełek.
Jak wygląda proces
Dzień 1–2: Brief: student zbiera logo, wymiary, treści, zdjęcia, przykłady inspiracji. Ustala specyfikację druku.
Dzień 2–3: Moodboard + koncepcje: 2 kierunki wizualne (np. minimalistyczny vs naturalny). Firma wybiera.
Dzień 3–5 (S) / 3–8 (M) / 3–13 (L): Projektowanie: pełny projekt graficzny etykiety/opakowania w wybranym kierunku.
Dzień +1–2: Poprawki: firma sprawdza, student koryguje.
Dzień +1: Finalizacja: eksport plików do druku (PDF/AI CMYK spady) + mockupy + paczka ZIP.',
  'Ta sekcja nie jest widoczna dla firmy-zleceniodawcy.
Twoje wynagrodzenie
Instrukcja realizacji — krok po kroku
Krok 1: Brief i materiały (~1–2h)
Zbierz WSZYSTKO zanim zaczniesz: logo (wektor!), wymiary, treści (skład, waga, dane producenta, EAN), zdjęcia, przykłady inspiracji.
Wymiary: dokładne w mm. Jeśli firma ma wykrojnik od drukarni (dieline) — użyj go. Jeśli nie — znajdź standardowy dla tego typu opakowania.
Specyfikacja druku: zapytaj firmę/drukarnię: materiał (papier samoprzylepny, folia, karton), uszlachetnienia (lakier UV, folia hot stamping, tłoczenie), kolorystyka (CMYK, Pantone, biały poddruk na przezroczystej etykiecie).
Branża: żywność = czytelność składu (prawne minimum: czcionka 1.2mm wysokości!). Kosmetyki = INCI, ostrzeżenia. Alkohol = obowiązkowe oznaczenia.
Krok 2: Moodboard i koncepcje (~2–3h)
Przygotuj 2 moodboardy (po 6–10 inspiracji każdy): różne style (np. minimalizm vs vintage, premium vs natural).
Każdy moodboard: przykłady etykiet z branży + paleta kolorów + typografia + styl zdjęć/ilustracji.
Firma WYBIERA kierunek. NIGDY nie projektuj pełnej etykiety bez zaakceptowanego moodboardu.
Jeśli firma ma identyfikację wizualną (#20) — etykieta MUSI być z nią spójna (kolory, fonty, styl).
Krok 3: Projektowanie (~4–15h zależnie od pakietu)
Pracuj w Adobe Illustrator (standard branżowy) lub Affinity Designer. NIE Canva (brak CMYK, brak precyzji druku).
CMYK od początku. RGB → CMYK na końcu = „dlaczego kolory są inne”. Profil: Coated FOGRA39 (standard Europa).
Spady 3mm z każdej strony. Elementy dochodzące do krawędzi MUSZĄ wychodzić 3mm poza linię cięcia.
Tekst: minimum 5pt (najlepiej 7pt+). Skład żywności: minimum 1.2mm wysokości litery x (wymóg UE).
Hierarchia: 1) Nazwa produktu (DOMINUJE), 2) Smak/wariant, 3) Marka/logo, 4) Kluczowe hasło, 5) Informacje obowiązkowe (skład, waga, producent).
Linia (pakiet M): zaprojektuj SYSTEM — co stałe (układ, logo, typografia), co zmienne (kolor, zdjęcie, nazwa smaku). Spójność + różnicowanie.
Opakowanie (pakiet L): siatka/wykrojnik = płaski rozkład pudełka. Projektuj na siatce. Oznacz linie gięcia, cięcia, klejenia. Dno, boki, wieczko, klapki.
ZASADA PÓŁKI: Wydrukuj etykietę w skali 1:1 i postaw obok konkurencji. Czy się wyróżnia? Czy jest czytelna z 1 metra? Jeśli nie — popraw.
Krok 4: Mockupy (~1–2h)
Mockupy = etykieta/opakowanie nałożone na realistyczne zdjęcie produktu. Firma widzi jak wygląda „na żywo”.
Użyj: Smartmockups, Placeit, MockupWorld, lub mockupy z Envato Elements.
Minimum: produkt z przodu (hero shot) + produkt na półce/w kontekscie (lifestyle shot).
Pakiet L: dodatkowo mockup 3D opakowania (złożone, otwarte, flat lay).
Spójny styl: wszystkie mockupy w jednej estetyce (jasne tło, czyste, minimalistyczne).
Krok 5: Eksport i finalizacja (~1h)
PDF do druku: PDF/X-1a lub PDF/X-4, CMYK, 300 DPI, spady 3mm, fonty osadzone/krzywe, linie cięcia.
AI edytowalny: plik Illustrator z warstwami (firma może edytować w przyszłości).
Mockupy: JPG/PNG wysoka rozdzielczość (do marketingu, strony, social media).
Paczka ZIP: PDF_druk/ + AI_edytowalny/ + Mockupy/ + README.txt (specyfikacja: wymiary, kolory Pantone, fonty).
Narzędzia
Adobe Illustrator standard branżowy — wektory, CMYK, precyzja druku. Używaj zawsze do etykiet.
Adobe InDesign układ tekstu na etykietach z dużą ilością treści (skład, tabele żywnościowe).
Affinity Designer tańsza alternatywa Illustratora. Pełne CMYK, wektory, eksport PDF/X. Dobra opcja.
Smartmockups / Placeit mockupy produktów. Darmowe + premium. Szybkie i realistyczne.
Dieline.com / TemplateMarket gotowe siatki/wykrojniki opakowań (pudełka, torby, display). Oszczędza godziny.
Najczęstsze problemy
Firma nie ma wymiarów („to taki normalny słoik”). Poprosić o zdjęcie produktu z miarką lub nazwę dostawcy opakowań. Każdy producent słoików/butelek ma karty techniczne z wymiarami. Alternatywa: zmierz obwód i wysokość etykiety na istniejącym produkcie.
Firma chce „dużo informacji na małej etykiecie”. „Skład i informacje obowiązkowe muszą być czytelne. Zaproponuję układ który zmieści wszystko czytelnie. Jeśli się nie zmieści — rozwiązanie: etykieta owijkowa (360°) lub dwustronna (przód + tył).”
Firma nie ma zdjęć produktu. Użyj zdjęć stockowych składników (owoce, zioła, kawa) lub ilustracji. Mockupy z pustym opakowaniem + etykieta = firma widzi efekt bez sesji zdjęciowej.
Kolory na wydruku inne niż na ekranie. „Ekran = RGB, druk = CMYK. Różnice są nieuniknione. Jeśli kolor jest KRYTYCZNY (np. Coca-Cola Red) — podaj Pantone. Drukarnia wydrukuje próbkę kolorystyczną (proof) przed pełnym nakładem.”
Firma chce zmienić smak/wariant po zatwierdzeniu. „Dodatkowy smak/wariant: +299 PLN (pakiet S) lub +249 PLN (w systemie linii, pakiet M). Układ i system graficzny już istnieje — to szybka adaptacja.”
Checklist końcowy
Brief zaakceptowany — wymiary, treści, logo, inspiracje zebrane
Moodboard zaakceptowany — kierunek wizualny potwierdzony PRZED projektowaniem
Wymiary zgodne z wykrojnikiem/specyfikacją drukarni
Treści kompletne — skład, waga, producent, EAN, ostrzeżenia (firma odpowiada za zgodność prawną!)
CMYK od początku — profil Coated FOGRA39
Spady 3mm na wszystkich elementach dochodzących do krawędzi
Tekst czytelny — minimum 5pt, skład żywności min. 1.2mm wysokości
Linia spójna (pakiet M) — system: co stałe, co zmienne
Siatka/wykrojnik poprawny (pakiet L) — linie gięcia, cięcia, klejenia oznaczone
Mockupy realistyczne — spójny styl
PDF do druku: PDF/X-1a, CMYK, 300 DPI, spady, fonty osadzone
Paczka ZIP na Google Drive — link udostępniony firmie
Wiadomość podsumowująca na platformie
Student2Work — Łączymy ambicje studentów z potrzebami firm',
  699, 1599,
  '[{"name": "S", "label": "Pakiet S", "price": 699, "delivery_time_days": 10, "scope": "Etykieta przód + tył (lub owijka 360°)"}, {"name": "M", "label": "Pakiet M", "price": 1199, "delivery_time_days": 20, "scope": "3 etykiety w spójnym systemie (kolory/grafiki różnicują smaki)"}, {"name": "L", "label": "Pakiet L", "price": 1599, "delivery_time_days": 30, "scope": "Siatka/wykrojnik pudełka + projekt graficzny wszystkich ścian + etykieta wewnętrzna"}]'::jsonb, 7, 'Design',
  false, 0.25, true, 'platform_service', 'active', NULL
);

-- #25: Konfiguracja i optymalizacja profili social media
INSERT INTO public.service_packages (
  title, description, locked_content, price, price_max,
  variants, delivery_time_days, category,
  requires_nda, commission_rate, is_system, type, status, student_id
) VALUES (
  'Konfiguracja i optymalizacja profili social media',
  'Konfiguracja i optymalizacja profili social media
Profesjonalne profile firmowe które budują zaufanie — od bio po highlights, od avatara po Linktree
O co chodzi
Twój profil firmowy na Instagramie wygląda jak założony w 5 minut. Bio mówi „Witamy na naszym profilu”. Zdjęcie profilowe to logo w złej rozdzielczości. Highlights nie ma. Link w bio prowadzi donikąd. LinkedIn firmowy świeci pustkami.
Student social media ogarnie WSZYSTKIE Twoje profile: profesjonalne bio z słowami kluczowymi, spójny avatar i cover, highlights ze stories, Linktree, Meta Business Suite, weryfikacja konta. Pierwsze wrażenie = zaufanie. Złe profile = utraceni klienci.
65% firm w naszej ankiecie wskazało social media jako obszar który najchętniej delegowałoby studentom.
Wybierz pakiet
Jak te ceny wyglądają na tle rynku
Najtańsza usługa w katalogu (S = 349 PLN). Idealna LOKOMOTYWA — firma wchodzi tanio, widzi jakość, wraca po content plan (#26), grafiki (#17), strategię (#01).
Co musisz dostarczyć
Logo — PNG przezroczyste tło (min. 500×500 px) + wersja uproszczona
Kolory marki — HEX. Jeśli brak — student dobierze na podstawie logo.
Opis firmy — czym się zajmujesz, dla kogo, co wyróżnia (5–10 zdań)
Dane kontaktowe — email, telefon, adres, strona www, godziny otwarcia
Dostęp do kont — login/hasło lub zaproszenie jako administrator
Zdjęcia — produkty, biuro, zespół (jeśli są). Jeśli brak — student użyje stocków.
Czego pakiety NIE obejmują
Tworzenia treści / postów — student konfiguruje PROFIL, nie publikuje. Prowadzenie SM = #01.
Content planu — co publikować i kiedy = usługa #26.
Grafik do postów — szablony = #17.
Reklam / kampanii płatnych — konfiguruje Meta Business Suite i Pixel (L), ale NIE prowadzi kampanii.
Stałej obsługi — jednorazowy setup. Potem firma zarządza samodzielnie (instrukcja w M/L).
Jak wygląda proces
Dzień 1: Brief + audyt: logo, opis, dane, dostępy. Screenshoty before.
Dzień 1–2 (S) / 1–3 (M) / 1–4 (L): Konfiguracja: bio, avatar, cover, highlights, Linktree, Meta Business Suite, LinkedIn.
Dzień +1: Poprawki: firma sprawdza, student koryguje.
Dzień +1: Finalizacja: raport before/after + instrukcja + przekazanie.',
  'Ta sekcja nie jest widoczna dla firmy-zleceniodawcy.
Twoje wynagrodzenie
Pakiet S to najszybsze zlecenie w katalogu (4–6h). Idealne na start — zbuduj portfolio i reputację na platformie.
Instrukcja realizacji
Krok 1: Audyt (~0.5–1h)
Screenshoty BEFORE: avatar, bio, cover, highlights, linki. Dowód Twojej pracy.
Sprawdź: avatar czytelny w 32×32px? Bio mówi KIM jest firma i CO oferuje? Jest CTA? Link działa?
Zanotuj co zmienisz i dlaczego.
Krok 2: Bio i opisy (~1–2h)
Instagram bio (150 znaków): L1: Kim jesteśmy. L2: Co oferujemy/USP. L3: CTA. Max 3–4 emoji.
Facebook: krótki opis (255 zn.) + długi. Kategorie dokładne (wpływa na wyszukiwanie).
LinkedIn About (2000 zn.): Co robimy → Dla kogo → Dlaczego my → CTA. Pod SEO — słowa kluczowe!
Ton: B2B = profesjonalny. Lifestyle = luźny. Tech = konkretny.
Krok 3: Avatar i cover (~1–2h)
Avatar: logo w okrągłym kadrze. Test 32×32px. Długa nazwa = użyj sygnetu.
Wymiary: IG 320×320, FB 170×170, LinkedIn 400×400, TikTok 200×200, YT 800×800.
Cover: FB 820×312, LinkedIn 1128×191, YT 2560×1440 (safe area 1546×423).
Canva lub Figma. Kolory marki + logo + CTA. TESTUJ na mobile — cover się przycina!
Krok 4: Highlights IG (~1–2h)
Okładki: spójne ikony w kolorach marki. Flat icons na tle LUB liniowe na białym.
Kategorie: O nas, Oferta, Portfolio, Opinie, FAQ, Kontakt, Aktualności, Za kulisami.
Nazwy: max 10 widocznych znaków.
Pakiet L: przypisz stories. Brak stories? Zrób 2–3 placeholder stories (grafika + tekst).
Krok 5: Linktree (~0.5–1h)
Linktree/Taplink: logo, kolory, 3–10 linków. Każdy link = jasny CTA.
Standardowe: Strona, Sklep, Oferta, Rezerwacja, Newsletter, Inne SM.
Włącz analytics — firma widzi co działa.
Krok 6: Meta Business Suite + LinkedIn (M/L, ~1–3h)
Meta BS: połącz IG+FB, kategorie, godziny, CTA, auto-reply DM.
Pixel (L): zainstaluj na stronie (GTM lub plugin WP). Podstawa remarketingu.
LinkedIn: About SEO, specjalności (10–20 tagów), banner, Showcase Pages (L).
Narzędzia
Canva covery, highlights, grafiki profilowe
Linktree / Taplink link w bio, darmowe plany wystarczają
Meta Business Suite zarządzanie FB+IG, darmowe
Figma precyzyjniejsze bannery (alternatywa Canva)
Najczęstsze problemy
Firma nie ma dostępów. Odzyskiwanie hasła przez email/telefon. FB strona utracona = procedura Meta. NIGDY nie twórz nowego konta.
Logo w złej jakości. Poprosić o wektor. Brak = Vectorizer.ai. Beznadziejne logo = zasugeruj #04.
Firma chce od razu posty. „To usługa konfiguracji profili (fundamenty). Content = #01 lub #17. Bez dobrego profilu posty nie konwertują.”
Cover inny na mobile vs desktop. Testuj na obu. Ważne elementy w safe zone (centrum). FB i LinkedIn przycinają na mobile.
Checklist końcowy
Screenshoty BEFORE zrobione
Bio: KIM + CO + CTA + słowa kluczowe
Avatar czytelny w 32×32px
Cover we właściwych wymiarach, safe zone ok
Highlights — okładki spójne, nazwy krótkie
Linktree — linki działają, CTA jasne, analytics włączone
Meta Business Suite (M/L) — IG+FB połączone, CTA, auto-reply
LinkedIn (M/L) — About SEO, specjalności, banner
Pixel (L) — zainstalowany i działa
Raport before/after + instrukcja (M/L) + screencast (L)
Dostępy przekazane firmie (Owner/Admin)
Wiadomość podsumowująca na platformie
Student2Work — Łączymy ambicje studentów z potrzebami firm',
  349, 799,
  '[{"name": "S", "label": "Pakiet S", "price": 349, "delivery_time_days": 4, "scope": "✔ Profesjonalne bio z CTA + słowami kluczowymi"}, {"name": "M", "label": "Pakiet M", "price": 549, "delivery_time_days": 8, "scope": "✔ Bio dopasowane do każdej platformy osobno"}, {"name": "L", "label": "Pakiet L", "price": 799, "delivery_time_days": 14, "scope": "✔ Bio + pełny opis firmy (LinkedIn About, FB Info, Google Business)"}]'::jsonb, 3, 'Marketing',
  false, 0.25, true, 'platform_service', 'active', NULL
);

-- #26: Strategia treści SM — content plan i kalendarz publikacji
INSERT INTO public.service_packages (
  title, description, locked_content, price, price_max,
  variants, delivery_time_days, category,
  requires_nda, commission_rate, is_system, type, status, student_id
) VALUES (
  'Strategia treści SM — content plan i kalendarz publikacji',
  'Strategia treści SM — content plan i kalendarz publikacji
Gotowy plan co, kiedy i jak publikować w social media — od filarów treści po harmonogram na 1–3 miesiące
O co chodzi
Wiesz że musisz publikować w social media, ale codziennie rano myślisz „co dziś wrzucić?”. Publikujesz chaotycznie, bez planu, bez strategii. Jeden tydzień 3 posty, potem miesiąc ciszy. Brak pomysłów, brak spójności, brak efektów.
Student marketingu przygotuje gotowy content plan: filary treści (o czym piszesz), formaty (jak piszesz), kalendarz publikacji (kiedy piszesz) i bank pomysłów na 1–3 miesiące. Dostajesz GOTOWY plan — otwierasz kalendarz, widzisz co publikować, robisz to.
Firmy które publikują regularnie (3–5x/tydzień) mają średnio 3.5× większy zasięg niż te które publikują chaotycznie.
Wybierz pakiet
Jak te ceny wyglądają na tle rynku
Student2Work: 1.5–4× taniej niż freelancer. Kompromis: student dostarcza PLAN i STRATEGIĘ, nie prowadzi SM na co dzień. Firma publikuje samodzielnie według planu.
Różnica: ta usługa vs #01 (prowadzenie SM) i #25 (konfiguracja profili)
Naturalna ścieżka: #25 (ogarnij profil) → #26 (dostaj plan) → #01 (ktoś prowadzi). Lub: #26 (plan) + #17 (grafiki) = firma prowadzi SM samodzielnie z profesjonalnymi materiałami.
Co musisz dostarczyć
Dostęp do profili SM — żeby student mógł przeanalizować statystyki (Insights)
Opis firmy — czym się zajmujesz, co sprzedajesz, czym się wyróżniasz
Grupa docelowa — kto jest Twoim klientem? Wiek, zainteresowania, problemy, gdzie przebywa online?
Cel SM — sprzedaż? Budowanie marki? Edukacja? Rekrutacja? To wpływa na filary i formaty.
Konkurencja — 3–5 firm z branży które są aktywne w SM (student przeanalizuje ich strategię)
Przykłady „podoba mi się” — profile które uważasz za dobrze prowadzone (z dowolnej branży)
Zasoby — kto będzie publikować? Czy macie grafika? Ile czasu tygodniowo możecie poświęcić na SM?
Czego pakiety NIE obejmują
Tworzenia grafik / zdjęć — student pisze PLAN, nie projektuje grafik. Grafiki = #17.
Pisania gotowych postów (copy) — pomysły z opisem + CTA, nie gotowe teksty do wklejenia. Copywriting = #06.
Publikowania — student NIE wrzuca postów. Plan + firma publikuje. Prowadzenie = #01.
Reklam płatnych — strategia organiczna, nie płatna. Brak setupów Facebook Ads / Google Ads.
Montażu wideo — pomysły na Reels z opisem formatu, nie gotowe filmiki. Montaż = #07.
Jak wygląda proces
Dzień 1–2: Brief + audyt: analiza obecnych profili (Insights), konkurencji, grupy docelowej. Zbieranie materiałów.
Dzień 2–4: Strategia: filary treści, formaty, ton głosu, hashtagi, najlepsze godziny publikacji.
Dzień 4–5 (S) / 4–7 (M) / 4–10 (L): Kalendarz + bank pomysłów: harmonogram tydzień po tygodniu, każdy pomysł z tytułem, formatem, CTA.
Dzień +1–2: Poprawki + finalizacja: firma sprawdza, student koryguje, dostarcza finalną paczkę.',
  'Ta sekcja nie jest widoczna dla firmy-zleceniodawcy.
Twoje wynagrodzenie
Instrukcja realizacji
Krok 1: Audyt obecnego profilu (~1–3h)
Insights/statystyki: najlepsze posty (engagement rate), godziny aktywności followerów, demografia, zasięg organic.
Top 10 postów firmy (najwyższy engagement): co mają wspólnego? Format? Temat? Godzina?
Bottom 10: co nie działa? Dlaczego?
Konkurencja (M/L): 3–5 kont z branży. Co publikują? Jak często? Jakie formaty? Co ma najlepsze wyniki?
Narzędzia: Instagram Insights (natywne), Not Just Analytics (darmowy tier), Social Blade.
Krok 2: Filary treści (~1–2h)
Filary = tematy przewodnie, które firma regularnie porusza. Typowe: Edukacja (porady, tips, how-to), Oferta (produkty, usługi, case study), Za kulisami (zespół, proces, codzienność), Społeczność (opinie, UGC, Q&A), Rozrywka (memy, trendy, humor branżowy), Inspiracja (cytaty, wartości, misja).
4–5 filarów to optimum. Każdy filar: nazwa, opis, przykład posta, proporcja (np. edukacja 40%, oferta 25%, za kulisami 20%, rozrywka 15%).
Filary dopasuj do CELU: sprzedaż = więcej oferty i case study. Budowanie marki = więcej za kulisami i wartości. Rekrutacja = zespół, kultura, benefity.
Krok 3: Formaty i styl (~1–2h)
Formaty per platforma: IG = karuzela (najwyższy zasięg), Reel (najwyższy reach), post (engagement), Stories (retencja). LinkedIn = post tekstowy (najlepszy), karuzela PDF, artykuł. TikTok = wideo 15–60 sek, trending audio.
Każdy format: opis, cel, długość/wymiary, styl, przykład.
Ton głosu: zdefiniuj JASNO. Przykład: „Mówimy jak ekspert który jest też kumplem — profesjonalnie ale bez korporacyjnego żargonu. Używamy Ty, nie Państwo. Emoji tak, ale max 3.”
Różnicowanie (M/L): ten sam temat = inny format per platforma. IG = karuzela. LinkedIn = post tekstowy. TikTok = krótki film.
Krok 4: Kalendarz publikacji (~2–6h)
Format: Excel/Google Sheets. Kolumny: data, dzień tygodnia, platforma, filar, format, tytuł/temat, krótki opis, CTA, hashtagi (grupa), godzina publikacji.
Częstotliwość: minimum 3x/tydzień (IG/FB), 2–3x/tydzień (LinkedIn), 3–5x/tydzień (TikTok). Mniej = spadek zasięgu.
Godziny: na podstawie Insights — kiedy followup są online. Ogólne: IG = 11:00–13:00 i 19:00–21:00. LinkedIn = 8:00–9:00 i 12:00–13:00. TikTok = 18:00–22:00.
Sezonowość (L): uwzględnij święta, eventy branżowe, Black Friday, Dzień Kobiet, Back to School — zaplanuj posty tematyczne.
Każdy pomysł musi być KONKRETNY: nie „post o produkcie” ale „Karuzela 5 sposobów użycia [produktu] w domu — CTA: Który sposób Wasz ulubiony? Komentuj!”
ZASADA: Każdy pomysł w kalendarzu musi odpowiadać na pytanie: „Dlaczego follower to przeczyta/obejrzy? Co z tego ma?” Jeśli nie masz odpowiedzi — usuń.
Krok 5: Hashtagi (~0.5–1h)
3 grupy: Due (duże, 100K+ postów — szeroki zasięg), Średnie (10–100K — konkretna nisza), Małe/lokalne (<10K — precyzyjne targetowanie).
Mix per post: 2–3 duże + 3–4 średnie + 3–4 małe = 8–11 hashtagów (IG). LinkedIn: 3–5 hashtagów max.
Rotacja: NIE te same hashtagi na każdym poście. Przygotuj 4–5 zestawów i rotuj.
Narzędzia: Hashtagify, All Hashtag, natywne sugestie IG.
Krok 6: Dokument strategii (M/L, ~2–4h)
Struktura PDF: 1) Podsumowanie audytu (co działa, co nie), 2) Grupa docelowa (persony — L), 3) Cele SM (SMART), 4) Filary treści + proporcje, 5) Formaty i styl, 6) Ton głosu, 7) Kalendarz (załącznik Excel), 8) Hashtagi, 9) KPI i jak mierzyć sukces, 10) Rekomendacje (co robić dalej).
Persony (L): 2–3 persony. Każda: imię, wiek, zawod, problemy, cele, gdzie przebywa online, co lubi w SM, co ją irytuje.
KPI: zasięg (reach), engagement rate, wzrost followerów, kliknięcia w link, zapisy na newsletter, sprzedaż. Firma musi wiedzieć jak mierzyć czy plan działa.
Pakiet L: Notion board lub Trello — kalendarz w formie tablicy kanban. Firma przeciąga karty: Pomysł → W przygotowaniu → Gotowe → Opublikowane.
Narzędzia
Instagram Insights / Facebook Insights natywne statystyki — bezpłatne, wystarczające
Not Just Analytics bezpłatna analiza profilu IG (engagement rate, wzrost, najlepsze posty)
Google Sheets / Notion / Trello kalendarz i organizacja treści
Hashtagify / All Hashtag research hashtagów (wolumen, popularność)
Canva (Content Planner) planowanie wizualne postów (darmowy tier)
Social Blade analiza wzrostu i statystyk konkurencji
Najczęstsze problemy
Firma nie ma Insights („nowy profil, 50 followerów”). Brak danych = brak audytu. Opieraj się na konkurencji i benchmarkach branżowych. Zaproponuj testowy miesiąc — po miesiącu będą dane do optymalizacji.
Firma chce „gotowe posty do wklejenia”. „To content PLAN, nie content WRITING. Dostarczam pomysły z opisem, formatem i CTA. Gotowe teksty postów = usługa #06 (copywriting) lub #01 (prowadzenie SM).”
„Ale ja nie wiem co publikować nawet z planem”. „Plan mówi dokładnie CO (temat), KIEDY (data, godzina), JAK (format), DLA KOGO (filar). Jedyne co robisz = tworzysz grafikę/zdjęcie i piszesz tekst. Grafiki = #17.”
Za dużo filarów, brak skupienia. Max 5–6 filarów. Każdy dodatkowy = rozmyć przekaz. Lepiej 4 mocne niż 8 słabych.
Checklist końcowy
Audyt wykonany — top/bottom posty, godziny, konkurencja (M/L)
Filary zdefiniowane — nazwa, opis, proporcja, przykłady
Formaty opisane per platforma
Ton głosu zdefiniowany (L)
Persony (L) — 2–3 profile grupy docelowej
Kalendarz w Sheets — każdy pomysł: data, platforma, filar, format, tytuł, CTA, hashtagi
Bank pomysłów: 20/40/60 konkretnych pomysłów (nie ogólników!)
Hashtagi pogrupowane i rotowane
Dokument strategii PDF (M/L)
Notion/Trello board (L)
Wiadomość podsumowująca na platformie
Student2Work — Łączymy ambicje studentów z potrzebami firm',
  449, 999,
  '[{"name": "S", "label": "Pakiet S", "price": 449, "delivery_time_days": 8, "scope": ""}, {"name": "M", "label": "Pakiet M", "price": 699, "delivery_time_days": 16, "scope": ""}, {"name": "L", "label": "Pakiet L", "price": 999, "delivery_time_days": 24, "scope": ""}]'::jsonb, 5, 'Marketing',
  false, 0.25, true, 'platform_service', 'active', NULL
);

-- #27: Strona firmowa WordPress — pełna strona internetowa dla Twoj
INSERT INTO public.service_packages (
  title, description, locked_content, price, price_max,
  variants, delivery_time_days, category,
  requires_nda, commission_rate, is_system, type, status, student_id
) VALUES (
  'Strona firmowa WordPress — pełna strona internetowa dla Twojej firmy',
  'Strona firmowa WordPress — pełna strona internetowa dla Twojej firmy
Profesjonalna strona www na WordPress — od 5 do 10 podstron, responsywna, gotowa do działania
O co chodzi
Twoja firma nie ma strony internetowej. Albo ma — ale wygląda jak z 2012 roku. Nie jest responsywna. Ładuje się 10 sekund. Nie pojawia się w Google. Klienci wchodzą, widzą „domową róbkę” i wychodzą.
Student web developmentu postawi profesjonalną stronę na WordPress — najlepszym systemie CMS na świecie (43% stron internetowych działa na WP). Responsywna, szybka, z formularzem kontaktowym, zoptymalizowana pod SEO, gotowa do samodzielnej edycji.
75% użytkowników ocenia wiarygodność firmy na podstawie wyglądu strony internetowej. Brak strony lub stara strona = utraceni klienci.
Różnica: ta usługa vs #10 (landing page)
Landing page = strona na jedną kampanię/produkt. Strona WordPress = pełna obecność firmy w internecie.
Wybierz pakiet
Jak te ceny wyglądają na tle rynku
Student2Work: 2–3× taniej niż freelancer, 3–8× taniej niż agencja. WordPress = firma ma PEŁNĄ kontrolę (w przeciwieństwie do Wix/Squarespace gdzie jesteś uzależniony od platformy).
Co musisz dostarczyć
Hosting + domena — jeśli masz = podaj dostępy. Jeśli nie = student doradzi (LH.pl, nazwa.pl, OVH — od 10 PLN/mies.). Koszt hostingu i domeny po stronie firmy.
Logo + kolory marki — wektor lub PNG. Brak = student dobierze na podstawie branży.
Treści — teksty na podstrony (O nas, Oferta, itp.). Student UKŁADA treści, nie pisze ich. Copywriting = #06.
Zdjęcia — produkty, biuro, zespół. Brak = student użyje stocków (Unsplash, Pexels — darmowe).
Przykłady „podoba mi się” — 3–5 stron które Ci się podobają (styl, układ, funkcje).
Dane kontaktowe — adres, telefon, email, social media, godziny otwarcia, NIP (polityka prywatności).
Nie masz hostingu? Student pomoże wybrać. Rekomendacja: LH.pl (hosting WP od 10 PLN/mies. + domena .pl ~50 PLN/rok) lub OVH (od 15 PLN/mies.).
Czego pakiety NIE obejmują
Copywritingu — student wstawia DOSTARCZONE treści. Pisanie tekstów = #06.
Sklepu internetowego (e-commerce) — brak WooCommerce, koszyka, płatności. Sklep = osobna usługa.
Hostingu i domeny — koszt po stronie firmy (10–50 PLN/mies.).
Stałej obsługi / utrzymania — jednorazowe wdrożenie. Aktualizacje WP i pluginów = firma (instrukcja w pakiecie).
Zaawansowanych integracji — CRM, ERP, systemy rezerwacji, płatności online. To zakres developera za 5 000+ PLN.
Projektu graficznego UX/UI — student używa motywu premium i customizuje. Pełny projekt UI = #18.
Jak wygląda proces
Dzień 1–2: Brief: student zbiera treści, logo, zdjęcia, przykłady, dostępy do hostingu. Ustala strukturę podstron.
Dzień 2–3: Instalacja WP + konfiguracja: motyw, pluginy, SSL, ustawienia podstawowe.
Dzień 3–7 (S) / 3–12 (M) / 3–18 (L): Budowa strony: układ podstron, wstawienie treści, zdjęć, formularzy. Responsywność.
Dzień +1–3: SEO + szybkość: Yoast, meta tagi, optymalizacja obrazków, caching, PageSpeed.
Dzień +1–2: Poprawki: firma sprawdza, student koryguje.
Dzień +1: Finalizacja: instrukcja obsługi + przekazanie dostępów.',
  'Ta sekcja nie jest widoczna dla firmy-zleceniodawcy.
Twoje wynagrodzenie
Najwyższe wynagrodzenie netto w katalogu (pakiet L = 2 249 PLN). Strona WP to duży projekt — ale też duża satysfakcja i świetna pozycja w portfolio.
Instrukcja realizacji
Krok 1: Instalacja WP + konfiguracja (~2–3h)
Hosting: zainstaluj WordPress przez auto-installer (Softaculous / cPanel). Najnowsza wersja WP.
SSL: aktywuj Let’s Encrypt w panelu hostingu. Wymuś HTTPS (plugin Really Simple SSL lub .htaccess).
Motyw: Astra (rekomendowany — najszybszy, kompatybilny z Elementor) lub Kadence. DARMOWA wersja wystarczy. NIE używaj motywów z nieznanych źródeł.
Page builder: Elementor (darmowy) — standard branżowy. Alternatywa: natywny Gutenberg (prostsze strony).
Pluginy OBOWIĄZKOWE: Yoast SEO, Contact Form 7 lub WPForms, WP Super Cache lub LiteSpeed Cache, Smush (optymalizacja obrazków), UpdraftPlus (backup), Wordfence (bezpieczeństwo).
Ustawienia: permalink structure = /%postname%/, usuń domyślne posty/strony, ustaw stronę główną jako static page.
Krok 2: Struktura i nawigacja (~1–2h)
Struktura podstron: Strona główna, O nas, Oferta (+ podstrony usług jeśli potrzeba), Blog (M/L), Portfolio/Realizacje (M/L), Kontakt, Polityka prywatności, FAQ (M/L).
Menu główne: max 6–7 pozycji. Logo po lewej, menu po prawej, CTA przycisk (np. „Umów konsultację”) jako ostatni element.
Stopka: dane firmy (NIP, adres, telefon), linki do polityki prywatności, social media ikony, formularz newsletter (M/L).
Krok 3: Budowa podstron (~10–40h)
Strona główna: Hero section (headline + subheadline + CTA + zdjęcie/film) → O nas (krótko) → Usługi (3–6 kafelków) → Dlaczego my / Wyróżniki → Opinie klientów → CTA końcowy → Stopka.
O nas: historia firmy, wartości, zespół (zdjęcia + opisy). Buduje zaufanie.
Oferta: każda usługa/produkt = osobna sekcja lub podstrona. Opis, korzyści, CTA.
Kontakt: formularz + mapa Google + dane (adres, telefon, email, godziny). Możliwe: widget Calendly do rezerwacji.
Blog (M/L): szablon wpisu z sidebar (kategorie, popularne wpisy, CTA newsletter). Typografia czytelna, zdjęcie wyróżnione.
Każda podstrona: spójny styl (kolory, fonty, odstępy), CTA na końcu, breadcrumbs (L).
ZASADA: Każda podstrona ma JEDEN główny cel. Strona główna = zaciekawić. Oferta = przekonać. Kontakt = ułatwić kontakt. Nie mieszaj.
Krok 4: Responsywność (~2–4h)
TESTUJ każdą podstronę na: iPhone (Safari), Android (Chrome), tablet, desktop.
Elementor: użyj mobile/tablet preview. Dostosuj font-size, padding, układ sekcji per breakpoint.
Zdjęcia: nie mogą wyjeżdżać poza ekran. Tekst musi być czytelny na mobile (min. 16px body).
Menu: hamburger menu na mobile. Logo mniejsze. CTA przycisk widoczny.
Chrome DevTools: F12 → Toggle Device Toolbar → testuj różne urządzenia.
Krok 5: SEO + szybkość (~2–4h)
Yoast SEO: meta title (max 60 zn.) i meta description (max 155 zn.) na KAŻDEJ podstronie. Słowa kluczowe.
Obrazki: alt text opisowy (nie „IMG_0001” ale „Projekt logo dla kawiarni Krakow”). Kompresja: Smush lub ShortPixel.
Sitemap: Yoast generuje automatycznie → wysyłka do Google Search Console (L).
PageSpeed: testuj na pagespeed.web.dev. Cel: ≥85 mobile. Optymalizuj: cache, lazy loading, minifikacja CSS/JS.
Schema markup (M/L): Yoast + plugin Schema Pro lub ręcznie — LocalBusiness schema (nazwa, adres, telefon, godziny).
Google Analytics 4 + Search Console (L): podłącz i zweryfikuj.
Krok 6: Bezpieczeństwo + backup (~0.5–1h)
Wordfence: firewall + malware scan. Darmowa wersja wystarczy.
UpdraftPlus: automatyczny backup (co tydzień, do Google Drive). Konfiguruj ZANIM oddaŁ stronę.
Admin: zmień domyślny login (nie „admin”), silne hasło, limit prób logowania.
Aktualizacje: w instrukcji napisz firmie: „Aktualizuj WP, motywy i pluginy co miesiąc. Przed aktualizacją — backup.”
Narzędzia
WordPress CMS — 43% stron na świecie. Standard.
Elementor page builder drag-and-drop. Darmowa wersja wystarcza.
Astra / Kadence motywy — szybkie, kompatybilne z Elementor, darmowe.
Yoast SEO plugin SEO — meta tagi, sitemap, schema, readability.
WPForms / Contact Form 7 formularze kontaktowe. WPForms = prostszy. CF7 = bardziej elastyczny.
PageSpeed Insights testowanie szybkości strony. Cel: ≥85/100 mobile.
Najczęstsze problemy
Firma nie ma hostingu i nie wie co to. „Hosting to miejsce gdzie „mieszkają” pliki strony. Domena to adres. Rekomenduję LH.pl (od 10 PLN/mies.) — pomogę z wyborem i konfiguracją.” Koszt po stronie firmy.
Firma chce sklep (WooCommerce). „Ta usługa obejmuje stronę firmową (wizytówka/oferta/blog), nie sklep z koszykiem i płatnościami. Sklep e-commerce to osobna usługa, znacznie bardziej złożona.”
Firma nie ma treści („nie wiem co napisać”). „Mogę ułożyć strukturę i wstawić placeholder tekst, ale finalne treści musi dostarczyć firma. Profesjonalne teksty = usługa #06.”
Strona wolno się ładuje. Checklist: obrazki skompresowane? Cache włączony? Ilość pluginów <15? Motyw lekki (Astra)? Hosting wydajny? Jeśli hosting to shared za 5 PLN — będzie wolno niezależnie od optymalizacji.
Firma chce zmiany po oddaniu strony. „Instrukcja pokazuje jak edytować treści, dodawać wpisy i zdjęcia. Zmiany strukturalne (nowe podstrony, nowe sekcje) = dodatkowe zlecenie.”
Checklist końcowy
WordPress zainstalowany, najnowsza wersja
SSL aktywny (HTTPS, kłódka w przeglądarce)
Motyw + Elementor skonfigurowane
Wszystkie podstrony gotowe z treściami
Responsywność: mobile + tablet + desktop przetestowane
Formularze działają — test: wysłanie formularza, email przychodzi
Yoast SEO: meta title/description na każdej podstronie
Obrazki skompresowane + alt text
Sitemap wysłany do Google Search Console (L)
PageSpeed ≥85/100 mobile
Backup skonfigurowany (UpdraftPlus → Google Drive)
Wordfence aktywny
Polityka prywatności / RODO na stronie
Instrukcja PDF + screencast (M/L) + videocall (L)
Dostępy przekazane firmie (admin WP + hosting)
Wiadomość podsumowująca na platformie
Student2Work — Łączymy ambicje studentów z potrzebami firm',
  1499, 2999,
  '[{"name": "S", "label": "Pakiet S", "price": 1499, "delivery_time_days": 20, "scope": ""}, {"name": "M", "label": "Pakiet M", "price": 2299, "delivery_time_days": 35, "scope": ""}, {"name": "L", "label": "Pakiet L", "price": 2999, "delivery_time_days": 50, "scope": ""}]'::jsonb, 10, 'Programowanie i IT',
  false, 0.25, true, 'platform_service', 'active', NULL
);

-- #28: Testy manualne QA — znajdź błędy zanim znajdą je Twoi klienc
INSERT INTO public.service_packages (
  title, description, locked_content, price, price_max,
  variants, delivery_time_days, category,
  requires_nda, commission_rate, is_system, type, status, student_id
) VALUES (
  'Testy manualne QA — znajdź błędy zanim znajdą je Twoi klienci',
  'Testy manualne QA — znajdź błędy zanim znajdą je Twoi klienci
Profesjonalne testy manualne aplikacji webowych, mobilnych i desktopowych — scenariusze, wykonanie, raport bugów
O co chodzi
Twój zespół developerski pisze kod, ale kto go testuje? Developerzy testują własny kod = jak sprawdzanie własnej pracy domowej. Bug który przeoczą trafia do klienta. Klient złoży reklamację. Albo gorzej — po cichu odejdzie do konkurencji.
Student QA przetestuje Twoją aplikację manualnie: napisze scenariusze testowe, przetestuje każdą funkcję, każdy formularz, każdą ścieżkę użytkownika. Dostarczy raport z listą bugów (priorytet, kroki reprodukcji, screenshoty). Twoi developerzy naprawiają — Ty zyskujesz lepszy produkt.
Koszt naprawienia buga po wdrożeniu jest 10–30× wyższy niż przed wdrożeniem. Testowanie to inwestycja, nie koszt.
Co możemy przetestować
Aplikacje webowe (SaaS, portale, panele): formularze, logowanie, rejestracja, dashboard, wyszukiwarka, filtry, płatności, role użytkowników
Strony internetowe: responsywność, linki, formularze, SEO techniczne, szybkość, dostępność, cross-browser
Aplikacje mobilne (Android/iOS): instalacja, nawigacja, push notyfikacje, geolokalizacja, offline mode, różne urządzenia/rozdzielczości
Aplikacje desktopowe: instalacja, UI, funkcje, integracje, wydajność, kompatybilność OS
E-commerce: ścieżka zakupowa (koszyk → checkout → płatność → potwierdzenie), warianty, kody rabatowe, zamówienia
MVP / prototypy: walidacja przed launchem — czy działa jak powinno zanim pokażesz inwestorowi/klientom
Wybierz pakiet
Jak te ceny wyglądają na tle rynku
Student2Work: 2–5× taniej niż freelancer QA, 5–15× taniej niż firma QA. Idealny dla startupów, małych zespołów dev i firm które nie mają własnego testera.
Co musisz dostarczyć
Dostęp do aplikacji — URL + konto testowe (login/hasło) lub build (APK/TestFlight). Środowisko testowe (staging), NIE produkcja!
Dokumentacja — jeśli masz: wymagania, user stories, specyfikacja. Jeśli nie — student przejdzie aplikację eksploracyjnie.
Zakres — co testować? Całą aplikację czy konkretne moduły? Nowe funkcje czy pełna regresja?
Urządzenia / przeglądarki — na czym użytownicy korzystają? Chrome? Safari? Mobile Android? iOS? (pakiet L)
Kontakt techniczny — ktoś z zespołu dev kto odpowie na pytania (np. „czy to bug czy feature?”)
Najważniejsze: śRODOWISKO TESTOWE (staging). Student NIE testuje na produkcji — testy mogą generować zamówienia testowe, użytkowników testowych itp.
Czego pakiety NIE obejmują
Testów automatycznych — student testuje MANUALNIE. Selenium, Cypress, Playwright = osobna usługa (wymaga doświadczonego automation QA).
Naprawiania bugów — student ZNAJDUJE bugi i raportuje. Naprawy robi zespół dev firmy.
Testów wydajnościowych (load testing) — brak JMeter, k6, Gatling. To zakres DevOps/performance engineer.
Testów bezpieczeństwa (pentesting) — brak skanowania podatności, SQL injection, XSS. To zakres security specialist.
Ciągłego QA — jednorazowa sesja testowa, nie stały zespół QA. Potrzebujesz ciągłego QA = zatrudnij testera.
Jak wygląda proces
Dzień 1–2: Brief + dostępy: student dostaje aplikację, dokumentację, konta testowe. Ustala zakres testów.
Dzień 2–3: Pisanie scenariuszy testowych: na podstawie dokumentacji lub eksploracji. Firma akceptuje zakres.
Dzień 3–4 (S) / 3–7 (M) / 3–10 (L): Wykonanie testów: student przechodzi każdy scenariusz, dokumentuje wyniki, robi screenshoty bugów.
Dzień +1–2: Raport: lista bugów z priorytetem, krokami reprodukcji, screenshotami. Executive summary (L).
Dzień +2–5 (M/L): Retesty: firma naprawia bugi → student weryfikuje czy naprawione + test regresji (L).',
  'Ta sekcja nie jest widoczna dla firmy-zleceniodawcy.
Twoje wynagrodzenie
Instrukcja realizacji
Krok 1: Poznanie aplikacji (~1–2h)
Zainstaluj / otwórz aplikację. Przejdź WSZYSTKIE ekrany jako użytkownik. Zrób notatki.
Przeczytaj dokumentację (jeśli jest): wymagania, user stories, makiety, README.
Zidentyfikuj KLU CZOWE FUNKCJE: logowanie, rejestracja, główny workflow (np. złóż zamówienie, dodaj produkt, wyślij formularz).
Zapytaj firmę: „Co jest najważniejsze? Co ostatnio zmieniliście? Gdzie były problemy?”
Krok 2: Scenariusze testowe (~2–6h)
Format: Excel/Sheets. Kolumny: ID, Moduł, Tytuł scenariusza, Warunki wstępne (preconditions), Kroki (steps), Oczekiwany wynik (expected result), Priorytet.
Happy path: główna ścieżka użytkownika — wszystko działa poprawnie. Np. „Użytkownik rejestruje się, loguje, dodaje produkt do koszyka, płaci, dostaje potwierdzenie.”
Negative testing (M/L): co jeśli użytkownik wpisze zły email? Zostawi pole puste? Wpisze SQL injection w formularz? Kliknie „Zapłać” 10 razy? Wyśle formularz bez wymaganych pól?
Edge cases (M/L): co jeśli imię ma 200 znaków? Email ma polskie znaki? Cena = 0 PLN? Koszyk ma 999 produktów? Sesja wygasa w trakcie płatności?
Boundary values: min/max wartości pól. Hasło 1 znak vs 255 znaków. Data urodzenia = jutro. Ilość = -1.
Cross-browser/device (L): te same scenariusze na Chrome, Firefox, Safari, Edge + mobile (Android Chrome, iOS Safari) + tablet.
ZASADA: Scenariusz = JEDEN test, JEDEN wynik. Nie „Sprawdź formularz kontaktowy” ale „Wypełnij formularz poprawnymi danymi i sprawdź czy wiadomość została wysłana + email potwierdzający dotarł.”
Krok 3: Wykonanie testów (~4–20h)
Przejdź KAZDY scenariusz. Status: PASS / FAIL / BLOCKED (nie można wykonać — np. brak danych testowych).
Każdy FAIL = bug. Dokumentuj NATYCHMIAST (nie „zaraz wracę” — zapomnisz kroki reprodukcji).
Testy eksploracyjne: poza scenariuszami — „klikaj losowo”, „próbuj złamać aplikację”. Najlepsze bugi często wychodzą z eksploracji.
Session-based testing: 30–45 min sesje skupione na jednym module. Po sesji = notatki.
Testuj na REALNYCH urządzeniach (nie tylko emulatorach). Przeglądarka na telefonie zachowuje się inaczej niż na desktopie.
Krok 4: Raportowanie bugów (~2–4h)
Format bug reportu: ID, Tytuł (krótki — „Formularz kontaktowy nie wysyła wiadomości po kliknięciu Wyślij”), Priorytet (Krytyczny / Wysoki / Średni / Niski), Środowisko (przeglądarka, OS, urządzenie), Kroki reprodukcji (1. Otwórz stronę X, 2. Wypełnij pole Y, 3. Kliknij Z), Expected result, Actual result, Screenshot/nagranie.
Priorytety: KRYTYCZNY = aplikacja nie działa / płatności nie przechodzą / utrata danych. WYSOKI = ważna funkcja nie działa / brak walidacji. ŚREDNI = działa ale źle (UI bug, zły komunikat). NISKI = kosmetyka (literówka, pixele, alignment).
Screenshot OBOWIĄZKOWY dla każdego buga. Oznacz na screenshocie co jest źle (strzałka, ramka czerwona). Narzędzia: Lightshot, ShareX, Loom (nagranie wideo).
Jira/Trello (L): jeśli firma używa — raportuj BEZPOŚREDNIO w ich systemie. Jeśli nie — Excel/Sheets i firma przeniesie do swojego systemu.
Krok 5: Retesty (M/L, ~2–6h)
Firma naprawia bugi → student dostaje nową wersję (build/staging).
Retest: przejdź KAŻDY zgłoszony bug. Status: NAPRAWIONY / NADAL WYSTĘPUJE / CZĘŚCIOWO NAPRAWIONY.
Test regresji (L): sprawdź czy naprawy nie zepsuły INNYCH funkcji. Przebież ponownie kluczowe scenariusze (happy path).
Aktualizuj raport: status bugów po retestach.
Narzędzia
Google Sheets / Excel scenariusze testowe i raport bugów. Prosty, uniwersalny.
Jira / Trello / Linear bug tracking (jeśli firma używa). Integracja ze screenshotami.
Lightshot / ShareX screenshoty z adnotacjami (strzałki, ramki, tekst).
Loom nagrywanie ekranu z głosem — „pokaż buga w 30 sek.” Lepsze niż 10 screenshotów.
BrowserStack / LambdaTest cross-browser testing (różne przeglądarki/urządzenia w chmurze). Darmowy tier.
Chrome DevTools inspekcja elementów, konsola (błędy JS), network (failed requests), responsive mode.
Najczęstsze problemy
Firma nie ma środowiska testowego („testuj na produkcji”). NIGDY nie testuj na produkcji. „Potrzebuję środowisko staging — kopię aplikacji gdzie mogę bezpiecznie testować bez wpływu na prawdziwych użytkowników. Poproszcie swój zespół dev o setup staging.”
Brak dokumentacji („nie mamy wymagań”). Testy eksploracyjne: przejdź aplikację jako użytkownik, napisz scenariusze na podstawie tego co widzisz. Zapytaj firmę: „Co ta funkcja POWINNA robić?”
Developer mówi „to nie bug, to feature”. Zgłoś z opisem: „Oczekiwane zachowanie wg dokumentacji: X. Aktualne: Y. Proszę o potwierdzenie czy to intended behavior.” Decyzja = po stronie firmy.
Za dużo bugów — firma się zniechęca. „Dużo bugów = dobrze że je znaleźliśmy TERAZ, nie klienci. Priorytetyzacja: zacznij od krytycznych i wysokich. Średnie i niskie = backlog na później.”
Firma chce „testy automatyczne”. „Testy manualne są pierwszym krokiem — identyfikują co testować. Automatyzacja ma sens dopiero jak masz stabilne scenariusze. To osobna usługa wymagająca doświadczonego automation QA.”
Checklist końcowy
Dostęp do staging / środowiska testowego (NIE produkcja)
Scenariusze testowe napisane i zaakceptowane przez firmę
Wszystkie scenariusze wykonane — status: PASS / FAIL / BLOCKED
Każdy bug: priorytet + kroki reprodukcji + screenshot/nagranie
Raport bugów dostarczony (Excel/Sheets lub Jira)
Retesty wykonane (M/L) — statusy zaktualizowane
Test regresji (L) — kluczowe ścieżki sprawdzone po naprawach
Executive summary (L) — podsumowanie: ilość testów, ilość bugów per priorytet, rekomendacje
Scenariusze testowe do ponownego użycia (firma może testować w przyszłości)
Wiadomość podsumowująca na platformie
Student2Work — Łączymy ambicje studentów z potrzebami firm',
  599, 1499,
  '[{"name": "S", "label": "Pakiet S", "price": 599, "delivery_time_days": 10, "scope": "Testy eksploracyjne + smoke test głównych funkcji (happy path)"}, {"name": "M", "label": "Pakiet M", "price": 999, "delivery_time_days": 20, "scope": "Testy funkcjonalne pełne (happy path + edge cases + negative testing)"}, {"name": "L", "label": "Pakiet L", "price": 1499, "delivery_time_days": 35, "scope": "Testy funkcjonalne + UX + cross-browser + cross-device + regresja"}]'::jsonb, 5, 'Programowanie i IT',
  false, 0.25, true, 'platform_service', 'active', NULL
);

-- #29: Biały wywiad i zbieranie danych z internetu (OSINT / Web Res
INSERT INTO public.service_packages (
  title, description, locked_content, price, price_max,
  variants, delivery_time_days, category,
  requires_nda, commission_rate, is_system, type, status, student_id
) VALUES (
  'Biały wywiad i zbieranie danych z internetu (OSINT / Web Research)',
  'Biały wywiad i zbieranie danych z internetu (OSINT / Web Research)
Gotowa baza danych zebrana ręcznie lub półautomatycznie z publicznych źródeł — leady, konkurencja, ceny, dostawcy, rynek
O co chodzi
Potrzebujesz listę 100 firm z branży X w regionie Y z emailami i telefonami? Chcesz porównać ceny konkurencji na 50 produktach? Szukasz dostawców z Aliexpress/Alibaba którzy spełniają Twoje kryteria? Potrzebujesz bazę kontaktów B2B do cold mailingu?
Student zbierze dane z publicznych źródeł internetowych: Google, LinkedIn, katalogi firm (Panorama Firm, PKD), portale branżowe, Allegro, Amazon, rejestry (KRS, CEIDG, GUS). Dostarczy czyste, uporządkowane dane w Excelu / Google Sheets — gotowe do użycia.
Biały wywiad (OSINT) = zbieranie informacji z publicznie dostępnych źródeł. To legalne, etyczne i powszechnie stosowane w biznesie.
Przykłady — co możemy zebrać
Baza leadów B2B: lista firm z branży (np. 200 gabinetów stomatologicznych w Warszawie) z nazwą, adresem, telefonem, emailem, stroną www, profilem SM
Analiza cenowa konkurencji: ceny 50–200 produktów u 5–10 konkurentów (Allegro, własne sklepy, Amazon) w zestawieniu porównawczym
Baza dostawców: lista dostawców z Alibaba/Aliexpress/made-in-china z cenami, MOQ, ocenami, kontaktem
Research rynku: dane o wielkości rynku, trendach, graczach, udziałach — z raportów, GUS, Eurostat, artykułów branżowych
Monitoring mediów: co mówią o Twojej firmie/branży w sieci — artykuły, fora, recenzje, social media
Baza kontaktów eventowych: lista prelegentów, sponsorów, wystawców z konferencji branżowych + kontakty
Dane do analizy: zbieranie danych ze stron/portalów do dalszej analizy (np. ogłoszenia o pracę w sektorze IT, ceny nieruchomości per dzielnica)
Wybierz pakiet
Jak te ceny wyglądają na tle rynku
Student2Work: jednorazowa opłata za GOTOWE dane (nie miesięczna subskrypcja). 1.5–3× taniej niż freelancer, bez vendor lock-in narzędzi SaaS.
Co musisz dostarczyć
Brief — dokładny opis CZEGO szukasz: jaka branża, jaki region, jakie kryteria (wielkość firmy, obroty, ilość pracowników itp.)
Kolumny — jakie dane potrzebujesz per rekord (nazwa, adres, email, telefon, www, social media, ilość pracowników...)
Przykład — 3–5 firm które spełniają kryteria (student kalibruje research).
Źródła preferencyjne — jeśli wiesz skąd zbierać (Panorama Firm, LinkedIn, KRS, konkretny portal branżowy)
Cel — do czego użyjesz danych? Cold mailing? Analiza rynku? Negocjacje z dostawcami? To wpływa na to JAKIE dane są potrzebne.
Czego pakiety NIE obejmują
Kontaktowania się z zebranymi firmami — student ZBIERA dane, nie wysyła maili/dzwoni. Cold mailing = osobna usługa.
Danych osobowych (RODO) — zbieramy dane FIRMOWE (publiczne). Nie zbieramy danych osób prywatnych (email prywatny, telefon prywatny).
Hackingu / danych niepublicznych — wyłącznie źródła publiczne. Brak łamania haseł, brak dostępu do zamkniętych baz.
Budowy narzędzia do scrapingu — student ZBIERA dane (ręcznie lub półautomatycznie). Nie buduje custom scraperów w Pythonie (to usługa developerska).
Analizy statystycznej / BI — student zbiera i porządkuje dane. Zaawansowana analiza (dashboardy, modele) = #21.
Jak wygląda proces
Dzień 1: Brief: student ustala dokładne kryteria, kolumny, źródła, ilość rekordów. Przykładowe 5–10 rekordów do akceptacji.
Dzień 1–2: Firma akceptuje próbkę: „Tak, takie dane potrzebuję” lub „Dodaj kolumnę X, usuń Y.”
Dzień 2–4 (S) / 2–8 (M) / 2–12 (L): Zbieranie: student przeszukuje źródła, zbiera rekordy, wypełnia kolumny.
Dzień +1–2: Czyszczenie: duplikaty, standaryzacja, walidacja, cross-check (M/L).
Dzień +1: Raport (M/L): metodologia, źródła, wnioski, rekomendacje. Deliverable gotowy.',
  'Ta sekcja nie jest widoczna dla firmy-zleceniodawcy.
Twoje wynagrodzenie
Web research to praca czasochłonna ale powtarzalna. Im szybciej opracujesz swój workflow (skróty, szablony, narzędzia), tym wyższa efektywna stawka.
Instrukcja realizacji
Krok 1: Ustalenie kryterów i próbka (~1–2h)
Doprecyzuj z firmą: branża (KOD PKD jeśli to pomaga), region (cała Polska? jedno miasto? UE?), wielkość (mikro/małe/średnie), inne filtry.
Przygotuj szablon Excel: kolumny ustalone z firmą. Wiersze = rekordy. Jeden arkusz = dane, drugi = metodologia/źródła.
Zbierz 5–10 przykładowych rekordów. Wyślij firmie: „Czy takie dane są OK? Brakuje czegoś?”
NIGDY nie zbieraj 300 rekordów bez akceptacji próbki. Firma może chcieć inne kolumny / inne kryteria.
Krok 2: Źródła danych — skąd zbierać (~0.5h planowanie)
Google (operator site:, intitle:, filetype:): wyszukiwanie zaawansowane. Np. site:linkedin.com/company „solar energy” Warszawa. Filetype:pdf „raport rynku”.
CEIDG (ceidg.gov.pl): rejestr jednoosobowych działalności. Szukaj po PKD, mieście, nazwie. Dane publiczne: nazwa, adres, NIP, data rejestracji, status.
KRS (ekrs.ms.gov.pl): rejestr spółek. Dane: zarząd, kapitał, data rejestracji, PKD, sprawozdania finansowe.
GUS / BDL (bdl.stat.gov.pl): dane statystyczne: demographics, gospodarka, sektory. Do researchów rynkowych.
Panorama Firm / Pkt.pl: katalogi firmowe z adresami, telefonami, branżami. Dobry punkt startowy.
LinkedIn (Sales Navigator — free trial): wyszukiwanie firm i osób decyzyjnych. Filtr: branża, wielkość, lokalizacja. UWAGA: scraping LinkedIn = niezgodny z ToS. Zbieraj RĘCZNIE.
Allegro / Amazon / Ceneo: ceny produktów, opinie, sprzedawcy, ilość sprzedaży. Do analiz cenowych i konkurencji.
Alibaba / Aliexpress / Made-in-China: dostawcy, MOQ, ceny FOB, oceny, certyfikaty.
Rejestry branżowe: izby gospodarcze, stowarzyszenia, listy członków — świetne źródło firm z konkretnej branży.
Krok 3: Zbieranie danych (~5–30h)
Metoda ręczna: kopiuj dane ze stron do Excela. Powolna ale dokładna. Dobre dla <100 rekordów.
Metoda półautomatyczna: narzędzia do ekstrakcji (Data Miner, Instant Data Scraper — rozszerzenia Chrome). Zbierają dane ze stron tabelarycznych/listowych. UWAGA: szanuj robots.txt i ToS.
Google Sheets + IMPORTHTML / IMPORTXML: do prostych tabel na stronach publicznych. Np. =IMPORTHTML("url","table",1).
Nie używaj botów na stronach które tego zabraniają (LinkedIn, Facebook). Zbieraj ręcznie.
Tempo: realnie 10–30 rekordów/h (ręcznie, z wypełnianiem wielu kolumn). 50–100/h z narzędziami (proste dane).
Co 50 rekordów = zapisuj. Nie trać postępów.
Krok 4: Czyszczenie i walidacja (~2–5h)
Duplikaty: usuń (Excel: Conditional Formatting → Highlight Duplicates, lub Remove Duplicates).
Standaryzacja: format telefonu (np. +48 XXX XXX XXX), format email (lowercase), format adresu (miasto, ulica, kod).
Walidacja emailów: format (regex: xxx@xxx.xx). Nie wysyłaj maili na złe adresy — bounce rate szkodzi domenie.
Walidacja URL: czy strona istnieje? Szybki test: otwórz w przeglądarce. Martwe linki = usuń lub oznacz.
Cross-check (M/L): porównaj dane z 2+ źródeł. Telefon z CEIDG = telefon z Google Maps? Email ze strony = email z Panoramy Firm?
Flagi jakości (L): kolumna „Jakość”: Wysoka (dane z oficjalnej strony, zweryfikowane), Średnia (z katalogu, niezweryfikowane), Niska (stare/wątpliwe).
Krok 5: Raport (M/L, ~1–3h)
Metodologia: jakie źródła, jakie kryteria, ile przeszukano, ile odrzucono i dlaczego.
Statystyki: ilość rekordów, podział per region/branża/wielkość, kompletność pól (np. „87% firm ma email, 62% ma stronę www”).
Wnioski (L): co wynika z danych? Np. „Rynek jest skoncentrowany — 5 firm ma 60% udziału. Ceny wahają się o 40% między najtanszym a najdroższym dostawcą.”
Rekomendacje (L): co firma powinna zrobić z tymi danymi? Np. „Najlepszy segment do cold mailingu: firmy 10–50 pracowników w województwie mazowieckim — najwyższa gęstość i najniższa konkurencja.”
Legalność i etyka — OBOWIĄZKOWE
ZBIERAMY TYLKO DANE PUBLICZNE — dostępne bez logowania, bez płatności, bez łamania zabezpieczeń.
Dane firmowe (nazwa, adres, NIP, telefon firmowy, email firmowy, strona www) są publiczne i można je zbierać.
Dane osób prywatnych (email prywatny, telefon osobisty) — NIE zbieramy. RODO.
LinkedIn: zbieraj ręcznie (kopiuj imię, stanowisko, firma). NIE używaj scraperów automatycznych (narusza ToS LinkedIn).
Szanuj robots.txt: jeśli strona zabrania scrapingu — zbieraj ręcznie lub pomiń.
NIE sprzedawaj zebranych danych osobom trzecim. Dane są dla FIRMY-ZLECENIODAWCY.
W razie wątpliwości: zapytaj na platformie Student2Work. Lepiej odpuścić wątpliwe źródło niż ryzykować problem prawny.
CZERWONA LINIA: nie łam haseł, nie używaj fałszywych kont, nie zbieraj danych medycznych/finansowych osób prywatnych, nie naruszaj regulaminów serwisów.
Narzędzia
Google Advanced Search operatory: site:, intitle:, inurl:, filetype:. Precyzyjne wyszukiwanie.
Data Miner / Instant Data Scraper rozszerzenia Chrome do ekstrakcji tabel i list ze stron. Darmowe.
Google Sheets (IMPORTHTML/IMPORTXML) pobieranie tabel ze stron bezpośrednio do arkusza.
CEIDG / KRS / GUS rejestry publiczne — oficjalne dane firmowe PL.
Excel (Power Query) łączenie i czyszczenie danych z wielu źródeł (M/L).
Hunter.io / Snov.io (darmowy tier) wyszukiwanie emailów firmowych na podstawie domeny. 25–50 darmowych wyszukiwań/mies.
Najczęstsze problemy
Firma chce „emails osób decyzyjnych” (CEO, dyrektorzy). Emaile służbowe osób publicznych (np. CEO w KRS, na stronie firmy) = OK. Emaile prywatne = NIE. LinkedIn profil publiczny = imię + stanowisko + firma, bez email/telefon (chyba że podane publicznie).
Dane są nieaktualne / firmy już nie istnieją. Cross-check z CEIDG/KRS (status: aktywna/zawieszona/wyrejestrowana). Oznacz kolumną „status”. Poinformuj firmę o odsetku nieaktualnych.
Za mało firm spełnia kryteria. Poszerz kryteria (większy region, pokrewne branże) lub zgłoś firmie: „W tym regionie jest tylko 47 firm spełniających kryteria, nie 100. Rozszerzyć kryteria czy dostarczyć 47?”
F',
  499, 1399,
  '[{"name": "S", "label": "Pakiet S", "price": 499, "delivery_time_days": 10, "scope": ""}, {"name": "M", "label": "Pakiet M", "price": 899, "delivery_time_days": 20, "scope": ""}, {"name": "L", "label": "Pakiet L", "price": 1399, "delivery_time_days": 35, "scope": ""}]'::jsonb, 5, 'Analiza danych',
  false, 0.25, true, 'platform_service', 'active', NULL
);

-- #30: Wdrażanie produktów na sklepy e-commerce
INSERT INTO public.service_packages (
  title, description, locked_content, price, price_max,
  variants, delivery_time_days, category,
  requires_nda, commission_rate, is_system, type, status, student_id
) VALUES (
  'Wdrażanie produktów na sklepy e-commerce',
  'Wdrażanie produktów na sklepy e-commerce
Dodawanie produktów na Allegro, Amazon, WooCommerce i inne platformy — opisy, zdjęcia, warianty, SEO, import masowy
O co chodzi
Masz 50 produktów do dodania na Allegro. Albo 200. Każdy wymaga: tytułu zoptymalizowanego pod wyszukiwarkę, opisu z parametrami, 5–10 zdjęć, wariantów (rozmiar, kolor), kategorii, ceny, stawki VAT, kosztu wysyłki. Godziny monotonnej pracy która nie przynosi przychodu.
Student e-commerce doda WSZYSTKIE produkty profesjonalnie: tytuły pod SEO, opisy sprzedające, parametry wypełnione, zdjęcia przycięte i zoptymalizowane, warianty skonfigurowane. Na Allegro, Amazon, WooCommerce, Shopify, PrestaShop, BaseLinker lub dowolnej platformie.
Dobrze wdrożony produkt na Allegro (pełne parametry + SEO tytuł + 8+ zdjęć) ma średnio 3× większy zasięg w wyszukiwarce niż produkt dodany „po łebkach”.
Jakie platformy obsługujemy
Allegro największy marketplace w Polsce. Tytuły SEO, parametry, warianty (rozmiar/kolor), opisy HTML, zdjęcia, oferty Allegro Smart
Amazon (.pl / .de / .co.uk) listings, bullet points, A+ Content (EBC), backend keywords, warianty (parent-child), FBA/FBM konfiguracja
WooCommerce produkty proste i z wariantami, kategorie, tagi, zdjęcia, SEO (Yoast), atrybuty, import CSV
Shopify produkty, kolekcje, warianty, zdjęcia, metafields, SEO title/description
PrestaShop produkty, kombinacje, kategorie, atrybuty, import CSV/XML
BaseLinker / inne integratory masowy import z pliku CSV/XML, mapowanie kategorii, synchronizacja stanów magazynowych
Wybierz pakiet
Jak te ceny wyglądają na tle rynku
Student2Work: od 7 PLN/produkt (pakiet L) do 17 PLN/produkt (pakiet S). Tańszy niż freelancer i agencja, z pełnym SEO i parametrami (w przeciwieństwie do wirtualnej asystentki).
Co musisz dostarczyć
Dostęp do platformy — konto sprzedawcy (Allegro, Amazon Seller Central, panel WooCommerce). Student jako współpracownik/podkonto.
Lista produktów — Excel / CSV z: nazwa, cena, warianty, parametry, EAN/GTIN (jeśli dotyczy).
Zdjęcia produktów — min. 3 zdjęcia per produkt (główne, detale, użycie). Min. 1000×1000 px. Białe tło preferowane (Amazon wymaga).
Opisy / specyfikacja — dane techniczne, skład, wymiary, waga, materiał, certyfikaty. Student FORMATUJE i optymalizuje, nie wymyśla specyfikacji.
Ceny + VAT — ceny brutto/netto, stawka VAT per produkt. Koszty wysyłki.
Polityka zwrotów / gwarancja — warunki zwrotów, okres gwarancji (wymagane na Allegro/Amazon).
Czego pakiety NIE obejmują
Fotografii produktowej — student DODAJE zdjęcia dostarczone przez firmę, nie robi zdjęć. Fotografia = osobna usługa.
Pisania opisów od zera — student OPTYMALIZUJE i FORMATUJE dane dostarczone przez firmę. Pełny copywriting produktów = #06.
Prowadzenia sprzedaży — jednorazowe wdrożenie. Obsługa zamówień, zwroty, komunikacja z klientami = firma.
Reklam Allegro Ads / Amazon PPC — student dodaje produkty, nie prowadzi kampanii reklamowych.
Integracji z ERP / magazynem — konfiguracja BaseLinker (L) tak, ale integracja z Subiekt/WMS = developer.
Jak wygląda proces
Dzień 1–2: Brief + dostępy: lista produktów, zdjęcia, dane, konto sprzedawcy. Próbka: 3–5 produktów do akceptacji.
Dzień 2–3: Firma akceptuje próbkę: tytuły, opisy, zdjęcia, parametry — OK czy korekty?
Dzień 3–4 (S) / 3–10 (M) / 3–15 (L): Masowe dodawanie: student dodaje wszystkie produkty wg zaakceptowanego szablonu.
Dzień +1–2: QA: student sprawdza każdy produkt — zdjęcia widoczne? Linki działają? Warianty poprawne?
Dzień +1: Finalizacja: lista produktów z linkami + instrukcja (M/L) + przekazanie.',
  'Ta sekcja nie jest widoczna dla firmy-zleceniodawcy.
Twoje wynagrodzenie
Tempo rośnie z doświadczeniem: pierwszy produkt = 30–45 min, po 20 produktach = 15–20 min. Import masowy CSV (L) = kilka sekund per produkt po przygotowaniu pliku.
Instrukcja realizacji
Krok 1: Przygotowanie danych (~1–3h)
Sprawdź co firma dostarczyła: Excel z produktami, zdjęcia (folder ZIP?), specyfikacje.
Brakuje danych? Lista do firmy: „Produkty 12, 27, 45 — brak zdjęć. Produkt 8 — brak wymiarów. Produkt 33 — brak EAN.”
Uporządkuj zdjęcia: folder per produkt, nazwy plików = SKU_01.jpg, SKU_02.jpg itd.
Sprawdź wymagania platformy: min. rozmiar zdjęć, format (JPG/PNG), białe tło (Amazon wymaga na głównym zdjęciu), limity tytułu (Allegro 75 zn., Amazon 200 zn.).
Krok 2: Tytuły SEO (~1–3h)
Allegro: [Marka] [Nazwa produktu] [Kluczowy parametr] [Wariant] — max 75 znaków. Np. „Samsung Galaxy S24 Smartfon 128GB Czarny”. Słowa kluczowe na początku.
Amazon: [Marka] [Linia] [Typ produktu] [Kluczowa cecha] [Rozmiar/Kolor] — max 200 zn. Np. „Samsung Galaxy S24 Smartphone 128GB 6.2 inch Display Black Unlocked”.
WooCommerce: krótszy, czytelny, SEO-friendly. Np. „Samsung Galaxy S24 128GB – Czarny”. Slug = samsung-galaxy-s24-128gb-czarny.
NIE pisz CAPS LOCK, nie powtarzaj słów, nie dodawaj „NOWOŚĆ!!!” — Allegro i Amazon za to karzą (obniżenie widoczności).
Krok 3: Opisy produktów (~3–10h)
Struktura opisu: 1) Krótki lead (2–3 zdania — co to jest, dla kogo, główna korzyść), 2) Kluczowe cechy (lista 4–6 bulletów), 3) Specyfikacja techniczna (tabela), 4) Zastosowanie / dla kogo, 5) W zestawie / co otrzymujesz, 6) CTA.
Allegro: HTML dozwolony (nagłówki, listy, tabele, bold). Używaj szablonów HTML — spójny wygląd całego sklepu.
Amazon: Bullet points (5 punktów, każdy zaczynaj od korzyści WIELKIMI LITERAMI). A+ Content (L): moduły graficzne z tekstem.
WooCommerce: krótki opis (widoczny na liście) + długi opis (na stronie produktu).
ZASADA: Opis sprzedaje KORZYŚCI, nie parametry. Nie „bateria 5000 mAh” ale „bateria 5000 mAh — 2 dni bez ładowania przy normalnym użytkowaniu”.
Krok 4: Parametry i warianty (~2–8h)
Parametry: WYPEŁNIJ WSZYSTKIE dostępne (nie tylko wymagane). Każdy wypełniony parametr = produkt pojawia się w dodatkowych filtrach = więcej wyświetleń.
Allegro: parametry są per kategoria. Wejdź w kategorię → sprawdź jakie parametry są dostępne → wypełnij maksymalnie.
Warianty: rozmiar, kolor, pojemność — skonfiguruj jako warianty (NIE osobne oferty). 1 oferta z wariantami > 10 osobnych ofert.
Amazon parent-child: parent = listing ogólny (niewidoczny), child = każdy wariant. Konfiguracja w pliku Flat File lub Seller Central.
EAN/GTIN: obowiązkowy na Allegro i Amazon. Firma MUSI dostarczyć. Brak EAN = produkt może być zablokowany.
Krok 5: Zdjęcia (~1–4h)
Wymagania: Allegro min. 800×800 px (rek. 1600×1600). Amazon min. 1000×1000 (główne: białe tło, produkt 85% kadru). WooCommerce: 800×800+ (spójny format).
Kolejność: 1) Główne (przód, białe tło), 2) Kąty (bok, tył), 3) Detale (tekstura, zamek, logo), 4) Użycie (produkt w kontekście), 5) Wymiary/skala, 6) Opakowanie.
Optymalizacja: kompresja bez utraty jakości (TinyPNG / Squoosh). Nazwy: marka-produkt-kolor-01.jpg (SEO).
Brak zdjęć od firmy: poprosić lub użyć zdjęć producenta (jeśli firma ma pozwolenie / jest autoryzowanym dystrybutorem).
Krok 6: Import masowy (L, ~2–5h)
CSV/XML: przygotuj plik zgodny ze schematem platformy. Allegro: REST API lub plik importu. WooCommerce: CSV z określonymi kolumnami. Amazon: Flat File.
Testuj import na 5–10 produktach ZANIM zaimportujesz 200. Sprawdź: zdjęcia widoczne? Warianty poprawne? Ceny ok? Kategorie ok?
BaseLinker: mapuj pola (nazwa → tytuł, cena → price, zdjęcia → images). Synchronizacja stanów magazynowych.
Szablon CSV: dostarczy firmie PUSTY szablon z instrukcją — firma może dodawać nowe produkty samodzielnie w przyszłości.
Narzędzia
Allegro Seller Panel dodawanie produktów, statystyki, zarządzanie ofertami
Amazon Seller Central listings, warianty, A+ Content, Flat File import
WooCommerce (panel WP) produkty, kategorie, atrybuty, import CSV
BaseLinker integracja multi-platform, masowy import/eksport, synchronizacja
TinyPNG / Squoosh kompresja zdjęć bez utraty jakości
Canva / Photopea edycja zdjęć, usuwanie tła, infografiki produktowe
Najczęstsze problemy
Firma nie ma zdjęć produktów. „Bez zdjęć nie da się sprzedać online. Minimum 3 zdjęcia per produkt. Jeśli jesteś dystrybutorem — użyj zdjęć producenta. Jeśli własny produkt — zrób zdjęcia telefonem na białym tle (darmowe poradniki na YouTube).”
Brak EAN / kodów kreskowych. „Allegro i Amazon wymagają EAN. Producent powinien dostarczyć EAN. Jeśli własna marka — kup EAN przez GS1 Polska (~250 PLN za 10 kodów). Amazon: można złożyć wniosek o Brand Registry i używać własnych ASIN.”
200 produktów ale każdy ma 10 wariantów. „200 produktów × 10 wariantów = 2000 SKU. To ZNACZNIE więcej pracy niż 200 prostych produktów. Wycenię per SKU, nie per produkt bazowy.”
Firma chce „od razu sprzedawać” ale nie ma konta. „Założenie konta sprzedawcy (Allegro, Amazon) = po stronie firmy. Mogę doradzić i przeprowadzić przez proces, ale konto musi być na dane firmy.”
Checklist końcowy
Próbka 3–5 produktów zaakceptowana
Wszystkie produkty dodane na platformę/platformy
Tytuły SEO — słowa kluczowe, marka, parametry, poprawna długość
Opisy — struktura HTML, korzyści, specyfikacja, CTA
Parametry — WSZYSTKIE dostępne wypełnione (nie tylko wymagane)
Warianty — poprawnie skonfigurowane, zdjęcia per wariant (M/L)
Zdjęcia — min. 3 per produkt, poprawna kolejność, skompresowane, białe tło
Ceny + VAT — poprawne, koszty wysyłki ustawione
Kategorie — właściwe, tagi/keywords dodane
QA: każdy produkt sprawdzony — wyświetla się poprawnie, linki działają
Lista produktów z linkami dostarczona firmie
Instrukcja (M/L) + szablon CSV (L) przekazany
Wiadomość podsumowująca na platformie
Student2Work — Łączymy ambicje studentów z potrzebami firm',
  499, 1399,
  '[{"name": "S", "label": "Pakiet S", "price": 499, "delivery_time_days": 10, "scope": "✔ Opis standardowy (parametry + korzyści + specyfikacja)"}, {"name": "M", "label": "Pakiet M", "price": 899, "delivery_time_days": 22, "scope": "✔ + Opisy HTML ze strukturą (nagłówki, listy, tabela parametrów, CTA)"}, {"name": "L", "label": "Pakiet L", "price": 1399, "delivery_time_days": 40, "scope": "✔ + Opisy sprzedażowe (storytelling, pain points, korzyści) + A+ Content (Amazon)"}]'::jsonb, 5, 'Programowanie i IT',
  false, 0.25, true, 'platform_service', 'active', NULL
);

-- #31: Dokumentacja techniczna — user guide, API docs, README, inst
INSERT INTO public.service_packages (
  title, description, locked_content, price, price_max,
  variants, delivery_time_days, category,
  requires_nda, commission_rate, is_system, type, status, student_id
) VALUES (
  'Dokumentacja techniczna — user guide, API docs, README, instrukcje',
  'Dokumentacja techniczna — user guide, API docs, README, instrukcje
Profesjonalna dokumentacja Twojego oprogramowania — dla użytkowników, developerów i zespołu wewnętrznego
O co chodzi
Twój zespół zbudował aplikację. Ale nikt nie opisał jak z niej korzystać. Nowy pracownik męczy się 3 tygodnie zamiast 3 dni. Klient pisze „jak to działa?” co godzinę na support. Developer odchodzi z firmy — i zabiera wiedzę o systemie ze sobą.
Student technical writingu napisze profesjonalną dokumentację: user guide dla użytkowników końcowych, dokumentację API dla developerów, README dla open source, instrukcje wdrożeniowe, wiki wewnętrzne. Jasna, ustrukturyzowana, z przykładami i screenshotami.
Firmy z dobrą dokumentacją zmniejszają zapytania na support o 40–60% i skracają czas onboardingu nowych pracowników o połowę.
Co możemy napisać
User Guide / Podręcznik użytkownika: jak korzystać z aplikacji krok po kroku. Dla klientów końcowych. Screenshoty, procedury, FAQ.
Dokumentacja API (REST / GraphQL): endpointy, metody, parametry, przykłady request/response, kody błędów, autoryzacja. Format: Markdown, Swagger/OpenAPI, Postman Collection.
README + Getting Started: jak zainstalować, skonfigurować i uruchomić projekt. Dla developerów. Wymagania, instalacja, konfiguracja, przykłady użycia.
Instrukcja administracyjna: jak zarządzać systemem: konfiguracja serwera, backup, monitoring, troubleshooting, aktualizacje.
Wiki wewnętrzne / Knowledge Base: baza wiedzy zespołu: architektura systemu, konwencje kodu, procesy, onboarding nowego developera.
Instrukcja wdrożeniowa (deployment): jak wdrożyć aplikację: środowiska, CI/CD, zmienne środowiskowe, checklist deploymentu.
Release notes / Changelog: opis zmian w kolejnych wersjach — nowe funkcje, poprawki, breaking changes.
Wybierz pakiet
Jak te ceny wyglądają na tle rynku
Student2Work: 3–7× taniej niż freelancer technical writer. Idealny dla startupów i małych zespołów dev które nie mają budżetu na pełnoetatowego tech writera.
Co musisz dostarczyć
Dostęp do aplikacji / systemu — konto testowe, środowisko staging, repozytorium (GitHub/GitLab jeśli API docs / README).
Istniejąca dokumentacja — cokolwiek macie: notatki, Confluence, wiki, README, komentarze w kodzie, user stories, makiety.
Kontakt do eksperta — developer / PM który odpowie na pytania techniczne (2–4 sesje po 30–60 min).
Grupa docelowa — dla kogo piszemy? Klient końcowy (nie-techniczny)? Developer integrujący API? Administrator systemu? Nowy pracownik?
Branding — logo, kolory, ton głosu (formalny / luźny) — jeśli dokumentacja będzie publiczna.
Czego pakiety NIE obejmują
Pisania kodu / naprawiania bugów — student DOKUMENTUJE istniejący system, nie rozwija go.
Tworzenia API — student dokumentuje ISTNIEJĄCE endpointy, nie projektuje nowych.
Tłumaczenia — dokumentacja w 1 języku (PL lub EN). Tłumaczenie = dodatkowy koszt.
Utrzymania dokumentacji — jednorazowe napisanie. Aktualizacje przy nowych wersjach = nowe zlecenie.
Szkolenia / wdrożeń — student pisze dokumentację, nie prowadzi szkoleń (choć dokumentacja MOŻE służyć jako materiał szkoleniowy).
Jak wygląda proces
Dzień 1–2: Discovery: student poznaje system — sesja z ekspertem, przejście aplikacji, lektura istniejących materiałów.
Dzień 2–3: Plan dokumentacji: spis treści, struktura, podział na sekcje. Firma akceptuje plan.
Dzień 3–5 (S) / 3–9 (M) / 3–14 (L): Pisanie: sekcja po sekcji, screenshoty, przykłady kodu, diagramy.
Dzień +1–2: Review #1: firma sprawdza merytorycznie (czy poprawne technicznie?). Student koryguje.
Dzień +1–2: Finalizacja: hosting (M/L), PDF eksport (L), przekazanie.',
  'Ta sekcja nie jest widoczna dla firmy-zleceniodawcy.
Twoje wynagrodzenie
Instrukcja realizacji
Krok 1: Discovery — poznaj system (~2–4h)
Przejdź aplikację jako użytkownik: każdy ekran, każdy przycisk, każdy flow. Rób screenshoty NA BIEŻĄCO.
Przeczytaj istniejącą dokumentację (README, wiki, Confluence, komentarze w kodzie, user stories, Jira).
Sesja z ekspertem (30–60 min): przygotuj pytania PRZED sesją. Nagraj (za zgodą). Pytania: „Kto jest odbiorca? Co robi system? Jakie są główne ścieżki? Co jest skomplikowane? Jakie pytania zadają użytkownicy najczęściej?”
API: przejrzyj endpointy (Swagger/OpenAPI jeśli jest), przetestuj w Postman. Zapisz request/response.
Krok 2: Plan dokumentacji (~1–2h)
Spis treści: zaplanuj WSZYSTKIE sekcje zanim zaczniesz pisać. Firma musi zaakceptować plan.
User Guide typowa struktura: 1) Wstęp (co to jest, dla kogo), 2) Wymagania (przeglądarka, OS, konto), 3) Pierwsze kroki (rejestracja, logowanie, konfiguracja), 4) Główne funkcje (sekcja per moduł), 5) Zarządzanie kontem, 6) FAQ / Troubleshooting, 7) Kontakt / Support.
API Docs typowa struktura: 1) Overview (co robi API, base URL, wersja), 2) Autoryzacja (API key, OAuth, Bearer token), 3) Endpointy pogrupowane per zasób (Users, Orders, Products...), 4) Każdy endpoint: metoda, URL, parametry, request body, response, kody błędów, przykład, 5) Rate limiting, 6) Changelog.
README typowa struktura: 1) Tytuł + opis (1–2 zdania), 2) Features, 3) Prerequisites, 4) Installation, 5) Configuration (.env), 6) Usage / Quick Start, 7) API reference (jeśli mały), 8) Contributing, 9) License.
Krok 3: Pisanie — zasady technical writingu (~10–35h)
JĘZYK: prosty, jednoznaczny, krótki. Zdanie max 20 słów. Akapit max 5 zdań. Używaj strony czynnej („Kliknij przycisk” nie „Przycisk powinien zostać kliknięty”).
PROCEDURY: numerowane kroki. Każdy krok = JEDNA akcja. Nie „Kliknij Ustawienia i zmień hasło” ale „1. Kliknij Ustawienia. 2. Wybierz Bezpieczeństwo. 3. Kliknij Zmień hasło.”
SCREENSHOTY: każdy screenshot z adnotacją (strzałka / ramka / numer kroku). Rozmiar czytelny. Nie wstawiaj screenshotów całego ekranu — przytnij do RELEVANTNEGO obszaru.
KOD: syntax highlighting. Każdy przykład kodu musi być DZIAŁAJĄCY (skopiuj → wklej → działa). Przetestuj każdy przykład.
SPÓJNOŚĆ: jeden termin = jedno znaczenie. Jeśli mówisz „dashboard” — nie mów potem „panel”, „konsola”, „strona główna”. Glosariusz (L) rozwiązuje ten problem.
NAWIGACJA: każda sekcja samodzielna (użytkownik może wejść z dowolnego miejsca). Cross-references: „Więcej o autoryzacji → Sekcja 2.1”.
OSTRZEZENIA: używaj admonitions (Note, Warning, Tip, Caution). Wyróżnij wizualnie.
ZASADA #1: Pisz dla kogoś kto NIGDY nie widział tego systemu. Jeśli musisz założyć wiedzę — napisz explicit: „Wymagana znajomość REST API i formatu JSON.”
Krok 4: Dokumentacja API — specyfika (~5–15h jeśli dotyczy)
Każdy endpoint: METHOD /path → opis → parametry (path, query, body) → response (sukces + błędy) → przykład.
Przykłady w wielu językach: cURL (zawsze), Python requests, JavaScript fetch, PHP (opcjonalnie). Realne dane (nie „string” ale „john@example.com”).
Kody błędów: tabela z kodem, opisem i rozwiązaniem. Np. 401 Unauthorized — „Sprawdź czy token jest ważny. Tokeny wygaśają po 24h.”
Swagger / OpenAPI (M/L): jeśli firma ma plik openapi.yaml/json — użyj go jako bazy. Jeśli nie — stwórz na podstawie testowania endpointów w Postman.
Postman Collection (L): eksportuj kolekcję z przykładami requestów — firma może zaimportować i testować od razu.
Krok 5: Diagramy (~1–4h)
Narzędzia: Mermaid (diagram as code — wersjonowalne!), Draw.io / Diagrams.net (darmowy), Lucidchart, Figma.
Typy diagramów: Flowchart (przepływ użytkownika), Sequence diagram (interakcja API), Architecture diagram (komponenty systemu), ER diagram (baza danych).
ZASADA: diagram musi być czytelny BEZ dodatkowego wyjaśnienia. Etykiety na strzałkach. Legenda kolorów. Max 10–15 elementów per diagram (więcej = podziel).
Krok 6: Hosting i format (~1–2h)
Markdown (.md): uniwersalny, wersjonowalny (Git), renderuje się na GitHub/GitLab. Standard dla README i API docs.
GitBook: darmowy plan (1 space). Markdown → ładna strona z nawigacją i wyszukiwaniem. Idealny na user guide i API docs.
Notion: dobre na wiki wewnętrzne. Firma pewnie już używa — zapytaj.
Confluence: korporacyjny standard. Jeśli firma ma — pisz tam bezpośrednio.
Docusaurus / MkDocs (L): static site generators dla dokumentacji. Developer-friendly. Wymaga deploy (GitHub Pages / Netlify).
PDF eksport (L): z GitBook/MkDocs. Dla firm które potrzebują offline/print.
Narzędzia
Markdown + VS Code pisanie dokumentacji. Rozszerzenia: Markdown All in One, Markdown Preview Enhanced.
GitBook hosting dokumentacji z nawigacją i wyszukiwaniem. Darmowy plan.
Postman testowanie i dokumentowanie API. Eksport do Collection / OpenAPI.
Draw.io / Mermaid diagramy (architektura, flowchart, sequence). Draw.io = GUI. Mermaid = kod.
Lightshot / ShareX / CleanShot screenshoty z adnotacjami.
Swagger Editor edycja i walidacja plików OpenAPI/Swagger.
Najczęstsze problemy
Firma nie ma żadnej dokumentacji („zaczynamy od zera”). To normalne i to właśnie jest wartość tej usługi. Discovery session z ekspertem = kluczowa. Przygotuj 20–30 pytań. Nagraj sesję. Przejdź aplikację samodzielnie.
Developer nie ma czasu na sesje. „Potrzebuję 2–4 sesje po 30 min. Bez dostępu do wiedzy technicznej nie mogę napisać poprawnej dokumentacji. Alternatywa: asynchroniczne Q&A przez Slack/email.”
System jest skomplikowany — trudno zrozumieć. To DOBRZE — skomplikowany system = najbardziej potrzebuje dokumentacji. Zacznij od big picture (diagram architektury), potem schodź w detale.
Firma chce „dokumentację która się sama aktualizuje”. „Dokumentacja wymaga utrzymania — tak jak kod. Mogę stworzyć strukturę łatwą do aktualizacji (Markdown + Git) i instrukcję jak aktualizować. Automatyczna generacja API docs z kodu = Swagger/OpenAPI (jeśli firma doda adnotacje).”
Checklist końcowy
Discovery wykonane — system poznany, pytania zadane, ',
  699, 1799,
  '[{"name": "S", "label": "Pakiet S", "price": 699, "delivery_time_days": 14, "scope": "1 typ dokumentacji (np. user guide LUB API docs LUB README)"}, {"name": "M", "label": "Pakiet M", "price": 1199, "delivery_time_days": 24, "scope": "2 typy dokumentacji (np. user guide + API docs)"}, {"name": "L", "label": "Pakiet L", "price": 1799, "delivery_time_days": 40, "scope": "3–4 typy dokumentacji + spójny system dokumentacyjny"}]'::jsonb, 7, 'Copywriting',
  false, 0.25, true, 'platform_service', 'active', NULL
);

-- #32: Specyfikacja wymagań programowych — SRS, user stories, specy
INSERT INTO public.service_packages (
  title, description, locked_content, price, price_max,
  variants, delivery_time_days, category,
  requires_nda, commission_rate, is_system, type, status, student_id
) VALUES (
  'Specyfikacja wymagań programowych — SRS, user stories, specyfikacja funkcjonalna',
  'Specyfikacja wymagań programowych — SRS, user stories, specyfikacja funkcjonalna
Profesjonalny dokument wymagań który mówi developerom dokładnie CO zbudować — zanim napiszesz pierwszą linię kodu
O co chodzi
Chcesz zbudować aplikację. Mówisz developerowi „zrób mi taką apkę jak Uber ale dla psich fryzjerów”. Developer buduje coś innego niż myślałeś. 3 miesiące zmarnowane, 50 000 PLN w błoto. Bo nie było specyfikacji.
Student analityk przetłumaczy Twoją WIZJĘ na język TECHNICZNY: specyfikacja wymagań (SRS), user stories, diagramy przepływów, makiety, kryteria akceptacji. Developer dostaje JASNY dokument — wie dokładnie co budować, jak powinno działać, jakie są edge cases.
Projekty IT bez specyfikacji mają 3× większe ryzyko przekroczenia budżetu i 2× większe ryzyko porażki (Standish Group CHAOS Report).
Dla kogo ta usługa
Startup z pomysłem na aplikację: masz wizję ale nie wiesz jak ją opisać technicznie. Specyfikacja = dokument dla software house’u / developera.
Firma zlecająca development: zamawiasz aplikację u software house’u — specyfikacja chroni Cię przed „to nie było w zakresie”.
Zespół dev bez analityka: programiści piszą kod ale nikt nie opisał wymagań — każdy rozumie inaczej.
Firma szukająca finansowania: inwestor / grant (NCBiR, PARP) wymaga dokumentacji technicznej projektu.
Firma z legacy systemem: system działa ale nikt nie wie jak — potrzeba reverse-engineer wymagań.
Wybierz pakiet
Jak te ceny wyglądają na tle rynku
Student2Work: 2–7× taniej niż freelance analityk, 4–18× taniej niż software house. Specyfikacja za 1 399 PLN może zaoszczędzić 10 000–50 000 PLN na zmianach w trakcie developmentu.
Co musisz dostarczyć
Opis pomysłu — co ma robić aplikacja? Dla kogo? Jaki problem rozwiązuje? (nawet notatki na kartce)
Przykłady — aplikacje które robią coś podobnego („chcę jak Uber ale dla...”, „jak Allegro ale z...”)
Role użytkowników — kto będzie korzystać? Administrator, użytkownik końcowy, moderator, sprzedawca...
Czas na sesje — 2–5 sesji (30–60 min) z studentem: wywiad, doprecyzowanie wymagań, walidacja
Istniejące materiały — jeśli masz: szkice ekranów, notatki, prezentacje, dokumenty z grantów
Czego pakiety NIE obejmują
Budowania aplikacji — student pisze WYMAGANIA, nie kod. Specyfikacja = input dla developera.
Projektowania UI/UX — wireframes (M/L) = szkice układu. Pełny projekt graficzny UI = #18.
Estymacji kosztów developmentu — student szacuje złożoność (story points w L), ale NIE wycenia w PLN. Wycena = software house.
Zarządzania projektem — jednorazowe napisanie specyfikacji, nie ciągły Product Owner.
Badań rynku / walidacji pomysłu — student dokumentuje TWOJĄ wizję, nie weryfikuje czy pomysł ma rynek.
Jak wygląda proces
Dzień 1–2: Discovery: 1–2 sesje z firmą. Student zadaje pytania: co, dla kogo, jakie funkcje, jakie role, jakie integracje?
Dzień 2–4: Analiza: student definiuje role, user stories, wymagania funkcjonalne i niefunkcjonalne. Diagramy use case.
Dzień 4–5 (S) / 4–9 (M) / 4–14 (L): Pisanie SRS: dokument sekcja po sekcji. Wireframes (M/L). Backlog w Jira/Trello (M/L).
Dzień +1–2: Review #1: firma sprawdza — „czy dobrze zrozumiałeś?”. Student koryguje.
Dzień +1–2: Finalizacja: poprawki, prototyp (L), prezentacja podsumowująca (L).',
  'Ta sekcja nie jest widoczna dla firmy-zleceniodawcy.
Twoje wynagrodzenie
To usługa o bardzo wysokiej wartości edukacyjnej — analiza wymagań to kompetencja która czyni Cię DROŻSZYM na rynku pracy (analityk biznesowy = 12–20k PLN/mies.).
Instrukcja realizacji
Krok 1: Discovery — wywiad z klientem (~2–4h)
Przygotuj pytania PRZED sesją. Kluczowe: Co ma robić aplikacja? Kto będzie używał? Jaki problem rozwiązuje? Jakie są najważniejsze funkcje? Jakie integracje (płatności, mapy, email, inne systemy)? Jakie dane przechowuje? Kto jest administratorem?
Technika: 5 Why’s — „Dlaczego?” 5 razy. Klient mówi „chcę dashboard” → „Po co?” → „żeby widzieć sprzedaż” → „Co dokładnie chcesz widzieć?” → „Przychody per produkt per miesiąc”. TERAZ wiesz co zbudować.
Nagraj sesję (za zgodą). Transkrypcja > notatki.
User journey: przeprowadź klienta przez całą ścieżkę: „Użytkownik wchodzi na stronę... co widzi? Co klika? Co się dzieje potem?”
Krok 2: User Stories (~2–6h)
Format: „Jako [rola] chcę [akcja] żeby [korzyść].” Np. „Jako klient chcę filtrować produkty po cenie żeby szybko znaleźć coś w moim budżecie.”
Każde user story: ID (US-001), tytuł, opis (jako/chcę/żeby), kryteria akceptacji (Given/When/Then lub checklist), priorytet (MoSCoW: Must/Should/Could/Won’t).
Kryteria akceptacji przykład: „Given: użytkownik jest na stronie produktu. When: klika „Dodaj do koszyka”. Then: produkt pojawia się w koszyku, ilość = 1, cena poprawna, badge koszyka +1.”
Epiki (M/L): grupuj user stories w większe całości. Np. Epik: „Koszyk i checkout” → US-012: Dodaj do koszyka, US-013: Zmień ilość, US-014: Usuń z koszyka, US-015: Przejdź do płatności.
Story points (L): relatywna złożoność. Fibonacci: 1, 2, 3, 5, 8, 13, 21. Punkt odniesienia: „US-001 = 3 punkty (prosta).” Reszta relatywnie.
ZASADA: User story = JEDNA funkcja, JEDEN cel użytkownika. Nie „Jako admin chcę zarządzać użytkownikami” (zbyt ogólne) ale „Jako admin chcę zablokować użytkownika żeby chronić platformę przed spamem.”
Krok 3: Dokument SRS (~4–15h)
Struktura SRS (IEEE 830 zmodyfikowana): 1) Wprowadzenie (cel, zakres, definicje, akronimy), 2) Opis ogólny (perspektywa produktu, funkcje, klasy użytkowników, środowisko), 3) Wymagania funkcjonalne (pogrupowane per moduł, każde z ID + priorytet), 4) Wymagania niefunkcjonalne (wydajność, bezpieczeństwo, skalowalność, RODO), 5) Interfejs użytkownika (opisy ekranów / wireframes), 6) Integracje zewnętrzne (API, płatności, email, mapy), 7) Założenia i ograniczenia, 8) Załączniki (diagramy, wireframes, glosariusz).
Każde wymaganie: REQ-F-001 (F = functional, NF = non-functional). Opis jednoznaczny. Testowalny (jak sprawdzić czy spełnione?). Priorytet (MoSCoW).
ZASADA: Wymaganie musi być TESTOWALNE. Nie „system powinien być szybki” ale „strona główna ładuje się w <3 sekundy na łączu 10 Mbps”.
Wymagania niefunkcjonalne: wydajność (response time, throughput), bezpieczeństwo (szyfrowanie, autoryzacja, OWASP Top 10), dostępność (uptime 99.9%), skalowalność (ilu użytkowników jednocześnie), backup (RPO/RTO), RODO (dane osobowe, prawo do usunięcia, zgody).
Krok 4: Diagramy (~2–6h)
Use Case Diagram: aktorzy (role) i ich interakcje z systemem. Narzędzia: Draw.io, PlantUML, Mermaid.
Flowchart / Activity Diagram: główne przepływy (rejestracja, zakup, zamówienie). Warunkowe rozgałęzienia (jeśli/jeśli nie).
ER Diagram (M/L): model danych — encje (User, Product, Order), atrybuty, relacje (1:N, N:M).
Architecture Diagram (M/L): komponenty systemu (frontend, backend, baza, API, integracje). Big picture.
Sequence Diagram (L): interakcja między komponentami krok po kroku (użytkownik → frontend → API → baza → response).
State Diagram (L): stany obiektów (zamówienie: nowe → opłacone → w realizacji → wysłane → dostarczone → zamknięte).
Krok 5: Wireframes (M/L, ~3–10h)
Low-fidelity: szare prostokąty, brak kolorów, brak grafik. Fokus na UKŁAD i FUNKCJE, nie wygląd.
Narzędzia: Figma (rekomendowane — darmowe, prototyp klikalny), Balsamiq (celowo brzydkie — nikt nie dyskutuje o kolorach), Whimsical.
Każdy ekran: co widzi użytkownik? Jakie elementy (przyciski, formularze, listy)? Co się dzieje po kliknięciu?
Prototyp klikalny (L): połącz ekrany w Figma (klikasz przycisk → przechodzisz na następny ekran). Firma „przechodzi” aplikację ZANIM powstała.
NIGDY nie projektuj pełnego UI (kolory, typografia, grafiki) — to zakres UI designera (#18). Wireframe = szkic układu.
Narzędzia
Figma wireframes, prototypy klikalne. Darmowy plan (3 projekty).
Draw.io / Mermaid diagramy (use case, flowchart, ER, architektura). Darmowe.
Jira / Trello / Linear backlog: user stories, epiki, priorytety, story points.
Notion / Google Docs / Word pisanie dokumentu SRS.
PlantUML diagramy UML jako kod (wersjonowalne w Git).
Miro / FigJam współpraca: user journey mapping, brainstorming z klientem.
Najczęstsze problemy
Klient nie wie czego chce („zróbcie coś fajnego”). Zadawaj KONKRETNE pytania: „Kto jest Twoim klientem? Co robi dziś bez tej aplikacji? Co mu przeszkadza? Co by chciał robić szybciej?” Technika: user journey mapping na Miro.
Scope creep („a może jeszcze dodajmy...” w trakcie). „Każda nowa funkcja = dodatkowe wymaganie. Zanotuję jako ‘Could have’ w MoSCoW. Najpierw kończymy ‘Must have’, potem rozmawiamy o rozszerzeniach.”
Firma chce od razu gotową aplikację. „Specyfikacja to FUNDAMENT. Bez niej developer buduje na ślepo. Inwestycja 1 399 PLN w specyfikację oszczędza 10–50 tys. PLN na zmianach później.”
Za dużo wymagań — nie wiadomo od czego zacząć. MoSCoW: Must Have = MVP (minimum żeby działało). Should = v1.1. Could = v2. Won’t = na razie nie. Firma widzi jasno: „to budujemy najpierw, a to potem.”
Checklist końcowy
Discovery — 2–5 sesji z klientem, wizja udokumentowana
User stories — każde z jako/chcę/żeby + kryteria akceptacji
Priorytety — MoSCoW: Must / Should / Could / Won’t
Wymagania funkcjonalne — ID, opis, priorytet, testowalne
Wymagania niefunkcjonalne — wydajność, bezpieczeństwo, RODO
Role użytkowników + matryca dostępu
Diagramy — use case + flowcharts + ER (M',
  799, 1999,
  '[{"name": "S", "label": "Pakiet S", "price": 799, "delivery_time_days": 14, "scope": ""}, {"name": "M", "label": "Pakiet M", "price": 1399, "delivery_time_days": 25, "scope": ""}, {"name": "L", "label": "Pakiet L", "price": 1999, "delivery_time_days": 40, "scope": ""}]'::jsonb, 7, 'Programowanie i IT',
  true, 0.25, true, 'platform_service', 'active', NULL
);

-- #33: Wsparcie IT / HelpDesk — pakiet godzin wsparcia technicznego
INSERT INTO public.service_packages (
  title, description, locked_content, price, price_max,
  variants, delivery_time_days, category,
  requires_nda, commission_rate, is_system, type, status, student_id
) VALUES (
  'Wsparcie IT / HelpDesk — pakiet godzin wsparcia technicznego',
  'Wsparcie IT / HelpDesk — pakiet godzin wsparcia technicznego
Student IT rozwiąże Twoje problemy techniczne — sprzęt, oprogramowanie, konta, sieć, poczta, chmura
O co chodzi
Twoja firma ma 5–30 pracowników. Nie stać Cię na pełnoetatowego informatyka. Ale co tydzień ktoś ma problem: „drukarka nie działa”, „nie mogę się zalogować”, „komputer wolno chodzi”, „jak skonfigurować służbowy email na telefonie?”. Ty tracisz czas na rozwiązywanie problemów IT zamiast zajmować się biznesem.
Student IT dostanie pakiet godzin i rozwiąże Twoje problemy: zdalnie (TeamViewer, AnyDesk) lub na miejscu (jeśli Warszawa/okolice). Konfiguracja sprzętu, rozwiązywanie problemów, instalacja oprogramowania, zarządzanie kontami, backup, bezpieczeństwo. Na koniec — raport co zrobiono + rekomendacje.
Małe firmy (5–30 osób) tracą średnio 3–5h tygodniowo na problemy IT które informatyk rozwiązałby w 30 minut.
Co możemy rozwiązać
Sprzęt biurowy: konfiguracja komputerów (Windows/Mac), drukarka/skaner, router Wi-Fi, monitor, stacja dokująca, UPS
Oprogramowanie: instalacja i konfiguracja MS Office / Google Workspace, programów branżowych, VPN, antyvirusa, backupów
Poczta e-mail: konfiguracja kont firmowych (domena, IMAP/SMTP, mobilne), migracja między dostawcami, spam filtering
Konta i uprawnienia: zakładanie/usuwanie kont pracowników, Google Workspace / Microsoft 365 admin, hasła, 2FA
Sieć biurowa: konfiguracja routera, Wi-Fi (sieć gości + firmowa), NAS, udostępnianie plików, drukarka sieciowa
Chmura: Google Drive / OneDrive / Dropbox — struktura folderów, uprawnienia, synchronizacja
Bezpieczeństwo: antywirus, firewall, aktualizacje Windows, backup automatyczny, szyfrowanie dysku (BitLocker)
Problemy pracowników: wolny komputer, brak internetu, problem z drukowaniem, zapomniane hasło, Windows Update, synchronizacja kalendarza
Wybierz pakiet
Jak te ceny wyglądają na tle rynku
Student2Work: 30–50% taniej niż informatyk na wezwanie, 3–5× taniej niż obsługa firmy IT. Idealny dla małych firm które nie potrzebują informatyka na stałe.
Co musisz dostarczyć
Listę problemów / zgłoszeń — co nie działa, co trzeba skonfigurować, co przeszkadza pracownikom
Dostęp do sprzętu — zdalny (TeamViewer / AnyDesk) lub fizyczny (wizyta w biurze)
Dostęp administratora — hasła do routerów, panelu hostingu, Google Workspace / M365 admin
Kontakt — osoba w firmie która może odebrać telefon i potwierdzić zmiany
Czego pakiety NIE obejmują
Programowania / developmentu — student KONFIGURUJE istniejące systemy, nie pisze kodu.
Zakupu sprzętu / licencji — student DORADZI co kupić, ale koszt sprzętu i oprogramowania po stronie firmy.
Naprawy sprzętu (hardware) — wymiana dysku, RAM, matrycy = serwis. Student diagnozuje i rekomenduje serwis.
Administracji serwerami / chmurą (AWS, Azure) — to zakres DevOps / sysadmin, nie HelpDesk.
SLA / gwarantowanego czasu reakcji — student odpowiada w godzinach pracy (Pn–Pt). To nie 24/7 SOC.
Jak wygląda proces
Dzień 1: Brief: student zbiera listę problemów, ustala priorytety, umawia dostęp zdalny lub wizytę.
Na bieżąco: Rozwiązywanie zgłoszeń: firma zgłasza problem (email / Trello / telefon) → student rozwiązuje → loguje czas.
Audyt (M/L): Student sprawdza całą infrastrukturę: sprzęt, sieć, konta, backup, bezpieczeństwo.
Koniec pakietu: Raport: co zrobiono, ile godzin na co, co rekomendowane na przyszłość.',
  'Ta sekcja nie jest widoczna dla firmy-zleceniodawcy.
Twoje wynagrodzenie
HelpDesk to usługa z dużym potencjałem powrotnym — firma kończy pakiet i zamawia następny. Buduj relację!
Instrukcja realizacji
Krok 1: Inwentaryzacja i priorytety (~0.5–1h)
Zbierz listę wszystkich problemów / zadań od firmy. Priorytetyzuj: krytyczne (nie można pracować), ważne (utrudnia pracę), drobne (kosmetyka / optymalizacja).
Ustal formę komunikacji: jak firma zgłasza problemy? Email? Trello board? WhatsApp? Telefon? JEDEN kanał.
Sprawdź jakie dostępy potrzebujesz: admin Google Workspace / M365, hasło routera, TeamViewer.
Krok 2: Rozwiązywanie typowych problemów
Najczęstsze problemy i rozwiązania:
„Komputer wolno chodzi” Sprawdź: startup programs (msconfig / Task Manager), dysk pełny (WinDirStat), RAM (czy wystarczająco), malware (Malwarebytes scan), aktualizacje Windows. Często: za dużo programów startujących z Windows + pełny dysk C:. Fix: wyłącz startup, oczyść temp, odinstaluj zbędne.
„Drukarka nie działa” Sprawdź: podłączenie (USB/Wi-Fi), kolejka wydruku (wyczyść), driver (reinstall z strony producenta), papier/toner. Sieciowa: IP drukarki, firewall, protokół (WSD/IPP).
„Nie działa internet” Sprawdź: kabel/Wi-Fi, router (restart), DNS (zmień na 8.8.8.8 / 1.1.1.1), ipconfig /release /renew, ping 8.8.8.8 (czy jest połączenie?). Wi-Fi: signal strength, channel congestion (WiFi Analyzer).
„Nie mogę się zalogować” Reset hasła (Google Workspace / M365 admin panel). Włącz 2FA. Sprawdź czy konto nie zablokowane.
„Email nie dochodzi / idzie do spamu” Sprawdź: SPF/DKIM/DMARC rekordy DNS (MXToolbox). Dodaj do whitelist. Sprawdź spam score (mail-tester.com).
„Jak skonfigurować email na telefonie?” IMAP/SMTP lub Exchange ActiveSync. Ustawienia per dostawca (Gmail: imap.gmail.com:993, smtp.gmail.com:587).
Krok 3: Audyt IT (M/L, ~2–5h)
Sprzęt: spisz komputery (model, RAM, dysk, wiek), drukarki, router, switch, NAS. Które do wymiany?
Oprogramowanie: Windows/Office licencje (legalne?), antywirus (jaki? aktualny?), programy branżowe.
Konta: kto ma dostęp do czego? Google Workspace / M365 — ilu użytkowników, jakie plany, czy byli pracownicy nadal mają dostęp?
Backup: czy istnieje? Automatyczny? Gdzie (lokalnie / chmura)? Kiedy ostatni test odzyskiwania?
Bezpieczeństwo: antywirus, firewall, aktualizacje Windows, 2FA, szyfrowanie dysków (BitLocker), polityka haseł.
Sieć: router (model, firmware aktualny?), Wi-Fi (hasło, gościnne?), kto ma dostęp, VPN?
Krok 4: Dokumentacja infrastruktury (L, ~2–3h)
Excel / Notion: lista sprzętu (komputer, model, SN, użytkownik, wiek), lista kont (usługa, login, admin), lista licencji (program, typ, wygaśnięcie).
Hasła: NIGDY w Excelu! Użyj menedżer haseł (Bitwarden Teams — darmowy 2 osoby, lub 1Password Business). Przekaz firmie.
Schemat sieci: prosty diagram (Draw.io) — router, switch, komputery, drukarka, NAS, internet.
Procedury: „Co robić gdy nowy pracownik” (utworzyć konto, nadać uprawnienia, skonfigurować komputer). „Co robić gdy odchodzi pracownik” (zablokuj konto, zmień hasła współdzielone, backup danych).
Krok 5: Logowanie czasu i raport (~0.5–1h)
Log godzin: data, czas (od–do), opis (co zrobiono), status (rozwiązane / w toku / eskalowane).
LOGUJ RZETELNIE. 15 min = 0.25h. Nie zaokrąglaj 20 min do 1h. Firma widzi log.
Raport końcowy: podsumowanie (ile zgłoszeń, ile rozwiązanych, ile godzin), rekomendacje (co warto zrobić dalej: wymiana sprzętu, lepszy backup, szkolenie pracowników).
Narzędzia
TeamViewer / AnyDesk zdalny dostęp do komputerów. Darmowe dla użytku niekomercyjnego (AnyDesk).
MXToolbox diagnostyka DNS, SPF, DKIM, DMARC, blacklist.
Malwarebytes skanowanie malware. Darmowa wersja do jednorazowych skanów.
WinDirStat / TreeSize analiza miejsca na dysku — co zajmuje miejsce.
WiFi Analyzer analiza sieci Wi-Fi: kanały, siła sygnału, interferencje.
Bitwarden menedżer haseł — bezpieczne przechowywanie haseł firmowych. Darmowy plan.
Najczęstsze problemy
Firma nie ma haseł do routera / panelu admina. Spróbuj domyślne hasło (admin/admin, naklejka na routerze). Jeśli nie — reset do ustawień fabrycznych (przycisk RESET 10 sek) i konfiguracja od zera. UWAGA: reset = utrata konfiguracji — zapisz obecną najpierw.
Sprzęt jest za stary (Windows 7, 4GB RAM). „Ten komputer nie spełnia minimalnych wymagań dla Windows 10/11. Rekomenduję wymianę. Mogę pomóc wybrać nowy sprzęt i przenieść dane.” Czasem: upgrade RAM + SSD = drugie życie za 300–500 PLN.
Firma używa pirackich programów. „Ta firma używa nielicencjonowanego oprogramowania. Nie mogę tego wspierać. Rekomenduję przejście na legalne alternatywy: LibreOffice (darmowy), Google Workspace (od 25 PLN/mies. per użytkownik).”
Problem wymaga specjalisty (serwer, sieć korporacyjna, cybersecurity). Eskalacja: „Ten problem wykracza poza zakres HelpDesk. Rekomenduję kontakt z firmą IT specjalizującą się w [temat]. Mogę opisać problem i przygotować brief dla specjalisty.”
Checklist końcowy
Wszystkie zgłoszenia zalogowane (data, czas, opis, status)
Krytyczne problemy rozwiązane
Audyt IT wykonany (M/L) — sprzęt, konta, backup, bezpieczeństwo
Dokumentacja infrastruktury (L) — lista sprzętu, kont, licencji
Hasła w menedżerze haseł (L) — NIE w Excelu/kartce
Schemat sieci (L)
Raport końcowy — co zrobiono, ile godzin, rekomendacje
Niewykorzystane godziny — poinformuj firmę (mogą zamówić następny pakiet)
Wiadomość podsumowująca na platformie
Student2Work — Łączymy ambicje studentów z potrzebami firm',
  399, 1399,
  '[{"name": "S", "label": "Pakiet S", "price": 399, "delivery_time_days": 5, "scope": ""}, {"name": "M", "label": "Pakiet M", "price": 799, "delivery_time_days": 12, "scope": ""}, {"name": "L", "label": "Pakiet L", "price": 1399, "delivery_time_days": 20, "scope": ""}]'::jsonb, 5, 'Programowanie i IT',
  false, 0.25, true, 'platform_service', 'active', NULL
);

-- #34: Konfiguracja infrastruktury IT — serwer, baza danych, sieć
INSERT INTO public.service_packages (
  title, description, locked_content, price, price_max,
  variants, delivery_time_days, category,
  requires_nda, commission_rate, is_system, type, status, student_id
) VALUES (
  'Konfiguracja infrastruktury IT — serwer, baza danych, sieć',
  'Konfiguracja infrastruktury IT — serwer, baza danych, sieć
Postawienie i konfiguracja małego serwera, bazy danych lub sieci firmowej — gotowe do działania
O co chodzi
Potrzebujesz serwera do przechowywania plików zespołu. Bazy danych do aplikacji. Sieci firmowej z Wi-Fi, VPN i oddzieloną siecią gości. NAS do backupów. Ale Twój zespół nie ma kompetencji — i nie stać Cię na administratora IT za 12 000 PLN/mies.
Student IT postawi i skonfiguruje infrastrukturę: serwer (Linux/Windows), bazę danych (MySQL, PostgreSQL, MongoDB), sieć firmową (router, Wi-Fi, VLAN, VPN), NAS, backup. Jednorazowa konfiguracja + dokumentacja + instrukcja obsługi.
Ta usługa dotyczy MAŁEJ infrastruktury — dla firm 3–50 osób. Enterprise (Active Directory, klastry, AWS/Azure production) = zakres starszego administratora / DevOps.
Co możemy skonfigurować
Serwery
Serwer plików (NAS / Samba): współdzielone foldery firmowe z uprawnieniami per użytkownik/zespół. Synology, QNAP lub Linux + Samba.
Serwer WWW (VPS): Nginx / Apache + PHP + SSL na VPS (DigitalOcean, Hetzner, OVH). Hosting strony / aplikacji.
Serwer aplikacji: Node.js, Python (Django/Flask), Java — deployment aplikacji na VPS z reverse proxy (Nginx) + SSL (Let’s Encrypt).
Serwer mailowy: konfiguracja własnego serwera email (Postfix + Dovecot) lub konfiguracja Google Workspace / Microsoft 365.
Bazy danych
MySQL / MariaDB: instalacja, konfiguracja, tworzenie baz i użytkowników, uprawnienia, backup automatyczny (cron + mysqldump).
PostgreSQL: instalacja, konfiguracja, role, schematy, backup (pg_dump), tunning podstawowy.
MongoDB: instalacja, konfiguracja, kolekcje, indeksy, backup, replikacja (prosty replica set).
SQLite: konfiguracja dla małych aplikacji (embedded DB). Backup = kopia pliku.
Migracja danych: import/eksport z CSV/Excel, migracja między bazami (MySQL → PostgreSQL), ETL podstawowy.
Sieci
Sieć biurowa: konfiguracja routera (MikroTik, Ubiquiti, TP-Link), Wi-Fi (SSID firmowy + gościnny), DHCP, DNS, firewall.
VLAN: separacja sieci (firmowa / gości / IoT / kamery). Wymaga managed switch.
VPN: WireGuard lub OpenVPN — bezpieczny dostęp zdalny do sieci firmowej. Praca zdalna.
NAS sieciowy: konfiguracja Synology / QNAP: foldery, uprawnienia, RAID, backup automatyczny, dostęp zdalny.
Monitoring sieci: podstawowy monitoring (Uptime Kuma, Netdata) — alerty gdy serwer/strona padnie.
Wybierz pakiet
Jak te ceny wyglądają na tle rynku
Student2Work: 2–5× taniej niż freelancer admin IT. Jednorazowa konfiguracja — potem firma zarządza samodzielnie (z instrukcją) lub zamawia #33 (pakiet wsparcia IT).
Co musisz dostarczyć
Cel — do czego potrzebujesz infrastrukturę? Hosting aplikacji? Pliki zespołu? Baza danych? VPN? Sieć biurowa?
Dostęp — VPS (dane logowania root/SSH), router (admin), NAS, panel hostingu. Jeśli nie masz — student doradzi co kupić.
Skala — ilu użytkowników? Ile danych? Ile połączeń jednocześnie? (wpływa na wybór technologii)
Budżet na infrastrukturę — koszt VPS (od 20–50 PLN/mies.), NAS (od 800 PLN), router (od 200 PLN) po stronie firmy
Nie masz VPS? Rekomendacja: Hetzner (najtańszy w Europie: VPS od 15 PLN/mies.), DigitalOcean (od 20 PLN/mies.), OVH (polskie DC: od 25 PLN/mies.).
Czego pakiety NIE obejmują
Zakupu sprzętu / VPS — student KONFIGURUJE, firma KUPUJE. Student doradzi co kupić.
Administracji ciągłej — jednorazowy setup. Utrzymanie = firma (instrukcja) lub #33 (wsparcie IT).
Enterprise infrastructure (Active Directory, klastry, Kubernetes, AWS production) — to zakres senior admin / DevOps.
Pisania kodu aplikacji — student STAWIA infrastrukturę, nie pisze aplikację. Development = osobna usługa.
SLA / gwarantowanego uptime — student konfiguruje i dokumentuje. Monitoring 24/7 = managed hosting / firma IT.
Jak wygląda proces
Dzień 1–2: Brief: co potrzebne, jaka skala, jakie dostępy. Student proponuje architekturę (diagram).
Dzień 2–3: Firma akceptuje architekturę i kupuje infrastrukturę (VPS, NAS, router jeśli potrzeba).
Dzień 3–4 (S) / 3–8 (M) / 3–12 (L): Konfiguracja: instalacja, setup,',
  'Ta sekcja nie jest widoczna dla firmy-zleceniodawcy.
Twoje wynagrodzenie
Infrastruktura IT to kompetencja o BARDZO wysokiej wartości rynkowej. Junior sysadmin/DevOps = 8–14k PLN/mies. Senior = 18–28k. To zlecenie na Student2Work to Twój start.
Instrukcja realizacji
Serwer VPS — konfiguracja od zera (~3–8h)
OS: Ubuntu Server 22.04 LTS (rekomendowany) lub Debian 12. NIE CentOS (EOL).
Pierwszy login: zmień hasło root, utwórz użytkownika z sudo, wyłącz logowanie root’a po SSH, włącz SSH key auth, zmień port SSH (np. 2222).
Firewall: ufw allow 22 (SSH), 80 (HTTP), 443 (HTTPS). Reszta = deny. DENY ALL po włączeniu!
Nginx jako reverse proxy: sites-available/domena.conf → proxy_pass http://localhost:3000 (Node) lub php-fpm. Certyfikat SSL: certbot --nginx (Let’s Encrypt, darmowy).
Automatyczne aktualizacje bezpieczeństwa: unattended-upgrades.
Monitoring (L): Uptime Kuma (self-hosted, darmowy) — ping/HTTP check co 60 sek, alert email/Telegram gdy down.
Baza danych — konfiguracja (~2–5h)
MySQL/MariaDB: apt install mariadb-server → mysql_secure_installation (usuń anonimowych, wyłącz root remote, usuń test DB). Utwórz bazę + użytkownika z GRANT per baza (nie GRANT ALL na *.*).
PostgreSQL: apt install postgresql → utwórz role (createuser), bazę (createdb), ustaw pg_hba.conf (autoryzacja md5/scram-sha-256). NIGDY trust auth na produkcji.
Backup: cron job codzienny. MySQL: mysqldump --all-databases | gzip > /backup/db_$(date +%F).sql.gz. PostgreSQL: pg_dumpall | gzip > backup. Retention: trzymaj 7 dziennych + 4 tygodniowe.
Backup do chmury (M/L): rclone sync /backup remote:bucket-name. Backblaze B2 = najtanszy ($0.005/GB/mies.). Konfiguracja rclone z szyfrowanymi credentials.
Tunning (M/L): MySQL: innodb_buffer_pool_size = 70% RAM. PostgreSQL: shared_buffers = 25% RAM, effective_cache_size = 75% RAM. Narzędzie: pgtune.leopard.in.ua.
Sieć firmowa — konfiguracja (~3–8h)
Router: zmień domyślne hasło admin (!), zaktualizuj firmware, skonfiguruj DHCP (zakres .100–.200), DNS (1.1.1.1 + 8.8.8.8), firewall (deny all inbound z WAN).
Wi-Fi: SSID firmowy (WPA3 lub WPA2-PSK, silne hasło 20+ zn.) + SSID gościnny (izolacja klientów, bandwidth limit). UKRYTY SSID = fałszywe poczucie bezpieczeństwa, nie ukrywaj.
VLAN (M/L): managed switch wymagany. VLAN 10 = biuro, VLAN 20 = goście, VLAN 30 = IoT/kamery. Trunk port do routera. Inter-VLAN routing kontrolowany firewallem.
VPN (M/L): WireGuard (szybszy, prostszy) lub OpenVPN. Serwer na VPS lub routerze (MikroTik). Każdy pracownik = osobny klucz/certyfikat. Pracownik odchodzi = revoke klucza.
NAS: Synology DSM — utwórz Shared Folders per dział (Marketing, Finanse, Zarząd). Uprawnienia per grupa. RAID 1 minimum (mirror). Backup na chmurę (Hyper Backup → Backblaze B2).
Narzędzia
Ubuntu Server 22.04 OS serwerowy — standard branżowy. LTS = wsparcie do 2027.
Nginx web server + reverse proxy. Szybszy niż Apache. Standard.
Let’s Encrypt (Certbot) darmowe certyfikaty SSL. Auto-renewal.
WireGuard VPN — szybszy i prostszy niż OpenVPN. Wbudowany w jądro Linux.
Uptime Kuma monitoring — self-hosted, darmowy. Alerty email/Telegram/Slack.
rclone synchronizacja backupów do chmury (B2, S3, GDrive). CLI.
Najczęstsze problemy
Firma nie wie czego potrzebuje („chcemy serwer”). Pytaj: „Do czego? Pliki zespołu = NAS. Hosting aplikacji = VPS. Baza danych = VPS + DB. Sieć firmowa = router + Wi-Fi + VLAN.” Narysuj prosty diagram (Draw.io) — firma zobaczy co budujecie.
VPS za słaby (1 GB RAM, aplikacja padnie). „Minimum: 2 GB RAM (web + DB). Rekomendacja: 4 GB. Hetzner CX21 = 4 GB, 2 vCPU, 40 GB SSD za ~25 PLN/mies.” Doradź ZANIM firma kupi.
Firma chce „AWS / Azure / GCP”. „Chmura publiczna (AWS/Azure) jest świetna ale złożona i droga dla małej firmy. VPS za 25–50 PLN/mies. da Ci to samo co EC2 za 150–300 PLN/mies. Chmura ma sens przy skalowaniu i high availability.”
Nie mam dostępu do routera (ISP zablokował). Wiele routerów od ISP ma ograniczony dostęp. Rekomendacja: kup własny router (MikroTik hAP ac3 ~350 PLN, Ubiquiti ER-X ~250 PLN) i podłącz za router ISP (bridge mode).
Checklist końcowy
Wszystkie elementy zainstalowane i skonfigurowane
Firewall — tylko potrzebne porty otwarte, reszta deny
SSH — key auth, zmieniony port, wyłączony root login
SSL/TLS — certyfikat aktywny, auto-renewal
Baza danych — użytkownicy z minimalnymi uprawnieniami, hasła silne
Backup — automatyczny (cron), testowany, do chmury (M/L)
Sieć — Wi-Fi zabezpieczone, gościnne odizolowane, VPN działa (M/L)
Monitoring — alerty skonfigurowane (L)
Dokumentacja — schemat architektury + dane dostępowe + instrukcja
Hasła w menedżerze haseł (Bitwarden) — NIE w pliku tekstowym
Test: czy po restarcie VPS/routera wszystko wstaje automatycznie?
Wiadomość podsumowująca na platformie
Student2Work — Łączymy ambicje studentów z potrzebami firm',
  699, 1799,
  '[{"name": "S", "label": "Pakiet S", "price": 699, "delivery_time_days": 10, "scope": "1 element (np. baza danych LUB serwer plików LUB sieć Wi-Fi)"}, {"name": "M", "label": "Pakiet M", "price": 1199, "delivery_time_days": 20, "scope": "2 elementy (np. VPS + baza danych LUB sieć + NAS)"}, {"name": "L", "label": "Pakiet L", "price": 1799, "delivery_time_days": 35, "scope": "3–4 elementy (np. VPS + baza + sieć + VPN + NAS)"}]'::jsonb, 5, 'Programowanie i IT',
  false, 0.25, true, 'platform_service', 'active', NULL
);

-- #35: Migracja hostingu, bazy danych i domeny
INSERT INTO public.service_packages (
  title, description, locked_content, price, price_max,
  variants, delivery_time_days, category,
  requires_nda, commission_rate, is_system, type, status, student_id
) VALUES (
  'Migracja hostingu, bazy danych i domeny',
  'Migracja hostingu, bazy danych i domeny
Bezpieczne przeniesienie strony, aplikacji, bazy danych lub domeny na nowy serwer — bez przerwy w działaniu
O co chodzi
Twój obecny hosting jest wolny, drogi lub ma słaby support. Chcesz przenieść stronę na nowy serwer. Ale boisz się — bo ostatni raz gdy „ktoś coś ruszał”, strona leżała 3 dni. Skrzynki mailowe przestały działać. Dane zniknęły.
Student IT przeprowadzi migrację BEZPIECZNIE: backup przed startem, przeniesienie plików i bazy, konfiguracja DNS, testy, przełączenie ruchu. Zero lub minimalna przerwa w działaniu. Na koniec — weryfikacja że wszystko działa + raport migracji.
Kluczowe: migracja to nie „kopiuj-wklej”. To zaplanowany proces z backupem, testami i rollback planem na wypadek problemów.
Co możemy migrować
Strona WordPress: pliki + baza MySQL + wp-config + media. Najczęstszy typ migracji. Plugin (Duplicator / All-in-One Migration) lub ręcznie.
Strona HTML / statyczna: pliki FTP/SFTP → nowy serwer. Prosta, szybka.
Aplikacja webowa (Node.js, PHP, Python, Java): kod + zależności + zmienne środowiskowe + reverse proxy (Nginx) + SSL.
Baza danych: MySQL → MySQL (inny serwer), MySQL → PostgreSQL, MongoDB → MongoDB, eksport/import, zmiana wersji.
Poczta e-mail: migracja skrzynek z jednego dostawcy na innego (np. hosting → Google Workspace). IMAP sync.
Domena (transfer rejestratora): przeniesienie domeny z jednego rejestratora na innego (np. home.pl → OVH). Auth code + DNS.
Hosting shared → VPS: upgrade z współdzielonego hostingu na własny VPS. Więcej kontroli, szybkości.
Sklep e-commerce: WooCommerce / PrestaShop / Shopify (eksport/import) — produkty, zamówienia, klienci.
Wybierz pakiet
Jak te ceny wyglądają na tle rynku
Student2Work vs „darmowa migracja” od hostingu: my robimy PEŁNĄ migrację (DNS, email, SSL, testy, dokumentacja), nie tylko kopiowanie plików.
Co musisz dostarczyć
Dostęp do STAREGO serwera — panel hostingu (cPanel, DirectAdmin, Plesk), FTP/SFTP, phpmyadmin, SSH (jeśli VPS)
Dostęp do NOWEGO serwera — panel hostingu lub SSH root. Jeśli nie masz — student doradzi co kupić.
Dostęp do rejestratora domeny — panel DNS (np. OVH, nazwa.pl, home.pl). Potrzebny do zmiany rekordów DNS.
Lista co migrować — które strony, bazy, skrzynki email, domeny, subdomeny.
Okno migracyjne — kiedy można przełączyć? Najlepiej: piątek wieczór / weekend (najmniejszy ruch).
Czego pakiety NIE obejmują
Zakupu nowego hostingu / VPS — koszt po stronie firmy. Student doradzi.
Przebudowy strony — student PRZENOSI istniejącą stronę, nie przebudowuje. Redesign = #27.
Migracji sklepów między platformami (np. Shopify → WooCommerce) — to konwersja, nie migracja. Znacznie bardziej złożone.
Migracji na AWS / Azure / GCP — cloud migration to zakres DevOps. VPS → VPS = OK. Hosting → VPS = OK.
Utrzymania nowego serwera po migracji — jednorazowe przeniesienie. Administracja = #33 (wsparcie IT).
Jak wygląda proces
Dzień 1: Audyt: student sprawdza co jest na starym serwerze — strony, bazy, emaile, DNS. Planuje migrację.
Dzień 1–2: Backup: pełny backup WSZYSTKIEGO ze starego serwera (pliki, bazy, konfiguracja, emaile).
Dzień 2–3 (S) / 2–5 (M) / 2–8 (L): Przeniesienie: kopiowanie plików, import baz, konfiguracja nowego serwera, SSL, email.
Dzień +1: Testy: strona działa na nowym serwerze? Baza połączona? Formularze? Email? Linki? Redirecty?
Dzień +1: Przełączenie DNS: zmiana rekordów A/MX. Propagacja 0–48h (TTL). Monitoring.
24–72h: Wsparcie po migracji: czy coś nie działa? Szybka reakcja.',
  'Ta sekcja nie jest widoczna dla firmy-zleceniodawcy.
Twoje wynagrodzenie
Migracja to usługa z bardzo dobrą stawką godzinową (szczególnie S). Prosta migracja WP trwa 3–5h — reszta to testy i DNS.
Instrukcja realizacji
ZASADA #0: BACKUP PRZED WSZYSTKIM
ZANIM cokolwiek ruszysz — zrób PEŁNY backup starego serwera i ZAPISZ LOKALNIE (nie tylko na serwerze). Jeśli migracja się nie uda — przywracasz backup i nic się nie stało.
Pliki: tar -czf /backup/site_$(date +%F).tar.gz /var/www/ (Linux) lub cały public_html z FTP
Baza: mysqldump -u root -p --all-databases > all_db_$(date +%F).sql
Email: eksport IMAP (imapsync) lub backup folderów mailowych
DNS: screenshot WSZYSTKICH rekordów DNS (A, CNAME, MX, TXT, SPF, DKIM). Będziesz je odtwarzać.
Pobierz backup NA LOKAY (laptop/dysk). NIE tylko na serwerze — jeśli serwer padnie, backup tez.
Krok 1: Migracja WordPress (~2–4h)
Metoda 1 (plugin — prosta): Duplicator lub All-in-One WP Migration. Eksportuj na starym → importuj na nowym. Działa w 90% przypadków. Limit: darmowa wersja do 512 MB.
Metoda 2 (ręczna — pewniejsza): 1) Eksportuj bazę (phpmyadmin lub mysqldump). 2) Skopiuj pliki (FTP/SFTP → cały wp-content/ + motywy + pluginy). 3) Utwórz bazę na nowym serwerze. 4) Importuj dump. 5) Edytuj wp-config.php (nowa baza, user, hasło, host). 6) Search-Replace URL (WP-CLI: wp search-replace ''stara-domena.pl'' ''nowa-domena.pl'' lub plugin Better Search Replace).
UWAGA: Search-Replace URLów to KLUCZOWY krok. Bez niego — linki, obrazki, style będą wskazywać na starą domenę.
Po imporcie: sprawdź Permalinks (Settings → Permalinks → Save). Często naprawia 404.
Krok 2: Migracja bazy danych (~1–3h)
MySQL → MySQL (inny serwer): mysqldump → scp plik → mysql import. Sprawdź wersję MySQL (kompatybilność).
MySQL → PostgreSQL: użyj pgloader (automatyczna konwersja) lub ręcznie: eksport CSV → import CSV. UWAGA: różnice składni (AUTO_INCREMENT → SERIAL, backticks → double quotes).
Weryfikacja: po imporcie sprawdź: ilość tabel, ilość rekordów (COUNT(*) na kluczowych tabelach), działanie aplikacji.
Duże bazy (>1 GB): kompresja (gzip), transfer scp z kompresją, import z pipelinem (zcat dump.sql.gz | mysql -u user -p db_name).
Krok 3: DNS — przełączenie (~0.5–1h + oczekiwanie)
ZANIM przełączysz DNS: ustaw TTL na 300 sekund (5 min) 24–48h PRZED migracją. Domyślne TTL = 3600–86400 sek = długa propagacja.
Rekord A: zmień IP na nowy serwer. Rekord CNAME: jeśli używasz (np. www → @).
Rekord MX: zmień TYLKO jeśli migrujesz pocztę. Jeśli poczta zostaje — NIE ruszaj MX!
SPF / DKIM / DMARC: odtwórz na nowym DNS. Bez tego — emaile idą do spamu.
Propagacja: sprawdź whatsmydns.net — czy nowy IP propaguje się globalnie. Może trwać 0–48h.
TRZYMAJ STARY SERWER 7–14 DNI po migracji. Niektóre DNS cache’e mogą wysłać ruch na stary serwer.
KRYTYCZNE: Nigdy nie kasuj starego serwera w dniu migracji. Trzymaj go minimum 7 dni jako fallback.
Krok 4: Migracja email (~1–4h jeśli dotyczy)
IMAP → IMAP (imapsync): narzędzie do synchronizacji skrzynek. Kopiuje WSZYSTKO (foldery, flagi, daty). Darmowy na Linuxie.
Komenda: imapsync --host1 stary.serwer --user1 user@domena.pl --password1 xxx --host1 nowy.serwer --user2 user@domena.pl --password2 yyy
Hosting → Google Workspace: Google Migration Tool (w Admin Console). Lub imapsync.
Po migracji MX: emaile nowe idą na nowy serwer. Stare emaile — już skopiowane imapsync.
Klienty email (Outlook, Thunderbird, telefony): zmień ustawienia IMAP/SMTP na nowy serwer (jeśli zmienił się adres serwera pocztowego).
Krok 5: Testy po migracji (~1–2h)
Strona: otwórz w przeglądarce (wyczyść cache!). Czy ładuje się? Screenshoty before/after — wygląda tak samo?
Formularze: wyślij testowy formularz kontaktowy. Czy email dochodzi?
Linki: sprawdź wewnętrzne linki (Screaming Frog / Broken Link Checker). Czy są 404?
Baza: zaloguj się do aplikacji. Dane są? Produkty, zamówienia, użytkownicy?
Email: wyślij email z i na migowane skrzynki. Odbiera? Wysyła? Nie idzie do spamu?
SSL: https://domena.pl — kłódka? Certyfikat ważny? ssllabs.com/ssltest — ocena A?
PageSpeed: porównaj przed i po. Nowy serwer powinien być szybszy (jeśli to był cel migracji).
SEO: Google Search Console — sprawdź czy Googlebot widzi nową stronę. Redirecty 301 ze starych URL-i (jeśli zmieniła się struktura).
Narzędzia
Duplicator / All-in-One Migration migracja WordPress (plugin). Prosta metoda.
imapsync migracja email IMAP → IMAP. Darmowy na Linuxie.
WP-CLI zarządzanie WordPress z linii komend. search-replace, db export/import.
rsync / scp transfer plików między serwerami (Linux). rsync = inkrementalny.
whatsmydns.net sprawdzanie propagacji DNS globalnie.
SSL Labs (ssllabs.com) test konfiguracji SSL / certyfikatu.
Najczęstsze problemy
Strona biała po migracji (White Screen of Death). Sprawdź: wp-config.php (dane bazy poprawne?), .htaccess (skasuj i odtwórz — Settings → Permalinks → Save), PHP version (nowy serwer ma inną wersję?), error log (wp-content/debug.log — włącz WP_DEBUG).
Obrazki nie wyświetlają się (złamane linki). Search-Replace: stara domena → nowa domena w bazie. WP-CLI: wp search-replace ''http://stara.pl'' ''https://nowa.pl''. Sprawdź wp-content/uploads — czy pliki skopiowane?
Emaile idą do spamu po migracji. Sprawdź DNS: SPF, DKIM, DMARC — czy odtworzone na nowym DNS? mail-tester.com — wyślij testowy email i sprawdź score. Cel: 10/10.
Firma nie ma dostępu do starego hostingu. „Potrzebuję panel hostingu LUB FTP + phpmyadmin. Spróbuj: zalogować się na stronie dostawcy, odzyskać hasło przez email, zadzwonić na support starego hostingu.”
Checklist końcowy
PEŁNY backup starego serwera (pliki + bazy + emaile + DNS) pobrany LOKALNIE
Pliki przeniesione na nowy serwer
Baza(y) zaimportowana i działająca
wp-config.php / .env zaktualizowany (nowe dane bazy, nowy URL)
Search-Replace URL-i wykonany (WordPress)
SSL certyfikat aktywny na nowym serwerze (HTTPS działa)
DNS TTL obniżony (przed migracją) i rekordy zmienione (A, CNAME, MX)
SPF / DKIM / DMARC odtworzone (jeśli email migrowany)
Email: wysyłanie i odbieranie działa, ',
  499, 1399,
  '[{"name": "S", "label": "Pakiet S", "price": 499, "delivery_time_days": 6, "scope": "1 strona / aplikacja + 1 baza danych. Hosting → hosting (ten sam typ)."}, {"name": "M", "label": "Pakiet M", "price": 899, "delivery_time_days": 14, "scope": "1–2 strony/aplikacje + bazy + poczta. Możliwa zmiana typu (shared → VPS)."}, {"name": "L", "label": "Pakiet L", "price": 1399, "delivery_time_days": 25, "scope": "Wiele stron / aplikacji + bazy + poczta + domena. Pełna infrastruktura."}]'::jsonb, 3, 'Programowanie i IT',
  false, 0.25, true, 'platform_service', 'active', NULL
);

-- #36: Kosztorys projektu IT — wycena, estymacja, budżetowanie
INSERT INTO public.service_packages (
  title, description, locked_content, price, price_max,
  variants, delivery_time_days, category,
  requires_nda, commission_rate, is_system, type, status, student_id
) VALUES (
  'Kosztorys projektu IT — wycena, estymacja, budżetowanie',
  'Kosztorys projektu IT — wycena, estymacja, budżetowanie
Profesjonalny kosztorys Twojego projektu technologicznego — zanim wydasz złotówkę na development, wiedz ile to będzie kosztować
O co chodzi
Chcesz zbudować aplikację. Pytasz software house — mówią „80–150 tysięcy”. Pytasz freelancera — mówi „30 tysięcy”. Pytasz drugiego — „200 tysięcy”. Kto ma rację? Nie wiesz, bo nie masz NIEZALEŻNEJ wyceny.
Student z doświadczeniem w zarządzaniu projektami IT przygotuje kosztorys: rozbije projekt na moduły i zadania, oszacuje pracochłonność (godziny), dobierze stawki rynkowe, policzy koszty infrastruktury, licencji i narzędzi. Dostarczy DOKUMENT z którym możesz negocjować z wykonawcami, wnioskować o grant lub podejmować świadome decyzje budżetowe.
Niezależny kosztorys to Twoje UBEZPIECZENIE przed przepłaceniem. Software house wycenia projekt na 120k PLN? Kosztorys pokazuje że realna wartość to 60–80k. Oszczędzasz 40–60 tys. na negocjacjach.
Kiedy potrzebujesz kosztorys
Planujesz zbudować aplikację / system: chcesz wiedzieć ile to będzie kosztować ZANIM zaczniesz szukać wykonawcy.
Porównujesz oferty software house’ów: masz 3 wyceny i nie wiesz która jest uczciwa. Kosztorys = benchmark.
Wnioskujesz o grant / dofinansowanie: NCBiR, PARP, RPO, Horizon Europe — wymaga szczegółowego kosztorysu IT.
Przekonujesz zarząd / inwestora: potrzebujesz profesjonalny dokument z rozkładem kosztów i harmonogramem.
Planujesz budżet roczny IT: ile kosztuje utrzymanie systemu? Rozwoju nowych funkcji? Infrastruktury?
Masz legacy system i chcesz go przebudować: ile kosztuje modernizacja vs budowa od zera?
Wybierz pakiet
Jak te ceny wyglądają na tle rynku
Kluczowa wartość: kosztorys od Student2Work jest NIEZALEŻNY — student nie sprzedaje developmentu, nie ma interesu zawyżać lub zaniżać. Software house’y dają „darmowe wyceny” bo chcą sprzedać projekt.
Co musisz dostarczyć
Opis projektu — co ma robić aplikacja / system? Dla kogo? Główne funkcje? (nawet notatki, prezentacja, specyfikacja #32)
Przykłady — aplikacje które robią coś podobnego („jak Booksy ale dla mechaników”)
Ograniczenia — budżet orientacyjny (jeśli masz), deadline, preferencje technologiczne
Cel kosztorysu — do czego użyjesz? Negocjacje z SH? Grant? Decyzja zarządu? Wpływa na format i szczegółowość.
Oferty do porównania — jeśli masz wyceny od software house’ów — student porówna z własną estymacją
Czego pakiety NIE obejmują
Pisania specyfikacji wymagań — kosztorys bazuje na ISTNIEJĄCYCH wymaganiach. Pisanie wymagań = #32.
Budowania aplikacji — student WYCENIA, nie buduje.
Wyboru wykonawcy — student dostarcza narzędzie (kosztorys + kryteria), ale decyzja = firma.
Gwarancji dokładności — kosztorys to ESTYMACJA (przedziały: optymistyczny/realistyczny/pesymistyczny). Realna cena zależy od wykonawcy, zmian w scope, rynku.
Audytu istniejącego kodu / systemu — kosztorys wycenia NOWY projekt lub rozbudowę. Audyt technicznego długu = osobna usługa.
Jak wygląda proces
Dzień 1–2: Discovery: sesja z firmą (60–90 min). Student poznaje projekt, cel, zakres, ograniczenia.
Dzień 2–3: Dekompozycja: podział na moduły → zadania. Firma potwierdza zakres.
Dzień 3–4 (S) / 3–7 (M) / 3–11 (L): Estymacja: godziny per zadanie, stawki rynkowe, koszty infra/licencji, harmonogram.
Dzień +1–2: Review: firma sprawdza — „czy to ma sens?” Student koryguje, uzupełnia.
Dzień +1: Finalizacja: dokument + Excel + prezentacja (L).',
  'Ta sekcja nie jest widoczna dla firmy-zleceniodawcy.
Twoje wynagrodzenie
SUPER COMBO: #32 (specyfikacja wymagań) + #36 (kosztorys) = pełny pakiet „spec + wycena” za 2 398 PLN (M+M). Software house za to samo bierze 10–30k PLN.
Instrukcja realizacji
Krok 1: Dekompozycja projektu (~2–4h)
Rozbij projekt na MODUŁY (logiczne części): Autoryzacja, Profil użytkownika, Dashboard, Zamówienia, Płatności, Panel admina, Powiadomienia, Integracje itd.
Każdy moduł rozbij na ZADANIA: np. Moduł „Autoryzacja” → Rejestracja, Logowanie, Reset hasła, 2FA, OAuth (Google/Facebook), Role i uprawnienia.
WBS (L): 3 poziomy: Projekt → Moduł → Zadanie. Numeracja: 1.0 Autoryzacja → 1.1 Rejestracja → 1.1.1 Formularz rejestracji → 1.1.2 Walidacja → 1.1.3 Email weryfikacyjny.
Nie zapomnij o zadaniach „niewidocznych”: setup projektu, CI/CD, testy, dokumentacja, deployment, code review, project management.
Krok 2: Estymacja godzin (~2–5h)
Metoda 3-punktów (PERT): O (optymistyczny) + 4×M (most likely) + P (pesymistyczny) / 6 = estymacja. Np. Formularz logowania: O=2h, M=4h, P=8h → (2+16+8)/6 = 4.3h.
Per rola (M/L): frontend (React/Angular), backend (Node/Python), DevOps (CI/CD, serwer), QA (testy), design (UI/UX), PM (zarządzanie). Każda rola = inne godziny i inna stawka.
Typowe estymacje (orientacyjne): Formularz logowania = 4–8h. CRUD (lista+dodaj+edytuj+usuń) = 8–16h. Integracja płatności (Stripe/P24) = 16–32h. Chat real-time = 24–48h. Panel admina (10 widoków) = 40–80h.
Bufor ryzyka: dodaj 20–30% do całkowitej estymacji. Projekty IT ZAWSZE trwają dłużej niż planowane. Bez buforu = przekroczenie budżetu.
ZASADA: Estymacja to PRZEDZIAŁ, nie jedna liczba. Nigdy nie mów „to będzie kosztować 50 000 PLN” ale „40 000–65 000 PLN (realistyczny: ~52 000 PLN).”
Krok 3: Stawki rynkowe i koszty robocizny (~1–2h)
Stawki rynkowe PL (2024/2025, B2B netto/h): Junior dev: 60–100 PLN/h. Mid dev: 100–180 PLN/h. Senior dev: 150–280 PLN/h. DevOps: 130–250 PLN/h. QA tester: 70–150 PLN/h. UI/UX designer: 80–200 PLN/h. PM: 100–200 PLN/h.
Warianty (M/L): Zespół juniorów (tańszy, wolniejszy, więcej ryzyka) vs mid/senior (droższy, szybszy, pewniejszy). Software house (narzut 40–80% na stawki) vs freelancerzy (tani ale ryzyko).
Obliczenie: Godziny per rola × stawka = koszt per moduł. Suma modułów = koszt developmentu. + Bufor 20–30%.
Scenariusze (L): Tani (juniorzy + freelancerzy) / Optymalny (mid + software house średni) / Premium (seniorzy + topowy software house). Firma widzi rozstęp i może świadomie wybrać.
Krok 4: Koszty infrastruktury i licencji (~1–2h)
Hosting / VPS / chmura: miesięczny koszt. Hetzner VPS 4GB = 25 PLN/mies. AWS EC2 t3.medium = 150 PLN/mies. Google Cloud Run = zależy od ruchu.
Baza danych: managed DB (AWS RDS, PlanetScale) vs self-hosted (free ale wymaga admina).
Domeny: ~50 PLN/rok (.pl), ~100 PLN/rok (.com). SSL: free (Let’s Encrypt) lub ~200–500 PLN/rok (komercyjny).
SaaS / API: Stripe (2.9% + 1.50 PLN per transakcja), Twilio SMS (0.10 PLN/SMS), SendGrid email (free do 100/dzień), Google Maps API (200$/mies. credit), itd.
Licencje: Figma ($15/mies./user), Jira (free do 10 userów), GitHub ($4/mies./user), Sentry (free tier).
TCO 12 mies. (L): zsumuj WSZYSTKO: development + infra ×12 + licencje ×12 + utrzymanie (10–20% kosztu dev rocznie) + buffer na zmiany.
Krok 5: Harmonogram (~1–3h)
Timeline: podziel projekt na fazy: Discovery (1–2 tyg.) → UI/UX Design (2–4 tyg.) → Development MVP (6–12 tyg.) → QA (2–4 tyg.) → Deployment (1 tyg.) → Iteracje.
Gantt chart: Moduły w czasie, zależności (backend auth PRZED frontendem auth), kamienie milowe. Narzędzia: Excel Gantt template, GanttProject (free), Notion timeline.
Scenariusze (L): MVP-first (zbuduj minimum, wypuść, iteruj) vs pełny scope (zbuduj wszystko, wypuść). MVP = szybciej + taniej + feedback. Pełny = dłużej + drożej + ryzyko.
Ścieżka krytyczna (L): zidentyfikuj zadania które blokują inne. Opóźnienie na ścieżce krytycznej = opóźnienie całego projektu.
Struktura dokumentu kosztorysu
1. Streszczenie wykonawcze — 1 strona: co, ile, kiedy (dla zarządu który nie przeczyta reszty)
2. Opis projektu — co budujemy, dla kogo, główne funkcje
3. Zakres — co jest W scope i co jest POZA scope (kluczowe!)
4. Dekompozycja — moduły i zadania (tabela lub WBS)
5. Estymacja godzin — tabela: moduł, rola, godziny (opt/real/pes)
6. Koszty robocizny — stawki × godziny = koszty per moduł + warianty (M/L)
7. Koszty infrastruktury i licencji — miesięczne + roczne
8. Harmonogram — timeline / Gantt + kamienie milowe
9. Ryzyka (M/L) — tabela: ryzyko, prawdopodobieństwo, wpływ, mitygacja
10. Rekomendacje — stack, model współpracy, MVP vs pełny scope
11. Załączniki — Excel szczegółowy, Gantt, porównanie ofert (jeśli były)
Narzędzia
Excel / Google Sheets tabele kosztów, estymacje, kalkulacje TCO. KLUCZOWE narzędzie.
GanttProject / Notion Timeline harmonogram Gantt. Darmowe.
Word / Google Docs dokument kosztorysu.
Draw.io / Mermaid diagramy WBS, architektura.
justinmind.com / Figma orientacyjne wireframes (jeśli pomagają w estymacji).
Glassdoor / No Fluff Jobs / Just Join IT stawki rynkowe developerów w Polsce — do referencji.
Najczęstsze problemy
Firma nie ma specyfikacji („nie wiem dokładnie co chcę”). „Kosztorys potrzebuje zakresu. Bez zakresu = szacunek z dokładnością ±50%. Rekomenduję najpierw #32 (specyfikacja wymagań), potem kosztorys.” Można zrobić SZACUNKOWY (S) na podstawie opisu, ale z dużym przedziałem.
Firma chce GWARANCJĘ ceny. „Kosztorys to ESTYMACJA, nie gwarancja. Podaję przedziały (opt/real/pes) i bufor. Realna cena zależy od wykonawcy, zmian scope i nieoczekiwanych komplikacji. Ten przedział daje solidną podstawę do negocjacji.”
Kosztorys nie zgadza się z wyceną software house’u. To NORMALNE. Software house dodaje narzut (biuro, PM, sprzedaż, margin = 40–80%). Kosztorys pokazuje „czyste” koszty robocizny. Różnica = margin SH. Firma może negocjować świadomie.
Za złożony projekt — nie wiem ile godzin. Użyj analogii: „Podobna funkcja w porównywalnej aplikacji zajęła X godzin.” Research: il',
  599, 1499,
  '[{"name": "S", "label": "Pakiet S", "price": 599, "delivery_time_days": 10, "scope": ""}, {"name": "M", "label": "Pakiet M", "price": 999, "delivery_time_days": 20, "scope": ""}, {"name": "L", "label": "Pakiet L", "price": 1499, "delivery_time_days": 35, "scope": ""}]'::jsonb, 5, 'Prace biurowe',
  false, 0.25, true, 'platform_service', 'active', NULL
);

-- #37: Transkrypcja i notatki z nagrań — spotkania, wywiady, podcas
INSERT INTO public.service_packages (
  title, description, locked_content, price, price_max,
  variants, delivery_time_days, category,
  requires_nda, commission_rate, is_system, type, status, student_id
) VALUES (
  'Transkrypcja i notatki z nagrań — spotkania, wywiady, podcasty',
  'Transkrypcja i notatki z nagrań — spotkania, wywiady, podcasty
Zamień nagrania audio i wideo w profesjonalne dokumenty tekstowe — transkrypcja, podsumowanie, action items
O co chodzi
Masz 10 nagrań z wywiadów z klientami. 5 godzin nagrań ze spotkań zespołu. 8 odcinków podcastu do opublikowania jako artykuły. Nagranie z konferencji które trzeba przetworzyć na raport. Nikt nie ma czasu tego przesłuchać i spisać.
Student przesłucha nagrania i dostarczy: pełną transkrypcję (słowo w słowo) LUB oczyszczoną (bez zająknieć i powtórzeń) LUB streszczenie z kluczowymi punktami i action items. W języku polskim lub angielskim.
NAJTAŃSZA usługa w katalogu (S = 299 PLN). Idealna lokomotywa wejściowa — niska bariera, każda firma ma nagrania do przetworzenia.
Co możemy przetworzyć
Spotkania firmowe (Zoom, Teams, Google Meet): notatki, decyzje, action items, kto co powiedział
Wywiady z klientami / użytkownikami (UX research): transkrypcja + wyciąg insightów, cytatów, patternów
Podcasty / webinary: transkrypcja do publikacji jako artykuł blogowy (SEO!) lub show notes
Konferencje / prezentacje: transkrypcja wystąpień, paneli dyskusyjnych, Q&A
Nagrania sądowe / prawne: transkrypcja rozpraw, przesłuchań, zeznań (wymaga dokładności verbatim)
Wykłady / szkolenia: transkrypcja do notatek studenckich lub materiałów szkoleniowych
Dyktafon / notatki głosowe: zamiana nagrań dyktafonowych w uporządkowany tekst
Wybierz pakiet
Jak te ceny wyglądają na tle rynku
Student2Work vs AI: AI transkrybuje TANIO ale z błędami (nazwy własne, žargon branżowy, polskie akcenty). Student WERYFIKUJE i poprawia + dodaje wartość (podsumowanie, action items, kontekst). Najlepszy model: AI jako baza + student jako redaktor.
Co musisz dostarczyć
Nagrania audio/wideo — MP3, WAV, MP4, MOV, M4A, WEBM. Link do Zoom/Teams recording lub plik na Google Drive / WeTransfer.
Lista mówców — kto mówi w nagraniu (imiona, role). Student oznacza mówców.
Kontekst — o czym jest nagranie? Branża? Terminologia specjalistyczna? (pomaga w dokładności)
Preferencje — verbatim czy oczyszczona? Z timestampami? Podsumowanie? Action items?
Poufność — jeśli nagrania są poufne (wywiady, sprawy prawne) — student podpisuje NDA przez platformę.
Czego pakiety NIE obejmują
Tłumaczenia — student transkrybuje w JĘZYKU nagrania. Transkrypcja PL + tłumaczenie na EN = osobna usługa.
Nagrywania — student PRZETWARZA dostarczone nagrania, nie nagrywa spotkań.
Edycji audio/wideo — student pisze tekst, nie montuje nagrań. Montaż = osobna usługa.
Certyfikowanej transkrypcji sądowej — transkrypcje prawne wymagają certyfikowanego transkryptora / tłumacza przysięgłego. Student może przygotować ROBOCZĄ transkrypcję.
Nagrań z bardzo słabą jakością audio — jeśli nie słychać co mówią — student oznaczy jako [niezrozumiałe].
Jak wygląda proces
Dzień 1: Brief + próbka: student odsłuchuje 10–15 min, dostarcza próbkę transkrypcji. Firma akceptuje styl.
Dzień 1–2 (S) / 1–3 (M) / 1–4 (L): Transkrypcja: AI jako baza (Whisper) + ręczna korekta + formatowanie + mówcy + timestampy.
Dzień +0.5–1 (M/L): Podsumowanie: kluczowe punkty, decyzje, action items, otwarte pytania.
Dzień +0.5: Finalizacja: formatowanie, QA (odsłuchanie fragmentów wątpliwych), deliverable.',
  'Ta sekcja nie jest widoczna dla firmy-zleceniodawcy.
Twoje wynagrodzenie
Klucz do dobrej stawki: używaj AI (Whisper) jako bazy i RĘCZNIE koryguj. Bez AI: 1h nagrania = 4–6h pracy. Z AI + korekta: 1h nagrania = 1.5–2.5h pracy.
Instrukcja realizacji
Krok 1: AI transkrypcja jako baza (~0.5h per godzina nagrania)
Narzędzie: Whisper (OpenAI) — darmowy, najlepsza jakość AI. Instalacja: whisper.cpp (lokalnie) lub narzędzia online oparte na Whisper.
Alternatywy: Transkriptor.com (free trial), Descript (free tier), oTranscribe (darmowy player do transkrypcji ręcznej).
Przetworzenie: załaduj nagranie → AI generuje tekst → pobrany tekst = BAZA do korekty.
AI nie jest idealny: błędy w nazwach własnych, žargonie, cichych fragmentach, polskich akcentach. ZAWSZE koryguj ręcznie.
Krok 2: Korekta ręczna (~1–2h per godzina nagrania)
Odsłuchaj nagranie równolegle z tekstem AI. Poprawiaj na bieżąco. Player: oTranscribe.com (darmowy, skróty klawiszowe, spowalnianie).
Skróty: F1 = play/pause, F2 = cofnij 2 sek, F3 = do przodu. Prędkość: 0.8×–1.2× (dostosuj do tempa mówienia).
Nazwy własne: sprawdź pisownię (firmy, osoby, produkty). Zapytaj firmę jeśli nie jesteś pewien.
Niezrozumiałe fragmenty: oznacz [niezrozumiałe 12:34] z timestampem. NIE zgaduj. Lepiej oznaczyć niż napisać bzdurę.
Oczyszczona vs verbatim: Oczyszczona = usuń „yyy”, „ee”, powtórzenia, niepełne zdania. Wygładź gramatykę (ale NIE zmieniaj sensu!). Verbatim = WSZYSTKO jak jest, łącznie z zająknieniami (potrzebne w transkrypcjach prawnych).
Krok 3: Formatowanie (~0.5–1h per godzina nagrania)
Mówcy: „Jan Kowalski: Uważam że powinniśmy...” lub „[JK]: Uważam...”. Spójna konwencja w całym dokumencie.
Timestampy: [00:12:34] co 2–5 min lub per wypowiedź (M/L). Format: [GG:MM:SS] lub [MM:SS] jeśli <1h.
Paragrafy: nowy paragraf per zmiana mówcy LUB per zmiana tematu. Nie rób ściany tekstu.
Nagłówki (M/L): podziel transkrypcję na sekcje tematyczne. Np. „1. Otwarcie spotkania”, „2. Omówienie wyników Q3”, „3. Planowanie Q4”.
Wyciąg cytatów (L): najważniejsze wypowiedzi wyświetl jako blockquote. Np. kluczowa decyzja, kontrowersyjna opinia, insight klienta.
Krok 4: Podsumowanie i action items (M/L, ~0.5–1h per nagranie)
Podsumowanie (M): 1–2 strony per nagranie. Struktura: Uczestnicy, Cel spotkania, Kluczowe punkty (3–7 punktów), Decyzje, Następne kroki.
Action items (L): tabela: Zadanie | Odpowiedzialny | Termin | Status. Wyciągnij z nagrania KAŻDE zobowiązanie („Ja to zrobię do piątku” = action item).
Executive summary (L): 1 paragraf (5–7 zdań) podsumowujący całe nagranie. Dla kogoś kto NIE będzie czytać pełnej transkrypcji.
Otwarte pytania (L): co nie zostało rozstrzygnięte? Jakie tematy wymagają follow-up?
Narzędzia
Whisper (OpenAI) AI transkrypcja — najlepsza jakość, darmowy. Lokalnie lub online.
oTranscribe darmowy player do transkrypcji ręcznej. Skróty klawiszowe, spowalnianie.
Descript AI transkrypcja + edycja — free tier (1h/mies.). Bardzo dobry interfejs.
Google Docs (Voice Typing) transkrypcja real-time (słabsza jakość niż Whisper, ale darmowa).
Otter.ai AI transkrypcja z automatycznym rozróżnieniem mówców. Free: 300 min/mies.
VLC Player odtwarzanie nagrań ze zmianą prędkości (0.5×–2×). Darmowy.
Najczęstsze problemy
Słaba jakość audio (szum, echo, cichy mówca). Spróbuj: Audacity (darmowy) — noise reduction, normalizacja głośności. Jeśli nadal niezrozumiałe — oznacz [niezrozumiałe]. Poinformuj firmę: „15% nagrania jest niezrozumiałe z powodu jakości audio.”
Nagranie w języku którego nie znasz. „Transkrybuję w języku polskim i angielskim. Inne języki — proszę o potwierdzenie przed rozpoczęciem.” Nie podejmuj się języka którego nie znasz na poziomie C1+.
Firma chce transkrypcję „na wczoraj” (pilne). „Pakiet S (3h nagrań) = 2 dni robocze. Express (+50% ceny) = 24h. Szybciej nie gwarantuję jakości.”
Nagranie zawiera dane poufne. Podpisz NDA na platformie. Nie udostępniaj nagrań osobom trzecim. Usuń lokalne kopie po zakończeniu zlecenia. AI: używaj Whisper LOKALNIE (nie przesyłaj do chmury).
Checklist końcowy
Próbka 10–15 min zaakceptowana przez firmę
Całość transkrypcji gotowa
Mówcy oznaczeni (imiona lub Mówca 1/2/3)
Timestampy dodane (M/L)
Niezrozumiałe fragmenty oznaczone [niezrozumiałe HH:MM:SS]
Nazwy własne sprawdzone (firmy, osoby, produkty)
Formatowanie spójne (nagłówki, paragrafy, cytaty)
Podsumowanie + action items (M/L)
Executive summary (L)
QA: odsłuchanie losowych fragmentów vs tekst
Plik dostarczony (Word / Google Docs)
Wiadomość podsumowująca na platformie
Student2Work — Łączymy ambicje studentów z potrzebami firm',
  299, 799,
  '[{"name": "S", "label": "Pakiet S", "price": 299, "delivery_time_days": 5, "scope": ""}, {"name": "M", "label": "Pakiet M", "price": 499, "delivery_time_days": 12, "scope": ""}, {"name": "L", "label": "Pakiet L", "price": 799, "delivery_time_days": 22, "scope": ""}]'::jsonb, 2, 'Prace biurowe',
  true, 0.25, true, 'platform_service', 'active', NULL
);

-- #38: Tłumaczenie dokumentów biznesowych PL↔EN
INSERT INTO public.service_packages (
  title, description, locked_content, price, price_max,
  variants, delivery_time_days, category,
  requires_nda, commission_rate, is_system, type, status, student_id
) VALUES (
  'Tłumaczenie dokumentów biznesowych PL↔EN',
  'Tłumaczenie dokumentów biznesowych PL↔EN
Profesjonalne tłumaczenie tekstów firmowych — oferty, prezentacje, strony www, umowy, raporty, treści marketingowe
O co chodzi
Twoja firma wchodzi na rynki zagraniczne. Potrzebujesz: stronę www po angielsku, ofertę handlową, prezentację dla inwestora, regulamin sklepu, treści na LinkedIn. Google Translate nie daje rady — brzmi sztucznie, gubi niuanse branżowe, a błędy w ofercie handlowej mogą kosztować kontrakt.
Student filologii angielskiej przetłumaczy Twoje dokumenty profesjonalnie: nie „słowo w słowo” ale z SENSEM — dostosowując ton, terminologię branżową i konwencje kulturowe. Polski formalny styl → anglosaski bezpośredni styl. Albo odwrotnie.
Usługa obejmuje tłumaczenia ZWYKŁE (biznesowe). Tłumaczenie przysięgłe (sądowe, urzędowe) wymaga uprawnień tłumacza przysięgłego — nie wchodzi w zakres.
Co możemy przetłumaczyć
Strona internetowa: cała strona www (podstrony, menu, CTA, meta opisy, alt texty) — gotowe do wklejenia w CMS
Oferty handlowe / pitch decki: prezentacje dla klientów i inwestorów zagranicznych
Materiały marketingowe: broszury, ulotki, newslettery, posty SM, opisy produktów, case studies
Umowy / regulaminy: regulamin sklepu, polityka prywatności, OWU, umowy z kontrahentami (tłumaczenie zwykłe, NIE przysięgłe)
Raporty / dokumentacja: raporty roczne, analizy, white papers, dokumentacja techniczna
Treści e-commerce: opisy produktów na Allegro / Amazon / eBay, tytuły SEO, specyfikacje
Korespondencja: emaile biznesowe, pisma, zapytania ofertowe — ton formalny / półformalny
CV / portfolio: dokumenty aplikacyjne na rynek zagraniczny
Wybierz pakiet
Jak te ceny wyglądają na tle rynku
Student2Work: 40–60% taniej niż biuro tłumaczeń. Lepsza jakość niż Google Translate + post-edycja. Spójność terminologiczna (glosariusz).
Co musisz dostarczyć
Tekst źródłowy — Word, Google Docs, PDF, PowerPoint, lub tekst strony www (link + eksport CMS)
Kontekst — dla kogo tłumaczymy? Klienci B2B? Konsumenci? Inwestorzy? Urzędnicy?
Ton — formalny (umowy, raporty), półformalny (oferty, prezentacje), luźny (SM, blog)
Glosariusz — jeśli firma ma istniejącą terminologię (nazwy produktów, branżowe terminy) — przekaż
Przykłady — czy firma ma już jakieś materiały po angielsku? (standard odniesienia)
Czego pakiety NIE obejmują
Tłumaczenia przysięgłego — wymaga uprawnień tłumacza przysięgłego (wpis na listę MS). To NIE ta usługa.
Tłumaczenia na inne języki — tylko PL↔EN. Inne pary językowe (DE, FR, ES) = osobna wycena.
Pisania treści od zera — student TŁUMACZY istniejący tekst, nie pisze nowego. Copywriting = #06.
DTP / składu graficznego — student dostarcza tekst. Wstawienie do broszury / layoutu = osobna usługa.
Ciągłego tłumaczenia — jednorazowe zlecenie. Stała współpraca = nowy pakiet każdorazowo.
Jak wygląda proces
Dzień 1: Brief: materiał źródłowy, kontekst, ton, termin. Próbka: student tłumaczy 300–500 słów. Firma akceptuje styl.
Dzień 1–2 (S) / 1–4 (M) / 1–6 (L): Tłumaczenie: sekcja po sekcji. AI jako baza (DeepL) + pełna redakcja człowieka.
Dzień +0.5–1: Proofreading (M/L): osobne czytanie całości — spójność, płynność, błędy.
Dzień +0.5: Finalizacja: glosariusz (M/L), formatowanie, deliverable.',
  'Ta sekcja nie jest widoczna dla firmy-zleceniodawcy.
Twoje wynagrodzenie
Klucz do efektywności: DeepL PRO jako baza (30 EUR/mies.) + pełna redakcja człowieka. Bez AI: ~300 słów/h. Z AI + redakcja: ~600–800 słów/h.
Instrukcja realizacji
Krok 1: Analiza tekstu źródłowego (~0.5–1h)
Przeczytaj CAŁY tekst ZANIM zaczniesz tłumaczyć. Zrozum kontekst, ton, odbiorcę, cel.
Zidentyfikuj trudne fragmenty: terminologia branżowa, żart, metafory, skróty, nazwy własne.
Sprawdź czy firma ma istniejący glosariusz / materiały po angielsku. Spójność!
Policz słowa (Word: Review → Word Count). Zweryfikuj czy mieścisz się w pakiecie.
Krok 2: Tłumaczenie z AI jako bazą (~70% czasu)
DeepL jako baza: wklej tekst → generuje tłumaczenie → TY redagujesz. DeepL jest lepszy od Google Translate w PL↔EN.
NIGDY nie oddawaj surowego AI. Każde zdanie weryfikuj: czy sens jest zachowany? Czy brzmi naturalnie? Czy terminologia jest poprawna?
Typowe błędy AI: literalne tłumaczenie idiomów („nie moja działka” ≠ „not my plot”), złe rejestry (zbyt formalny / zbyt luźny), brak kontekstu branżowego.
PL→EN: polskie zdania są DŁUŻSZE i bardziej formalne. Anglosaski styl = krótsze zdania, bezpośredni, aktywna strona. ADAPTUJ, nie tłumacz „słowo w słowo”.
EN→PL: angielskie „you” = „ty” czy „Pan/Pani”? Zależy od kontekstu (SM = ty, umowa = Pan/Pani). Ustal z firmą.
Krok 3: Lokalizacja (M/L, + ~20% czasu)
Lokalizacja ≠ tłumaczenie. Tłumaczenie = zmiana języka. Lokalizacja = adaptacja do KULTURY docelowej.
Formaty: data (01.03.2025 → March 1, 2025 lub 1 March 2025), waluta (PLN → EUR/USD z przelicznikiem lub „approximately”), jednostki (km → miles jeśli US), telefon (+48 → +44/+1).
Konwencje prawne: „NIP” → „tax identification number (NIP)”. „KRS” → „National Court Register (KRS)”. Pierwsza wzmianki pełna nazwa + skrót w nawiasie.
CTA / marketing: „Sprawdź ofertę” ≠ „Check offer”. Lepiej: „Explore our offer” / „Get started” / „See pricing”. Adaptuj do konwencji rynku docelowego.
Ton: polski formalny styl („Uprzejmie informujemy, iż...”) → anglosaski bezpośredni („We’re pleased to let you know that...”).
Krok 4: Glosariusz (M/L, ~0.5–1h)
Format: Excel / tabela. Kolumny: Termin PL | Termin EN | Kontekst / uwagi.
Zbierz WSZYSTKIE kluczowe terminy branżowe, nazwy produktów, skróty. Np. „umowa o dzieło” = „contract for a specific task” (nie „contract for work” które to „umowa o pracę”).
Spójność: jeśli raz przetłumaczyłeś „zleceniodawca” jako „client” — nie zmieniaj na „customer” w innym miejscu.
Dostarcz glosariusz firmie — użyje go przy kolejnych tłumaczeniach (wewnętrznie lub w następnym zleceniu).
Krok 5: Proofreading (~15–25% czasu)
ODDZIELNY KROK od tłumaczenia. Najlepiej następnego dnia (świeże oczy).
Czytaj TŁUMACZENIE bez patrzenia na oryginał. Czy brzmi naturalnie? Czy płynie? Czy zrozumiałbyś jako native speaker?
Cross-check z oryginałem (L): zdanie po zdaniu — czy nic nie pominięto? Czy sens zachowany?
Checklist: ortografia, interpunkcja, spójność terminologii (glosariusz), formatowanie (nagłówki, listy, bold), nazwy własne.
Narzędzia
DeepL (PRO) najlepsza baza AI do PL↔EN. PRO: 30 EUR/mies., większe limity, API, glosariusz.
Grammarly Premium korekta językowa EN — gramatyka, styl, ton, klarowność. Must-have.
Ludwig.guru wyszukiwarka kontekstu — „jak native speakerzy używają tego zwrotu?”
Linguee / Reverso Context słowniki kontekstowe — przykłady użycia w realnych tłumaczeniach.
Google Docs (Suggesting mode) track changes — firma widzi co zmieniłeś.
Word Count Tool liczenie słów, znaków, stron. Weryfikacja objętości.
Najczęstsze problemy
Firma chce tłumaczenie przysięgłe. „Ta usługa obejmuje tłumaczenie ZWYKŁE (biznesowe). Tłumaczenie przysięgłe wymaga uprawnień tłumacza przysięgłego wpisanego na listę MS. Mogę przygotować robocze tłumaczenie, ale pieczątka = tłumacz przysięgły.”
Tekst pełen žargonu branżowego (prawny, medyczny, techniczny). Zbadaj terminologię: EUR-Lex (prawo UE), PubMed (medycyna), IATE (terminologia UE). Zapytaj firmę o istniejący glosariusz. Nie tłumacz na siłę — lepiej oznaczyć [do potwierdzenia] niż użyć złego terminu.
Firma chce „tak jak Google Translate ale poprawione”. Post-edycja AI to ważna część procesu, ale to NIE jest pełne tłumaczenie. Wyjaśnij: „Używam AI jako bazy i każde zdanie redaguję ręcznie — to standard branżowy (MTPE). Jakość końcowa jest profesjonalna.”
Objętość tekstu jest znacznie większa niż deklarowała firma. Policz słowa ZANIM zaczniesz. Jeśli 15 000 zamiast 5 000 — „Tekst ma 15 000 słów. Pakiet S obejmuje 5 000. Proponuję upgrade do M (12 000) + dodatkowe 3 000 słów.”
Checklist końcowy
Próbka 300–500 słów zaakceptowana
Całość przetłumaczona
Spójność terminologii (glosariusz M/L)
Lokalizacja (daty, waluty, konwencje, CTA) (M/L)
Proofreading wykonany (M/L) — osobne czytanie
Cross-check z oryginałem (L) — nic nie pominięte
Grammarly / korekta EN — brak błędów
Formatowanie spójne z oryginałem (nagłówki, listy, bold)
SEO (jeśli strona) — meta title, description, alt texty
Glosariusz dostarczony (M/L)
Plik w uzgodnionym formacie
Wiadomość podsumowująca na platformie
Student2Work — Łączymy ambicje studentów z potrzebami firm',
  349, 999,
  '[{"name": "S", "label": "Pakiet S", "price": 349, "delivery_time_days": 6, "scope": ""}, {"name": "M", "label": "Pakiet M", "price": 599, "delivery_time_days": 14, "scope": ""}, {"name": "L", "label": "Pakiet L", "price": 999, "delivery_time_days": 28, "scope": ""}]'::jsonb, 3, 'Tłumaczenia',
  false, 0.25, true, 'platform_service', 'active', NULL
);

-- #39: Montaż wideo — Reels, TikTok, materiały szkoleniowe, filmy p
INSERT INTO public.service_packages (
  title, description, locked_content, price, price_max,
  variants, delivery_time_days, category,
  requires_nda, commission_rate, is_system, type, status, student_id
) VALUES (
  'Montaż wideo — Reels, TikTok, materiały szkoleniowe, filmy promocyjne',
  'Montaż wideo — Reels, TikTok, materiały szkoleniowe, filmy promocyjne
Profesjonalny montaż Twoich nagrań wideo — krótkie formy SM, filmy firmowe, tutoriale, relacje z eventów
O co chodzi
Nagrałeś 40 minut materiału telefonem na evencie. Albo masz 2 godziny nagrania szkolenia na Zoomie. Albo 15 klipów z product shootingu. Leżą na dysku bo nikt nie ma czasu zmontować ich w coś, co można opublikować.
Student montażysta zamieni surowe nagrania w gotowe wideo: przycinanie, muzyka, napisy, animacje tekstu, intro/outro, korekta kolorów, format pod platformę (9:16 Reels/TikTok, 16:9 YouTube, 1:1 feed). Dostajesz pliki GOTOWE DO PUBLIKACJI.
Student MONTUJE dostarczone nagrania. Nie nagrywa (brak ekipy filmowej) i nie tworzy pełnych animacji 3D. Montaż + post-produkcja = zakres tej usługi.
Co możemy zmontować
Reels / TikToki / Shorts (15–90 sek): krótkie, dynamiczne, z napisami, muzyką, hookiem. Format 9:16.
Film promocyjny firmy (1–3 min): przedstawienie firmy, produktu, usługi. Profesjonalny, z narracją lub tekstem.
Materiał szkoleniowy / tutorial (5–20 min): screencast + talking head, podział na rozdziały, animacje tekstu.
Relacja z eventu (2–5 min): highlight reel z konferencji, targów, firmowego spotkania.
Testimonial / wywiad (1–3 min): montaż wywiadu z klientem/pracownikiem, captions, B-roll.
Wideo do prezentacji (slides + narracja): PowerPoint/Canva + voiceover, animacje przejść.
Podcast wideo (30–60 min + clips): montaż pełnego odcinka + 3–5 klipów promocyjnych (Reels/TikTok).
Wybierz pakiet
Jak te ceny wyglądają na tle rynku
Student2Work: 30–60% taniej niż freelancer. Pakiet S (5 Reels za 399 PLN = 80 PLN/szt.) vs rynkowe 150–300 PLN/Reel.
Co musisz dostarczyć
Surowe nagrania — MP4, MOV, MKV. Link do Google Drive / WeTransfer / Dropbox. Min. 720p (idealnie 1080p lub 4K).
Brief kreatywny — jaki cel? Gdzie publikacja? Jaki ton (energiczny, spokojny, profesjonalny, luźny)? Przykłady wideo które Ci się podobają (linki).
Logo + kolory firmowe — plik PNG (przezroczyste tło), hex kolory, fonty (jeśli są w brand guide).
Muzyka — jeśli masz preferencje. Jeśli nie — student dobierze royalty-free.
Tekst napisów / CTA — co ma być na ekranie? Jaki CTA na końcu? („Zobacz więcej: link”)
Czego pakiety NIE obejmują
Nagrywania wideo — student MONTUJE dostarczone materiały. Filmowanie = ekipa filmowa (osobna usługa).
Pełnej animacji 2D/3D — proste motion graphics (wykresy, ikony) = tak. Pełna animacja explainer video = nie.
Scenariusza — student montuje wg briefu, nie pisze scenariusza. Scenariusz = copywriting (#06).
Licencji muzycznych — student używa muzyki royalty-free (Epidemic Sound, Artlist). Konkretny utwór komercyjny = firma kupuje licencję.
Dystrybucji / publikacji — student dostarcza pliki gotowe do publikacji. Upload i promowanie = firma.
Jak wygląda proces
Dzień 1: Brief + przegląd materiału: student ogląda nagrania, ustala plan montażu.
Dzień 1–2: Rough cut: wstępny montaż (cięcia, kolejność, tempo). Firma zatwierdza kierunek.
Dzień 2–3 (S) / 2–5 (M) / 2–9 (L): Fine cut: napisy, muzyka, color grading, animacje, intro/outro.
Dzień +1–2: Poprawki: firma zgłasza uwagi, student koryguje.
Dzień +1: Eksport: finalne pliki we wszystkich formatach + deliverable.',
  'Ta sekcja nie jest widoczna dla firmy-zleceniodawcy.
Twoje wynagrodzenie
Montaż krótkich form (Reels) to NAJSZYBSZA usługa do wykonania. 1 Reel = 1–2h pracy. 5 Reelsów = 6–10h. Dobra stawka i szybki turnaround.
Instrukcja realizacji
Krok 1: Przegląd materiału (~0.5–1h)
Obejrzyj WSZYSTKO. Oznacz najlepsze ujęcia (timestamps). Narzędzie: VLC (M marker) lub notatki w telefonie.
Oceń jakość: oświetlenie, stabilizacja, dźwięk. Ciemne / trzeszczące = ograniczone możliwości korekty.
Zaplanuj: które fragmenty do którego wideo? Jaka kolejność? Jaki hook (pierwszy kadr)?
Krok 2: Montaż krótkich form — Reels/TikTok (~1–2h per klip)
Hook: pierwsze 1–3 sekundy DECYDUJĄ czy widz ogląda dalej. Zasada: intrygujący kadr / bold statement / pytanie. NIE logo. NIE „Cześć, dzisiaj porozmawiamy o...”.
Tempo: cięcia co 2–4 sekundy (Reels). Usunąć WSZYSTKIE pauzy, „eee”, dead space. Jump cuts są OK w short formie.
Napisy: OBOWIĄZKOWE. 80% ogląda bez dźwięku. Styl: bold, środek ekranu, 2–3 słowa per linia, kontrastowy kolor. CapCut ma auto-captions.
Muzyka: dopasowana do tempa. Energiczna = szybkie cięcia. Spokojne = dłuższe ujęcia. Beat drop = zmiana kadru. Royalty-free: Epidemic Sound, Artlist, YouTube Audio Library.
CTA na końcu: 2–3 sek. „Obserwuj po więcej” / „Link w bio” / „Napisz do nas”. Tekst na ekranie + voiceover (jeśli jest).
Format: 9:16 (1080×1920). Safe zone: nie umieszczaj tekstu na dole (interfejs platform) ani na górze (notification bar).
Krok 3: Montaż filmu firmowego / szkoleniowego (~3–8h per film)
Struktura: Intro (5–10 sek: logo + tytuł) → Hook (problem / pytanie) → Treść (rozwiązanie / prezentacja) → CTA (co dalej?) → Outro (logo, kontakt).
Tempo: wolniejsze niż Reels ale NIE nudne. Cięcia co 5–10 sek. B-roll (ujęcia dodatkowe) przełamuje montaż talking head.
Szkolenie / tutorial: podział na sekcje (tytułowe plansze między sekcjami). Screencast: zoom na ważne elementy, highlight kursora, animacje wskaźników.
Lower thirds: imię i stanowisko mówcy. Pojawia się na 3–5 sek, potem znika. Animowane (wjeżdża z lewej).
Wywiady / testimoniale: cięcia między pytaniami (usuń pytającego, zostaw odpowiedzi). B-roll: ujęcia firmy/produktu podczas narracji.
Krok 4: Audio (~0.5–1h per film)
Normalizacja: wyrównaj głośność (dialogi = -12 dB LUFS, muzyka = -20 dB LUFS pod dialogiem).
Noise reduction: DaVinci Resolve Fairlight lub Audacity (darmowe). Usuń szum tła.
Muzyka: ciszej POD dialogiem (ducking — automatyczne w DaVinci i Premiere). Głośniej w intro/outro i przejściach.
Sound effects (M/L): whoosh na przejściach, pop na pojawieniu się tekstu, ambient na B-rollu. Nie przesadzaj — delikatnie.
Krok 5: Color grading (~0.5–1h per film)
Podstawy: balans bieli (nie za niebieski, nie za żółty), ekspozycja (nie za ciemny, nie za jasny), kontrast, nasycenie.
Spójność: wszystkie klipy w filmie powinny wyglądać spójnie (ten sam look). Scal gradingiem nawet jeśli nagrania z różnych źródeł.
LUT (M/L): look-up table = preset kolorystyczny. Nadaj filmowi „climate”. Darmowe LUT-y: smallHD, Color Grading Central.
DaVinci Resolve: najlepszy darmowy color grading. Sekcja Color = profesjonalne narzędzia (lift/gamma/gain, krówki, masks).
Narzędzia
DaVinci Resolve darmowy, profesjonalny. Montaż + color grading + audio + efekty. REKOMENDOWANY.
CapCut (desktop/mobile) szybki montaż Reels/TikTok. Auto-captions. Darmowy. Idealny na krótkie formy.
Adobe Premiere Pro standard branżowy. Płatny (studencki = ~80 PLN/mies.).
Canva (wideo) proste animacje, intro/outro, tekst na wideo. Darmowy plan.
Epidemic Sound / Artlist muzyka royalty-free. Artlist: $17/mies. (studenci: tańszy). Epidemic Sound: $15/mies.
Handbrake darmowy kompresor wideo. Zmniejsz rozmiar pliku bez utraty jakości.
Najczęstsze problemy
Słaba jakość nagrań (ciemne, trzeszczące, niestabilne). Korekta: jasność +, noise reduction, stabilizacja (DaVinci: Stabilizer). Ale słaby materiał = słaby wynik. Poinformuj firmę: „Materiał ma ograniczenia techniczne — zrobię najlepsze możliwe, ale cuda się nie zdarzają.” Zaproponuj nagranie lepszego materiału (tips dla firmy).
Firma nie ma wideo, tylko zdjęcia. „Mogę zrobić slideshow z animacjami (Ken Burns effect, transitions) + muzyką + tekstem. Ale pełnowartościowe wideo wymaga materiału filmowego.”
„Skopiuj styl tego TikToka” (firma wysłała przykład). INSPIRACJA = tak. 1:1 kopiowanie = nie (copyright + brak oryginalności). Przeanalizuj CO działa w przykładzie (tempo? hook? styl napisów?) i zaaplikuj do materiałów firmy.
Za dużo poprawek / firma zmienia koncepcję. „Pakiet obejmuje X rund poprawek. Poprawki = korekty detali (kolor, cięcie, napis). Zmiana koncepcji (inny styl, inna muzyka, inne ujęcia) = nowa runda montażu.” Ustal PRZED startem.
Checklist końcowy
Rough cut zatwierdzony przez firmę (kierunek montażu OK)
Fine cut gotowy — cięcia, tempo, przejścia
Napisy / captions — poprawne, czytelne, w safe zone
Muzyka — dopasowana, royalty-free, ducking pod dialogiem
Audio — znormalizowany, noise reduction, mix
Color grading — spójny look, korekta ekspozycji
Logo / intro / outro — obecne
CTA — na końcu każdego wideo
Formaty wyeksportowane (9:16, 16:9, 1:1 — wg pakietu)
Pliki przesłane (Google Drive / WeTransfer)
Wiadomość podsumowująca na platformie
Student2Work — Łączymy ambicje studentów z potrzebami firm',
  399, 1399,
  '[{"name": "S", "label": "Pakiet S", "price": 399, "delivery_time_days": 6, "scope": ""}, {"name": "M", "label": "Pakiet M", "price": 799, "delivery_time_days": 15, "scope": ""}, {"name": "L", "label": "Pakiet L", "price": 1399, "delivery_time_days": 30, "scope": ""}]'::jsonb, 3, 'Multimedia',
  false, 0.25, true, 'platform_service', 'active', NULL
);

-- #40: Identyfikacja wizualna — logo, wizytówki, branding basics
INSERT INTO public.service_packages (
  title, description, locked_content, price, price_max,
  variants, delivery_time_days, category,
  requires_nda, commission_rate, is_system, type, status, student_id
) VALUES (
  'Identyfikacja wizualna — logo, wizytówki, branding basics',
  'Identyfikacja wizualna — logo, wizytówki, branding basics
Spójny wizerunek Twojej firmy od podstaw — logo, kolory, typografia, wizytówki, papier firmowy, szablony SM
O co chodzi
Otwierasz firmę. Albo masz firmę od lat ale logo robił kuzyn w Paincie. Wizytówki z Vistaprint za 29 PLN. Każdy materiał wygląda inaczej — inne kolory, inne fonty, inne style. Klienci nie rozpoznają Twojej marki.
Student designer zaprojektuje spójną identyfikację wizualną: logo (kilka wariantów), paleta kolorów, typografia, wizytówki, papier firmowy, szablony social media. Wszystko w jednym spójnym systemie — żeby Twoja firma wyglądała PROFESJONALNIE na każdym touchpoincie.
RÓŻNICA vs #18 (UI/UX): #18 to projektowanie interfejsu APLIKACJI. #40 to branding FIRMY — logo, kolory, materiały firmowe. Inne kompetencje, inny deliverable.
Co dostaniesz
Logo: 2–3 koncepcje → wybór → dopracowanie. Wersje: pełne (logo + nazwa), sygnatura (sam symbol), monochromatyczne (czarno-białe), negatyw (na ciemnym tle). Pliki: SVG, PNG (przezroczyste tło), PDF.
Paleta kolorów: kolory główne (1–2) + akcentowe (1–2) + neutralne (szary/biały/czarny). Kody: HEX, RGB, CMYK. Zasady użycia.
Typografia: font główny (nagłówki) + font uzupełniający (treść). Darmowe lub z licencją. Hierarchia: H1, H2, body, caption.
Wizytówka: dwustronna, gotowa do druku (PDF CMYK + bleedy). Format 90×50 mm.
Papier firmowy: A4, nagłówek + stopka + miejsce na treść. Word / PDF.
Szablony social media: 3–5 szablonów Canva (post, story, cover) w kolorach firmowych. Firma edytuje samodzielnie.
Brand guide (mini): dokument PDF z zasadami użycia logo, kolorów, fontów, przykładami poprawnego i niepoprawnego użycia.
Wybierz pakiet
Jak te ceny wyglądają na tle rynku
Student2Work vs 99designs/Fiverr: my dajemy SYSTEM (logo + kolory + fonty + materiały), nie samo logo. Spójność wizualna > ładne logo bez kontekstu.
Co musisz dostarczyć
Nazwa firmy + branża — jak się nazywasz, czym się zajmujesz
Grupa docelowa — kto jest Twoim klientem? (B2B/B2C, wiek, styl)
Preferencje — jakie marki Ci się podobają wizualnie? Jakie kolory? Styl: nowoczesny, klasyczny, minimalistyczny, odważny?
Przykłady (moodboard) — 3–5 logotypów / stron / marek które Ci odpowiadają (Pinterest, Dribbble, Behance)
Istniejące materiały — jeśli masz obecne logo / materiały — czy robimy od zera czy odświeżamy?
Czego pakiety NIE obejmują
Strategii marki — student projektuje WIZUALNIE. Strategia (pozycjonowanie, architektura marki, naming) = osobna usługa.
Fotografii / ilustracji — student używa stocków / ikon. Custom fotografia lub ilustracja = osobna usługa.
Druku — student dostarcza pliki GOTOWE DO DRUKU (PDF CMYK + bleed). Druk = drukarnia.
Projektowania UI/UX — branding firmy ≠ interfejs aplikacji. UI/UX = #18.
Animacji / wideo — animowane logo (GIF w M/L) tak. Pełna animacja / film = #39.
Jak wygląda proces
Dzień 1–2: Brief + moodboard: student zbiera preferencje, analizuje branżę i konkurencję, tworzy moodboard.
Dzień 2–3: Koncepcje logo: 2–3 kierunki. Firma wybiera jeden i zgłasza feedback.
Dzień 3–4 (S) / 3–7 (M) / 3–10 (L): Dopracowanie logo + projektowanie pozostałych materiałów (wizytówka, paleta, fonty, szablony).
Dzień +1–3: Poprawki (2–3 rundy): detale, korekty, warianty.
Dzień +1: Finalizacja: eksport plików, brand guide, przekazanie.',
  'Ta sekcja nie jest widoczna dla firmy-zleceniodawcy.
Twoje wynagrodzenie
Branding to usługa portfolio-building: każdy projekt ląduje w Twoim portfolio na Behance/Dribbble. Po 5–10 projektach — masz portfolio które otwiera drzwi do pracy w agencji.
Instrukcja realizacji
Krok 1: Brief i research (~1–2h)
Brief: nazwa firmy, branża, grupa docelowa, wartości marki (3–5 słów kluczowych: innowacyjność, zaufanie, elegancja...), preferencje wizualne.
Analiza konkurencji: jakie logo/kolory mają 3–5 konkurentów? WYRÓŻNIJ SIĘ — nie kopiuj.
Moodboard: zbierz 10–20 inspiracji (Pinterest, Dribbble, Behance, Brandmark, Logopond). Pokaż firmie: „Czy ten kierunek Ci odpowiada?”
Psychologia kolorów: niebieski = zaufanie (finanse, IT), zielony = natura/zdrowie, czerwony = energia/jedzenie, czarny = luksus, żółty = radość/kreatywność. DOPASUJ do branży.
Krok 2: Projektowanie logo (~3–8h)
Zacznij od SZKICÓW NA PAPIERZE. 20–30 szybkich miniaturek (thumbnails). Dopiero potem digitalizacja. Najłatwiej przetestować 10 kierunków na papierze w 30 min niż 1 kierunek w Figmie w 3h.
Typy logo: Wordmark (tylko napis: Google, Coca-Cola), Lettermark (inicjały: IBM, HP), Symbol + napis (Apple, Nike), Emblema (Starbucks, Harley-Davidson), Abstrakcyjne (Pepsi, Airbnb). Dobierz typ do firmy.
PROSTOTA: dobre logo działa w rozmiarze 16×16 px (favicon). Jeśli jest zbyt skomplikowane — uprość. Małe firmy = czytelne, proste, zapamiętywalne.
Czarno-białe NAJPIERW: projektuj logo w czerni. Jeśli działa w mono — będzie działać w kolorze. Odwrotnie — nie zawsze.
Skalowalność: testuj logo na wizytówce (małe) i na billboardzie (duże). Na ciemnym i jasnym tle. Na zdjęciu. Na koszulce.
Wektorowo (SVG/AI): ZAWSZE projektuj w wektorze. NIE w Photoshopie/Canvie (rastery nie skalują się). Figma, Illustrator, Inkscape (darmowy).
Krok 3: System wizualny (~2–5h)
Paleta: 1–2 kolory główne + 1–2 akcentowe + neutralne (szary, biały, czarny). Kontrast: kolor tekstu vs kolor tła musi być czytelny (WCAG AA: ratio ≥4.5:1). Narzędzie: coolors.co, Adobe Color.
Typografia: 1 font na nagłówki + 1 na treść. Darmowe: Google Fonts (rekomendowane: Inter, Poppins, Montserrat, Lora, Merriweather). NIE mieszaj więcej niż 2 fontów. Hierarchia: H1 (32–40px bold), H2 (24–28px semibold), Body (16px regular), Caption (12–14px).
Wizytówka: format 90×50 mm + bleed 3 mm. CMYK (nie RGB!). Przód: logo, imię i nazwisko, stanowisko, kontakt. Tył: logo duże lub pattern / kolor firmowy. Rozdzielczość: 300 DPI.
Papier firmowy (M/L): A4. Nagłówek: logo + dane firmy. Stopka: NIP, REGON, adres, kontakt. Obszar treści: marginesy 20–25 mm. Eksport: Word (edytowalny) + PDF.
Krok 4: Szablony SM (M/L, ~2–4h)
Canva: tworzenie szablonów które firma może edytować samodzielnie. Udostępnij jako „Canva template” (link).
Formaty: Post feed (1080×1080), Story (1080×1920), Cover Facebook (820×312), Cover LinkedIn (1584×396), Highlight Instagram (1080×1080 circle-safe).
Rodzaje szablonów: cytat / tip, ogłoszenie / promo, before-after, karuzela (multi-slide), zdjęcie z ramką firmową.
Spójność: te same kolory, fonty, styl co logo. Firma zmienia TEKST i ZDJĘCIA — design zostaje spójny.
Krok 5: Brand guide (~1–4h)
Mini (M, 5–8 stron): Logo (wersje, min. rozmiar, pole ochronne), Paleta kolorów (kody), Typografia (fonty, rozmiary), Do’s & Don’ts (jak NIE używać logo: nie rozciągaj, nie zmieniaj kolorów, nie dodawaj efektów).
Pełny (L, 12–20 stron): + Tone of voice (jak firma mówi: formalnie? luźno? ekspersko?), Fotografia (styl zdjęć, filtry, jasne/ciemne), Ikony (styl ikon: filled/outlined, grubość linii), Mockupy (jak wygląda branding na materiałach: wizytówka, koszulka, teczka, torba, samochód).
Mockupy: Smartmockups.com (darmowy), Figma mockup plugins. Pokaż firmie jak branding wygląda „w życiu”.
Narzędzia
Figma projektowanie logo, materiałów, brand guide. Darmowy plan. REKOMENDOWANY.
Adobe Illustrator standard branżowy na logo wektorowe. Płatny (studencki ~80 PLN/mies.).
Inkscape darmowa alternatywa Illustratora (wektor SVG).
Canva Pro szablony SM, wizytówki, papier firmowy. Darmowy plan (ograniczony).
Coolors.co generator palet kolorów. Darmowy.
Google Fonts darmowe fonty. Ogromna biblioteka. Komercyjne użycie dozwolone.
Najczęstsze problemy
Firma nie wie czego chce („zrób coś ładnego”). Moodboard rozwiązuje problem. Pokaż 10–15 inspiracji: „Takie? Czy raczej takie?” Zawężaj wybór. Pytaj: „Co Ci się NIE podoba?” — często łatwiej określić czego nie chcesz.
„Zrób podobne do [duża marka]” (Apple, Nike). „Mogę zainspirować się stylem (minimalizm, prostota) ale nie kopiować. Logo musi być ORYGINALNE i dopasowane do TWOJEJ firmy, nie Apple.”
Firma chce WSZYSTKO na wizytówce (logo, 3 telefony, fax, 2 adresy, QR, motto, hasło). „Mniej = więcej. Wizytówka to pierwsze wrażenie — musi być CZYTELNA. Logo + imię + stanowisko + telefon + email + www. Reszta na stronę www (QR code).”
Nie kończą się poprawki („a może jeszcze trochę w lewo...”). Pakiet obejmuje 2–3 rundy. Runda = zebrany feedback → implementacja. Nie „co 5 minut nowy email z drobną zmianą”. Ustal zasady NA POCZĄTKU.
Checklist końcowy
Logo — wszystkie wersje (pełne, sygnatura, mono, negatyw)
Pliki logo — SVG + PNG (przezroczyste, min. 3000px) + PDF
Paleta kolorów — kody HEX, RGB, CMYK
Typografia — fonty + hierarchia + linki do pobrania
Wizytówka — PDF CMYK + bleed, gotowa do druku
Papier firmowy (M/L) — Word + PDF
Szablony SM (M/L) — Canva linki udostępnione
Brand guide — mini (M) lub pełny (L) w PDF
Mockupy (L) — wizualizacje brandingu w kontekście
Pliki źródłowe — Figma / AI (edytowalne)
Wiadomość podsumowująca na platformie
Student2Work — Łączymy ambicje studentów z potrzebami firm',
  499, 1499,
  '[{"name": "S", "label": "Pakiet S", "price": 499, "delivery_time_days": 10, "scope": ""}, {"name": "M", "label": "Pakiet M", "price": 899, "delivery_time_days": 20, "scope": ""}, {"name": "L", "label": "Pakiet L", "price": 1499, "delivery_time_days": 35, "scope": ""}]'::jsonb, 5, 'Design',
  false, 0.25, true, 'platform_service', 'active', NULL
);

-- #41: Prowadzenie social media — pakiet miesięczny postów
INSERT INTO public.service_packages (
  title, description, locked_content, price, price_max,
  variants, delivery_time_days, category,
  requires_nda, commission_rate, is_system, type, status, student_id
) VALUES (
  'Prowadzenie social media — pakiet miesięczny postów',
  'Prowadzenie social media — pakiet miesięczny postów
Regularny, spójny content na Twoich profilach firmowych — teksty, grafiki, harmonogram, publikacja
O co chodzi
Wiesz że Twoja firma powinna być na social mediach. Ale: nie masz czasu pisać postów, nie wiesz co publikować, ostatni post był 3 miesiące temu, grafiki robisz „na kolanie” w Canvie, a profil wygląda jak porzucony.
Student przejmie Twoje social media: zaplanuje harmonogram publikacji na cały miesiąc, napisze teksty, zaprojektuje grafiki w Twoich kolorach firmowych, opublikuje posty i dostarczy raport z wynikami. Ty tylko akceptujesz content i zajmujesz się biznesem.
PIERWSZA usługa cykliczna w katalogu. Firma kupuje pakiet na 1 miesiąc i (idealnie) przedłuża. Wysoki potencjał powrotny = stabilny przychód.
Jakie platformy obsługujemy
Instagram: feed (1080×1080 / karuzela), Stories, Reels. B2C, lifestyle, wizualne branże.
Facebook: posty, wydarzenia, Stories. B2C, usługi lokalne, starsze grupy docelowe.
LinkedIn: posty (tekst + grafika), artykuły, karuzele PDF. B2B, employer branding, eksperci.
TikTok: krótkie wideo (z dostarczonych materiałów lub stock). Gen Z + młodzi profesjonaliści.
Google Business Profile: aktualizacje, zdjęcia, odpowiedzi na recenzje. Lokalne firmy.
Rekomendacja: zacznij od 1–2 platform które mają sens dla Twojej branży. Lepiej dobrze na 2 niż słabo na 5.
Wybierz pakiet
Jak te ceny wyglądają na tle rynku
Student2Work: 2–3× taniej niż freelancer SM, 3–10× taniej niż agencja. Idealny dla małych firm które nie potrzebują pełnej agencji.
Co musisz dostarczyć
Dostęp do profili — login do kont SM LUB zaproszenie jako administrator/edytor (Meta Business Suite, LinkedIn Page admin)
Materiały — zdjęcia (produkty, zespół, biuro, eventy), logo, kolory firmowe. Im więcej materiałów = lepsze posty.
Brief — co jest Twoim celem? (rozpoznawalność, leady, sprzedaż, employer branding). Kim jest Twój klient? Jaki ton komunikacji?
Zatwierdzanie — student prześle kalendarz na początku miesiąca. Firma zatwierdza lub zgłasza poprawki. Potem publikacja wg planu.
Tematy / newsy — jeśli w firmie dzieje się coś ciekawego (event, nowy produkt, nagroda) — poinformuj studenta. To najlepszy content!
Czego pakiety NIE obejmują
Reklam płatnych (Meta Ads, LinkedIn Ads) — student zarządza organicznym contentem. Kampanie reklamowe = osobna usługa.
Fotografii / filmowania — student projektuje grafiki i montuje dostarczone materiały. Sesja zdjęciowa = osobna usługa.
Strategii długoterminowej — pakiet L obejmuje 3-mies. plan contentowy. Pełna strategia marketingowa = osobna usługa.
Obsługi kryzysu — student odpowiada na komentarze i DM (M/L). Kryzys wizerunkowy (hejt, skandal) = eskalacja do firmy.
Wzrostu followerów gwarantowanego — student robi DOBRY content i optymalizuje. Algorytm decyduje o zasięgu. Nikt nie gwarantuje followerów.
Jak wygląda proces (co miesiąc)
Dzień 1–3: Brief (1. miesiąc) lub review poprzedniego miesiąca. Student przygotowuje kalendarz publikacji na cały miesiąc.
Dzień 3–5: Firma zatwierdza kalendarz (tematy, daty, ton). Feedback: „ten temat tak, ten nie, dodaj X”.
Dzień 5–8: Produkcja: student pisze teksty, projektuje grafiki, przygotowuje hashtagi, planuje publikację.
Cały miesiąc: Publikacja wg harmonogramu. Moderacja komentarzy i DM (M/L).
Ostatni tydzień: Raport: co opublikowano, jakie wyniki, rekomendacje na następny miesiąc.',
  'Ta sekcja nie jest widoczna dla firmy-zleceniodawcy.
Twoje wynagrodzenie
CYKLICZNA usługa = CYKLICZNY przychód. 3 firmy na pakiecie M = 2 247 PLN/mies. netto. Buduj relacje — firma która widzi efekty nie rezygnuje.
Instrukcja realizacji
Krok 1: Content pillars i kalendarz (~2–4h na 1. miesiąc, ~1h potem)
Content pillars: 3–5 stałych kategorii postów. Np. dla restauracji: 1) Dania (zdjęcia, przepisy), 2) Zespół (behind the scenes), 3) Opinie klientów, 4) Eventy/promocje, 5) Edukacja (skąd produkty). Pillar = nigdy nie brakuje tematów.
Kalendarz: Excel / Notion / Google Sheets. Kolumny: Data | Platforma | Pillar | Temat | Tekst | Grafika (link) | Hashtagi | Status (draft/approved/published). Firma widzi i zatwierdza PRZED publikacją.
Proporcje: 80% wartość (edukacja, inspiracja, entertainment) / 20% sprzedaż (promo, oferta, CTA). NIE sprzedawaj w każdym poście — ludzie przestają obserwować.
Godziny publikacji: Instagram: Wt–Cz 10:00–12:00 lub 18:00–20:00. LinkedIn: Wt–Cz 8:00–10:00. Facebook: Pn–Pt 13:00–16:00. Testuj i optymalizuj (L).
Krok 2: Copywriting — teksty postów (~0.5–1h per post)
Hook: pierwsze 1–2 zdania DECYDUJĄ czy ktoś czyta dalej. Techniki: pytanie („Czy wiesz że...?”), bold statement („Większość firm robi to źle.”), statystyka („73% klientów...”), kontrowersja („Nie potrzebujesz X.”).
Długość: Instagram: 100–200 słów (krótko, emoji OK). LinkedIn: 200–600 słów (dłuższe, merytoryczne, bez emoji). Facebook: 50–150 słów (krótko). TikTok: 1–2 zdania + hashtagi.
CTA: każdy post kończy się wezwaniem do działania. „Napisz w komentarzu”, „Zapisz ten post”, „Kliknij link w bio”, „Udostępnij znajomemu”. BEZ CTA = brak zaangażowania.
Hashtagi (Instagram): 5–15 tagów. Mix: 2–3 duże (>500K postów), 3–5 średnie (10K–500K), 3–5 niszowe (<10K). Badaj: hashtagify.me. LinkedIn: 3–5 tagów. Facebook / TikTok: 3–5.
Ton: DOPASUJ do marki. Formalna kancelaria prawna ≠ kreatywna kawiarnia. Ustal tone of voice na początku i TRZYMAJ SIĘ go.
Krok 3: Grafiki (~0.5–0.75h per grafika)
Canva: szablony w kolorach firmowych. Utwórz BRAND KIT (logo, kolory, fonty). Każdy post = spójny look.
Typy grafik: 1) Zdjęcie + overlay tekstu, 2) Cytat na kolorowym tle, 3) Infografika / lista tipów, 4) Karuzela (multi-slide), 5) Before-after, 6) Meme / trending format.
Formaty: Feed IG: 1080×1080 (kwadrat) lub 1080×1350 (4:5 — więcej miejsca w feedzie!). Story/Reels: 1080×1920 (9:16). LinkedIn: 1200×1200 lub 1200×628.
ZASADA: zdjęcia > grafiki. Autentyczne zdjęcia (zespołu, biura, produktu) działają LEPIEJ niż stock. Jeśli firma ma zdjęcia — używaj ich.
Czytelność: tekst na grafice = max 6–8 słów. Duży font. Kontrast z tłem. Nie upychaj wszystkiego na jednej grafice.
Krok 4: Moderacja (M/L, ~0.5–1h/dzień)
Odpowiadaj na każdy komentarz (nawet emoji — odpisz emoji). Algorytm nagradza zaangażowanie.
DM: odpowiadaj w ciągu 4–8h (Pn–Pt). Pytania sprzedażowe → przekieruj do firmy. Pytania ogólne → odpowiedz sam.
Negatywne komentarze: NIGDY nie kasuj (wygląda źle). Odpowiedz rzeczowo: „Przepraszamy za niedogodności. Napisz do nas DM — rozwiążemy to.” Hejt bez treści = ignoruj lub ukryj (nie kasuj).
Proaktywne zaangażowanie (L): komentuj posty firm z branży, potencjalnych klientów, influencerów. 15–20 min/dzień. Buduje widoczność.
Krok 5: Raport miesięczny (M/L, ~1–2h)
Metryki: followers (zmiana +/-), zasięg (łączny, średni per post), zaangażowanie (lajki, komentarze, udostępnienia, zapisy), CTR (kliknięcia w link), top 3 posty, najgorszy post.
Narzędzia: Instagram Insights, Meta Business Suite, LinkedIn Analytics. Eksport do Google Sheets.
Rekomendacje: co zadziałało? Co nie? Co zmienić w następnym miesiącu? (więcej karuzeli? Mniej postów sprzedażowych? Inne godziny?)
Benchmark konkurencji (L): jak wypadamy vs 2–3 konkurentów (followers, zaangażowanie, częstotliwość publikacji)?
Narzędzia
Canva (Pro) grafiki, szablony, Brand Kit. Studencki plan tańszy.
Meta Business Suite planowanie i publikacja na FB + IG. Darmowy.
Buffer / Later planowanie publikacji cross-platform. Darmowy plan (3 kanały).
Notion / Google Sheets content calendar, harmonogram, baza pomysłów.
Hashtagify / DisplayPurposes research hashtagów (popularność, powiązane).
ChatGPT / Claude wsparcie przy generowaniu pomysłów na posty, hooków, wariantów tekstu. ZAWSZE redaguj ręcznie.
Najczęstsze problemy
Firma nie ma żadnych zdjęć. „Autentyczne zdjęcia działają najlepiej. Proszę — zróbcie telefonem 10–15 zdjęć: zespół, biuro, produkt, proces. Wyślij mi — zrobię z nich posty.” Alternatywa: stock (Unsplash, Pexels) ale mniej autentyczne.
Firma chce „wiralowego” posta. „Wiral to EFEKT, nie cel. Cel = spójny content który buduje markę. Mogę zoptymalizować pod zaangażowanie (hook, CTA, trending format) ale nikt nie gwarantuje wirala.”
Zero zaangażowania mimo regularnych postów. Sprawdź: 1) Czy posty dają WARTOŚĆ (nie tylko sprzedają)? 2) Czy jest CTA? 3) Czy godziny są optymalne? 4) Czy odpowiadasz na komentarze? 5) Czy hashtagi są trafne? Często: za dużo sprzedaży, za mało edukacji/rozrywki.
Firma zmienia zdanie co tydzień („nie tak, inaczej, wróć do poprzedniego”). Kalendarz zatwierdzony na początku miesiąca = kontrakt. Zmiany w trakcie = dodatkowa runda. Ustal JEDNEGO decydenta po stronie firmy.
Checklist końcowy (miesięczny)
Kalendarz zatwierdzony przez firmę na początku miesiąca
Wszystkie posty opublikowane wg harmonogramu
Grafiki spójne z brandem (kolory, fonty, styl)
Teksty z hookiem + CTA + hashtagi
Stories / Reels (M/L) opublikowane
Komentarze i DM obsłużone (M/L)
Raport miesięczny dostarczony (M/L)
Rekomendacje na następny miesiąc
Wiadomość podsumowująca na platformie
Student2Work — Łączymy ambicje studentów z potrzebami firm',
  599, 1599,
  '[{"name": "S", "label": "Pakiet S", "price": 599, "delivery_time_days": 10, "scope": ""}, {"name": "M", "label": "Pakiet M", "price": 999, "delivery_time_days": 20, "scope": ""}, {"name": "L", "label": "Pakiet L", "price": 1599, "delivery_time_days": 35, "scope": ""}]'::jsonb, 7, 'Marketing',
  false, 0.25, true, 'platform_service', 'active', NULL
);

-- Total: 37 packages seeded
