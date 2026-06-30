-- MASTER FIX: Admin Permissions
-- Cel: Nadanie pełnych uprawnień (DELETE/UPDATE) dla Administratora do wszystkich powiązanych tabel.
-- Rozwiązuje problem "niewidzialnych blokad" przy usuwaniu ofert z czatami.

-- 1. MESSAGES (Wiadomości) - Kluczowe dla czyszczenia historii czatu
DROP POLICY IF EXISTS "Admins can delete messages" ON messages;
CREATE POLICY "Admins can delete messages" ON messages FOR DELETE USING (
  exists (select 1 from profiles where profiles.user_id = auth.uid() and profiles.role = 'admin')
);

-- 2. CONVERSATIONS (Czaty)
DROP POLICY IF EXISTS "Admins can delete conversations" ON conversations;
CREATE POLICY "Admins can delete conversations" ON conversations FOR DELETE USING (
  exists (select 1 from profiles where profiles.user_id = auth.uid() and profiles.role = 'admin')
);

-- 3. APPLICATIONS (Aplikacje)
DROP POLICY IF EXISTS "Admins can delete applications" ON applications;
CREATE POLICY "Admins can delete applications" ON applications FOR DELETE USING (
  exists (select 1 from profiles where profiles.user_id = auth.uid() and profiles.role = 'admin')
);

-- 4. OFFERS (Oferty) - DELETE (Usuwanie)
DROP POLICY IF EXISTS "Admins can delete offers" ON offers;
CREATE POLICY "Admins can delete offers" ON offers FOR DELETE USING (
  exists (select 1 from profiles where profiles.user_id = auth.uid() and profiles.role = 'admin')
);

-- 5. OFFERS (Oferty) - UPDATE (Zamykanie/Edycja)
DROP POLICY IF EXISTS "Admins can update offers" ON offers;
CREATE POLICY "Admins can update offers" ON offers FOR UPDATE USING (
  exists (select 1 from profiles where profiles.user_id = auth.uid() and profiles.role = 'admin')
);

SELECT 'All Admin permissions (Messages, Conversations, Apps, Offers) updated successfully.' as status;
