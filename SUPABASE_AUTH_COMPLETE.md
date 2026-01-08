# Autenticação Completa com Supabase Auth

Este documento descreve a implementação completa de autenticação usando Supabase Auth, baseado no [repositório oficial do Supabase Auth](https://github.com/supabase/auth).

## 📚 Visão Geral

O Supabase Auth é uma API JWT baseada para gerenciar usuários e emitir tokens JWT. Nossa implementação usa o cliente JavaScript oficial (`@supabase/supabase-js`) que se comunica automaticamente com os endpoints REST da API.

## 🔗 Endpoints da API Supabase Auth

### Autenticação Básica

#### `POST /token?grant_type=password`
**Usado por:** `supabase.auth.signInWithPassword()`

Login com email e senha:
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Resposta:**
```json
{
  "access_token": "jwt-token",
  "token_type": "bearer",
  "expires_in": 3600,
  "refresh_token": "refresh-token"
}
```

#### `POST /signup`
**Usado por:** `supabase.auth.signUp()`

Criar nova conta:
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Resposta:**
```json
{
  "id": "user-uuid",
  "email": "user@example.com",
  "confirmation_sent_at": "2024-01-01T00:00:00Z",
  "created_at": "2024-01-01T00:00:00Z"
}
```

#### `POST /logout`
**Usado por:** `supabase.auth.signOut()`

Revoga todos os refresh tokens do usuário. Requer autenticação.

### Recuperação de Senha

#### `POST /recover`
**Usado por:** `supabase.auth.resetPasswordForEmail()`

Envia email de recuperação de senha:
```json
{
  "email": "user@example.com"
}
```

**Limite:** Pode ser enviado apenas uma vez a cada 60 segundos.

### Magic Link (Login sem senha)

#### `POST /otp` ou `POST /magiclink`
**Usado por:** `supabase.auth.signInWithOtp()`

Envia magic link por email:
```json
{
  "email": "user@example.com",
  "create_user": true
}
```

O usuário recebe um link que redireciona para:
```
SITE_URL/#access_token=...&refresh_token=...&expires_in=3600&token_type=bearer&type=magiclink
```

### Verificação de Email

#### `GET /verify`
Verifica token de confirmação de email ou recuperação de senha:
```
?type=signup&token=confirmation-code&redirect_to=https://app.com
```

### Atualização de Usuário

#### `PUT /user`
**Usado por:** `supabase.auth.updateUser()`

Atualiza dados do usuário (requer autenticação):
```json
{
  "email": "new-email@example.com",
  "password": "new-password",
  "data": {
    "name": "John Doe",
    "custom_field": "value"
  }
}
```

## 🏗️ Arquitetura da Implementação

### Estrutura de Arquivos

```
src/
├── contexts/
│   └── SupabaseAuthContext.tsx    # Contexto global de autenticação
├── lib/
│   └── supabaseClient.ts           # Cliente Supabase inicializado
├── pages/
│   ├── Login.tsx                   # Página de login/cadastro
│   ├── Dashboard.tsx               # Página protegida (exemplo)
│   └── ForgotPassword.tsx          # Recuperação de senha
└── components/
    └── SupabaseProtectedRoute.tsx  # Componente para proteger rotas
```

### Fluxo de Autenticação

1. **Inicialização:**
   - `SupabaseAuthProvider` envolve a aplicação
   - Carrega sessão existente com `getSession()`
   - Escuta mudanças com `onAuthStateChange()`

2. **Login:**
   - Usuário preenche email/senha em `/login`
   - Chama `signIn(email, password)`
   - Supabase retorna `access_token` e `refresh_token`
   - Tokens são armazenados automaticamente (localStorage)
   - Estado é atualizado via `onAuthStateChange`
   - Redireciona para `/dashboard`

3. **Cadastro:**
   - Usuário preenche email/senha em `/login` (modo signup)
   - Chama `signUp(email, password)`
   - Se email confirmation estiver habilitado, envia email
   - Usuário confirma email e pode fazer login

4. **Proteção de Rotas:**
   - `SupabaseProtectedRoute` verifica `user`
   - Se não autenticado, redireciona para `/login`
   - Se autenticado, renderiza children

5. **Logout:**
   - Chama `signOut()`
   - Revoga tokens
   - Estado é atualizado via `onAuthStateChange`
   - Redireciona para `/login`

## 🔧 Funcionalidades Implementadas

### ✅ Funcionalidades Básicas
- [x] Login com email/senha
- [x] Cadastro de novos usuários
- [x] Logout
- [x] Persistência de sessão (localStorage)
- [x] Proteção de rotas
- [x] Tratamento de erros amigável
- [x] Loading states

### ✅ Funcionalidades Avançadas
- [x] Recuperação de senha
- [x] Magic Link (OTP)
- [x] Atualização de senha
- [x] Atualização de dados do usuário
- [x] Verificação de email
- [x] Redirecionamento automático

## 📝 Uso no Código

### Hook de Autenticação

```typescript
import { useSupabaseAuth } from '../contexts/SupabaseAuthContext';

const MyComponent = () => {
  const { user, session, loading, signIn, signUp, signOut } = useSupabaseAuth();

  // Verificar se está autenticado
  if (loading) return <div>Carregando...</div>;
  if (!user) return <div>Não autenticado</div>;

  return <div>Logado como: {user.email}</div>;
};
```

### Proteger Rotas

```typescript
import SupabaseProtectedRoute from './src/components/SupabaseProtectedRoute';

<Route 
  path="/dashboard" 
  element={
    <SupabaseProtectedRoute>
      <Dashboard />
    </SupabaseProtectedRoute>
  } 
/>
```

### Recuperação de Senha

```typescript
const { resetPassword } = useSupabaseAuth();

const handleReset = async () => {
  const { error } = await resetPassword(email);
  if (!error) {
    // Email enviado com sucesso
  }
};
```

### Magic Link

```typescript
const { sendMagicLink } = useSupabaseAuth();

const handleMagicLink = async () => {
  const { error } = await sendMagicLink(email);
  if (!error) {
    // Magic link enviado
  }
};
```

## ⚙️ Configuração no Supabase Dashboard

### 1. Habilitar Email Provider
- Authentication → Providers → Email → Habilitar

### 2. Configurar URLs
- Authentication → URL Configuration
- **Site URL:** `http://localhost:5173` (dev) e `https://seu-dominio.com` (prod)
- **Redirect URLs:** Adicionar `http://localhost:5173/*` e `https://seu-dominio.com/*`

### 3. Configurar Email Templates (Opcional)
- Authentication → Email Templates
- Personalizar templates de confirmação, recuperação, etc.

### 4. Configurar Rate Limits (Opcional)
- Authentication → Settings
- Ajustar limites de requisições por minuto/hora

## 🔒 Segurança

### Boas Práticas Implementadas

1. **Nunca usar `service_role` key no frontend**
   - Apenas `anon` key deve ser usada no cliente
   - `service_role` key só no backend (API routes)

2. **Validação de variáveis de ambiente**
   - Verificação de `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`
   - Avisos no console se não configuradas

3. **Tratamento de erros**
   - Mensagens amigáveis para o usuário
   - Logs detalhados no console para debug

4. **Rate Limiting**
   - Supabase limita automaticamente requisições
   - Mensagens de erro informam sobre limites

## 🧪 Testes

### Testar Login
1. Acesse `/login`
2. Preencha email e senha
3. Clique em "Entrar"
4. Deve redirecionar para `/dashboard`

### Testar Cadastro
1. Acesse `/login`
2. Clique em "Criar conta"
3. Preencha email e senha
4. Clique em "Criar conta"
5. Verifique email (se confirmation habilitado)

### Testar Recuperação de Senha
1. Acesse `/login`
2. Clique em "Esqueceu sua senha?"
3. Preencha email
4. Verifique email recebido
5. Siga link para redefinir senha

### Testar Persistência
1. Faça login
2. Recarregue a página (F5)
3. Deve continuar logado

### Testar Proteção de Rotas
1. Sem estar logado, acesse `/dashboard`
2. Deve redirecionar para `/login`

## 📚 Referências

- [Repositório Supabase Auth](https://github.com/supabase/auth)
- [Documentação Supabase Auth](https://supabase.com/docs/guides/auth)
- [Cliente JavaScript Supabase](https://supabase.com/docs/reference/javascript/auth-api)

## 🐛 Troubleshooting

### Erro: "Invalid login credentials"
- Verifique email e senha
- Verifique se email foi confirmado (se confirmation habilitado)

### Erro: "Email rate limit exceeded"
- Aguarde 60 segundos
- Verifique se não está fazendo muitas requisições

### Sessão não persiste
- Verifique URLs de redirecionamento no Supabase
- Verifique variáveis de ambiente
- Limpe localStorage e tente novamente

### Magic Link não funciona
- Verifique configuração de email no Supabase
- Verifique se email está sendo enviado (spam)
- Verifique URLs de redirecionamento

