-- Configuração global do limite diário de cortesias.
-- Execute no Supabase SQL Editor.

CREATE TABLE IF NOT EXISTS public.app_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO public.app_settings (key, value)
VALUES ('daily_courtesy_limit', '{"limit": 0}'::jsonb)
ON CONFLICT (key) DO NOTHING;
