-- Formas de pagamento configuráveis (admin) + vínculo no agendamento
-- Execute no Supabase SQL Editor.

CREATE TABLE IF NOT EXISTS public.payment_methods (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payment_methods_active_order ON public.payment_methods(is_active, display_order);

CREATE OR REPLACE FUNCTION public.update_payment_methods_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_payment_methods_updated_at ON public.payment_methods;
CREATE TRIGGER trg_payment_methods_updated_at
  BEFORE UPDATE ON public.payment_methods
  FOR EACH ROW
  EXECUTE FUNCTION public.update_payment_methods_updated_at();

ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS payment_method_id INTEGER REFERENCES public.payment_methods(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_bookings_payment_method_id ON public.bookings(payment_method_id);

ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "payment_methods readable" ON public.payment_methods;
CREATE POLICY "payment_methods readable" ON public.payment_methods FOR SELECT USING (true);
DROP POLICY IF EXISTS "payment_methods writable" ON public.payment_methods;
CREATE POLICY "payment_methods writable" ON public.payment_methods FOR ALL USING (true) WITH CHECK (true);

COMMENT ON TABLE public.payment_methods IS 'Formas de pagamento exibidas no formulário do cliente';
COMMENT ON COLUMN public.bookings.payment_method_id IS 'Forma escolhida pelo cliente ao solicitar o agendamento';
