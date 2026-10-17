
-- Fix all RLS policies: change from RESTRICTIVE to PERMISSIVE
-- Drop all restrictive public-facing SELECT/INSERT policies and recreate as permissive

-- === SERIES ===
DROP POLICY IF EXISTS "Anyone can read active series" ON public.series;
CREATE POLICY "Anyone can read active series" ON public.series FOR SELECT USING (status = 'ativo');

-- === CAROUSEL_SECTIONS ===
DROP POLICY IF EXISTS "Anyone can read visible carousel_sections" ON public.carousel_sections;
CREATE POLICY "Anyone can read visible carousel_sections" ON public.carousel_sections FOR SELECT USING (is_visible = true);

-- === COUPONS ===
DROP POLICY IF EXISTS "Anyone can read active coupons" ON public.coupons;
CREATE POLICY "Anyone can read active coupons" ON public.coupons FOR SELECT USING (is_active = true);

-- === ORDERS ===
DROP POLICY IF EXISTS "Anyone can create orders" ON public.orders;
CREATE POLICY "Anyone can create orders" ON public.orders FOR INSERT WITH CHECK (user_email IS NOT NULL AND user_email <> '');

-- === SITE_SETTINGS ===
DROP POLICY IF EXISTS "Anyone can read settings" ON public.site_settings;
CREATE POLICY "Anyone can read settings" ON public.site_settings FOR SELECT USING (true);

-- === PROFILES ===
DROP POLICY IF EXISTS "Users read own profile" ON public.profiles;
CREATE POLICY "Users read own profile" ON public.profiles FOR SELECT TO authenticated USING (id = auth.uid() OR has_role(auth.uid(), 'admin'));

-- === USER_ROLES ===
DROP POLICY IF EXISTS "Users can read own roles" ON public.user_roles;
CREATE POLICY "Users can read own roles" ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid() OR has_role(auth.uid(), 'admin'));
