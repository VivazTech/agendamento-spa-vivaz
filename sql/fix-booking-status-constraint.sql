-- Corrige constraint de status da tabela bookings para o fluxo atual.
-- Execute no Supabase SQL Editor.

DO $$
BEGIN
  -- Remove nomes antigos/alternativos da constraint de status.
  IF EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'check_booking_status'
      AND conrelid = 'public.bookings'::regclass
  ) THEN
    ALTER TABLE public.bookings DROP CONSTRAINT check_booking_status;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'bookings_status_check'
      AND conrelid = 'public.bookings'::regclass
  ) THEN
    ALTER TABLE public.bookings DROP CONSTRAINT bookings_status_check;
  END IF;
END $$;

ALTER TABLE public.bookings
  ADD CONSTRAINT bookings_status_check
  CHECK (status IN ('pending', 'scheduled', 'rejected', 'completed', 'cancelled'));
