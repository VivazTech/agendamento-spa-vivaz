-- Intervalo diário por profissional.
-- Execute no Supabase SQL Editor.

ALTER TABLE public.professionals
  ADD COLUMN IF NOT EXISTS break_start_time TIME NULL,
  ADD COLUMN IF NOT EXISTS break_end_time TIME NULL;

COMMENT ON COLUMN public.professionals.break_start_time IS 'Início do intervalo diário do profissional';
COMMENT ON COLUMN public.professionals.break_end_time IS 'Fim do intervalo diário do profissional';
