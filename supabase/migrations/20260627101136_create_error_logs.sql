CREATE TABLE IF NOT EXISTS public.error_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  source text NOT NULL CHECK (char_length(source) BETWEEN 1 AND 120),
  level text NOT NULL DEFAULT 'error' CHECK (level IN ('error', 'warning', 'info')),
  error_type text,
  error_code text,
  message text NOT NULL CHECK (char_length(message) BETWEEN 1 AND 1200),
  context jsonb NOT NULL DEFAULT '{}'::jsonb,
  order_id uuid,
  contract_id uuid,
  payment_id uuid,
  stripe_session_id text,
  stripe_event_id text,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

ALTER TABLE public.error_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY error_logs_select_admin
  ON public.error_logs
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.profiles profile
      WHERE profile.user_id = (SELECT auth.uid())
        AND profile.role = 'admin'
    )
  );

CREATE POLICY error_logs_deny_insert_authenticated
  ON public.error_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (false);

CREATE POLICY error_logs_deny_update_authenticated
  ON public.error_logs
  FOR UPDATE
  TO authenticated
  USING (false)
  WITH CHECK (false);

CREATE POLICY error_logs_deny_delete_authenticated
  ON public.error_logs
  FOR DELETE
  TO authenticated
  USING (false);

REVOKE ALL ON public.error_logs FROM anon;
GRANT SELECT ON public.error_logs TO authenticated;
GRANT INSERT, SELECT ON public.error_logs TO service_role;

CREATE INDEX IF NOT EXISTS idx_error_logs_created_at
  ON public.error_logs (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_error_logs_source_created_at
  ON public.error_logs (source, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_error_logs_contract_id
  ON public.error_logs (contract_id, created_at DESC)
  WHERE contract_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_error_logs_user_id
  ON public.error_logs (user_id, created_at DESC)
  WHERE user_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_error_logs_stripe_event_id
  ON public.error_logs (stripe_event_id)
  WHERE stripe_event_id IS NOT NULL;

COMMENT ON TABLE public.error_logs IS
  'Sanitized server-side operational errors. Inserted by service_role; visible to admins only via RLS.';

COMMENT ON COLUMN public.error_logs.context IS
  'Sanitized diagnostic metadata only. Do not store request bodies, headers, cookies, tokens, emails, PESEL, NIP, addresses, or payment card data.';
