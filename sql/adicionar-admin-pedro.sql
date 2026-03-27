-- =====================================================
-- Script para adicionar admin com email do Firebase
-- Email: pedroriquelmefoz@gmail.com
-- =====================================================

-- Verificar se o admin já existe
SELECT id, username, name, email, is_active, created_at
FROM public.admins 
WHERE email = 'pedroriquelmefoz@gmail.com';

-- Inserir ou atualizar admin
-- Como estamos usando apenas Firebase (sem username/password), 
-- podemos usar o email como username também
-- O password_hash pode ser vazio ou um valor dummy, já que não é usado com Firebase
INSERT INTO public.admins (username, password_hash, name, email, is_active, created_at, updated_at)
VALUES (
    'pedroriquelmefoz@gmail.com',  -- username (usando email)
    'firebase_auth',  -- password_hash dummy (não usado com Firebase, mas campo é NOT NULL)
    'Pedro Riquelme',  -- name (ajuste se necessário)
    'pedroriquelmefoz@gmail.com',  -- email
    true,  -- is_active
    NOW(),  -- created_at
    NOW()   -- updated_at
)
ON CONFLICT (username) DO UPDATE
SET 
    email = EXCLUDED.email,
    is_active = true,
    updated_at = NOW();

-- OU se a constraint for no email (depende do schema):
-- ON CONFLICT (email) DO UPDATE
-- SET 
--     username = EXCLUDED.username,
--     is_active = true,
--     updated_at = NOW();

-- Verificar se foi inserido/atualizado corretamente
SELECT id, username, name, email, is_active, created_at, updated_at
FROM public.admins 
WHERE email = 'pedroriquelmefoz@gmail.com';

-- =====================================================
-- Por que isso é necessário?
-- =====================================================
-- O backend (/api/auth-firebase) verifica se o email do Firebase
-- está na tabela admins com is_active = true.
-- 
-- Fluxo:
-- 1. Firebase autentica o usuário com Google ✅
-- 2. Backend recebe o idToken e verifica no Firebase ✅
-- 3. Backend busca o email na tabela admins ❌ (falha aqui se não existir)
-- 4. Se não encontrar ou is_active = false, retorna "Usuário não autorizado"
--
-- Por isso é necessário ter o email cadastrado na tabela admins!

