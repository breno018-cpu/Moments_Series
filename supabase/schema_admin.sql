-- ==============================================================================
-- HANGAR BOX - SCRIPT SQL COMPLETO PARA CONFIGURAÇÃO ADMINISTRATIVA NO SUPABASE
-- Execute este script no SQL Editor do seu dashboard Supabase caso precise
-- configurar ou resetar as permissões e tabelas administrativas.
-- ==============================================================================

-- 1. Criação do Enum de Roles (caso não exista)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role') THEN
        CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');
    END IF;
END$$;

-- 2. Tabela de Controle de Acesso Baseado em Função (RBAC)
CREATE TABLE IF NOT EXISTS public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role public.app_role NOT NULL DEFAULT 'user',
    UNIQUE (user_id, role)
);

-- Ativar RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 3. Função RPC de Verificação de Permissão has_role
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  );
$$;

-- Políticas RLS para user_roles
DROP POLICY IF EXISTS "Usuários podem visualizar sua própria role" ON public.user_roles;
CREATE POLICY "Usuários podem visualizar sua própria role"
ON public.user_roles FOR SELECT
TO authenticated
USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

-- 4. Tabela de Configurações do Site (Pixel, WhatsApp, Modo Manutenção, etc.)
CREATE TABLE IF NOT EXISTS public.site_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key TEXT UNIQUE NOT NULL,
    value JSONB NOT NULL DEFAULT '{}'::jsonb,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

-- Qualquer um pode ler configurações públicas (modo manutenção, pixels, abas)
DROP POLICY IF EXISTS "Leitura pública de configurações" ON public.site_settings;
CREATE POLICY "Leitura pública de configurações"
ON public.site_settings FOR SELECT
TO public
USING (true);

-- Apenas admins podem alterar configurações
DROP POLICY IF EXISTS "Admins podem atualizar configurações" ON public.site_settings;
CREATE POLICY "Admins podem atualizar configurações"
ON public.site_settings FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 5. Bucket de Storage para Capas e Banners de Séries
INSERT INTO storage.buckets (id, name, public)
VALUES ('series-images', 'series-images', true)
ON CONFLICT (id) DO NOTHING;

-- Políticas de Storage para series-images
DROP POLICY IF EXISTS "Imagens de séries públicas" ON storage.objects;
CREATE POLICY "Imagens de séries públicas"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'series-images');

DROP POLICY IF EXISTS "Admins podem fazer upload de imagens" ON storage.objects;
CREATE POLICY "Admins podem fazer upload de imagens"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'series-images' AND public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins podem deletar imagens" ON storage.objects;
CREATE POLICY "Admins podem deletar imagens"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'series-images' AND public.has_role(auth.uid(), 'admin'));

-- ==============================================================================
-- DICA: COMO ATRIBUIR ROLE DE ADMIN A UM USUÁRIO:
-- Substitua 'SEU_EMAIL_AQUI@exemplo.com' pelo e-mail do seu usuário:
--
-- INSERT INTO public.user_roles (user_id, role)
-- SELECT id, 'admin'::public.app_role
-- FROM auth.users
-- WHERE email = 'SEU_EMAIL_AQUI@exemplo.com'
-- ON CONFLICT (user_id, role) DO NOTHING;
-- ==============================================================================
