-- Trabalhadores extras (substitutos — não somam capacidade; só exibição no site quando "trabalhando hoje")
-- Execute no Supabase SQL Editor.

CREATE TABLE IF NOT EXISTS public.extra_workers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  work_time_from TIME NOT NULL,
  work_time_to TIME NOT NULL,
  working_today BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.extra_worker_services (
  extra_worker_id UUID NOT NULL REFERENCES public.extra_workers(id) ON DELETE CASCADE,
  service_id INTEGER NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
  PRIMARY KEY (extra_worker_id, service_id)
);

CREATE INDEX IF NOT EXISTS idx_extra_workers_working_today ON public.extra_workers(working_today) WHERE working_today = true;
CREATE INDEX IF NOT EXISTS idx_extra_worker_services_service_id ON public.extra_worker_services(service_id);

CREATE OR REPLACE FUNCTION public.update_extra_workers_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_extra_workers_updated_at ON public.extra_workers;
CREATE TRIGGER trg_extra_workers_updated_at
  BEFORE UPDATE ON public.extra_workers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_extra_workers_updated_at();

ALTER TABLE public.extra_workers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.extra_worker_services ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "extra_workers readable" ON public.extra_workers;
CREATE POLICY "extra_workers readable" ON public.extra_workers FOR SELECT USING (true);
DROP POLICY IF EXISTS "extra_workers writable" ON public.extra_workers;
CREATE POLICY "extra_workers writable" ON public.extra_workers FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "extra_worker_services readable" ON public.extra_worker_services;
CREATE POLICY "extra_worker_services readable" ON public.extra_worker_services FOR SELECT USING (true);
DROP POLICY IF EXISTS "extra_worker_services writable" ON public.extra_worker_services;
CREATE POLICY "extra_worker_services writable" ON public.extra_worker_services FOR ALL USING (true) WITH CHECK (true);

COMMENT ON TABLE public.extra_workers IS 'Substitutos temporários; não entram na lógica de vagas — apenas exibição quando working_today';
COMMENT ON COLUMN public.extra_workers.working_today IS 'Se true, o nome aparece nos serviços vinculados (área do cliente)';
