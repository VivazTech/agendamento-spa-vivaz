-- Script para adicionar campo role na tabela admins
-- Roles disponíveis: 'admin', 'gerente', 'colaborador', 'cliente'

-- Adicionar coluna role se não existir
ALTER TABLE public.admins
ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'colaborador';

-- Adicionar constraint para garantir valores válidos
ALTER TABLE public.admins
DROP CONSTRAINT IF EXISTS check_role_valid;

ALTER TABLE public.admins
ADD CONSTRAINT check_role_valid 
CHECK (role IN ('admin', 'gerente', 'colaborador'));

-- Atualizar admins existentes para ter role 'admin' (assumindo que já são admins)
UPDATE public.admins
SET role = 'admin'
WHERE role IS NULL OR role = 'colaborador';

-- Criar índice para busca rápida por role
CREATE INDEX IF NOT EXISTS idx_admins_role ON public.admins(role);

-- Comentários
COMMENT ON COLUMN public.admins.role IS 'Nível de acesso do usuário: admin (acesso total), gerente (gerenciamento), colaborador (visualização e operações básicas)';

-- Exemplo de inserção de usuários com diferentes roles:
-- INSERT INTO public.admins (username, password_hash, name, email, role, is_active)
-- VALUES 
--   ('admin', 'hash_senha', 'Administrador', 'admin@exemplo.com', 'admin', true),
--   ('gerente1', 'hash_senha', 'Gerente', 'gerente@exemplo.com', 'gerente', true),
--   ('colab1', 'hash_senha', 'Colaborador', 'colab@exemplo.com', 'colaborador', true);

