-- Adicionar campo category à tabela services
-- Categorias disponíveis: 'beleza-estetica', 'massagens', 'tratamentos', 'combos'

ALTER TABLE public.services 
ADD COLUMN IF NOT EXISTS category VARCHAR(50);

-- Comentário na coluna
COMMENT ON COLUMN public.services.category IS 'Categoria do serviço: beleza-estetica, massagens, tratamentos, combos';

-- Índice para melhorar performance de filtros por categoria
CREATE INDEX IF NOT EXISTS idx_services_category ON public.services(category);

