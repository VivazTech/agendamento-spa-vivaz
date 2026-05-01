-- Motivo obrigatório de recusa de agendamento (uso interno/relatórios)
-- Execute no Supabase SQL Editor.

ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

COMMENT ON COLUMN public.bookings.rejection_reason IS 'Motivo interno da recusa do agendamento';
-- Motivo obrigatório de recusa de agendamento (uso interno/relatórios)
-- Execute no Supabase SQL Editor.

ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

COMMENT ON COLUMN public.bookings.rejection_reason IS 'Motivo interno da recusa do agendamento';
