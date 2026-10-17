
ALTER TABLE public.coupons ADD COLUMN starts_at timestamp with time zone DEFAULT now();
