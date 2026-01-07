-- =====================================================
-- CRIAR TABELA DE BANNERS PROMOCIONAIS
-- =====================================================
-- Execute este script no Supabase SQL Editor
-- =====================================================

CREATE TABLE IF NOT EXISTS public.banners (
    id SERIAL PRIMARY KEY,
    image_url TEXT NOT NULL,
    title VARCHAR(255),
    description TEXT,
    link_url TEXT,
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_banners_is_active ON public.banners(is_active);
CREATE INDEX IF NOT EXISTS idx_banners_display_order ON public.banners(display_order);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_banners_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_banners_updated_at ON public.banners;
CREATE TRIGGER trigger_update_banners_updated_at
    BEFORE UPDATE ON public.banners
    FOR EACH ROW
    EXECUTE FUNCTION update_banners_updated_at();

-- RLS para banners
ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Banners are readable" ON public.banners;
CREATE POLICY "Banners are readable" ON public.banners
    FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "Banners are writable by service role" ON public.banners;
CREATE POLICY "Banners are writable by service role" ON public.banners
    FOR ALL
    USING (true)
    WITH CHECK (true);

COMMENT ON TABLE public.banners IS 'Tabela de banners promocionais para exibição no topo da página';
COMMENT ON COLUMN public.banners.image_url IS 'URL da imagem do banner';
COMMENT ON COLUMN public.banners.title IS 'Título do banner (opcional)';
COMMENT ON COLUMN public.banners.description IS 'Descrição do banner (opcional)';
COMMENT ON COLUMN public.banners.link_url IS 'URL de destino ao clicar no banner (opcional)';
COMMENT ON COLUMN public.banners.display_order IS 'Ordem de exibição dos banners';
COMMENT ON COLUMN public.banners.is_active IS 'Indica se o banner está ativo';

-- =====================================================
-- FIM DO SCRIPT
-- =====================================================

