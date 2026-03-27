-- =====================================================
-- AJUSTE TEMPORÁRIO DE RLS PARA PERMITIR LEITURA COM ANON KEY
-- ⚠️ ATENÇÃO: Isso reduz a segurança. Use apenas temporariamente.
-- O ideal é usar SUPABASE_SERVICE_ROLE_KEY no Vercel.
-- =====================================================

-- Atualizar política RLS para permitir leitura pública temporariamente
DROP POLICY IF EXISTS "Admins can read own data" ON public.admins;

CREATE POLICY "Admins can read own data" ON public.admins
    FOR SELECT
    USING (true);

-- Também permitir UPDATE para last_login
DROP POLICY IF EXISTS "Admins can update last login" ON public.admins;

CREATE POLICY "Admins can update last login" ON public.admins
    FOR UPDATE
    USING (true)
    WITH CHECK (true);

-- =====================================================
-- FIM DO SCRIPT
-- =====================================================

