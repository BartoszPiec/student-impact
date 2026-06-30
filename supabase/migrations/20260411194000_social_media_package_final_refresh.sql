update public.service_packages
set
  title = 'Miesięczny Pakiet Social Media',
  slug = 'miesieczny-pakiet-social-media',
  category = 'Marketing',
  description = $social_desc$
## Opis usługi

Twoja firma powinna być widoczna w social mediach — ale prowadzenie profilu to dodatkowe godziny tygodniowo, których po prostu nie masz. Student przygotuje dla Ciebie kompletny zestaw postów na cały miesiąc: gotowe grafiki, teksty do skopiowania i harmonogram publikacji. Dostajesz paczkę materiałów gotową do wrzucenia na Facebooka i Instagram — bez agencji, bez długich umów, bez przepłacania.

**Usługa jest gotowym produktem — nie zarządzaniem kanałem.** Student nie loguje się na Twoje konto, nie odpowiada na komentarze, nie uruchamia reklam. Dostajesz materiały i robisz z nimi, co chcesz.

## Problem który rozwiązuje

Małe firmy mają profile na Facebooku i Instagramie, ale prowadzą je chaotycznie — raz na 3 tygodnie, bez planu, bez spójnego wyglądu, bo brakuje czasu i zasobów. Efekt: brak widoczności, brak zaufania klientów, zmarnowany potencjał kanałów SM. Ta usługa eliminuje problem pustego profilu bez konieczności zatrudniania agencji lub osoby na etat.

## Jak dbamy o jakość

Wiemy, że jakość i terminowość to największe obawy przy pracy z zewnętrznym wykonawcą. Dlatego każde zlecenie ma trzy obowiązkowe punkty kontrolne:

- **Krok 1 — Plan tematów:** zanim student napisze choćby jedno słowo, dostajesz plan wszystkich postów do akceptacji.
- **Krok 2 — Podgląd stylu graficznego:** zatwierdzasz wygląd grafiki zanim powstanie ich cały zestaw.
- **Krok 3 — Gotowy pakiet:** odbierasz komplet materiałów z możliwością poprawek w ramach pakietu.

Żaden etap nie jest pomijany. Czas realizacji jest gwarantowany od momentu złożenia zamówienia.

## Czego pakiet NIE obejmuje

- Publikowanie postów na koncie klienta
- Odpowiadanie na komentarze i wiadomości prywatne
- Reklamy płatne (Facebook Ads, promowanie postów)
- Sesja zdjęciowa (pracujemy na Twoich zdjęciach lub stockach)
- Reelsy i wideo (tylko posty feed + stories w pakiecie PRO)
- Strategia marketingowa, analiza wyników, raportowanie
- Zmiany po zamknięciu rundy poprawek
$social_desc$,
  price = 299,
  price_max = 999,
  delivery_time_days = 5,
  commission_rate = 0.25,
  status = 'active',
  is_system = true,
  type = 'platform_service',
  variants = $social_variants$
[
  {
    "id": "starter",
    "name": "STARTER",
    "price": 299,
    "price_label": "299 PLN brutto",
    "delivery_time_days": 5,
    "commission_rate": 0.20,
    "student_earnings": 239,
    "student_hours_estimate": 5,
    "is_recommended": false,
    "badge": "Pakiet testowy",
    "description": "Idealny na start — sprawdź jakość usługi przed większym zamówieniem.",
    "deliverables": [
      "4 posty na feed (grafika + tekst)",
      "Facebook LUB Instagram (do wyboru)",
      "Harmonogram publikacji (Google Sheets)",
      "1 runda poprawek, max 2 zmiany"
    ],
    "post_types": {
      "edukacyjny": 1,
      "ofertowy": 1,
      "angażujący": 1,
      "wizerunkowy": 1
    },
    "platforms": ["facebook_or_instagram"],
    "includes_stories": false,
    "revision_rounds": 1,
    "max_revisions": 2
  },
  {
    "id": "basic",
    "name": "BASIC",
    "price": 499,
    "price_label": "499 PLN brutto",
    "delivery_time_days": 7,
    "commission_rate": 0.25,
    "student_earnings": 374,
    "student_hours_estimate": 8,
    "is_recommended": false,
    "badge": null,
    "description": "Regularność na jednym kanale przez cały miesiąc.",
    "deliverables": [
      "8 postów na feed (grafika + tekst + hashtagi)",
      "Facebook LUB Instagram (do wyboru)",
      "Harmonogram publikacji (Google Sheets)",
      "Link do edytowalnych szablonów graficznych",
      "1 runda poprawek, max 3 zmiany"
    ],
    "post_types": {
      "edukacyjny": 2,
      "ofertowy": 2,
      "angażujący": 2,
      "wizerunkowy": 2
    },
    "platforms": ["facebook_or_instagram"],
    "includes_stories": false,
    "revision_rounds": 1,
    "max_revisions": 3
  },
  {
    "id": "standard",
    "name": "STANDARD",
    "price": 699,
    "price_label": "699 PLN brutto",
    "delivery_time_days": 7,
    "commission_rate": 0.25,
    "student_earnings": 524,
    "student_hours_estimate": 13,
    "is_recommended": true,
    "badge": "Najpopularniejszy",
    "description": "Kompletny miesiąc contentu na obu platformach.",
    "deliverables": [
      "12 postów na feed (grafika + tekst + hashtagi)",
      "Facebook + Instagram",
      "Harmonogram publikacji (Google Sheets)",
      "Link do edytowalnych szablonów graficznych",
      "1 runda poprawek, max 5 zmian"
    ],
    "post_types": {
      "edukacyjny": 3,
      "ofertowy": 3,
      "angażujący": 3,
      "wizerunkowy": 3
    },
    "platforms": ["facebook", "instagram"],
    "includes_stories": false,
    "revision_rounds": 1,
    "max_revisions": 5
  },
  {
    "id": "pro",
    "name": "PRO",
    "price": 999,
    "price_label": "999 PLN brutto",
    "delivery_time_days": 10,
    "commission_rate": 0.25,
    "student_earnings": 749,
    "student_hours_estimate": 16,
    "is_recommended": false,
    "badge": "Pełny pakiet",
    "description": "Feed i stories — pełna obecność wizualna na obu platformach.",
    "deliverables": [
      "12 postów na feed (grafika + tekst + hashtagi)",
      "8 stories graficznych",
      "Facebook + Instagram",
      "Harmonogram publikacji (Google Sheets)",
      "Link do edytowalnych szablonów graficznych",
      "2 rundy poprawek"
    ],
    "post_types": {
      "edukacyjny": 3,
      "ofertowy": 3,
      "angażujący": 3,
      "wizerunkowy": 3
    },
    "platforms": ["facebook", "instagram"],
    "includes_stories": true,
    "stories_count": 8,
    "revision_rounds": 2,
    "max_revisions": null
  }
]
$social_variants$::jsonb,
  form_schema = $social_form$
{
  "version": "1.0",
  "sections": [
    {
      "id": "company_info",
      "title": "Informacje o firmie",
      "fields": [
        {
          "id": "company_description",
          "label": "Czym zajmuje się firma?",
          "hint": "Opisz główne usługi lub produkty które oferujesz",
          "type": "textarea",
          "required": true,
          "max_length": 500
        },
        {
          "id": "industry",
          "label": "Branża",
          "type": "text",
          "required": true,
          "max_length": 100
        },
        {
          "id": "usp",
          "label": "Co wyróżnia Twoją firmę na tle konkurencji?",
          "hint": "Twoja unikalna wartość (USP) — co sprawia że klienci wybierają właśnie Ciebie",
          "type": "textarea",
          "required": true,
          "max_length": 300
        },
        {
          "id": "communication_tone",
          "label": "Ton komunikacji",
          "type": "radio",
          "required": true,
          "options": [
            { "value": "formal", "label": "Formalny" },
            { "value": "casual", "label": "Luźny" },
            { "value": "expert", "label": "Ekspercki" },
            { "value": "sales", "label": "Sprzedażowy" }
          ]
        },
        {
          "id": "brand_guidelines",
          "label": "Brand guidelines",
          "hint": "Czy masz brand book, paletę kolorów lub wytyczne wizualne?",
          "type": "radio",
          "required": true,
          "options": [
            { "value": "yes_file", "label": "Tak — załączę plik" },
            { "value": "yes_colors", "label": "Tak — podaję kolory i czcionki" },
            { "value": "no", "label": "Nie mam, proszę bazować na logo" }
          ]
        },
        {
          "id": "brand_guidelines_details",
          "label": "Kolory firmowe / link do brand booka",
          "type": "textarea",
          "required": false,
          "max_length": 300,
          "show_if": {
            "field": "brand_guidelines",
            "value": ["yes_colors", "yes_file"]
          }
        }
      ]
    },
    {
      "id": "goal",
      "title": "Cel prowadzenia social media",
      "fields": [
        {
          "id": "primary_goal",
          "label": "Główny cel postów",
          "hint": "Wybierz jeden — pomoże to studentowi dobrać właściwe typy treści",
          "type": "radio",
          "required": true,
          "options": [
            { "value": "sales", "label": "Sprzedaż bezpośrednia" },
            { "value": "brand", "label": "Budowanie marki / wizerunku" },
            { "value": "leads", "label": "Generowanie leadów" },
            { "value": "education", "label": "Edukacja klientów" },
            { "value": "traffic", "label": "Zwiększenie ruchu na stronie" },
            { "value": "recruitment", "label": "Rekrutacja" },
            { "value": "other", "label": "Inne" }
          ]
        },
        {
          "id": "primary_goal_other",
          "label": "Opisz cel",
          "type": "text",
          "required": false,
          "show_if": {
            "field": "primary_goal",
            "value": ["other"]
          }
        }
      ]
    },
    {
      "id": "target_audience",
      "title": "Grupa docelowa",
      "fields": [
        {
          "id": "audience_description",
          "label": "Kto jest Twoim klientem?",
          "hint": "Wiek, branża, lokalizacja — im więcej szczegółów, tym lepsze posty",
          "type": "textarea",
          "required": true,
          "max_length": 400
        },
        {
          "id": "business_type",
          "label": "Typ klienta",
          "type": "radio",
          "required": true,
          "options": [
            { "value": "b2c", "label": "B2C — sprzedaję osobom prywatnym" },
            { "value": "b2b", "label": "B2B — sprzedaję firmom" },
            { "value": "both", "label": "Oba" }
          ]
        },
        {
          "id": "audience_problems",
          "label": "Jakie problemy klientów rozwiązujesz?",
          "type": "textarea",
          "required": true,
          "max_length": 300
        },
        {
          "id": "audience_knowledge_level",
          "label": "Poziom wiedzy Twoich klientów o Twojej branży",
          "type": "radio",
          "required": true,
          "options": [
            { "value": "beginner", "label": "Początkujący — tłumaczę podstawy" },
            { "value": "advanced", "label": "Zaawansowani — rozmawiamy jak eksperci" },
            { "value": "mixed", "label": "Mieszany" }
          ]
        }
      ]
    },
    {
      "id": "content",
      "title": "Tematyka postów",
      "fields": [
        {
          "id": "topics",
          "label": "Jakie tematy chcesz poruszać?",
          "hint": "np. porady branżowe, prezentacje produktów, opinie klientów, behind the scenes...",
          "type": "textarea",
          "required": true,
          "max_length": 500
        },
        {
          "id": "services_to_promote",
          "label": "Które usługi / produkty promować w tym miesiącu?",
          "type": "textarea",
          "required": true,
          "max_length": 300
        },
        {
          "id": "important_dates",
          "label": "Ważne daty w tym miesiącu",
          "hint": "Promocje, eventy, sezonowość, święta branżowe — zostaw puste jeśli brak",
          "type": "textarea",
          "required": false,
          "max_length": 300
        }
      ]
    },
    {
      "id": "competitors",
      "title": "Konkurencja i inspiracje",
      "fields": [
        {
          "id": "competitor_profiles",
          "label": "2–3 profile konkurencji (linki)",
          "hint": "Wklej linki do profili FB lub IG konkurentów — student przejrzy co działa w Twojej branży",
          "type": "textarea",
          "required": true,
          "max_length": 500
        },
        {
          "id": "liked_profiles",
          "label": "Profile które Ci się podobają",
          "hint": "Co w nich cenisz? (styl, ton, rodzaj treści) — nie muszą być z Twojej branży",
          "type": "textarea",
          "required": true,
          "max_length": 400
        },
        {
          "id": "disliked_profiles",
          "label": "Profile których nie lubisz",
          "hint": "Co Ci w nich przeszkadza? Pomaga to uniknąć podobnych błędów",
          "type": "textarea",
          "required": false,
          "max_length": 300
        }
      ]
    },
    {
      "id": "cta",
      "title": "Call to Action",
      "fields": [
        {
          "id": "primary_cta",
          "label": "Co głównie mają robić ludzie po zobaczeniu postów?",
          "type": "radio",
          "required": true,
          "options": [
            { "value": "buy", "label": "Kupić / zamówić / skontaktować się" },
            { "value": "visit_website", "label": "Odwiedzić stronę www" },
            { "value": "message", "label": "Napisać wiadomość / zapytanie" },
            { "value": "engage", "label": "Polubić, skomentować, udostępnić" }
          ]
        },
        {
          "id": "website_url",
          "label": "Link do strony www",
          "type": "url",
          "required": false,
          "hint": "Zostaw puste jeśli nie masz strony"
        }
      ]
    },
    {
      "id": "materials",
      "title": "Materiały",
      "fields": [
        {
          "id": "logo_status",
          "label": "Logo firmy",
          "type": "radio",
          "required": true,
          "options": [
            { "value": "will_upload", "label": "Wgram plik (PNG, SVG lub PDF wektorowy)" },
            { "value": "drive_link", "label": "Podam link do Google Drive" },
            { "value": "no_logo", "label": "Nie mam logo" }
          ]
        },
        {
          "id": "logo_note",
          "label": "Link do logo lub informacja",
          "type": "text",
          "required": false,
          "show_if": {
            "field": "logo_status",
            "value": ["drive_link", "no_logo"]
          }
        },
        {
          "id": "photos_link",
          "label": "Zdjęcia produktów / usług / zespołu",
          "hint": "Link do folderu Google Drive ze zdjęciami. Zostaw puste jeśli nie masz — użyjemy stocków.",
          "type": "url",
          "required": false
        }
      ]
    },
    {
      "id": "contact",
      "title": "Osoba kontaktowa",
      "fields": [
        {
          "id": "contact_person",
          "label": "Imię i nazwisko osoby decydującej",
          "type": "text",
          "required": true,
          "max_length": 100
        },
        {
          "id": "preferred_contact",
          "label": "Preferowany kanał kontaktu",
          "type": "radio",
          "required": true,
          "options": [
            { "value": "platform", "label": "Wiadomości przez platformę" },
            { "value": "email", "label": "E-mail" }
          ]
        },
        {
          "id": "contact_email",
          "label": "Adres e-mail do kontaktu",
          "type": "email",
          "required": false,
          "show_if": {
            "field": "preferred_contact",
            "value": ["email"]
          }
        }
      ]
    }
  ]
}
$social_form$::jsonb,
  faq = $social_faq$
[
  {
    "question": "Czy student będzie publikował posty na moim koncie?",
    "answer": "Nie. Dostajesz gotowe materiały (grafiki, teksty, harmonogram) i publikujesz je samodzielnie. Student nie loguje się na Twoje konto."
  },
  {
    "question": "Co jeśli nie mam logo ani brand guidelines?",
    "answer": "Napisz o tym w briefie. Student zaproponuje kolory i styl bazując na charakterze Twojej firmy. Logo możesz też zlecić osobno jako usługę #04."
  },
  {
    "question": "Kiedy zaczyna się liczenie czasu realizacji?",
    "answer": "Od momentu złożenia zamówienia z wypełnionym briefem. Nie musisz czekać — brief jest częścią zamówienia."
  },
  {
    "question": "Czy mogę zmienić tematy postów zaproponowane przez studenta?",
    "answer": "Tak. Przed produkcją grafik i tekstów student wysyła Ci plan tematów do akceptacji (Milestone 1). Możesz zasugerować zmiany — student uwzględni je przed przystąpieniem do pracy."
  },
  {
    "question": "Ile poprawek mi przysługuje?",
    "answer": "Zależy od pakietu: STARTER — 1 runda / max 2 zmiany, BASIC — 1 runda / max 3 zmiany, STANDARD — 1 runda / max 5 zmian, PRO — 2 rundy. Poprawki dotyczą gotowego pakietu, nie planu tematów ani podglądu stylu."
  },
  {
    "question": "Czy posty będą na Facebooku i Instagramie jednocześnie?",
    "answer": "Pakiety STANDARD i PRO obejmują obie platformy. Pakiety STARTER i BASIC — jedną wybraną przez Ciebie platformę."
  },
  {
    "question": "Co to są 'edytowalne szablony graficzne'?",
    "answer": "Link do szablonów w narzędziu graficznym (np. Canva) z opcją kopiowania. Dzięki temu możesz samodzielnie modyfikować grafiki w przyszłości — zmieniać teksty, zdjęcia, dostosowywać do nowych promocji."
  },
  {
    "question": "Czy student może też prowadzić moje social media na stałe?",
    "answer": "Ten pakiet to jednorazowy zestaw materiałów na miesiąc. Jeśli chcesz stałego prowadzenia SM, sprawdź usługę #41 Prowadzenie Social Media."
  }
]
$social_faq$::jsonb,
  meta_title = 'Miesięczny Pakiet Social Media - gotowe posty na miesiąc',
  meta_description = 'Gotowe posty na Facebook i Instagram: grafiki, teksty i harmonogram publikacji na cały miesiąc.',
  related_service_ids = ARRAY[
    '5de0e9f6-3768-4732-987b-5c0073591646',
    '532f8ea0-edf8-491c-bb14-3eeb33ec69a0',
    'd2ec7812-2199-4e40-b4cd-1cd8c3f193ce',
    '8c732b45-d527-4d6b-aba8-60937a8857ba'
  ]::uuid[]
where id = 'c9fea07e-ba17-4dba-b15e-5b045cd267db';
