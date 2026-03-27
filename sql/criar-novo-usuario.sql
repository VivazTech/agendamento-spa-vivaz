-- Script para criar um novo usuário admin
-- IMPORTANTE: Execute primeiro o script criar-funcao-hash-senha.sql para criar a função hash_password()

-- Exemplo de uso:
-- 1. Execute criar-funcao-hash-senha.sql (apenas uma vez)
-- 2. Escolha um username único
-- 3. Escolha uma senha segura (em texto plano - o banco gera o hash automaticamente)
-- 4. Substitua os valores no INSERT abaixo
-- 5. Execute no Supabase SQL Editor

-- Criar novo usuário (senha em texto plano - hash gerado automaticamente)
INSERT INTO public.admins (username, password_hash, name, email, role, is_active)
VALUES (
    'pedro',                    -- Substitua pelo username desejado
    public.hash_password('pedro123'),  -- Senha em texto plano - hash gerado automaticamente
    'Pedro Riquelme',        -- Substitua pelo nome completo
    'teste@pedroriquelme.com.br',            -- Substitua pelo email (opcional, pode ser NULL)
    'admin',                     -- Role: 'admin', 'gerente' ou 'colaborador'
    true                               -- is_active: true para ativo, false para desativado
)
ON CONFLICT (username) DO UPDATE
SET 
    password_hash = EXCLUDED.password_hash,
    name = EXCLUDED.name,
    email = EXCLUDED.email,
    role = EXCLUDED.role,
    is_active = EXCLUDED.is_active,
    updated_at = NOW();

-- Exemplo prático: Criar um gerente
-- INSERT INTO public.admins (username, password_hash, name, email, role, is_active)
-- VALUES (
--     'gerente1',
--     public.hash_password('studio2024'),  -- Senha em texto plano
--     'Gerente do Sistema',
--     'gerente@vivazcataratas.com',
--     'gerente',
--     true
-- )
-- ON CONFLICT (username) DO UPDATE
-- SET 
--     password_hash = EXCLUDED.password_hash,
--     name = EXCLUDED.name,
--     email = EXCLUDED.email,
--     role = EXCLUDED.role,
--     is_active = EXCLUDED.is_active,
--     updated_at = NOW();

-- Exemplo prático: Criar um colaborador
-- INSERT INTO public.admins (username, password_hash, name, email, role, is_active)
-- VALUES (
--     'colab1',
--     public.hash_password('senha123'),  -- Senha em texto plano
--     'Colaborador',
--     'colab@vivazcataratas.com',
--     'colaborador',
--     true
-- )
-- ON CONFLICT (username) DO UPDATE
-- SET 
--     password_hash = EXCLUDED.password_hash,
--     name = EXCLUDED.name,
--     email = EXCLUDED.email,
--     role = EXCLUDED.role,
--     is_active = EXCLUDED.is_active,
--     updated_at = NOW();

-- Verificar se o usuário foi criado
SELECT id, username, name, email, role, is_active, created_at 
FROM public.admins 
WHERE username = 'novo_usuario';  -- Substitua pelo username usado acima

-- VANTAGENS de usar a função hash_password():
-- 1. Mais seguro: senha não precisa ser gerada externamente
-- 2. Mais simples: apenas digite a senha em texto plano
-- 3. Consistente: sempre usa o mesmo algoritmo (SHA-256)
-- 4. Automático: banco de dados gera o hash na hora da inserção

-- IMPORTANTE: Execute primeiro criar-funcao-hash-senha.sql para criar a função

