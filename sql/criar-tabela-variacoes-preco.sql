-- =====================================================
-- CRIAR TABELA DE VARIAÇÕES DE PREÇO DOS SERVIÇOS
-- =====================================================
-- Execute este script no Supabase SQL Editor
-- =====================================================

CREATE TABLE IF NOT EXISTS public.service_price_variations (
    id SERIAL PRIMARY KEY,
    service_id INTEGER NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
    duration_minutes INTEGER NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(service_id, duration_minutes)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_service_price_variations_service_id ON public.service_price_variations(service_id);
CREATE INDEX IF NOT EXISTS idx_service_price_variations_display_order ON public.service_price_variations(display_order);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_service_price_variations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_service_price_variations_updated_at ON public.service_price_variations;
CREATE TRIGGER trigger_update_service_price_variations_updated_at
    BEFORE UPDATE ON public.service_price_variations
    FOR EACH ROW
    EXECUTE FUNCTION update_service_price_variations_updated_at();

-- RLS para service_price_variations
ALTER TABLE public.service_price_variations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Service price variations are readable" ON public.service_price_variations;
CREATE POLICY "Service price variations are readable" ON public.service_price_variations
    FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "Service price variations are writable by service role" ON public.service_price_variations;
CREATE POLICY "Service price variations are writable by service role" ON public.service_price_variations
    FOR ALL
    USING (true)
    WITH CHECK (true);

COMMENT ON TABLE public.service_price_variations IS 'Variações de preço por duração dos serviços';
COMMENT ON COLUMN public.service_price_variations.duration_minutes IS 'Duração em minutos para esta variação';
COMMENT ON COLUMN public.service_price_variations.price IS 'Preço para esta duração';
COMMENT ON COLUMN public.service_price_variations.display_order IS 'Ordem de exibição das variações';

-- =====================================================
-- FIM DO SCRIPT
-- =====================================================

