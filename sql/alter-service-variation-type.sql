-- Variação por tipo (ex.: curto / médio / longo) + modo no serviço
-- Execute no Supabase SQL Editor em bancos que já existem.

-- Remover unicidade (service_id, duration_minutes): tipos diferentes podem ter a mesma duração
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

COMMENT ON COLUMN public.service_price_variations.variation_kind IS 'duration = por tempo; service_type = por tipo (ex. cabelo curto)';
COMMENT ON COLUMN public.service_price_variations.label IS 'Nome do tipo quando variation_kind = service_type';

ALTER TABLE public.services
  ADD COLUMN IF NOT EXISTS variation_mode TEXT NOT NULL DEFAULT 'fixed';

ALTER TABLE public.services
  DROP CONSTRAINT IF EXISTS services_variation_mode_check;

ALTER TABLE public.services
  ADD CONSTRAINT services_variation_mode_check
  CHECK (variation_mode IN ('fixed', 'duration', 'service_type'));

COMMENT ON COLUMN public.services.variation_mode IS 'fixed | duration | service_type — exclusivos entre si';

UPDATE public.services s
SET variation_mode = 'duration'
WHERE variation_mode = 'fixed'
  AND EXISTS (
    SELECT 1 FROM public.service_price_variations v
    WHERE v.service_id = s.id
      AND (v.variation_kind IS NULL OR v.variation_kind = 'duration')
  );
