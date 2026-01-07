# Sistema de Níveis de Usuário (Roles)

## Visão Geral

O sistema agora suporta 4 níveis de usuário com diferentes permissões:

1. **Admin** - Acesso total ao sistema
2. **Gerente** - Gerenciamento de operações (sem acesso a configurações de usuários)
3. **Colaborador** - Visualização e operações básicas
4. **Cliente** - Acesso apenas ao próprio histórico de agendamentos

## Estrutura

### Tabela `admins`
- Campo `role` adicionado com valores: `'admin'`, `'gerente'`, `'colaborador'`
- Clientes usam a tabela `registered_clients` (sistema separado)

### Permissões por Role

#### Admin
- ✅ Gerenciar todos os usuários (criar, editar, deletar)
- ✅ Gerenciar serviços, profissionais, categorias
- ✅ Gerenciar agendamentos
- ✅ Visualizar relatórios
- ✅ Configurar banners
- ✅ Acesso total ao painel

#### Gerente
- ❌ Gerenciar usuários (apenas visualizar)
- ✅ Gerenciar serviços, profissionais, categorias
- ✅ Gerenciar agendamentos
- ✅ Visualizar relatórios
- ✅ Configurar banners
- ✅ Acesso ao painel (exceto gerenciamento de usuários)

#### Colaborador
- ❌ Gerenciar usuários
- ❌ Gerenciar serviços, profissionais, categorias
- ✅ Visualizar agendamentos
- ✅ Editar status de agendamentos
- ❌ Visualizar relatórios
- ❌ Configurar banners

#### Cliente
- ✅ Visualizar próprios agendamentos
- ✅ Cancelar próprios agendamentos
- ❌ Acesso ao painel admin

## Como Usar

### 1. Executar o Script SQL

Execute o arquivo `adicionar-campo-role.sql` no Supabase para adicionar o campo `role`:

```sql
-- O script já está criado em adicionar-campo-role.sql
```

### 2. Criar Usuários com Roles

```sql
-- Criar Admin
INSERT INTO public.admins (username, password_hash, name, email, role, is_active)
VALUES ('admin', 'hash_senha', 'Administrador', 'admin@exemplo.com', 'admin', true);

-- Criar Gerente
INSERT INTO public.admins (username, password_hash, name, email, role, is_active)
VALUES ('gerente1', 'hash_senha', 'Gerente', 'gerente@exemplo.com', 'gerente', true);

-- Criar Colaborador
INSERT INTO public.admins (username, password_hash, name, email, role, is_active)
VALUES ('colab1', 'hash_senha', 'Colaborador', 'colab@exemplo.com', 'colaborador', true);
```

### 3. Verificar Permissões no Código

```typescript
import { useAuth } from '../contexts/AuthContext';

const MyComponent = () => {
  const { admin } = useAuth();
  
  // Verificar se é admin
  if (admin?.role === 'admin') {
    // Mostrar funcionalidades de admin
  }
  
  // Verificar se pode gerenciar
  const canManage = ['admin', 'gerente'].includes(admin?.role || '');
  
  // Verificar se pode visualizar
  const canView = ['admin', 'gerente', 'colaborador'].includes(admin?.role || '');
};
```

## Implementação Técnica

### Arquivos Modificados

1. **adicionar-campo-role.sql** - Script para adicionar campo role
2. **api/auth-firebase.ts** - Retorna role do usuário
3. **contexts/AuthContext.tsx** - Inclui role no objeto admin
4. **components/admin/** - Componentes verificam permissões

### Hook de Permissões

Um hook `usePermissions` pode ser criado para facilitar a verificação:

```typescript
const { canManageUsers, canManageServices, canViewReports } = usePermissions();
```

## Notas

- Clientes não usam a tabela `admins`, eles têm seu próprio sistema de autenticação via telefone
- O sistema mantém compatibilidade com usuários existentes (default: 'admin')
- Permissões são verificadas tanto no frontend quanto no backend

