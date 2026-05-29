BEGIN;

UPDATE public.service_packages
SET
  title = 'Projekt logo + mini-ksiega znaku',
  slug = 'projekt-logo',
  category = 'Grafika / Branding',
  categories = ARRAY['grafika', 'branding', 'identyfikacja-wizualna'],
  status = 'active',
  is_system = true,
  requires_nda = false,
  commission_rate = 0.25,
  price = 500,
  price_max = 1299,
  delivery_time_days = 7,
  meta_title = 'Projekt logo dla firmy | Student2Work - od 500 PLN',
  meta_description = 'Profesjonalne logo zaprojektowane przez studenta grafiki. 3 warianty: STARTER 500 PLN, STANDARD 849 PLN, PRO 1299 PLN. Pliki wektorowe, prawa autorskie w cenie.',
  variants = '[
    {
      "id": "starter",
      "name": "STARTER",
      "price": 500,
      "student_payout": 400,
      "delivery_time_days": 7,
      "commission_rate": 0.20,
      "description": "2 koncepcje, PNG + SVG, 1 runda poprawek, prawa autorskie. Idealne dla JDG i startupow potrzebujacych logo do internetu i social mediow.",
      "features": [
        "2 propozycje logo",
        "1 runda poprawek (5 zmian)",
        "Pliki PNG + SVG (web)",
        "Wersja kolorowa + monochromatyczna",
        "1 wersja kompozycji",
        "Prezentacja na 2 mockupach",
        "Pelne prawa autorskie"
      ]
    },
    {
      "id": "standard",
      "name": "STANDARD",
      "price": 849,
      "student_payout": 637,
      "delivery_time_days": 10,
      "commission_rate": 0.25,
      "description": "3 koncepcje, pliki do druku (PDF CMYK), mini-ksiega 2 str., 2 rundy poprawek. Dla firm planujacych wizytowki, ulotki i szyldy.",
      "features": [
        "3 propozycje logo",
        "2 rundy poprawek (5 zmian / runda)",
        "Pliki PNG + SVG (web) + PDF CMYK (druk)",
        "Wersja kolorowa + mono + negatyw",
        "Wersje pozioma + pionowa",
        "Prezentacja na 3 mockupach",
        "Mini-ksiega znaku 2 str. (kolory, czcionki, pole ochronne)",
        "Pelne prawa autorskie"
      ]
    },
    {
      "id": "pro",
      "name": "PRO",
      "price": 1299,
      "student_payout": 974,
      "delivery_time_days": 14,
      "commission_rate": 0.25,
      "description": "3 koncepcje, pelny pakiet plikow (w tym AI/EPS), mini-ksiega PRO 4-6 str. z DO/DON''T i mockupami aplikacji. Dla firm budujacych marke.",
      "features": [
        "3 propozycje logo",
        "2 rundy poprawek (5 zmian / runda)",
        "Pliki PNG + SVG + PDF CMYK + AI / EPS",
        "Wersja kolorowa + mono + negatyw",
        "Wersje pozioma + pionowa + favicon",
        "Prezentacja na 5 mockupach",
        "Mini-ksiega znaku 4-6 str. (paleta, typografia, grid ochronny, DO/DON''T, mockupy aplikacji)",
        "Pelne prawa autorskie"
      ]
    }
  ]'::jsonb,
  form_schema = '{
    "fields": [
      {
        "id": "company_name",
        "type": "text",
        "label": "Nazwa firmy",
        "placeholder": "Dokladna pisownia, np. Kowalski Transport",
        "required": true
      },
      {
        "id": "slogan",
        "type": "text",
        "label": "Slogan lub podtytul (opcjonalnie)",
        "placeholder": "np. przewozy krajowe i miedzynarodowe",
        "required": false
      },
      {
        "id": "industry",
        "type": "textarea",
        "label": "Branza i opis firmy",
        "placeholder": "Czym sie zajmujesz? Kto jest Twoim klientem? Jaki styl chcesz komunikowac (formalny / nowoczesny / zabawny / premium)?",
        "required": true
      },
      {
        "id": "logos_liked",
        "type": "textarea",
        "label": "2-3 logo ktore Ci sie podobaja (z dowolnej branzy)",
        "placeholder": "Nazwy firm lub linki. Nie musisz byc z tej samej branzy.",
        "required": true
      },
      {
        "id": "logos_disliked",
        "type": "textarea",
        "label": "2-3 logo ktore Ci sie NIE podobaja",
        "placeholder": "Rownie wazne jak to co lubisz.",
        "required": true
      },
      {
        "id": "colors",
        "type": "textarea",
        "label": "Preferencje kolorystyczne",
        "placeholder": "np. odcienie granatu i szarosci, albo dobierzcie sami",
        "required": false
      },
      {
        "id": "old_logo",
        "type": "file_upload",
        "label": "Stare logo (jesli istnieje)",
        "accept": "image/*,.pdf,.ai,.eps,.svg",
        "required": false
      },
      {
        "id": "print_usage",
        "type": "radio",
        "label": "Czy logo bedzie drukowane? (wizytowki, szyldy, ulotki)",
        "options": ["Tak", "Nie", "Nie wiem jeszcze"],
        "required": true,
        "show_if": { "field": "variant", "value": ["standard", "pro"] }
      },
      {
        "id": "additional_notes",
        "type": "textarea",
        "label": "Dodatkowe uwagi",
        "placeholder": "Cokolwiek co pomoze studentowi zrozumiec Twoja marke.",
        "required": false
      }
    ]
  }'::jsonb,
  faq = '[
    {
      "q": "Co jesli zadna z propozycji mi nie odpowiada?",
      "a": "Student przygotuje 1 dodatkowa koncepcje bezplatnie na podstawie Twojego feedbacku. To jednorazowa opcja - chodzi o to, zeby razem znalezc wlasciwy kierunek, nie o nieskonczone iteracje."
    },
    {
      "q": "Czy dostane plik ktory moge dac do drukarni?",
      "a": "W pakiecie STANDARD i PRO tak - dostajesz PDF w trybie CMYK gotowy do druku. W pakiecie STARTER pliki sa przeznaczone tylko do uzycia w internecie."
    },
    {
      "q": "Student czy doswiadczony grafik - jaka jest roznica?",
      "a": "Student grafiki 3-4 roku ma za soba kilkadziesiat projektow logo z uczelni i zna zasady typografii, kompozycji i koloru - bo to jadro jego studiow. Carolyn Davidson byla studentka kiedy projektowala Nike Swoosh. Placisz mniej, bo student buduje portfolio. Jakosc procesu (brief, propozycje na mockupach, pliki wektorowe) jest taka sama jak u freelancera."
    },
    {
      "q": "Co to jest mini-ksiega znaku i czy jej potrzebuje?",
      "a": "Mini-ksiega to dokument 2-6 stron ktory pokazuje jak uzywac logo: jakie kolory (HEX, RGB, CMYK), jakie czcionki, ile przestrzeni wokol logo, czego unikac. Przyda Ci sie gdy bedziesz zamawiac materialy u roznych dostawcow - kazdy dostaje ten dokument i robi wszystko spojnie. Jesli jestes JDG i logo jest tylko na stronie i FB - STARTER wystarczy. Jesli planujesz druk lub wspolpracujesz z agencja - wez STANDARD lub PRO."
    },
    {
      "q": "Czy logo bedzie moje na wylacznosc?",
      "a": "Tak. Pelne przeniesienie praw majatkowych jest wliczone w kazdy pakiet. Logo jest Twoje - mozesz je rejestrowac jako znak towarowy, sprzedawac firme razem z nim, robic z nim cokolwiek."
    },
    {
      "q": "Czym rozni sie STANDARD od PRO?",
      "a": "Glowna roznica to mini-ksiega znaku i pliki zrodlowe. W PRO dostajesz rozbudowana mini-ksiege (paleta kolorow z odcieniami, przyklady typografii, zasady uzycia w roznych kontekstach) oraz pliki AI/EPS ktore kazda drukarnia i agencja moze otworzyc i edytowac. Jesli planujesz rozwijac marke i wspolpracowac z roznymi wykonawcami - PRO daje Ci pelen pakiet dokumentacji."
    }
  ]'::jsonb,
  related_service_ids = ARRAY[
    '5de0e9f6-3768-4732-987b-5c0073591646'
  ]
WHERE id = '5de0e9f6-3768-4732-987b-5c0073591646';

COMMIT;
