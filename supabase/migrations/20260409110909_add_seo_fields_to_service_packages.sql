
ALTER TABLE service_packages
ADD COLUMN IF NOT EXISTS meta_title text,
ADD COLUMN IF NOT EXISTS meta_description text,
ADD COLUMN IF NOT EXISTS slug text UNIQUE;

COMMENT ON COLUMN service_packages.meta_title IS 'SEO title tag — max 60 znaków';
COMMENT ON COLUMN service_packages.meta_description IS 'SEO meta description — max 160 znaków';
COMMENT ON COLUMN service_packages.slug IS 'URL-friendly identyfikator usługi np. projekt-logo';
;
