-- =====================================================
-- CRIAR TABELA DE VARIAÇÕES DE PREÇO DOS SERVIÇOS
-- =====================================================
-- Execute no Supabase SQL Editor.
--
-- Se a tabela JÁ EXISTIR (versão antiga sem variation_kind), o CREATE
-- é ignorado; os ALTER abaixo acrescentam colunas e constraints.
-- Para só migrar um banco antigo, pode usar sql/alter-service-variation-type.sql
-- =====================================================

CREATE TABLE IF NOT EXISTS public.service_price_variations (
    id SERIAL PRIMARY KEY,
    service_id INTEGER NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
    duration_minutes INTEGER NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    display_order INTEGER DEFAULT 0,
    variation_kind TEXT NOT NULL DEFAULT 'duration',
    label TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Banco já existente sem estas colunas: CREATE acima não altera a tabela
ALTER TABLE public.service_price_variations
  DROP CONSTRAINT IF EXISTS service_price_variations_service_id_duration_minutes_key;

ALTER TABLE public.service_price_variations
  ADD COLUMN IF NOT EXISTS variation_kind TEXT NOT NULL DEFAULT 'duration';

ALTER TABLE public.service_price_variations
  ADD COLUMN IF NOT EXISTS label TEXT;

ALTER TABLE public.service_price_variations
  DROP CONSTRAINT IF EXISTS service_price_variations_variation_kind_check;

ALTER TABLE public.service_price_variations
  ADD CONSTRAINT service_price_variations_variation_kind_check
  CHECK (variation_kind IN ('duration', 'service_type'));

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

COMMENT ON TABLE public.service_price_variations IS 'Variações de preço (por duração ou por tipo de serviço)';
COMMENT ON COLUMN public.service_price_variations.duration_minutes IS 'Duração em minutos para esta opção (agendamento)';
COMMENT ON COLUMN public.service_price_variations.price IS 'Preço desta opção';
COMMENT ON COLUMN public.service_price_variations.display_order IS 'Ordem de exibição das variações';
COMMENT ON COLUMN public.service_price_variations.variation_kind IS 'duration | service_type';
COMMENT ON COLUMN public.service_price_variations.label IS 'Rótulo quando variation_kind = service_type (ex. Cabelo curto)';

-- =====================================================
-- FIM DO SCRIPT
-- =====================================================

