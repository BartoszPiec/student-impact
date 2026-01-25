-- ENABLING SYSTEM PACKAGES & SEEDING DATA

-- 1. Modify Table Structure
ALTER TABLE public.service_packages ADD COLUMN IF NOT EXISTS is_system boolean DEFAULT false;
ALTER TABLE public.service_packages ALTER COLUMN student_id DROP NOT NULL;

-- 2. Seed Data (Ready-made Solutions)
DO $$
BEGIN
    -- 1. Marketing
    IF NOT EXISTS (SELECT 1 FROM public.service_packages WHERE title = 'Kampania Marketingowa' AND is_system = true) THEN
        INSERT INTO public.service_packages (title, description, price, delivery_time_days, status, is_system)
        VALUES (
            'Kampania Marketingowa', 
            'Kompleksowa kampania w social media (FB + IG). Obejmuje 8 postów, 4 stories i moderację komentarzy przez miesiąc.', 
            1200, 
            30, 
            'active', 
            true
        );
    END IF;

    -- 2. Automation
    IF NOT EXISTS (SELECT 1 FROM public.service_packages WHERE title = 'Automatyzacja Skrzynki Pocztowej' AND is_system = true) THEN
        INSERT INTO public.service_packages (title, description, price, delivery_time_days, status, is_system)
        VALUES (
            'Automatyzacja Skrzynki Pocztowej', 
            'Wdrożenie autoresponderów i etykietowania w Gmail/Outlook. Oszczędź 5h tygodniowo na segregowaniu maili.', 
            300, 
            3, 
            'active', 
            true
        );
    END IF;

    -- 3. Logo
    IF NOT EXISTS (SELECT 1 FROM public.service_packages WHERE title = 'Przygotowanie Logo' AND is_system = true) THEN
        INSERT INTO public.service_packages (title, description, price, delivery_time_days, status, is_system)
        VALUES (
            'Przygotowanie Logo', 
            '3 propozycje logo + księga znaku. Pliki wektorowe i rastrowe (PNG, SVG, AI).', 
            500, 
            7, 
            'active', 
            true
        );
    END IF;
END $$;
