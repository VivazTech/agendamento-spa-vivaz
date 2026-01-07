-- Criar tabela de categorias
CREATE TABLE IF NOT EXISTS public.categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    icon VARCHAR(10),
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_categories_name ON public.categories(name);
CREATE INDEX IF NOT EXISTS idx_categories_is_active ON public.categories(is_active);
CREATE INDEX IF NOT EXISTS idx_categories_display_order ON public.categories(display_order);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_categories_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_categories_updated_at ON public.categories;
CREATE TRIGGER trigger_update_categories_updated_at
    BEFORE UPDATE ON public.categories
    FOR EACH ROW
    EXECUTE FUNCTION update_categories_updated_at();

-- RLS para categories
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Categories are readable" ON public.categories;
CREATE POLICY "Categories are readable" ON public.categories
    FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "Categories are writable by service role" ON public.categories;
CREATE POLICY "Categories are writable by service role" ON public.categories
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- Atualizar tabela services para usar foreign key
-- Primeiro, remover constraint se existir
ALTER TABLE public.services 
DROP CONSTRAINT IF EXISTS fk_services_category;

-- Converter a coluna category de VARCHAR para INTEGER
DO $$
DECLARE
  v_category_exists BOOLEAN;
  v_category_type TEXT;
  v_beleza_id INTEGER;
  v_massagens_id INTEGER;
  v_tratamentos_id INTEGER;
  v_combos_id INTEGER;
BEGIN
  -- Verificar se a coluna category existe
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'services' 
    AND column_name = 'category'
  ) INTO v_category_exists;
  
  IF v_category_exists THEN
    -- Obter o tipo da coluna
    SELECT data_type INTO v_category_type
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'services' 
    AND column_name = 'category';
    
    -- Se for VARCHAR, precisamos converter
    IF v_category_type = 'character varying' THEN
      -- Buscar IDs das categorias
      SELECT id INTO v_beleza_id FROM public.categories WHERE name = 'Beleza e Estética' LIMIT 1;
      SELECT id INTO v_massagens_id FROM public.categories WHERE name = 'Massagens' LIMIT 1;
      SELECT id INTO v_tratamentos_id FROM public.categories WHERE name = 'Tratamentos' LIMIT 1;
      SELECT id INTO v_combos_id FROM public.categories WHERE name = 'Combos' LIMIT 1;
      
      -- Criar coluna temporária
      ALTER TABLE public.services ADD COLUMN category_new INTEGER;
      
      -- Popular a coluna temporária com os IDs corretos
      UPDATE public.services 
      SET category_new = CASE 
        WHEN category = 'beleza-estetica' THEN v_beleza_id
        WHEN category = 'massagens' THEN v_massagens_id
        WHEN category = 'tratamentos' THEN v_tratamentos_id
        WHEN category = 'combos' THEN v_combos_id
        ELSE NULL
      END;
      
      -- Remover coluna antiga
      ALTER TABLE public.services DROP COLUMN category;
      
      -- Renomear coluna nova
      ALTER TABLE public.services RENAME COLUMN category_new TO category;
    END IF;
  ELSE
    -- Se não existir, criar como INTEGER
    ALTER TABLE public.services ADD COLUMN category INTEGER;
  END IF;
END $$;

-- Adicionar foreign key
ALTER TABLE public.services
ADD CONSTRAINT fk_services_category 
FOREIGN KEY (category) 
REFERENCES public.categories(id) 
ON DELETE SET NULL;

-- Inserir categorias padrão (apenas se não existirem)
INSERT INTO public.categories (name, icon, display_order) 
SELECT * FROM (VALUES
  ('Beleza e Estética', '✨', 1),
  ('Massagens', '💆', 2),
  ('Tratamentos', '🧴', 3),
  ('Combos', '🎁', 4)
) AS v(name, icon, display_order)
WHERE NOT EXISTS (SELECT 1 FROM public.categories WHERE categories.name = v.name);

COMMENT ON TABLE public.categories IS 'Tabela de categorias de serviços';
COMMENT ON COLUMN public.categories.icon IS 'Emoji ou ícone da categoria';
COMMENT ON COLUMN public.categories.display_order IS 'Ordem de exibição das categorias';

