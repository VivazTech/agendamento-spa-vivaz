-- =====================================================
-- PADRÃO SQL PARA INSERÇÃO EM MASSA DE SERVIÇOS
-- =====================================================
-- Este script permite cadastrar múltiplos serviços de uma vez
-- Execute no Supabase SQL Editor
-- =====================================================

-- IMPORTANTE: Antes de executar, verifique:
-- 1. Se as categorias já existem na tabela categories
-- 2. Se os profissionais existem (caso queira associar)
-- 3. Os valores de preço e duração estão corretos

-- =====================================================
-- MÉTODO 1: INSERT com múltiplos VALUES (Recomendado)
-- =====================================================
-- Use este método para inserir vários serviços de uma vez
-- Substitua os valores de exemplo pelos seus dados reais

INSERT INTO public.services (
    name,
    price,
    duration_minutes,
    description,
    category,
    responsible_professional_id
) VALUES
    -- Exemplo 1: Serviço completo com todos os campos
    (
        'Massagem Relaxante',
        150.00,
        60,
        'Massagem terapêutica para relaxamento e alívio de tensões musculares',
        2, -- ID da categoria "Massagens" (verifique o ID correto na tabela categories)
        NULL -- UUID do profissional (ou NULL se não houver profissional específico)
    ),
    -- Exemplo 2: Serviço sem profissional específico
    (
        'Corte de Cabelo',
        80.00,
        45,
        'Corte moderno e personalizado',
        1, -- ID da categoria "Beleza e Estética"
        NULL
    ),
    -- Exemplo 3: Serviço sem descrição
    (
        'Manicure',
        50.00,
        30,
        NULL,
        1,
        NULL
    ),
    -- Exemplo 4: Serviço com profissional específico
    -- IMPORTANTE: Substitua 'UUID_DO_PROFISSIONAL' pelo UUID real do profissional
    (
        'Tratamento Facial',
        200.00,
        90,
        'Tratamento facial completo com produtos premium',
        3, -- ID da categoria "Tratamentos"
        'UUID_DO_PROFISSIONAL'::UUID -- Substitua pelo UUID real
    ),
    -- Exemplo 5: Combo/Pacote
    (
        'Combo Beleza Completa',
        350.00,
        180,
        'Pacote completo: corte, escova, manicure e pedicure',
        4, -- ID da categoria "Combos"
        NULL
    );

-- =====================================================
-- MÉTODO 2: INSERT com SELECT (Útil para importar de outra tabela)
-- =====================================================
-- Use este método se você tiver os dados em outra tabela

-- Exemplo: Inserir serviços a partir de uma tabela temporária
/*
CREATE TEMP TABLE temp_services_import (
    name VARCHAR(255),
    price DECIMAL(10, 2),
    duration_minutes INTEGER,
    description TEXT,
    category_name VARCHAR(255),
    professional_name VARCHAR(255)
);

-- Inserir dados na tabela temporária
INSERT INTO temp_services_import VALUES
    ('Serviço 1', 100.00, 60, 'Descrição 1', 'Massagens', 'João Silva'),
    ('Serviço 2', 150.00, 90, 'Descrição 2', 'Beleza e Estética', NULL);

-- Inserir na tabela services com JOIN para buscar IDs
INSERT INTO public.services (
    name,
    price,
    duration_minutes,
    description,
    category,
    responsible_professional_id
)
SELECT 
    t.name,
    t.price,
    t.duration_minutes,
    t.description,
    c.id AS category,
    p.id AS responsible_professional_id
FROM temp_services_import t
LEFT JOIN public.categories c ON c.name = t.category_name
LEFT JOIN public.professionals p ON p.name = t.professional_name;

-- Limpar tabela temporária
DROP TABLE temp_services_import;
*/

-- =====================================================
-- MÉTODO 3: INSERT com verificação de duplicatas
-- =====================================================
-- Use este método para evitar inserir serviços duplicados

INSERT INTO public.services (
    name,
    price,
    duration_minutes,
    description,
    category,
    responsible_professional_id
)
SELECT 
    name,
    price,
    duration_minutes,
    description,
    category,
    responsible_professional_id
FROM (VALUES
    ('Massagem Terapêutica', 180.00, 75, 'Massagem para alívio de dores', 2, NULL),
    ('Escova Progressiva', 250.00, 120, 'Alisamento e tratamento capilar', 1, NULL)
) AS new_services(name, price, duration_minutes, description, category, responsible_professional_id)
WHERE NOT EXISTS (
    SELECT 1 
    FROM public.services s 
    WHERE s.name = new_services.name
);

-- =====================================================
-- CONSULTAS ÚTEIS PARA VERIFICAR DADOS ANTES DE INSERIR
-- =====================================================

-- Ver todas as categorias disponíveis e seus IDs
-- Execute esta query para descobrir os IDs das categorias
SELECT id, name, icon, display_order 
FROM public.categories 
ORDER BY display_order;

-- Ver todos os profissionais disponíveis e seus UUIDs
-- Execute esta query para descobrir os UUIDs dos profissionais
SELECT id, name, email, phone 
FROM public.professionals 
WHERE is_active = true 
ORDER BY name;

-- Ver serviços já cadastrados
SELECT 
    s.id,
    s.name,
    s.price,
    s.duration_minutes,
    s.description,
    c.name AS category_name,
    p.name AS professional_name
FROM public.services s
LEFT JOIN public.categories c ON c.id = s.category
LEFT JOIN public.professionals p ON p.id = s.responsible_professional_id
ORDER BY s.name;

-- =====================================================
-- EXEMPLO COMPLETO: Cadastro de múltiplos serviços
-- =====================================================
-- Copie e cole este bloco, substituindo pelos seus dados

/*
-- PASSO 1: Verificar IDs das categorias
SELECT id, name FROM public.categories;

-- PASSO 2: Verificar UUIDs dos profissionais (se necessário)
SELECT id, name FROM public.professionals WHERE is_active = true;

-- PASSO 3: Inserir os serviços
INSERT INTO public.services (
    name,
    price,
    duration_minutes,
    description,
    category,
    responsible_professional_id
) VALUES
    -- Cole aqui seus serviços, um por linha
    ('Nome do Serviço 1', 100.00, 60, 'Descrição do serviço 1', 1, NULL),
    ('Nome do Serviço 2', 150.00, 90, 'Descrição do serviço 2', 2, NULL);
    -- Adicione quantos serviços precisar...

-- PASSO 4: Verificar se foram inseridos corretamente
SELECT * FROM public.services ORDER BY created_at DESC LIMIT 10;
*/

-- =====================================================
-- DICAS IMPORTANTES
-- =====================================================
-- 1. Preço: Use DECIMAL com 2 casas decimais (ex: 150.00, não 150)
-- 2. Duração: Sempre em minutos (ex: 60 para 1 hora, 90 para 1h30)
-- 3. Categoria: Use o ID numérico da categoria, não o nome
-- 4. Profissional: Use UUID ou NULL se não houver profissional específico
-- 5. Descrição: Pode ser NULL se não houver descrição
-- 6. Nome: Deve ser único e descritivo
-- 7. Sempre teste com poucos registros antes de inserir muitos

-- =====================================================
-- FIM DO SCRIPT
-- =====================================================

