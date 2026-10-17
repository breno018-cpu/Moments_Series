-- Add optional streaming URL to series
ALTER TABLE public.series ADD COLUMN IF NOT EXISTS stream_url text;

-- Allow authenticated users to read their own orders by email
DROP POLICY IF EXISTS "user reads own orders by email" ON public.orders;
CREATE POLICY "user reads own orders by email"
ON public.orders
FOR SELECT
TO authenticated
USING (auth.email() = user_email);

GRANT SELECT ON public.orders TO authenticated;