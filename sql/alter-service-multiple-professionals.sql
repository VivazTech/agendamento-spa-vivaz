-- Vários profissionais por serviço (N:N)
-- Execute no Supabase SQL Editor após existirem as tabelas services e professionals.

CREATE TABLE IF NOT EXISTS public.service_professionals (
  service_id INTEGER NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
  professional_id UUID NOT NULL REFERENCES public.professionals(id) ON DELETE CASCADE,
  PRIMARY KEY (service_id, professional_id)
);

CREATE INDEX IF NOT EXISTS idx_service_professionals_service_id ON public.service_professionals(service_id);
CREATE INDEX IF NOT EXISTS idx_service_professionals_professional_id ON public.service_professionals(professional_id);

COMMENT ON TABLE public.service_professionals IS 'Profissionais habilitados para cada serviço (muitos para muitos)';

ALTER TABLE public.service_professionals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service professionals are readable" ON public.service_professionals;
CREATE POLICY "Service professionals are readable" ON public.service_professionals
  FOR SELECT USING (true);
-- Escrita via API (service role) ignora RLS; não abrir INSERT/UPDATE/DELETE para anon.
DROP POLICY IF EXISTS "Service professionals are writable by service role" ON public.service_professionals;

-- Copiar vínculo antigo (um profissional por serviço) para a nova tabela
INSERT INTO public.service_professionals (service_id, professional_id)
SELECT id, responsible_professional_id
FROM public.services
WHERE responsible_professional_id IS NOT NULL
ON CONFLICT DO NOTHING;
