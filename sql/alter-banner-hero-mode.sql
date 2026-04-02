-- Modo de exibição do topo: slider (só imagens) OU vídeo (só banner de vídeo), nunca os dois juntos.
-- Execute no Supabase SQL Editor.

CREATE TABLE IF NOT EXISTS public.banner_promo_settings (
  id SMALLINT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  hero_mode TEXT NOT NULL DEFAULT 'slider' CHECK (hero_mode IN ('slider', 'video')),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO public.banner_promo_settings (id, hero_mode)
VALUES (1, 'slider')
ON CONFLICT (id) DO NOTHING;

ALTER TABLE public.banner_promo_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Banner promo settings readable" ON public.banner_promo_settings;
CREATE POLICY "Banner promo settings readable" ON public.banner_promo_settings
  FOR SELECT USING (true);

COMMENT ON TABLE public.banner_promo_settings IS 'Configuração global: hero_mode slider = carrossel de slides; video = apenas o banner de vídeo';

CREATE OR REPLACE FUNCTION public.touch_banner_promo_settings()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_touch_banner_promo_settings ON public.banner_promo_settings;
CREATE TRIGGER trigger_touch_banner_promo_settings
  BEFORE UPDATE ON public.banner_promo_settings
  FOR EACH ROW EXECUTE FUNCTION public.touch_banner_promo_settings();
