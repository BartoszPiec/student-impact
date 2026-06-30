DO $$
BEGIN
    -- 1. TikTok / Reels / Shorts Editing
    IF NOT EXISTS (SELECT 1 FROM public.service_packages WHERE title = 'Montaż Rolek (TikTok, Reels, Shorts)' AND is_system = true) THEN
        INSERT INTO public.service_packages (title, description, price, delivery_time_days, status, is_system, form_schema)
        VALUES (
            'Montaż Rolek (TikTok, Reels, Shorts)', 
            'Dynamiczny montaż krótkich form wideo. Dodanie napisów (captions), przejść, muzyki trendującej i efektów dźwiękowych.', 
            150, 
            2, 
            'active', 
            true,
            '[
              {
                "id": "footage",
                "label": "Czy posiadasz surowe nagrania?",
                "type": "select",
                "options": ["Tak, mam pliki video", "Nie, potrzebuję montażu ze stocków", "Mam zdjęcia i chcę z nich video"]
              },
              {
                "id": "style",
                "label": "Jaki styl montażu?",
                "type": "select",
                "options": ["Dynamiczny (szybkie cięcia, efekty)", "Vlog / Lifestyle (spokojny)", "Edukacyjny (napisy, zoomy)", "Korporacyjny / Profesjonalny"]
              },
              {
                "id": "duration",
                "label": "Docelowa długość wideo",
                "type": "select",
                "options": ["do 15 sekund", "15-30 sekund", "30-60 sekund", "Powyżej 1 minuty"]
              },
              {
                "id": "captions",
                "label": "Rodzaj napisów",
                "type": "select",
                "options": ["Brak napisów", "Tylko słowa kluczowe", "Pełne napisy (karaoke style)", "Napisy statyczne"]
              }
            ]'::jsonb
        );
    END IF;

    -- 2. YouTube Video Editing
    IF NOT EXISTS (SELECT 1 FROM public.service_packages WHERE title = 'Montaż Wideo na YouTube' AND is_system = true) THEN
        INSERT INTO public.service_packages (title, description, price, delivery_time_days, status, is_system, form_schema)
        VALUES (
            'Montaż Wideo na YouTube', 
            'Profesjonalny montaż dłuższego materiału (do 15 min). Korekcja kolorów, audio, intro/outro, B-roll.', 
            400, 
            5, 
            'active', 
            true,
            '[
              {
                "id": "source_len",
                "label": "Ile materiału surowego posiadasz?",
                "type": "select",
                "options": ["Do 30 minut", "30-60 minut", "Powyżej 1 godziny", "Materiał ze streamu (wiele godzin)"]
              },
              {
                "id": "style",
                "label": "Styl filmu",
                "type": "select",
                "options": ["Vlog / Storytelling", "Gaming / Stream Highlights", "Wywiad / Podcast", "Review / Recenzja", "Tutorial / Edukacja"]
              },
               {
                "id": "thumbnail",
                "label": "Czy potrzebujesz też miniatury (Thumbnail)?",
                "type": "select",
                "options": ["Nie, mam własną", "Tak, poproszę (+50 PLN)", "Nie, dziękuję"]
              }
            ]'::jsonb
        );
    END IF;

END $$;
