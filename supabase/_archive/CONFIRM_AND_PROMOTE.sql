-- Skrypt naprawczy: Potwierdzenie Emaila + Nadanie Admina
-- Uruchom to w Supabase SQL Editor.

-- 1. Automatycznie potwierdź email (naprawia problem "Login Failed" / brak maila)
UPDATE auth.users
SET email_confirmed_at = now()
WHERE email = 'kamienserca@gmail.com';

-- 2. Nadaj uprawnienia Administratora (Superusera)
UPDATE profiles
SET role = 'admin'
WHERE user_id IN (
    SELECT id FROM auth.users WHERE email = 'kamienserca@gmail.com'
);

-- Sprawdzenie wyników
SELECT email, email_confirmed_at FROM auth.users WHERE email = 'kamienserca@gmail.com';
SELECT profiles.role FROM profiles JOIN auth.users ON profiles.user_id = auth.users.id WHERE email = 'kamienserca@gmail.com';
