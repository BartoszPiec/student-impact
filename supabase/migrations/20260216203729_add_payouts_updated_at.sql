ALTER TABLE public.payouts ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();;
