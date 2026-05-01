-- Permite configurar quantos profissionais simultâneos o serviço exige.
-- Execute no Supabase SQL Editor.

ALTER TABLE public.services
  ADD COLUMN IF NOT EXISTS simultaneous_professionals_required INTEGER NOT NULL DEFAULT 1;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'services_simultaneous_professionals_required_check'
  ) THEN
    ALTER TABLE public.services
      ADD CONSTRAINT services_simultaneous_professionals_required_check
      CHECK (simultaneous_professionals_required IN (1, 2));
  END IF;
END $$;
