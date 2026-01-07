-- =====================================================
-- ADICIONAR CAMPO ROOM_NUMBER NA TABELA CLIENTS
-- =====================================================
-- Execute este script no Supabase SQL Editor
-- =====================================================

-- Adicionar coluna room_number à tabela clients
ALTER TABLE public.clients 
ADD COLUMN IF NOT EXISTS room_number VARCHAR(20);

-- Comentário na coluna
COMMENT ON COLUMN public.clients.room_number IS 'Número do quarto do cliente (opcional)';

-- Índice para melhorar performance de buscas por número do quarto (opcional)
CREATE INDEX IF NOT EXISTS idx_clients_room_number ON public.clients(room_number);

-- =====================================================
-- FIM DO SCRIPT
-- =====================================================

