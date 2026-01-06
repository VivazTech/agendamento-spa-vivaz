-- =====================================================
-- SCRIPT PARA VERIFICAR E CORRIGIR O ADMIN
-- Execute este script no Supabase SQL Editor
-- =====================================================

-- 1. Verificar se o admin existe e seu status atual
SELECT 
    id,
    username,
    name,
    email,
    is_active,
    LEFT(password_hash, 20) || '...' as hash_preview,
    CASE 
        WHEN password_hash = '0daab506bc7b67801525e210c0a0325f8296bac8485d75c7d5466425abb7de0a' 
        THEN '✅ Hash correto'
        ELSE '❌ Hash incorreto'
    END as status_hash,
    created_at,
    last_login
FROM public.admins
WHERE username = 'admin';

-- 2. Corrigir/Atualizar o admin
-- Hash SHA-256 correto de 'studio2024': 0daab506bc7b67801525e210c0a0325f8296bac8485d75c7d5466425abb7de0a

INSERT INTO public.admins (username, password_hash, name, email, is_active)
VALUES (
    'admin',
    '0daab506bc7b67801525e210c0a0325f8296bac8485d75c7d5466425abb7de0a', -- hash correto de 'studio2024'
    'Administrador',
    'admin@studioriquelme.com.br',
    true
)
ON CONFLICT (username) 
DO UPDATE SET 
    password_hash = '0daab506bc7b67801525e210c0a0325f8296bac8485d75c7d5466425abb7de0a',
    is_active = true,
    name = 'Administrador',
    email = 'admin@studioriquelme.com.br';

-- 3. Verificar novamente após a correção
SELECT 
    username,
    name,
    email,
    is_active,
    CASE 
        WHEN password_hash = '0daab506bc7b67801525e210c0a0325f8296bac8485d75c7d5466425abb7de0a' 
        THEN '✅ Hash correto - Login deve funcionar!'
        ELSE '❌ Hash ainda incorreto'
    END as status_hash
FROM public.admins
WHERE username = 'admin';

-- =====================================================
-- FIM DO SCRIPT
-- =====================================================

