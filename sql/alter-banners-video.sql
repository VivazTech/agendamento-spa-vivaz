-- =====================================================
-- MIGRAÇÃO: colunas de vídeo em banners (somente ALTER)
-- =====================================================
-- Quando usar: a tabela public.banners JÁ EXISTE (criada antes das
-- colunas banner_type e video_url).
--
-- Sobre rodar de novo o criar-tabela-banners.sql:
--   • NÃO duplica a tabela — CREATE TABLE IF NOT EXISTS só cria se
--     ainda não existir.
--   • Porém também NÃO adiciona colunas em tabela antiga; por isso
--     use ESTE arquivo para atualizar o esquema sem recriar nada.
-- =====================================================

ALTER TABLE public.banners
  ADD COLUMN IF NOT EXISTS banner_type TEXT NOT NULL DEFAULT 'slide';

ALTER TABLE public.banners
  ADD COLUMN IF NOT EXISTS video_url TEXT;

COMMENT ON COLUMN public.banners.image_url IS 'URL da imagem do banner (slide) ou miniatura até o vídeo carregar (video)';
COMMENT ON COLUMN public.banners.banner_type IS 'slide = carrossel de imagens; video = vídeo incorporado';
COMMENT ON COLUMN public.banners.video_url IS 'URL do vídeo quando banner_type = video';

ALTER TABLE public.banners DROP CONSTRAINT IF EXISTS banners_banner_type_check;
ALTER TABLE public.banners
  ADD CONSTRAINT banners_banner_type_check
  CHECK (banner_type IN ('slide', 'video'));
