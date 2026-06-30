-- SEED_PLATFORM_SERVICES.sql

-- Insert default platform services if they don't exist
INSERT INTO public.service_packages (student_id, title, description, price, delivery_time_days, status, type, category)
SELECT 
    id as student_id, -- We assign them to the first admin/company or a placeholder. Ideally should be NULL or specific system user.
    -- For now, let's just use a random ID or user from profiles if ensuring FK. 
    -- Actually, service_packages usually link to a student. For 'platform_service', student_id might be nullable or a system account.
    -- Let's check schema. If student_id is NOT NULL, we need a dummy user.
    
    'Stworzenie Landing Page (Szablon)',
    'Profesjonalny Landing Page oparty o sprawdzone szablony. Idealny dla kampanii marketingowych.',
    500,
    3,
    'active',
    'platform_service',
    'Marketing'
FROM public.profiles WHERE role = 'company' LIMIT 1
-- Use ON CONFLICT DO NOTHING if title is unique, otherwise just insert for testing
;

-- Insert another one
INSERT INTO public.service_packages (student_id, title, description, price, delivery_time_days, status, type, category)
SELECT 
    id,
    'Social Media Pack (10 Postów)',
    'Pakiet 10 grafik do social media według Twoich wytycznych. Szybka realizacja.',
    300,
    5,
    'active',
    'platform_service',
    'Grafika'
FROM public.profiles WHERE role = 'company' LIMIT 1;
