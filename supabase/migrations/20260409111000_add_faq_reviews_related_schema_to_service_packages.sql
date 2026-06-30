
ALTER TABLE service_packages
ADD COLUMN IF NOT EXISTS faq jsonb,
ADD COLUMN IF NOT EXISTS related_service_ids uuid[],
ADD COLUMN IF NOT EXISTS schema_org jsonb;

COMMENT ON COLUMN service_packages.faq IS 'Lista FAQ: [{question, answer}] — widoczna na stronie usługi';
COMMENT ON COLUMN service_packages.related_service_ids IS 'Tablica UUID powiązanych usług (cross-sell)';
COMMENT ON COLUMN service_packages.schema_org IS 'JSON-LD structured data dla Google (Service, Offer, AggregateRating)';
;
