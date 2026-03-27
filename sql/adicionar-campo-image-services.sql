-- =====================================================
-- ADICIONAR CAMPO IMAGE_URL NA TABELA SERVICES
-- =====================================================
-- Execute este script no Supabase SQL Editor
-- =====================================================

-- Adicionar coluna image_url à tabela services
ALTER TABLE public.services 
ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Comentário na coluna
COMMENT ON COLUMN public.services.image_url IS 'URL da imagem do serviço (opcional)';

-- Índice para melhorar performance de buscas (opcional)
CREATE INDEX IF NOT EXISTS idx_services_image_url ON public.services(image_url) WHERE image_url IS NOT NULL;

-- =====================================================
-- FIM DO SCRIPT
-- =====================================================

