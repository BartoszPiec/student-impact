-- Student Impact - release hardening (chat during negotiation + safe accepts)
-- Date: 2025-12-20
--
-- Run in Supabase SQL Editor (Database -> SQL).
-- Safe to run multiple times (uses IF EXISTS / exception guards).

-- =========================
-- 0) Helpers
-- =========================

-- 0.1 Ensure extensions you rely on (optional)
-- create extension if not exists "pgcrypto";

-- =========================
-- 1) Constraints + indexes
-- =========================

-- 1.1 offers.status check (prevents typos)
DO $$
BEGIN
  ALTER TABLE public.offers
    ADD CONSTRAINT offers_status_check
    CHECK (status = ANY (ARRAY['published','in_progress','closed']));
EXCEPTION
  WHEN duplicate_object THEN
    -- already exists
    NULL;
END $$;

-- 1.2 Useful indexes (FKs are not indexed automatically)
CREATE INDEX IF NOT EXISTS applications_student_status_idx
  ON public.applications (student_id, status);

CREATE INDEX IF NOT EXISTS offers_company_status_idx
  ON public.offers (company_id, status);

CREATE INDEX IF NOT EXISTS messages_conversation_created_idx
  ON public.messages (conversation_id, created_at DESC);

CREATE INDEX IF NOT EXISTS notifications_user_read_idx
  ON public.notifications (user_id, read_at);

-- =========================
-- 2) RPC: notifications
-- =========================

-- If you already have create_notification, this will replace it with a safe version.
CREATE OR REPLACE FUNCTION public.create_notification(
  p_user_id uuid,
  p_typ text,
  p_payload jsonb DEFAULT '{}'::jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.notifications (user_id, typ, payload)
  VALUES (p_user_id, p_typ, COALESCE(p_payload, '{}'::jsonb));
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_notification(uuid, text, jsonb) TO authenticated;

-- =========================
-- 3) RPC: student accepts company counter safely (atomic)
-- =========================

-- This prevents a student session from updating other students' rows or the offer directly.
CREATE OR REPLACE FUNCTION public.student_accept_counter(
  p_application_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_student_id uuid := auth.uid();
  v_offer_id uuid;
  v_counter numeric;
  v_status text;
BEGIN
  IF v_student_id IS NULL THEN
    RAISE EXCEPTION 'not_authenticated';
  END IF;

  SELECT offer_id, counter_stawka, status
    INTO v_offer_id, v_counter, v_status
  FROM public.applications
  WHERE id = p_application_id
    AND student_id = v_student_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'application_not_found_or_not_owner';
  END IF;

  IF v_status <> 'countered' THEN
    RAISE EXCEPTION 'application_not_countered';
  END IF;

  IF v_counter IS NULL THEN
    RAISE EXCEPTION 'missing_counter_stawka';
  END IF;

  -- accept
  UPDATE public.applications
  SET status = 'accepted',
      agreed_stawka = v_counter,
      decided_at = NOW()
  WHERE id = p_application_id;

  -- reject others
  UPDATE public.applications
  SET status = 'rejected',
      decided_at = NOW()
  WHERE offer_id = v_offer_id
    AND id <> p_application_id
    AND status IN ('sent','countered');

  -- offer in progress
  UPDATE public.offers
  SET status = 'in_progress'
  WHERE id = v_offer_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.student_accept_counter(uuid) TO authenticated;

-- =========================
-- 4) RLS policies (chat available from 'sent')
-- =========================

-- Enable RLS (no-op if already enabled)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deliverables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.experience_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- ----------
-- profiles
-- ----------
DROP POLICY IF EXISTS profiles_select_own ON public.profiles;
DROP POLICY IF EXISTS profiles_insert_own ON public.profiles;
DROP POLICY IF EXISTS profiles_update_own ON public.profiles;

CREATE POLICY profiles_select_own
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY profiles_insert_own
  ON public.profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY profiles_update_own
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ----------
-- student_profiles / company_profiles
-- ----------
DROP POLICY IF EXISTS student_profiles_own ON public.student_profiles;
CREATE POLICY student_profiles_own
  ON public.student_profiles
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS company_profiles_own ON public.company_profiles;
CREATE POLICY company_profiles_own
  ON public.company_profiles
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ----------
-- offers
-- ----------
DROP POLICY IF EXISTS offers_select ON public.offers;
DROP POLICY IF EXISTS offers_insert_company ON public.offers;
DROP POLICY IF EXISTS offers_update_company ON public.offers;
DROP POLICY IF EXISTS offers_delete_company ON public.offers;

CREATE POLICY offers_select
  ON public.offers
  FOR SELECT
  TO authenticated
  USING (
    -- visible marketplace
    status = 'published'
    OR company_id = auth.uid()
    OR EXISTS (
      SELECT 1
      FROM public.applications a
      WHERE a.offer_id = offers.id
        AND a.student_id = auth.uid()
    )
  );

CREATE POLICY offers_insert_company
  ON public.offers
  FOR INSERT
  TO authenticated
  WITH CHECK (company_id = auth.uid());

CREATE POLICY offers_update_company
  ON public.offers
  FOR UPDATE
  TO authenticated
  USING (company_id = auth.uid())
  WITH CHECK (company_id = auth.uid());

CREATE POLICY offers_delete_company
  ON public.offers
  FOR DELETE
  TO authenticated
  USING (company_id = auth.uid());

-- ----------
-- saved_offers
-- ----------
DROP POLICY IF EXISTS saved_offers_own ON public.saved_offers;
CREATE POLICY saved_offers_own
  ON public.saved_offers
  FOR ALL
  TO authenticated
  USING (student_id = auth.uid())
  WITH CHECK (student_id = auth.uid());

-- ----------
-- applications
-- ----------
DROP POLICY IF EXISTS applications_select ON public.applications;
DROP POLICY IF EXISTS applications_insert_student ON public.applications;
DROP POLICY IF EXISTS applications_update_student ON public.applications;
DROP POLICY IF EXISTS applications_delete_student ON public.applications;
DROP POLICY IF EXISTS applications_update_company ON public.applications;

CREATE POLICY applications_select
  ON public.applications
  FOR SELECT
  TO authenticated
  USING (
    student_id = auth.uid()
    OR EXISTS (
      SELECT 1
      FROM public.offers o
      WHERE o.id = applications.offer_id
        AND o.company_id = auth.uid()
    )
  );

CREATE POLICY applications_insert_student
  ON public.applications
  FOR INSERT
  TO authenticated
  WITH CHECK (student_id = auth.uid());

-- Student can only edit their own application before 'accepted'
CREATE POLICY applications_update_student
  ON public.applications
  FOR UPDATE
  TO authenticated
  USING (
    student_id = auth.uid()
    AND status IN ('sent','countered')
  )
  WITH CHECK (
    student_id = auth.uid()
    AND status IN ('sent','countered','rejected')
  );

-- Student can withdraw only before accepted (delete)
CREATE POLICY applications_delete_student
  ON public.applications
  FOR DELETE
  TO authenticated
  USING (
    student_id = auth.uid()
    AND status IN ('sent','countered')
  );

-- Company can update applications to its own offers (accept/reject/counter)
CREATE POLICY applications_update_company
  ON public.applications
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.offers o
      WHERE o.id = applications.offer_id
        AND o.company_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.offers o
      WHERE o.id = applications.offer_id
        AND o.company_id = auth.uid()
    )
  );

-- ----------
-- conversations
-- ----------
DROP POLICY IF EXISTS conversations_select ON public.conversations;
DROP POLICY IF EXISTS conversations_insert ON public.conversations;

CREATE POLICY conversations_select
  ON public.conversations
  FOR SELECT
  TO authenticated
  USING (company_id = auth.uid() OR student_id = auth.uid());

-- Create conversation only if caller is a participant AND application links match
CREATE POLICY conversations_insert
  ON public.conversations
  FOR INSERT
  TO authenticated
  WITH CHECK (
    application_id IS NOT NULL
    AND (company_id = auth.uid() OR student_id = auth.uid())
    AND EXISTS (
      SELECT 1
      FROM public.applications a
      JOIN public.offers o ON o.id = a.offer_id
      WHERE a.id = conversations.application_id
        AND a.student_id = conversations.student_id
        AND o.company_id = conversations.company_id
        AND o.id = conversations.offer_id
        AND a.status IN ('sent','countered','accepted')
    )
  );

-- ----------
-- messages
-- ----------
DROP POLICY IF EXISTS messages_select ON public.messages;
DROP POLICY IF EXISTS messages_insert ON public.messages;

CREATE POLICY messages_select
  ON public.messages
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.conversations c
      WHERE c.id = messages.conversation_id
        AND (c.company_id = auth.uid() OR c.student_id = auth.uid())
    )
  );

CREATE POLICY messages_insert
  ON public.messages
  FOR INSERT
  TO authenticated
  WITH CHECK (
    sender_id = auth.uid()
    AND EXISTS (
      SELECT 1
      FROM public.conversations c
      JOIN public.applications a ON a.id = c.application_id
      WHERE c.id = messages.conversation_id
        AND (c.company_id = auth.uid() OR c.student_id = auth.uid())
        AND a.status IN ('sent','countered','accepted')
    )
  );

-- ----------
-- deliverables
-- ----------
DROP POLICY IF EXISTS deliverables_select ON public.deliverables;
DROP POLICY IF EXISTS deliverables_insert_student ON public.deliverables;
DROP POLICY IF EXISTS deliverables_update_student ON public.deliverables;
DROP POLICY IF EXISTS deliverables_update_company ON public.deliverables;

CREATE POLICY deliverables_select
  ON public.deliverables
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.applications a
      JOIN public.offers o ON o.id = a.offer_id
      WHERE a.id = deliverables.application_id
        AND (a.student_id = auth.uid() OR o.company_id = auth.uid())
    )
  );

-- Student can create deliverable for accepted application
CREATE POLICY deliverables_insert_student
  ON public.deliverables
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.applications a
      WHERE a.id = deliverables.application_id
        AND a.student_id = auth.uid()
        AND a.status = 'accepted'
    )
    AND status IN ('draft','submitted')
  );

-- Student can update only draft/submitted/changes_requested (not approved)
CREATE POLICY deliverables_update_student
  ON public.deliverables
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.applications a
      WHERE a.id = deliverables.application_id
        AND a.student_id = auth.uid()
        AND a.status = 'accepted'
    )
    AND deliverables.status <> 'approved'
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.applications a
      WHERE a.id = deliverables.application_id
        AND a.student_id = auth.uid()
        AND a.status = 'accepted'
    )
    AND status IN ('draft','submitted','changes_requested')
  );

-- Company can update to approved/changes_requested for its offer
CREATE POLICY deliverables_update_company
  ON public.deliverables
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.applications a
      JOIN public.offers o ON o.id = a.offer_id
      WHERE a.id = deliverables.application_id
        AND o.company_id = auth.uid()
        AND a.status = 'accepted'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.applications a
      JOIN public.offers o ON o.id = a.offer_id
      WHERE a.id = deliverables.application_id
        AND o.company_id = auth.uid()
        AND a.status = 'accepted'
    )
    AND status IN ('approved','changes_requested')
  );

-- ----------
-- experience_entries
-- ----------
DROP POLICY IF EXISTS experience_entries_select ON public.experience_entries;
DROP POLICY IF EXISTS experience_entries_insert_company ON public.experience_entries;

CREATE POLICY experience_entries_select
  ON public.experience_entries
  FOR SELECT
  TO authenticated
  USING (student_id = auth.uid() OR company_id = auth.uid());

-- Allow company insert only when there is an approved deliverable for that application
CREATE POLICY experience_entries_insert_company
  ON public.experience_entries
  FOR INSERT
  TO authenticated
  WITH CHECK (
    company_id = auth.uid()
    AND application_id IS NOT NULL
    AND EXISTS (
      SELECT 1
      FROM public.deliverables d
      JOIN public.applications a ON a.id = d.application_id
      WHERE a.id = experience_entries.application_id
        AND a.student_id = experience_entries.student_id
        AND a.offer_id = experience_entries.offer_id
        AND d.status = 'approved'
    )
  );

-- ----------
-- notifications
-- ----------
DROP POLICY IF EXISTS notifications_select_own ON public.notifications;
DROP POLICY IF EXISTS notifications_update_own ON public.notifications;

CREATE POLICY notifications_select_own
  ON public.notifications
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY notifications_update_own
  ON public.notifications
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Insert is done via SECURITY DEFINER function create_notification.
