
-- Add is_adult flag to series
ALTER TABLE public.series ADD COLUMN IF NOT EXISTS is_adult boolean NOT NULL DEFAULT false;

-- Create packs table for combo sales
CREATE TABLE public.packs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo text NOT NULL,
  descricao text NOT NULL DEFAULT '',
  capa_url text NOT NULL DEFAULT '',
  preco_original numeric NOT NULL DEFAULT 0,
  preco_pack numeric NOT NULL DEFAULT 0,
  series_ids uuid[] NOT NULL DEFAULT '{}',
  is_active boolean NOT NULL DEFAULT true,
  posicao integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.packs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins full access to packs" ON public.packs FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can read active packs" ON public.packs FOR SELECT TO anon, authenticated
  USING (is_active = true);

-- Add trigger for updated_at on packs
CREATE TRIGGER packs_updated_at BEFORE UPDATE ON public.packs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
