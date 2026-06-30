# Pilot MVP - decyzje i wytyczne do kolejnych rund

Data: 2026-05-09

## 1. Zlecenia systemowe

Zlecenia systemowe rozumiemy jako gotowe pakiety z predefiniowanym zakresem. Etapy nie powinny byc wymyslane recznie od zera przy kazdym zamowieniu, tylko wynikac z pakietu albo wybranego wariantu.

Decyzja produktowa:
- wdrazamy szablony etapow per `service_package` oraz opcjonalnie per `variant_key`;
- przy tworzeniu kontraktu dla `service_order` system generuje milestone'y z aktywnego szablonu;
- jesli pakiet nie ma szczegolowego szablonu, MVP uzywa jednego domyslnego etapu 100%: `Realizacja pakietu`;
- escrow nadal jest zablokowane do czasu istnienia etapow, akceptacji umow i podpisow obu stron.

Do dopracowania pozniej:
- panel admina do edycji `service_package_milestone_templates`;
- osobne szablony dla wariantow logo/social/video;
- walidacja, czy suma `amount_percent` jest logiczna dla kazdego aktywnego szablonu.

## 2. Watermark i ochrona prac studenta

Decyzja MVP:
- przed akceptacja etapu firma widzi tylko preview pliku z watermarkiem dla obrazow i PDF;
- pelne otwarcie/pobranie pliku jest dostepne dopiero po akceptacji/rozliczeniu etapu;
- dla formatow bez bezpiecznego preview pelny plik jest blokowany do akceptacji, a student powinien dostarczyc preview w PNG/JPG/PDF.

Ograniczenia:
- watermark nie chroni w 100% przed screenshotem, nagraniem ekranu, OCR ani recznym przepisaniem;
- zabezpieczenie ma ograniczyc proste naduzycia i dac jasny sygnal UX/prawny;
- zapisy umowne i logi zdarzen nadal sa potrzebne.

## 3. Wiadomosci

Zasady:
- lista wiadomosci ma proste filtry: `Wszystkie` i `Nieprzeczytane`;
- preview ostatniej wiadomosci musi pokazywac tekst, plik albo zdarzenie negocjacyjne, nie pusty wiersz;
- oznaczenie rozmowy jako nieprzeczytanej ma byc widoczne jako akcja na poziomie rozmowy;
- otwarta rozmowa nie moze natychmiast kasowac recznie ustawionego stanu `nieprzeczytane`;
- link do ogloszenia z rozmowy nie moze prowadzic w slepe 404, gdy ogloszenie jest zakonczone albo niedostepne.

## 4. Escrow

Escrow / platnosc moze pojawic sie dopiero po:
- ustaleniu etapow;
- zaakceptowaniu etapow;
- wygenerowaniu wymaganych umow;
- akceptacji wlasciwej umowy przez firme i studenta.

Firma widzi tylko umowe Firma - Student Impact.
Student widzi umowe nazwana `Umowa zlecenie`.

## 5. Manualny test regresji

Firma:
- aplikacja studenta tworzy widoczna rozmowe;
- po odczycie rozmowa znika z `Nieprzeczytane`;
- mozna oznaczyc rozmowe jako nieprzeczytana;
- klik w zakonczone/niedostepne ogloszenie z rozmowy nie konczy sie 404;
- zlecenie systemowe ma etapy z szablonu;
- depozyt nie jest widoczny przed umowami.

Student:
- widzi kontre firmy w wiadomosciach;
- nie moze spamowac kolejnych wiadomosci przed odpowiedzia firmy albo statusem odblokowujacym kontakt;
- widzi wlasciwa umowe jako `Umowa zlecenie`;
- po akceptacji/rozliczeniu etapu pelny plik jest dostepny zgodnie z flow.
