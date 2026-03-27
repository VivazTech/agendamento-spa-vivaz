-- =====================================================
-- CONFIGURAR RLS (Row Level Security) PARA TABELA ADMINS
-- Execute este script no Supabase SQL Editor
-- =====================================================

-- Remover políticas existentes
DROP POLICY IF EXISTS "Admins can read own data" ON public.admins;
DROP POLICY IF EXISTS "Admins can insert" ON public.admins;
DROP POLICY IF EXISTS "Admins can update" ON public.admins;
DROP POLICY IF EXISTS "Admins can delete" ON public.admins;

-- Política para SELECT (leitura)
-- Permite leitura se RLS estiver habilitado mas usando service_role key
CREATE POLICY "Admins can read own data" ON public.admins
    FOR SELECT
    USING (true);

-- Política para INSERT (criação)
-- Permite inserção de novos admins
CREATE POLICY "Admins can insert" ON public.admins
    FOR INSERT
    WITH CHECK (true);

-- Política para UPDATE (atualização)
-- Permite atualização de admins existentes
CREATE POLICY "Admins can update" ON public.admins
    FOR UPDATE
    USING (true)
    WITH CHECK (true);

-- Política para DELETE (exclusão)
-- Permite exclusão de admins (opcional, pode remover se não quiser permitir)
CREATE POLICY "Admins can delete" ON public.admins
    FOR DELETE
    USING (true);

-- =====================================================
-- NOTA IMPORTANTE:
-- =====================================================
-- Se você estiver usando SUPABASE_SERVICE_ROLE_KEY na API,
-- essas políticas não são necessárias, pois a service_role key
-- bypassa o RLS. No entanto, se estiver usando VITE_SUPABASE_ANON_KEY,
-- essas políticas são ESSENCIAIS.
-- =====================================================

