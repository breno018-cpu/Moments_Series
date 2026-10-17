
CREATE TABLE public.carousel_sections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  section_type text NOT NULL DEFAULT 'category',
  filter_category text DEFAULT NULL,
  sort_by text NOT NULL DEFAULT 'posicao',
  sort_order text NOT NULL DEFAULT 'asc',
  max_items integer NOT NULL DEFAULT 20,
  is_visible boolean NOT NULL DEFAULT true,
  posicao integer NOT NULL DEFAULT 0,
  show_rank boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.carousel_sections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins full access to carousel_sections" ON public.carousel_sections
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can read visible carousel_sections" ON public.carousel_sections
  FOR SELECT TO anon, authenticated
  USING (is_visible = true);

CREATE TRIGGER update_carousel_sections_updated_at
  BEFORE UPDATE ON public.carousel_sections
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Insert default sections
INSERT INTO public.carousel_sections (title, section_type, filter_category, sort_by, sort_order, posicao, show_rank) VALUES
  ('Destaques', 'category', 'Destaques', 'posicao', 'asc', 1, false),
  ('Em Alta', 'category', 'Em Alta', 'vendas_count', 'desc', 2, true),
  ('Novidades', 'recent', NULL, 'data_adicao', 'desc', 3, false),
  ('Mais Populares', 'popular', NULL, 'vendas_count', 'desc', 4, false),
  ('Recomendados', 'category', 'Recomendados', 'posicao', 'asc', 5, false);
