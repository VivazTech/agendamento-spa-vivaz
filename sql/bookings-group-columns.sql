-- Agendamento em grupo (vários bookings com mesmo booking_group_id) e interesse em grupo no fluxo do cliente
-- Execute no Supabase SQL Editor.

ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS booking_group_id UUID;

ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS client_requests_group BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_bookings_booking_group_id ON public.bookings(booking_group_id);
CREATE INDEX IF NOT EXISTS idx_bookings_client_requests_group ON public.bookings(client_requests_group) WHERE client_requests_group = true;

COMMENT ON COLUMN public.bookings.booking_group_id IS 'Mesmo UUID em todos os horários de um agendamento em grupo (admin)';
COMMENT ON COLUMN public.bookings.client_requests_group IS 'Cliente marcou interesse em agendamento em grupo na solicitação';
