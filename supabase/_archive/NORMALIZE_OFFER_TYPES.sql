-- Normalizacja typów ofert w bazie danych
-- Cel: Ujednolicenie danych do formatu: 'job', 'micro', 'internship'

-- 1. Normalizuj Praca/praca -> 'job'
UPDATE offers
SET typ = 'job'
WHERE typ ILIKE 'praca';

-- 2. Normalizuj Mikrozlecenie/projekt -> 'micro'
UPDATE offers
SET typ = 'micro'
WHERE typ ILIKE 'mikrozlecenie' OR typ ILIKE 'projekt' OR typ ILIKE 'micro';

-- 3. Normalizuj Staż -> 'internship' (jeśli istnieją takie rekordy w kolumnie typ)
UPDATE offers
SET typ = 'internship'
WHERE typ ILIKE 'staż';

-- Weryfikacja
SELECT typ, count(*) as liczba FROM offers GROUP BY typ;
