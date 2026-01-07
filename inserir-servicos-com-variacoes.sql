-- =====================================================
-- PADRÃO SQL PARA INSERÇÃO EM MASSA DE SERVIÇOS COM VARIAÇÕES DE PREÇO
-- =====================================================
-- Este script permite cadastrar serviços com múltiplas variações de preço
-- Execute no Supabase SQL Editor
-- =====================================================

-- IMPORTANTE: Antes de executar, verifique:
-- 1. Se as categorias já existem na tabela categories
-- 2. Se os profissionais existem (caso queira associar)
-- 3. Os valores de preço e duração estão corretos
-- 4. A tabela service_price_variations foi criada

-- =====================================================
-- MÉTODO 1: INSERT com CTE (Common Table Expression) - Recomendado
-- =====================================================
-- Use este método para inserir serviço e suas variações em uma única transação

WITH novo_servico AS (
  INSERT INTO public.services (
    name,
    price,
    duration_minutes,
    description,
    category,
    responsible_professional_id,
    image_url
  ) VALUES (
    'Massagem Relaxante',
    119.00, -- Preço padrão (será ignorado se houver variações)
    25,    -- Duração padrão (será ignorada se houver variações)
    'Massagem terapêutica para relaxamento e alívio de tensões musculares',
    2, -- ID da categoria "Massagens" (verifique o ID correto)
    NULL, -- UUID do profissional (ou NULL)
    'https://exemplo.com/imagem-massagem.jpg' -- URL da imagem (opcional)
  )
  RETURNING id
)
INSERT INTO public.service_price_variations (
  service_id,
  duration_minutes,
  price,
  display_order
)
SELECT 
  novo_servico.id,
  duration_minutes,
  price,
  display_order
FROM novo_servico
CROSS JOIN (VALUES
  (25, 119.00, 0),  -- 25 minutos por R$119
  (55, 210.00, 1)   -- 55 minutos por R$210
) AS variations(duration_minutes, price, display_order);

-- =====================================================
-- MÉTODO 2: INSERT separado (mais simples para múltiplos serviços)
-- =====================================================
-- Use este método quando quiser inserir vários serviços de uma vez

-- Passo 1: Inserir o serviço
INSERT INTO public.services (
  name,
  price,
  duration_minutes,
  description,
  category,
  responsible_professional_id,
  image_url
) VALUES (
  'Tratamento Facial Completo',
  150.00, -- Preço padrão
  30,     -- Duração padrão
  'Tratamento facial com produtos premium para rejuvenescimento',
  3, -- ID da categoria "Tratamentos"
  NULL,
  NULL
)
RETURNING id;

-- Passo 2: Inserir as variações (substitua SERVICE_ID pelo ID retornado acima)
-- Exemplo: se o ID retornado foi 10, use service_id = 10
INSERT INTO public.service_price_variations (
  service_id,
  duration_minutes,
  price,
  display_order
) VALUES
  (10, 30, 150.00, 0),  -- 30 minutos por R$150
  (60, 280.00, 1),      -- 60 minutos por R$280
  (90, 400.00, 2);      -- 90 minutos por R$400

-- =====================================================
-- MÉTODO 3: Múltiplos serviços com variações usando função
-- =====================================================
-- Função auxiliar para inserir serviço com variações

CREATE OR REPLACE FUNCTION inserir_servico_com_variacoes(
  p_name VARCHAR(255),
  p_price DECIMAL(10, 2),
  p_duration_minutes INTEGER,
  p_description TEXT,
  p_category INTEGER,
  p_professional_id UUID DEFAULT NULL,
  p_image_url TEXT DEFAULT NULL,
  p_variacoes JSONB DEFAULT NULL
)
RETURNS INTEGER AS $$
DECLARE
  v_service_id INTEGER;
  v_variacao JSONB;
BEGIN
  -- Inserir o serviço
  INSERT INTO public.services (
    name, price, duration_minutes, description, 
    category, responsible_professional_id, image_url
  ) VALUES (
    p_name, p_price, p_duration_minutes, p_description,
    p_category, p_professional_id, p_image_url
  )
  RETURNING id INTO v_service_id;
  
  -- Inserir variações se fornecidas
  IF p_variacoes IS NOT NULL THEN
    FOR v_variacao IN SELECT * FROM jsonb_array_elements(p_variacoes)
    LOOP
      INSERT INTO public.service_price_variations (
        service_id, duration_minutes, price, display_order
      ) VALUES (
        v_service_id,
        (v_variacao->>'duration_minutes')::INTEGER,
        (v_variacao->>'price')::DECIMAL(10, 2),
        COALESCE((v_variacao->>'display_order')::INTEGER, 0)
      );
    END LOOP;
  END IF;
  
  RETURN v_service_id;
END;
$$ LANGUAGE plpgsql;

-- Exemplo de uso da função:
SELECT inserir_servico_com_variacoes(
  'Massagem Terapêutica',
  100.00,  -- preço padrão
  30,      -- duração padrão
  'Massagem para alívio de dores musculares',
  2,       -- categoria
  NULL,    -- profissional
  NULL,    -- imagem
  '[
    {"duration_minutes": 30, "price": 100.00, "display_order": 0},
    {"duration_minutes": 60, "price": 180.00, "display_order": 1},
    {"duration_minutes": 90, "price": 250.00, "display_order": 2}
  ]'::JSONB
);

-- =====================================================
-- MÉTODO 4: INSERT em massa com múltiplos serviços
-- =====================================================
-- Use este método para cadastrar vários serviços de uma vez

-- Inserir serviços
INSERT INTO public.services (
  name,
  price,
  duration_minutes,
  description,
  category,
  responsible_professional_id,
  image_url
) VALUES
  ('Massagem Relaxante', 119.00, 25, 'Massagem para relaxamento', 2, NULL, NULL),
  ('Tratamento Facial', 150.00, 30, 'Tratamento facial completo', 3, NULL, NULL),
  ('Drenagem Linfática', 120.00, 45, 'Drenagem para redução de inchaço', 2, NULL, NULL)
RETURNING id, name;

-- Depois, inserir as variações para cada serviço
-- IMPORTANTE: Substitua os IDs pelos valores retornados acima

-- Variações para Massagem Relaxante (assumindo ID = 1)
INSERT INTO public.service_price_variations (service_id, duration_minutes, price, display_order) VALUES
  (1, 25, 119.00, 0),
  (1, 55, 210.00, 1);

-- Variações para Tratamento Facial (assumindo ID = 2)
INSERT INTO public.service_price_variations (service_id, duration_minutes, price, display_order) VALUES
  (2, 30, 150.00, 0),
  (2, 60, 280.00, 1),
  (2, 90, 400.00, 2);

-- Variações para Drenagem Linfática (assumindo ID = 3)
INSERT INTO public.service_price_variations (service_id, duration_minutes, price, display_order) VALUES
  (3, 45, 120.00, 0),
  (3, 60, 160.00, 1);

-- =====================================================
-- MÉTODO 5: Usando subquery para buscar o ID automaticamente
-- =====================================================
-- Útil quando você conhece o nome do serviço

INSERT INTO public.service_price_variations (
  service_id,
  duration_minutes,
  price,
  display_order
)
SELECT 
  s.id,
  v.duration_minutes,
  v.price,
  v.display_order
FROM public.services s
CROSS JOIN (VALUES
  (25, 119.00, 0),
  (55, 210.00, 1)
) AS v(duration_minutes, price, display_order)
WHERE s.name = 'Massagem Relaxante';

-- =====================================================
-- EXEMPLO COMPLETO: Cadastro de múltiplos serviços com variações
-- =====================================================

-- PASSO 1: Verificar IDs das categorias
SELECT id, name FROM public.categories ORDER BY display_order;

-- PASSO 2: Inserir serviços
INSERT INTO public.services (
  name,
  price,
  duration_minutes,
  description,
  category,
  image_url
) VALUES
  ('Massagem Relaxante', 119.00, 25, 'Massagem terapêutica para relaxamento', 2, NULL),
  ('Massagem Desportiva', 150.00, 30, 'Massagem para atletas e esportistas', 2, NULL),
  ('Tratamento Facial Premium', 200.00, 60, 'Tratamento facial com produtos de luxo', 3, NULL)
RETURNING id, name;

-- PASSO 3: Inserir variações (substitua os IDs pelos valores retornados)

-- Exemplo: Se Massagem Relaxante retornou ID = 10
INSERT INTO public.service_price_variations (service_id, duration_minutes, price, display_order) VALUES
  (10, 25, 119.00, 0),
  (10, 55, 210.00, 1);

-- Exemplo: Se Massagem Desportiva retornou ID = 11
INSERT INTO public.service_price_variations (service_id, duration_minutes, price, display_order) VALUES
  (11, 30, 150.00, 0),
  (11, 60, 280.00, 1),
  (11, 90, 400.00, 2);

-- Exemplo: Se Tratamento Facial Premium retornou ID = 12
INSERT INTO public.service_price_variations (service_id, duration_minutes, price, display_order) VALUES
  (12, 60, 200.00, 0),
  (12, 90, 300.00, 1);

-- =====================================================
-- CONSULTAS ÚTEIS
-- =====================================================

-- Ver serviços com suas variações
SELECT 
  s.id,
  s.name,
  s.price AS preco_padrao,
  s.duration_minutes AS duracao_padrao,
  json_agg(
    json_build_object(
      'duracao', v.duration_minutes,
      'preco', v.price,
      'ordem', v.display_order
    ) ORDER BY v.display_order
  ) AS variacoes
FROM public.services s
LEFT JOIN public.service_price_variations v ON v.service_id = s.id
GROUP BY s.id, s.name, s.price, s.duration_minutes
ORDER BY s.name;

-- Ver apenas serviços que têm variações
SELECT 
  s.id,
  s.name,
  COUNT(v.id) AS quantidade_variacoes
FROM public.services s
INNER JOIN public.service_price_variations v ON v.service_id = s.id
GROUP BY s.id, s.name
HAVING COUNT(v.id) > 0
ORDER BY s.name;

-- Ver detalhes de todas as variações de um serviço específico
SELECT 
  s.name AS servico,
  v.duration_minutes AS duracao_minutos,
  v.price AS preco,
  v.display_order AS ordem
FROM public.service_price_variations v
INNER JOIN public.services s ON s.id = v.service_id
WHERE s.name = 'Massagem Relaxante'  -- Substitua pelo nome do serviço
ORDER BY v.display_order, v.duration_minutes;

-- =====================================================
-- DICAS IMPORTANTES
-- =====================================================
-- 1. Preço padrão: O preço e duração na tabela services são usados apenas quando
--    não há variações. Se houver variações, elas serão exibidas no lugar.
-- 2. Display_order: Use para controlar a ordem de exibição das variações
-- 3. Duração única: Não pode ter duas variações com a mesma duração para o mesmo serviço
-- 4. Validação: Sempre verifique se o service_id existe antes de inserir variações
-- 5. Transações: Use BEGIN/COMMIT para garantir que serviço e variações sejam
--    inseridos juntos ou nenhum seja inserido em caso de erro

-- =====================================================
-- EXEMPLO COM TRANSAÇÃO (Recomendado para produção)
-- =====================================================

BEGIN;

-- Inserir serviço
INSERT INTO public.services (
  name, price, duration_minutes, description, category
) VALUES (
  'Massagem Aromaterapia', 130.00, 30, 'Massagem com óleos essenciais', 2
)
RETURNING id INTO v_service_id;

-- Inserir variações
INSERT INTO public.service_price_variations (service_id, duration_minutes, price, display_order) VALUES
  (v_service_id, 30, 130.00, 0),
  (v_service_id, 60, 240.00, 1);

COMMIT;

-- =====================================================
-- FIM DO SCRIPT
-- =====================================================

