
-- Create storage bucket for series images
INSERT INTO storage.buckets (id, name, public) VALUES ('series-images', 'series-images', true);

-- Allow authenticated admins to upload
CREATE POLICY "Admins can upload series images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'series-images' AND
  public.has_role(auth.uid(), 'admin'::public.app_role)
);

-- Allow anyone to read
CREATE POLICY "Anyone can view series images"
ON storage.objects FOR SELECT
USING (bucket_id = 'series-images');

-- Allow admins to delete
CREATE POLICY "Admins can delete series images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'series-images' AND
  public.has_role(auth.uid(), 'admin'::public.app_role)
);

-- Allow admins to update
CREATE POLICY "Admins can update series images"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'series-images' AND
  public.has_role(auth.uid(), 'admin'::public.app_role)
);

-- Create coupons table
CREATE TABLE public.coupons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  discount_type text NOT NULL DEFAULT 'percentage' CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value numeric NOT NULL DEFAULT 0,
  min_order_value numeric NOT NULL DEFAULT 0,
  max_uses integer DEFAULT NULL,
  used_count integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  expires_at timestamp with time zone DEFAULT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;

-- Anyone can read active coupons (for validation at checkout)
CREATE POLICY "Anyone can read active coupons"
ON public.coupons FOR SELECT
USING (is_active = true);

-- Admins full access
CREATE POLICY "Admins full access to coupons"
ON public.coupons FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

-- Trigger for updated_at
CREATE TRIGGER update_coupons_updated_at
  BEFORE UPDATE ON public.coupons
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();
