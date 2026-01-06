-- =====================================================
-- SCRIPT PARA CORRIGIR A SENHA DO ADMIN
-- Execute este script no Supabase SQL Editor
-- =====================================================

-- Hash SHA-256 correto de 'studio2024': 0daab506bc7b67801525e210c0a0325f8296bac8485d75c7d5466425abb7de0a

-- Atualizar o hash da senha do admin existente
UPDATE public.admins
SET password_hash = '0daab506bc7b67801525e210c0a0325f8296bac8485d75c7d5466425abb7de0a'
WHERE username = 'admin';

-- Se o admin não existir, criar um novo
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
    password_hash = EXCLUDED.password_hash,
    is_active = true;

-- Verificar se foi atualizado corretamente
SELECT 
    username,
    name,
    email,
    is_active,
    LEFT(password_hash, 20) || '...' as hash_preview,
    CASE 
        WHEN password_hash = '0daab506bc7b67801525e210c0a0325f8296bac8485d75c7d5466425abb7de0a' 
        THEN '✅ Hash correto'
        ELSE '❌ Hash incorreto'
    END as status_hash
FROM public.admins
WHERE username = 'admin';

-- =====================================================
-- FIM DO SCRIPT
-- =====================================================

