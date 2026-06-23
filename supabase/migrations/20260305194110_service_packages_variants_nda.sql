-- 1. service_packages: new columns
ALTER TABLE public.service_packages ADD COLUMN IF NOT EXISTS variants jsonb;
ALTER TABLE public.service_packages ADD COLUMN IF NOT EXISTS requires_nda boolean DEFAULT false;
ALTER TABLE public.service_packages ADD COLUMN IF NOT EXISTS commission_rate numeric DEFAULT 0.10;

-- 2. service_orders: new columns
ALTER TABLE public.service_orders ADD COLUMN IF NOT EXISTS nda_accepted_at timestamptz;
ALTER TABLE public.service_orders ADD COLUMN IF NOT EXISTS selected_variant text;

-- 3. contracts: commission_rate (frozen at contract creation time)
ALTER TABLE public.contracts ADD COLUMN IF NOT EXISTS commission_rate numeric DEFAULT 0.10;

-- 4. Set commission_rate for existing system packages
UPDATE public.service_packages
SET commission_rate = 0.25
WHERE is_system = true OR type = 'platform_service';;
