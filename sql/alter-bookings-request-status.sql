-- Fluxo de solicitação de agendamento
-- pending: solicitação enviada pelo cliente
-- scheduled: solicitação aceita (agendamento aprovado)
-- rejected: solicitação recusada
-- completed/cancelled: estados finais

ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'pending';

ALTER TABLE public.bookings
  DROP CONSTRAINT IF EXISTS bookings_status_check;

ALTER TABLE public.bookings
  ADD CONSTRAINT bookings_status_check
  CHECK (status IN ('pending', 'scheduled', 'rejected', 'completed', 'cancelled'));

CREATE INDEX IF NOT EXISTS idx_bookings_status ON public.bookings(status);

UPDATE public.bookings
SET status = 'scheduled'
WHERE status IS NULL;
