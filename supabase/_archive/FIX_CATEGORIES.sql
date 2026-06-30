-- FIX_CATEGORIES.sql
-- Force update categories for specific titles to match the new definitions.

BEGIN;

-- 1. Serwisy internetowe
UPDATE public.service_packages SET category = 'Serwisy internetowe' WHERE title ILIKE '%sklep%';
UPDATE public.service_packages SET category = 'Serwisy internetowe' WHERE title ILIKE '%e-commerce%';
UPDATE public.service_packages SET category = 'Serwisy internetowe' WHERE title ILIKE '%strona%';
UPDATE public.service_packages SET category = 'Serwisy internetowe' WHERE title ILIKE '%www%';

-- 2. Multimedia (Wideo, UGC, Montage)
UPDATE public.service_packages SET category = 'Multimedia' WHERE title ILIKE '%wideo%';
UPDATE public.service_packages SET category = 'Multimedia' WHERE title ILIKE '%rolek%';
UPDATE public.service_packages SET category = 'Multimedia' WHERE title ILIKE '%tiktok%';
UPDATE public.service_packages SET category = 'Multimedia' WHERE title ILIKE '%youtube%';
UPDATE public.service_packages SET category = 'Multimedia' WHERE title ILIKE '%ugc%';
UPDATE public.service_packages SET category = 'Multimedia' WHERE title ILIKE '%montaż%';

-- 3. Design
UPDATE public.service_packages SET category = 'Design' WHERE title ILIKE '%logo%';
UPDATE public.service_packages SET category = 'Design' WHERE title ILIKE '%grafika%';
UPDATE public.service_packages SET category = 'Design' WHERE title ILIKE '%design%';

-- 4. Marketing
UPDATE public.service_packages SET category = 'Marketing' WHERE title ILIKE '%marketing%';
UPDATE public.service_packages SET category = 'Marketing' WHERE title ILIKE '%reklama%';
UPDATE public.service_packages SET category = 'Marketing' WHERE title ILIKE '%kampania%';

-- 5. Programowanie i IT
UPDATE public.service_packages SET category = 'Programowanie i IT' WHERE title ILIKE '%it%';
UPDATE public.service_packages SET category = 'Programowanie i IT' WHERE title ILIKE '%programowanie%';
UPDATE public.service_packages SET category = 'Programowanie i IT' WHERE title ILIKE '%kod%';

-- 6. Prace biurowe
UPDATE public.service_packages SET category = 'Prace biurowe' WHERE title ILIKE '%biuro%';
UPDATE public.service_packages SET category = 'Prace biurowe' WHERE title ILIKE '%poczto%';
UPDATE public.service_packages SET category = 'Prace biurowe' WHERE title ILIKE '%administracja%';

-- 7. Tłumaczenia
UPDATE public.service_packages SET category = 'Tłumaczenia' WHERE title ILIKE '%tłumaczenie%';
UPDATE public.service_packages SET category = 'Tłumaczenia' WHERE title ILIKE '%angielski%';

-- 8. Unique/Other
UPDATE public.service_packages SET category = 'Usprawnienia AI' WHERE title ILIKE '%automatyzacja%';
UPDATE public.service_packages SET category = 'Usprawnienia AI' WHERE title ILIKE '%ai%';

UPDATE public.service_packages SET category = 'Prawo' WHERE title ILIKE '%prawo%';
UPDATE public.service_packages SET category = 'Prawo' WHERE title ILIKE '%umowa%';

UPDATE public.service_packages SET category = 'Copywriting' WHERE title ILIKE '%pisanie%';
UPDATE public.service_packages SET category = 'Copywriting' WHERE title ILIKE '%copywriting%';
UPDATE public.service_packages SET category = 'Copywriting' WHERE title ILIKE '%tekst%';

UPDATE public.service_packages SET category = 'Analiza danych' WHERE title ILIKE '%dane%';
UPDATE public.service_packages SET category = 'Analiza danych' WHERE title ILIKE '%analiza%';

-- Default fallbacks if still null (optional)
-- UPDATE public.service_packages SET category = 'inne prace' WHERE category IS NULL;

NOTIFY pgrst, 'reload schema';

COMMIT;
