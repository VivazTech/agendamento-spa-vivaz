-- Marca agendamentos originados pela página /cortesia (CORTESIA)
-- Execute no Supabase SQL Editor.

ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS is_courtesy BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_bookings_is_courtesy ON public.bookings(is_courtesy);

COMMENT ON COLUMN public.bookings.is_courtesy IS 'true = solicitação via página Cortesia';
