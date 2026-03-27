-- Tabela para horários de funcionamento configuráveis
-- Execute este script no Supabase (SQL Editor)

CREATE TABLE IF NOT EXISTS public.business_hours (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6), -- 0=Domingo, 1=Segunda, ..., 6=Sábado
  period VARCHAR(20) NOT NULL CHECK (period IN ('morning', 'afternoon', 'evening')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(day_of_week, period)
);

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_business_hours_day ON public.business_hours(day_of_week);
CREATE INDEX IF NOT EXISTS idx_business_hours_active ON public.business_hours(is_active);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_business_hours_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_business_hours_updated_at ON public.business_hours;
CREATE TRIGGER trg_update_business_hours_updated_at
BEFORE UPDATE ON public.business_hours
FOR EACH ROW
EXECUTE FUNCTION update_business_hours_updated_at();

-- RLS (Row Level Security)
ALTER TABLE public.business_hours ENABLE ROW LEVEL SECURITY;

-- Política para leitura pública (frontend precisa consultar)
DROP POLICY IF EXISTS "Public read access to business hours" ON public.business_hours;
CREATE POLICY "Public read access to business hours" ON public.business_hours
  FOR SELECT
  USING (true);

-- Política para service_role (API) - permite todas as operações
DROP POLICY IF EXISTS "Service role can manage business hours" ON public.business_hours;
CREATE POLICY "Service role can manage business hours" ON public.business_hours
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Inserir horários padrão (segunda a sexta)
INSERT INTO public.business_hours (day_of_week, period, is_active, start_time, end_time) VALUES
  -- Segunda-feira
  (1, 'morning', true, '09:00', '12:00'),
  (1, 'afternoon', true, '12:00', '18:00'),
  (1, 'evening', true, '18:00', '20:00'),
  -- Terça-feira
  (2, 'morning', true, '09:00', '12:00'),
  (2, 'afternoon', true, '12:00', '18:00'),
  (2, 'evening', true, '18:00', '20:00'),
  -- Quarta-feira
  (3, 'morning', true, '09:00', '12:00'),
  (3, 'afternoon', true, '12:00', '18:00'),
  (3, 'evening', true, '18:00', '20:00'),
  -- Quinta-feira
  (4, 'morning', true, '09:00', '12:00'),
  (4, 'afternoon', true, '12:00', '18:00'),
  (4, 'evening', true, '18:00', '20:00'),
  -- Sexta-feira
  (5, 'morning', true, '09:00', '12:00'),
  (5, 'afternoon', true, '12:00', '18:00'),
  (5, 'evening', true, '18:00', '20:00'),
  -- Sábado
  (6, 'morning', true, '09:00', '12:00'),
  (6, 'afternoon', true, '12:00', '18:00'),
  (6, 'evening', false, '18:00', '20:00'), -- Noite desativada no sábado
  -- Domingo
  (0, 'morning', false, '09:00', '12:00'), -- Desativado
  (0, 'afternoon', false, '12:00', '18:00'), -- Desativado
  (0, 'evening', false, '18:00', '20:00') -- Desativado
ON CONFLICT (day_of_week, period) DO NOTHING;

-- Comentários
COMMENT ON TABLE public.business_hours IS 'Horários de funcionamento configuráveis por dia da semana e período';
COMMENT ON COLUMN public.business_hours.day_of_week IS '0=Domingo, 1=Segunda, 2=Terça, 3=Quarta, 4=Quinta, 5=Sexta, 6=Sábado';
COMMENT ON COLUMN public.business_hours.period IS 'Período: morning (manhã), afternoon (tarde), evening (noite)';
COMMENT ON COLUMN public.business_hours.is_active IS 'Se o período está ativo/aberto para agendamentos';

