-- Poprawiony skrypt usuwania (Rozwiązuje problem Foreign Key)
-- Najpierw usuwamy dane powiązane, potem samego użytkownika.

-- 1. Usuń profil (i kaskadowo inne dane jeśli są)
DELETE FROM public.profiles 
WHERE user_id IN (SELECT id FROM auth.users WHERE email = 'admin@admin.com');

-- 2. Usuń profil Studenta/Firmy (na wszelki wypadek, jeśli nie ma kaskady)
DELETE FROM public.student_profiles 
WHERE user_id IN (SELECT id FROM auth.users WHERE email = 'admin@admin.com');

DELETE FROM public.company_profiles 
WHERE user_id IN (SELECT id FROM auth.users WHERE email = 'admin@admin.com');

-- 3. Teraz bezpiecznie usuń użytkownika z auth.users
DELETE FROM auth.users WHERE email = 'admin@admin.com';
