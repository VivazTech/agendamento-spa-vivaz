-- =====================================================
-- SCHEMA COMPLETO DO SISTEMA DE AGENDAMENTO SPA
-- Execute este script no Supabase SQL Editor
-- =====================================================

-- Habilitar extensões necessárias
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 1. TABELA: ADMINS (Administradores do sistema)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.admins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(100) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login TIMESTAMP WITH TIME ZONE
);

-- Índices para admins
CREATE INDEX IF NOT EXISTS idx_admins_username ON public.admins(username);
CREATE INDEX IF NOT EXISTS idx_admins_is_active ON public.admins(is_active);

-- Trigger para atualizar updated_at em admins
CREATE OR REPLACE FUNCTION update_admins_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_admins_updated_at ON public.admins;
CREATE TRIGGER trigger_update_admins_updated_at
    BEFORE UPDATE ON public.admins
    FOR EACH ROW
    EXECUTE FUNCTION update_admins_updated_at();

-- RLS para admins
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins can read own data" ON public.admins;
CREATE POLICY "Admins can read own data" ON public.admins
    FOR SELECT
    USING (true);

COMMENT ON TABLE public.admins IS 'Tabela de administradores do sistema';
COMMENT ON COLUMN public.admins.password_hash IS 'Hash da senha (usar bcrypt ou SHA-256)';
COMMENT ON COLUMN public.admins.is_active IS 'Indica se o admin está ativo';

-- =====================================================
-- 2. TABELA: PASSWORD_RESET_TOKENS (Tokens de reset de senha)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.password_reset_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id UUID NOT NULL REFERENCES public.admins(id) ON DELETE CASCADE,
    token TEXT UNIQUE NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    used BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para password_reset_tokens
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_token ON public.password_reset_tokens(token);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_admin_id ON public.password_reset_tokens(admin_id);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_expires_at ON public.password_reset_tokens(expires_at);

-- RLS para password_reset_tokens
ALTER TABLE public.password_reset_tokens ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Service role can manage tokens" ON public.password_reset_tokens;
CREATE POLICY "Service role can manage tokens" ON public.password_reset_tokens
    FOR ALL
    USING (true);

COMMENT ON TABLE public.password_reset_tokens IS 'Tokens temporários para reset de senha de administradores';
COMMENT ON COLUMN public.password_reset_tokens.token IS 'Token único para reset de senha';
COMMENT ON COLUMN public.password_reset_tokens.expires_at IS 'Data e hora de expiração do token (1 hora após criação)';
COMMENT ON COLUMN public.password_reset_tokens.used IS 'Indica se o token já foi usado';

-- =====================================================
-- 3. TABELA: PROFESSIONALS (Profissionais)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.professionals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(50),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para professionals
CREATE INDEX IF NOT EXISTS idx_professionals_name ON public.professionals(name);
CREATE INDEX IF NOT EXISTS idx_professionals_is_active ON public.professionals(is_active);
CREATE INDEX IF NOT EXISTS idx_professionals_email ON public.professionals(email);

-- Trigger para atualizar updated_at em professionals
CREATE OR REPLACE FUNCTION update_professionals_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_professionals_updated_at ON public.professionals;
CREATE TRIGGER trigger_update_professionals_updated_at
    BEFORE UPDATE ON public.professionals
    FOR EACH ROW
    EXECUTE FUNCTION update_professionals_updated_at();

-- RLS para professionals
ALTER TABLE public.professionals ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Professionals are readable" ON public.professionals;
CREATE POLICY "Professionals are readable" ON public.professionals
    FOR SELECT
    USING (true);

COMMENT ON TABLE public.professionals IS 'Tabela de profissionais do spa/salão';
COMMENT ON COLUMN public.professionals.is_active IS 'Indica se o profissional está ativo';

-- =====================================================
-- 4. TABELA: SERVICES (Serviços oferecidos)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.services (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    duration_minutes INTEGER NOT NULL,
    description TEXT,
    responsible_professional_id UUID REFERENCES public.professionals(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para services
CREATE INDEX IF NOT EXISTS idx_services_name ON public.services(name);
CREATE INDEX IF NOT EXISTS idx_services_responsible_professional_id ON public.services(responsible_professional_id);

-- Trigger para atualizar updated_at em services
CREATE OR REPLACE FUNCTION update_services_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_services_updated_at ON public.services;
CREATE TRIGGER trigger_update_services_updated_at
    BEFORE UPDATE ON public.services
    FOR EACH ROW
    EXECUTE FUNCTION update_services_updated_at();

-- RLS para services
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Services are readable" ON public.services;
CREATE POLICY "Services are readable" ON public.services
    FOR SELECT
    USING (true);

COMMENT ON TABLE public.services IS 'Tabela de serviços oferecidos pelo spa/salão';
COMMENT ON COLUMN public.services.price IS 'Preço do serviço em reais';
COMMENT ON COLUMN public.services.duration_minutes IS 'Duração do serviço em minutos';
COMMENT ON COLUMN public.services.responsible_professional_id IS 'Profissional responsável pelo serviço (opcional)';

-- =====================================================
-- 5. TABELA: CLIENTS (Clientes)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.clients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    email VARCHAR(255),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para clients
CREATE INDEX IF NOT EXISTS idx_clients_phone ON public.clients(phone);
CREATE INDEX IF NOT EXISTS idx_clients_email ON public.clients(email);
CREATE INDEX IF NOT EXISTS idx_clients_name ON public.clients(name);

-- Trigger para atualizar updated_at em clients
CREATE OR REPLACE FUNCTION update_clients_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_clients_updated_at ON public.clients;
CREATE TRIGGER trigger_update_clients_updated_at
    BEFORE UPDATE ON public.clients
    FOR EACH ROW
    EXECUTE FUNCTION update_clients_updated_at();

-- RLS para clients
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Clients are readable" ON public.clients;
CREATE POLICY "Clients are readable" ON public.clients
    FOR SELECT
    USING (true);

COMMENT ON TABLE public.clients IS 'Tabela de clientes do sistema';
COMMENT ON COLUMN public.clients.phone IS 'Telefone do cliente (identificador principal)';
COMMENT ON COLUMN public.clients.notes IS 'Observações sobre o cliente';

-- =====================================================
-- 6. TABELA: BOOKINGS (Agendamentos)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date DATE NOT NULL,
    time TIME NOT NULL,
    professional_id UUID REFERENCES public.professionals(id) ON DELETE SET NULL,
    client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
    completed_at TIMESTAMP WITH TIME ZONE,
    cancelled_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para bookings
CREATE INDEX IF NOT EXISTS idx_bookings_date ON public.bookings(date);
CREATE INDEX IF NOT EXISTS idx_bookings_time ON public.bookings(time);
CREATE INDEX IF NOT EXISTS idx_bookings_professional_id ON public.bookings(professional_id);
CREATE INDEX IF NOT EXISTS idx_bookings_client_id ON public.bookings(client_id);
CREATE INDEX IF NOT EXISTS idx_bookings_date_time ON public.bookings(date, time);
CREATE INDEX IF NOT EXISTS idx_bookings_completed_at ON public.bookings(completed_at);
CREATE INDEX IF NOT EXISTS idx_bookings_cancelled_at ON public.bookings(cancelled_at);

-- Trigger para atualizar updated_at em bookings
CREATE OR REPLACE FUNCTION update_bookings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_bookings_updated_at ON public.bookings;
CREATE TRIGGER trigger_update_bookings_updated_at
    BEFORE UPDATE ON public.bookings
    FOR EACH ROW
    EXECUTE FUNCTION update_bookings_updated_at();

-- RLS para bookings
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Bookings are readable" ON public.bookings;
CREATE POLICY "Bookings are readable" ON public.bookings
    FOR SELECT
    USING (true);

COMMENT ON TABLE public.bookings IS 'Tabela de agendamentos';
COMMENT ON COLUMN public.bookings.date IS 'Data do agendamento (formato: YYYY-MM-DD)';
COMMENT ON COLUMN public.bookings.time IS 'Horário do agendamento (formato: HH:MM:SS)';
COMMENT ON COLUMN public.bookings.completed_at IS 'Data e hora em que o atendimento foi concluído';
COMMENT ON COLUMN public.bookings.cancelled_at IS 'Data e hora em que o agendamento foi cancelado';

-- =====================================================
-- 7. TABELA: BOOKING_SERVICES (Serviços de cada agendamento)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.booking_services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
    service_id INTEGER NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para booking_services
CREATE INDEX IF NOT EXISTS idx_booking_services_booking_id ON public.booking_services(booking_id);
CREATE INDEX IF NOT EXISTS idx_booking_services_service_id ON public.booking_services(service_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_booking_services_unique ON public.booking_services(booking_id, service_id);

-- RLS para booking_services
ALTER TABLE public.booking_services ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Booking services are readable" ON public.booking_services;
CREATE POLICY "Booking services are readable" ON public.booking_services
    FOR SELECT
    USING (true);

COMMENT ON TABLE public.booking_services IS 'Tabela de relacionamento entre agendamentos e serviços';
COMMENT ON COLUMN public.booking_services.quantity IS 'Quantidade do serviço no agendamento';

-- =====================================================
-- 8. TABELA: REGISTERED_CLIENTS (Clientes registrados para login)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.registered_clients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    phone TEXT NOT NULL UNIQUE,
    email TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login TIMESTAMP WITH TIME ZONE
);

-- Índices para registered_clients
CREATE INDEX IF NOT EXISTS idx_registered_clients_phone ON public.registered_clients(phone);
CREATE INDEX IF NOT EXISTS idx_registered_clients_client_id ON public.registered_clients(client_id);

-- Trigger para atualizar updated_at em registered_clients
CREATE OR REPLACE FUNCTION update_registered_clients_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_registered_clients_updated_at ON public.registered_clients;
CREATE TRIGGER trg_update_registered_clients_updated_at
    BEFORE UPDATE ON public.registered_clients
    FOR EACH ROW
    EXECUTE FUNCTION update_registered_clients_updated_at();

-- RLS para registered_clients
ALTER TABLE public.registered_clients ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Registered clients readable" ON public.registered_clients;
CREATE POLICY "Registered clients readable" ON public.registered_clients
    FOR SELECT
    USING (true);

COMMENT ON TABLE public.registered_clients IS 'Clientes registrados para login via WhatsApp';

-- =====================================================
-- DADOS INICIAIS
-- =====================================================

-- Inserir admin padrão (senha: studio2024)
-- Hash SHA-256 de 'studio2024': 0daab506bc7b67801525e210c0a0325f8296bac8485d75c7d5466425abb7de0a
INSERT INTO public.admins (username, password_hash, name, email, is_active)
VALUES (
    'admin',
    '0daab506bc7b67801525e210c0a0325f8296bac8485d75c7d5466425abb7de0a', -- hash correto de 'studio2024'
    'Administrador',
    'admin@studioriquelme.com.br',
    true
)
ON CONFLICT (username) DO NOTHING;

-- =====================================================
-- VERIFICAÇÃO FINAL
-- =====================================================

-- Verificar se todas as tabelas foram criadas
DO $$
DECLARE
    table_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO table_count
    FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name IN (
        'admins',
        'password_reset_tokens',
        'professionals',
        'services',
        'clients',
        'bookings',
        'booking_services',
        'registered_clients'
    );
    
    IF table_count = 8 THEN
        RAISE NOTICE '✅ Todas as 8 tabelas foram criadas com sucesso!';
    ELSE
        RAISE WARNING '⚠️ Apenas % de 8 tabelas foram encontradas. Verifique os erros acima.', table_count;
    END IF;
END $$;

-- =====================================================
-- FIM DO SCRIPT
-- =====================================================

