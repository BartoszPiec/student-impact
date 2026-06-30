BEGIN;

UPDATE public.service_packages
SET
  title = 'Projekt Logo',
  category = 'Design',
  type = 'platform_service',
  is_system = true,
  requires_nda = false,
  price = 350,
  price_max = 650,
  delivery_time_days = 7,
  slug = 'projekt-logo',
  meta_title = 'Projekt Logo dla firm | Student2Work',
  meta_description = 'Profesjonalne logo zaprojektowane przez studenta grafiki. 2-3 koncepcje, pelne prawa autorskie, pliki do druku i internetu. Od 350 PLN.',
  description = $$
### O co chodzi
Otwierasz firme, zmieniasz nazwe albo po prostu masz logo, ktore nie oddaje jakosci Twojej marki.
Potrzebujesz nowego znaku: profesjonalnego, czytelnego i gotowego do uzycia na stronie, w social mediach i w druku.

Student grafiki przygotuje projekt od zera: najpierw brief, potem 2-3 koncepcje, a po wyborze finalny projekt
oraz komplet plikow do codziennej pracy. W obu pakietach otrzymujesz pelne przeniesienie praw autorskich.

### Dla kogo
- **Nowa firma lub startup** - Potrzebujesz pierwszego profesjonalnego logo.
- **Firma z amatorskim logo** - Czas na znak, ktory lepiej reprezentuje Twoja marke.
- **Stowarzyszenie lub NGO** - Potrzebujesz profesjonalnego wizerunku przy ograniczonym budzecie.
- **Freelancer lub specjalista** - Budujesz marke osobista do strony, portfolio i social mediow.
- **Rebrand** - Firma rosnie i stare logo przestalo pasowac do nowego etapu.

### Wybierz pakiet
| Element | Basic - Start | Standard - Rekomendowany |
| --- | --- | --- |
| Cena | 350 PLN | 650 PLN |
| Koncepcje | 2 | 3 |
| Poprawki | 1 runda (do 8 zmian) | 2 rundy (do 8 zmian na runde) |
| Wersje logo | Kolor + czarno-biala | Kolor + czarno-biala + monochromatyczna |
| Pliki | PNG + SVG | PNG + SVG + PDF CMYK + AI/EPS |
| Dokumentacja | Przewodnik 1 strona | Mini-ksiega znaku 2-4 strony |
| Prawa autorskie | Pelne przeniesienie | Pelne przeniesienie |

### Co dokladnie dostajesz
| Element | Szczegoly |
| --- | --- |
| Propozycje logo | Basic: 2 koncepcje. Standard: 3 koncepcje na mockupach. |
| Poprawki | Basic: 1 runda. Standard: 2 rundy. |
| Wersje kolorystyczne | Wersje gotowe do internetu i materialow drukowanych. |
| Finalne pliki | Paczka plikow dopasowana do wybranego wariantu. |

### Czego ten pakiet nie obejmuje
- Wizytowek, papieru firmowego i szablonow social media.
- Animacji logo (motion design).
- Rejestracji znaku towarowego.
- Strategii marki i namingu.

### Co musisz dostarczyc
- Nazwe firmy i ewentualny slogan.
- Krotki opis branzy i grupy docelowej.
- 2-3 przyklady logo, ktore Ci sie podobaja.
- 2-3 przyklady logo, ktore Ci sie nie podobaja.
- Preferencje kolorystyczne (lub decyzja po stronie studenta).

### Jak ta cena wyglada na tle rynku
| Opcja | Co dostajesz | Cena |
| --- | --- | --- |
| Generator AI | Szablonowe logo, ograniczona unikalnosc | 0-150 PLN |
| Freelancer poczatkujacy | 1-2 propozycje, podstawowe pliki | 200-500 PLN |
| Doswiadczony freelancer | Szeroki zakres i dokumentacja marki | 1500-5000 PLN |
| Agencja brandingowa | Strategia + identyfikacja + zespol | 5000-20000+ PLN |
| Student2Work | 3 koncepcje + pliki + mini-ksiega + prawa | 650 PLN |

### Jak wyglada proces
1. **Brief i wybor studenta** - Przy zamowieniu wypelniasz brief i wybierasz studenta albo auto-przydzial.
2. **Analiza i szkice** - Student analizuje brief i przygotowuje szkice koncepcji.
3. **Propozycje koncepcji** - Otrzymujesz 2-3 propozycje i wybierasz kierunek.
4. **Dopracowanie i poprawki** - Student realizuje poprawki zgodnie z wariantem.
5. **Pliki koncowe i zamkniecie** - Dostajesz paczke finalna, a Escrow uwalnia srodki po akceptacji.
$$,
  variants = $$
  {
    "packages": [
      {
        "id": "basic",
        "name": "Basic",
        "label": "Basic",
        "price": 350,
        "price_minor": 35000,
        "delivery_time_days": 7,
        "is_recommended": false,
        "description": "Mikrofirma, stowarzyszenie, freelancer - profesjonalne logo w rozsadnej cenie.",
        "includes": [
          "2 rozne koncepcje logo",
          "1 runda poprawek",
          "Pliki PNG + SVG",
          "Pelne przeniesienie praw autorskich"
        ],
        "excludes": [
          "3 koncepcja logo",
          "Mini-ksiega znaku",
          "Pliki CMYK + AI/EPS"
        ],
        "milestones": [
          {"idx": 1, "title": "Brief i wybor studenta", "acceptance_criteria": "Brief jest kompletny, student wybrany.", "due_days": 1},
          {"idx": 2, "title": "Analiza i szkice", "acceptance_criteria": "Student przygotowal kierunki i szkice.", "due_days": 2},
          {"idx": 3, "title": "Koncepcje", "acceptance_criteria": "Firma otrzymala 2 koncepcje i wskazala kierunek.", "due_days": 4},
          {"idx": 4, "title": "Poprawki", "acceptance_criteria": "Wprowadzono uzgodnione poprawki.", "due_days": 6},
          {"idx": 5, "title": "Pliki koncowe", "acceptance_criteria": "Firma odebrala finalna paczke plikow.", "due_days": 7}
        ]
      },
      {
        "id": "standard",
        "name": "Standard",
        "label": "Standard",
        "price": 650,
        "price_minor": 65000,
        "delivery_time_days": 10,
        "is_recommended": true,
        "description": "Rekomendowany pakiet logo gotowy do internetu i druku.",
        "includes": [
          "3 rozne koncepcje logo",
          "2 rundy poprawek",
          "PNG + SVG + PDF CMYK + AI/EPS",
          "Mini-ksiega znaku",
          "Pelne przeniesienie praw autorskich"
        ],
        "excludes": [],
        "milestones": [
          {"idx": 1, "title": "Brief i wybor studenta", "acceptance_criteria": "Brief jest kompletny, student wybrany.", "due_days": 1},
          {"idx": 2, "title": "Analiza i szkice", "acceptance_criteria": "Student przygotowal kierunki i szkice.", "due_days": 2},
          {"idx": 3, "title": "Koncepcje", "acceptance_criteria": "Firma otrzymala 3 koncepcje i wskazala kierunek.", "due_days": 5},
          {"idx": 4, "title": "Poprawki", "acceptance_criteria": "Wprowadzono uzgodnione poprawki po 2 rundach.", "due_days": 9},
          {"idx": 5, "title": "Pliki koncowe", "acceptance_criteria": "Firma odebrala finalna paczke plikow i mini-ksiege.", "due_days": 10}
        ]
      }
    ]
  }
  $$::jsonb,
  faq = $$
  [
    {
      "question": "Czy moge zobaczyc portfolio studenta przed zakupem?",
      "answer": "Tak. Po zlozeniu zamowienia zobaczysz liste dostepnych studentow i wybierzesz wykonawce samodzielnie albo auto-przydzial."
    },
    {
      "question": "Co jesli zadna z propozycji mi nie odpowiada?",
      "answer": "Student przygotuje dodatkowa koncepcje na podstawie Twojego feedbacku bez dodatkowej oplaty."
    },
    {
      "question": "Jak liczone sa poprawki?",
      "answer": "1 zmiana to 1 modyfikacja 1 elementu w 1 pliku. Basic ma 1 runde, Standard ma 2 rundy."
    },
    {
      "question": "Czy dostaje pelne prawa autorskie?",
      "answer": "Tak. W obu pakietach otrzymujesz pelne przeniesienie majatkowych praw autorskich."
    },
    {
      "question": "Jak dziala platnosc?",
      "answer": "Platnosc jest zabezpieczona przez Escrow i uwalniana po akceptacji dostarczonej pracy."
    }
  ]
  $$::jsonb
WHERE id = '5de0e9f6-3768-4732-987b-5c0073591646';

COMMIT;
