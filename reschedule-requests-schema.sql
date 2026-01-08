-- Tabela para solicitações de reagendamento (troca de horário)
-- Execute este script no Supabase (SQL Editor)

CREATE TABLE IF NOT EXISTS public.reschedule_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  requested_date DATE NOT NULL,
  requested_time TIME NOT NULL,
  current_date DATE NOT NULL,
  current_time TIME NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  requested_by VARCHAR(50) NOT NULL DEFAULT 'client' CHECK (requested_by IN ('client', 'admin', 'professional')),
  responded_by UUID REFERENCES public.admins(id) ON DELETE SET NULL,
  response_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  responded_at TIMESTAMPTZ
);

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_reschedule_requests_booking_id ON public.reschedule_requests(booking_id);
CREATE INDEX IF NOT EXISTS idx_reschedule_requests_status ON public.reschedule_requests(status);
CREATE INDEX IF NOT EXISTS idx_reschedule_requests_created_at ON public.reschedule_requests(created_at DESC);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_reschedule_requests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_reschedule_requests_updated_at ON public.reschedule_requests;
CREATE TRIGGER trg_update_reschedule_requests_updated_at
BEFORE UPDATE ON public.reschedule_requests
FOR EACH ROW
EXECUTE FUNCTION update_reschedule_requests_updated_at();

-- RLS (Row Level Security)
ALTER TABLE public.reschedule_requests ENABLE ROW LEVEL SECURITY;

-- Política para service_role (API) - permite todas as operações
DROP POLICY IF EXISTS "Service role can manage reschedule requests" ON public.reschedule_requests;
CREATE POLICY "Service role can manage reschedule requests" ON public.reschedule_requests
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Comentários
COMMENT ON TABLE public.reschedule_requests IS 'Solicitações de reagendamento de agendamentos';
COMMENT ON COLUMN public.reschedule_requests.status IS 'Status: pending (pendente), accepted (aceita), rejected (rejeitada)';
COMMENT ON COLUMN public.reschedule_requests.requested_by IS 'Quem solicitou: client, admin, professional';
COMMENT ON COLUMN public.reschedule_requests.responded_by IS 'ID do admin que respondeu (se aplicável)';

