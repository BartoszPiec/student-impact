-- Add missing columns to service_packages if they don't exist

-- gallery_urls (For image uploads)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'service_packages' AND column_name = 'gallery_urls') THEN
        ALTER TABLE service_packages ADD COLUMN gallery_urls text[] DEFAULT '{}';
    END IF;
END $$;

-- portfolio_items (For external links)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'service_packages' AND column_name = 'portfolio_items') THEN
        ALTER TABLE service_packages ADD COLUMN portfolio_items text[] DEFAULT '{}';
    END IF;
END $$;

-- form_schema (For custom questions)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'service_packages' AND column_name = 'form_schema') THEN
        ALTER TABLE service_packages ADD COLUMN form_schema jsonb DEFAULT '[]';
    END IF;
END $$;

-- requirements (For general requirements text - just in case)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'service_packages' AND column_name = 'requirements') THEN
        ALTER TABLE service_packages ADD COLUMN requirements text;
    END IF;
END $$;
