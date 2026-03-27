# 📋 Resumo das Páginas de Login e Autenticação

## 🔐 Sistema de Autenticação

O projeto possui **3 sistemas de autenticação diferentes**, cada um para um propósito específico:

1. **Supabase Auth** - Autenticação geral (email/senha) para usuários
2. **Admin Auth** - Autenticação customizada (username/senha) para administradores
3. **Client Auth** - Autenticação para clientes do sistema de agendamento

---

## 📄 Páginas de Login e Autenticação

### 1. **Login Supabase** (`/login`)
**Arquivo:** `src/pages/Login.tsx`  
**Sistema:** Supabase Auth  
**Contexto:** `SupabaseAuthContext`

**Funcionalidades:**
- ✅ Login com email e senha
- ✅ Cadastro de novos usuários
- ✅ Alternância entre modo login e cadastro
- ✅ Link para recuperação de senha
- ✅ Tratamento de erros amigável
- ✅ Redirecionamento automático se já logado
- ✅ Mensagens de sucesso/erro

**Rotas relacionadas:**
- `/login` - Página principal
- `/dashboard` - Redirecionamento após login (protegida)
- `/forgot-password` - Link para recuperação

**Proteção:** Pública (qualquer um pode acessar)

---

### 2. **Recuperação de Senha** (`/forgot-password`)
**Arquivo:** `src/pages/ForgotPassword.tsx`  
**Sistema:** Supabase Auth  
**Contexto:** `SupabaseAuthContext`

**Funcionalidades:**
- ✅ Solicitar recuperação de senha por email
- ✅ Envio de link de redefinição
- ✅ Validação de email
- ✅ Mensagem de sucesso após envio
- ✅ Link para voltar ao login

**Fluxo:**
1. Usuário digita email
2. Sistema envia email com link de recuperação
3. Usuário clica no link e é redirecionado para `/reset-password`

**Proteção:** Pública

---

### 3. **Redefinição de Senha** (`/reset-password`)
**Arquivo:** `src/pages/ResetPassword.tsx`  
**Sistema:** Supabase Auth  
**Contexto:** `SupabaseAuthContext`

**Funcionalidades:**
- ✅ Redefinir senha após clicar no link do email
- ✅ Validação de senha (mínimo 6 caracteres)
- ✅ Confirmação de senha
- ✅ Verificação de token na URL
- ✅ Redirecionamento automático após sucesso

**Fluxo:**
1. Usuário recebe email com link
2. Clica no link → redireciona para `/reset-password?access_token=...`
3. Digita nova senha
4. Senha é atualizada
5. Redireciona para `/login`

**Proteção:** Pública (mas requer token válido)

---

### 4. **Dashboard** (`/dashboard`)
**Arquivo:** `src/pages/Dashboard.tsx`  
**Sistema:** Supabase Auth  
**Contexto:** `SupabaseAuthContext`  
**Proteção:** `SupabaseProtectedRoute`

**Funcionalidades:**
- ✅ Exibe informações do usuário logado
- ✅ Mostra email, ID, status de verificação
- ✅ Botão de logout
- ✅ Página protegida (requer autenticação)

**Proteção:** Protegida (redireciona para `/login` se não autenticado)

---

### 5. **Login Admin** (`/admin`)
**Arquivo:** `components/admin/LoginPage.tsx`  
**Sistema:** Admin Auth (customizado)  
**Contexto:** `AuthContext`

**Funcionalidades:**
- ✅ Login com username e senha (não email)
- ✅ Autenticação via API `/api/auth` (POST)
- ✅ Hash SHA-256 da senha
- ✅ Redirecionamento automático se já autenticado
- ✅ Link para criar conta admin
- ✅ Tratamento de erros

**Rotas relacionadas:**
- `/admin` - Mostra login se não autenticado, painel admin se autenticado
- `/admin/create-account` - Link para criar conta

**Proteção:** Pública (mas redireciona para painel se já autenticado)

---

### 6. **Criar Conta Admin** (`/admin/create-account`)
**Arquivo:** `components/admin/CreateAdminAccount.tsx`  
**Sistema:** Admin Auth (customizado)  
**API:** `/api/auth` (PUT)

**Funcionalidades:**
- ✅ Formulário completo para criar conta admin
- ✅ Campos: username, nome, email (opcional), role, senha, confirmar senha
- ✅ Seleção de perfil (admin, gerente, colaborador)
- ✅ Validações:
  - Username mínimo 3 caracteres
  - Senha mínimo 6 caracteres
  - Senhas devem coincidir
  - Email válido (se fornecido)
- ✅ Verificação de username duplicado
- ✅ Mensagem de sucesso e redirecionamento

**Proteção:** Pública

---

### 7. **Login Cliente** (`/login-cliente`)
**Arquivo:** `components/client/ClientLoginPage.tsx`  
**Sistema:** Client Auth (sistema de agendamento)

**Funcionalidades:**
- ✅ Login para clientes do sistema de agendamento
- ✅ Acesso aos agendamentos do cliente

**Rotas relacionadas:**
- `/meus-agendamentos` - Página de agendamentos do cliente

**Proteção:** Pública

---

## 🛡️ Componentes de Proteção

### 1. **SupabaseProtectedRoute**
**Arquivo:** `src/components/SupabaseProtectedRoute.tsx`  
**Sistema:** Supabase Auth

**Funcionalidades:**
- ✅ Protege rotas que requerem autenticação Supabase
- ✅ Verifica se usuário está logado
- ✅ Mostra loading durante verificação
- ✅ Redireciona para `/login` se não autenticado
- ✅ Renderiza children se autenticado

**Uso:**
```tsx
<Route 
  path="/dashboard" 
  element={
    <SupabaseProtectedRoute>
      <Dashboard />
    </SupabaseProtectedRoute>
  } 
/>
```

---

### 2. **ProtectedRoute** (Admin)
**Arquivo:** `components/admin/ProtectedRoute.tsx`  
**Sistema:** Admin Auth

**Funcionalidades:**
- ✅ Protege rotas do painel admin
- ✅ Verifica autenticação via `AuthContext`
- ✅ Mostra `LoginPage` se não autenticado
- ✅ Renderiza children se autenticado

**Uso:**
```tsx
<Route 
  path="/admin" 
  element={
    <ProtectedRoute>
      <Admin />
    </ProtectedRoute>
  } 
/>
```

---

## 🔄 Contextos de Autenticação

### 1. **SupabaseAuthContext**
**Arquivo:** `src/contexts/SupabaseAuthContext.tsx`  
**Sistema:** Supabase Auth

**Funcionalidades:**
- ✅ Gerencia sessão do Supabase
- ✅ Funções: `signIn`, `signUp`, `signOut`
- ✅ Funções extras: `resetPassword`, `sendMagicLink`, `updatePassword`, `updateUser`
- ✅ Estado: `user`, `session`, `loading`
- ✅ Hook: `useSupabaseAuth()`

**Provider:** `SupabaseAuthProvider` (em `index.tsx`)

---

### 2. **AuthContext** (Admin)
**Arquivo:** `contexts/AuthContext.tsx`  
**Sistema:** Admin Auth (customizado)

**Funcionalidades:**
- ✅ Gerencia autenticação de admin
- ✅ Função: `login(username, password)`
- ✅ Estado: `isAuthenticated`, `admin`, `isLoading`
- ✅ Armazena sessão no localStorage
- ✅ Hook: `useAuth()`

**Provider:** `AuthProvider` (em `index.tsx`)

---

## 📊 Resumo das Rotas

| Rota | Página | Sistema | Proteção | Descrição |
|------|--------|---------|----------|-----------|
| `/login` | `Login.tsx` | Supabase | Pública | Login/cadastro geral |
| `/forgot-password` | `ForgotPassword.tsx` | Supabase | Pública | Recuperação de senha |
| `/reset-password` | `ResetPassword.tsx` | Supabase | Pública* | Redefinir senha |
| `/dashboard` | `Dashboard.tsx` | Supabase | Protegida | Dashboard do usuário |
| `/admin` | `LoginPage.tsx` ou `Admin.tsx` | Admin | Protegida | Login/painel admin |
| `/admin/create-account` | `CreateAdminAccount.tsx` | Admin | Pública | Criar conta admin |
| `/login-cliente` | `ClientLoginPage.tsx` | Client | Pública | Login de cliente |
| `/meus-agendamentos` | `ClientBookingsPage.tsx` | Client | Protegida | Agendamentos do cliente |

*Pública mas requer token válido na URL

---

## 🔑 Diferenças entre os Sistemas

### Supabase Auth
- **Método:** Email e senha
- **Backend:** Supabase Auth (gerenciado)
- **Sessão:** Gerenciada pelo Supabase (localStorage)
- **Uso:** Usuários gerais do sistema

### Admin Auth
- **Método:** Username e senha
- **Backend:** API customizada (`/api/auth`)
- **Sessão:** localStorage customizado
- **Uso:** Administradores do sistema
- **Hash:** SHA-256

### Client Auth
- **Método:** Específico do sistema de agendamento
- **Backend:** Sistema próprio
- **Uso:** Clientes que fazem agendamentos

---

## 📝 Notas Importantes

1. **Dois sistemas coexistem:**
   - `SupabaseAuthContext` - Para autenticação geral
   - `AuthContext` - Para autenticação de admin

2. **Variáveis de ambiente:**
   - Frontend: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`
   - Backend (API): `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`

3. **Proteção de rotas:**
   - Use `SupabaseProtectedRoute` para rotas Supabase
   - Use `ProtectedRoute` para rotas admin

4. **Recuperação de senha:**
   - Supabase: Via email com link
   - Admin: Via API customizada (se implementado)

---

## 🎯 Fluxos Principais

### Fluxo de Login Supabase
1. Usuário acessa `/login`
2. Preenche email/senha
3. Clica em "Entrar"
4. `signIn()` é chamado
5. Supabase valida credenciais
6. Sessão é criada
7. Redireciona para `/dashboard`

### Fluxo de Criação de Conta Admin
1. Usuário acessa `/admin/create-account`
2. Preenche formulário completo
3. Clica em "Criar Conta"
4. API `/api/auth` (PUT) é chamada
5. Admin é criado no banco
6. Mensagem de sucesso
7. Redireciona para `/admin` (login)

### Fluxo de Recuperação de Senha
1. Usuário acessa `/forgot-password`
2. Digita email
3. Sistema envia email com link
4. Usuário clica no link
5. Redireciona para `/reset-password?access_token=...`
6. Usuário digita nova senha
7. Senha é atualizada
8. Redireciona para `/login`

---

## 📚 Documentação Relacionada

- `SUPABASE_AUTH_SETUP.md` - Configuração do Supabase
- `SUPABASE_AUTH_COMPLETE.md` - Documentação completa do Supabase Auth
- `CONFIGURAR_SUPABASE_RLS.md` - Configuração de RLS
- `VERIFICAR_VARIAVEIS_VERCEL.md` - Verificação de variáveis

---

**Última atualização:** Janeiro 2026

