-- Skrypt konfiguracji konta administratora (Dla kamienserca@gmail.com)
-- Uruchom ten skrypt w Supabase SQL Editor, aby nadać uprawnienia.

UPDATE profiles
SET role = 'admin'
WHERE user_id IN (
    SELECT id FROM auth.users WHERE email = 'kamienserca@gmail.com'
);

-- Weryfikacja: Po uruchomieniu sprawdź, czy rola została nadana
SELECT email, role 
FROM profiles 
JOIN auth.users ON profiles.user_id = auth.users.id
WHERE email = 'kamienserca@gmail.com';
