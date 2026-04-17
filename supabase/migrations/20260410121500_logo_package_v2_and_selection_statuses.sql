BEGIN;

ALTER TABLE public.service_orders
  ADD COLUMN IF NOT EXISTS student_selection_mode text,
  ADD COLUMN IF NOT EXISTS student_selected_at timestamptz,
  ADD COLUMN IF NOT EXISTS student_pool_snapshot jsonb;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conrelid = 'public.service_orders'::regclass
      AND conname = 'service_orders_status_check'
  ) THEN
    ALTER TABLE public.service_orders
      DROP CONSTRAINT service_orders_status_check;
  END IF;
END
$$;

ALTER TABLE public.service_orders
  ADD CONSTRAINT service_orders_status_check
  CHECK (
    status IN (
      'inquiry',
      'pending',
      'pending_selection',
      'pending_student_confirmation',
      'pending_confirmation',
      'proposal_sent',
      'countered',
      'accepted',
      'active',
      'in_progress',
      'revision',
      'delivered',
      'completed',
      'rejected',
      'cancelled',
      'disputed'
    )
  );

UPDATE public.service_packages
SET
  title = 'Projekt Logo',
  category = 'Design',
  type = 'platform_service',
  is_system = true,
  commission_rate = 0.25,
  requires_nda = false,
  price = 350,
  price_max = 650,
  delivery_time_days = 7,
  slug = 'projekt-logo',
  meta_title = 'Projekt Logo dla firm | Student2Work',
  meta_description = 'Profesjonalne logo zaprojektowane przez studenta grafiki. 2-3 koncepcje, pelne prawa autorskie, pliki do druku i internetu. Od 350 PLN. Zamow bez zobowiazan.',
  variants = $${
    "packages": [
      {
        "id": "basic",
        "name": "Basic",
        "price": 350,
        "price_minor": 35000,
        "delivery_time_days": 7,
        "is_recommended": false,
        "description": "Mikrofirma, stowarzyszenie, freelancer - profesjonalne logo w rozsadnej cenie.",
        "includes": [
          "2 rozne koncepcje logo",
          "Prezentacja na jasnym i ciemnym tle",
          "1 runda poprawek (max 8 zmian)",
          "Wersja kolorowa i czarno-biala",
          "Pliki PNG i SVG",
          "Krotki przewodnik uzycia logo",
          "Pelne przeniesienie praw autorskich"
        ],
        "excludes": [
          "3 koncepcja logo",
          "Wersja monochromatyczna",
          "Kompozycje pozioma i pionowa",
          "Pliki do druku CMYK + AI/EPS",
          "Mini ksiega znaku"
        ],
        "milestones": [
          {"idx": 1, "title": "Brief zatwierdzony", "acceptance_criteria": "Brief jest kompletny i student moze zaczac", "due_days": 1},
          {"idx": 2, "title": "Koncepcje dostarczone", "acceptance_criteria": "Firma wybiera 1 z 2 koncepcji", "due_days": 4},
          {"idx": 3, "title": "Poprawki i finalizacja", "acceptance_criteria": "Finalny projekt po 1 rundzie poprawek", "due_days": 6},
          {"idx": 4, "title": "Pliki koncowe", "acceptance_criteria": "Komplet plikow PNG/SVG + przewodnik", "due_days": 7}
        ]
      },
      {
        "id": "standard",
        "name": "Standard",
        "price": 650,
        "price_minor": 65000,
        "delivery_time_days": 10,
        "is_recommended": true,
        "description": "Najlepszy wybor dla firm, ktore chca logo gotowe do internetu i druku.",
        "includes": [
          "3 rozne koncepcje logo na mockupach",
          "2 rundy poprawek (max 8 zmian / runde)",
          "Wersje: kolor, czarno-biala, mono",
          "Kompozycje pozioma i pionowa",
          "Pliki PNG, SVG, PDF CMYK, AI/EPS",
          "Mini ksiega znaku 2-4 strony",
          "Pelne przeniesienie praw autorskich"
        ],
        "excludes": [],
        "milestones": [
          {"idx": 1, "title": "Brief zatwierdzony", "acceptance_criteria": "Brief jest kompletny i student moze zaczac", "due_days": 1},
          {"idx": 2, "title": "Koncepcje dostarczone", "acceptance_criteria": "Firma wybiera 1 z 3 koncepcji", "due_days": 5},
          {"idx": 3, "title": "I runda poprawek", "acceptance_criteria": "Firma przekazuje pierwsza runde zmian", "due_days": 7},
          {"idx": 4, "title": "II runda i final", "acceptance_criteria": "Finalna wersja po drugiej rundzie", "due_days": 9},
          {"idx": 5, "title": "Pliki koncowe", "acceptance_criteria": "Komplet plikow + mini ksiega znaku", "due_days": 10}
        ]
      }
    ]
  }$$::jsonb,
  form_schema = $$[
    {"id":"q1","section":"Twoja firma","type":"text","label":"Nazwa firmy i slogan","placeholder":"np. Kowalski Transport - przewozy krajowe","required":true},
    {"id":"q2","section":"Twoja firma","type":"textarea","label":"Czym sie zajmujesz? Kto jest klientem?","placeholder":"Opisz firme i odbiorcow.","required":true},
    {"id":"q3","section":"Twoja firma","type":"select","label":"Branza","options":["Uslugi B2B","Handel / E-commerce","Gastronomia","Budownictwo","Zdrowie / Uroda","Edukacja","Transport","IT / Technologia","Finanse / Prawo","NGO","Inna"],"required":true},
    {"id":"q4","section":"Styl i preferencje","type":"radio","label":"Jaki styl logo preferujesz?","options":["Minimalistyczny","Klasyczny","Geometryczny","Organiczny","Odwazny","Brak preferencji"],"required":true},
    {"id":"q5","section":"Styl i preferencje","type":"radio","label":"Jaki typ logo wolisz?","options":["Wordmark","Lettermark","Symbol + napis","Brak preferencji"],"required":true},
    {"id":"q6","section":"Styl i preferencje","type":"textarea","label":"Podaj 2-3 logo ktore Ci sie podobaja","placeholder":"Wklej linki i napisz co dziala.","required":true},
    {"id":"q7","section":"Styl i preferencje","type":"textarea","label":"Podaj 2-3 logo ktore Ci sie nie podobaja","placeholder":"Wklej linki i napisz co nie pasuje.","required":true},
    {"id":"q8","section":"Kolory","type":"radio","label":"Czy masz preferencje kolorystyczne?","options":["Tak","Mam ogolne preferencje","Nie"],"required":true},
    {"id":"q9","section":"Kolory","type":"textarea","label":"Kolory (HEX, nazwy lub opis)","placeholder":"np. #1E3A5F i #E86C2F","required":false},
    {"id":"q10","section":"Materialy","type":"file","label":"Wgraj stare logo (opcjonalnie)","accept":"image/*, .pdf, .ai, .eps, .svg","required":false},
    {"id":"q11","section":"Materialy","type":"textarea","label":"Czego absolutnie nie chcesz w logo?","placeholder":"Opisz motywy, kolory i skojarzenia do unikniecia.","required":false},
    {"id":"q12","section":"Dodatkowe informacje","type":"textarea","label":"Gdzie bedzie uzywane logo?","placeholder":"Strona, social media, wizytowki, szyld, auto firmowe.","required":false},
    {"id":"q13","section":"Dodatkowe informacje","type":"textarea","label":"Dodatkowy kontekst dla studenta","placeholder":"Opis marki, inspiracje, ton komunikacji.","required":false}
  ]$$::jsonb,
  faq = $$[
    {"question":"Czy moge zobaczyc portfolio przed wyborem?","answer":"Tak. Po briefie zobaczysz liste kandydatow z miniaturkami prac i wybierzesz wykonawce samodzielnie albo automatycznie."},
    {"question":"Co jesli zadna koncepcja mi nie odpowiada?","answer":"Student przygotuje jedna dodatkowa koncepcje na bazie Twojego feedbacku bez dodatkowej oplaty."},
    {"question":"Jak liczone sa poprawki?","answer":"1 zmiana = 1 modyfikacja 1 elementu w 1 pliku. Basic: 1 runda (8 zmian). Standard: 2 rundy (8 zmian kazda)."},
    {"question":"Czy dostaje pelne prawa autorskie?","answer":"Tak. W obu pakietach jest pelne przeniesienie majatkowych praw autorskich na firme."},
    {"question":"Jak dziala platnosc?","answer":"Platnosc jest zabezpieczona escrow i uwalniana po akceptacji pracy przez firme."}
  ]$$::jsonb,
  related_service_ids = ARRAY[
    '03193ee7-cffa-43e8-8c9b-e34c5829f473'::uuid,
    'c9fea07e-ba17-4dba-b15e-5b045cd267db'::uuid,
    '394f7ce6-2dcc-4c78-8931-1c3e430c0058'::uuid
  ],
  schema_org = $${
    "@context": "https://schema.org",
    "@type": "Service",
    "name": "Projekt Logo",
    "description": "Profesjonalne logo zaprojektowane przez studenta grafiki. 2-3 koncepcje, pelne prawa autorskie, pliki do druku i internetu.",
    "provider": {
      "@type": "Organization",
      "name": "Student2Work",
      "url": "https://student-impact.vercel.app"
    },
    "areaServed": "PL",
    "offers": {
      "@type": "AggregateOffer",
      "lowPrice": "350",
      "highPrice": "650",
      "priceCurrency": "PLN",
      "offerCount": "2"
    },
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "0",
      "reviewCount": "0"
    }
  }$$::jsonb
WHERE id = '5de0e9f6-3768-4732-987b-5c0073591646';

COMMIT;

