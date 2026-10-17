ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS email_sent_at timestamptz;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS email_status text;