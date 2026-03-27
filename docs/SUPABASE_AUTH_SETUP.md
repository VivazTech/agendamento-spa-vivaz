# Configuração de Autenticação Supabase

## PASSO 1 — Configuração no Supabase Dashboard

### 1. Habilitar Provider Email

1. Acesse o [Supabase Dashboard](https://app.supabase.com)
2. Selecione seu projeto
3. Vá em **Authentication** → **Providers**
4. Encontre **Email** e certifique-se de que está **habilitado**
5. Opcionalmente, configure:
   - **Confirm email**: Se desejar que usuários confirmem email antes de fazer login
   - **Secure email change**: Se desejar que mudanças de email exijam confirmação

### 2. Configurar URLs de Redirecionamento

1. Ainda em **Authentication**, vá em **URL Configuration**
2. Configure as seguintes URLs:

#### Site URL
- **Desenvolvimento**: `http://localhost:5173`
- **Produção**: `https://SEU_DOMINIO_VERCEL.com.br` (substitua pelo seu domínio real)

#### Redirect URLs
Adicione as seguintes URLs (uma por linha):
```
http://localhost:5173/*
http://localhost:5173/auth/callback
http://localhost:5173/reset-password
https://SEU_DOMINIO_VERCEL.com.br/*
https://SEU_DOMINIO_VERCEL.com.br/auth/callback
https://SEU_DOMINIO_VERCEL.com.br/reset-password
```

**Importante**: Substitua `SEU_DOMINIO_VERCEL.com.br` pelo domínio real do seu projeto no Vercel.

### 3. Verificar Variáveis de Ambiente

Certifique-se de que as seguintes variáveis estão configuradas:

**Local (.env):**
```
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-anon-key
```

**Vercel (Environment Variables):**
- Acesse seu projeto no Vercel
- Vá em **Settings** → **Environment Variables**
- Adicione/verifique:
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`

⚠️ **NUNCA** use a `service_role` key no frontend! Apenas a `anon` key deve ser usada no cliente.

### 4. Testar Configuração

Após configurar, teste:
1. Criar uma conta nova em `/login`
2. Verificar se recebe email de confirmação (se habilitado)
3. Fazer login
4. Verificar se a sessão persiste após refresh
5. Fazer logout

## Troubleshooting

### Erro: "Invalid login credentials"
- Verifique se o email está correto
- Verifique se a senha está correta
- Se habilitou "Confirm email", verifique se o email foi confirmado

### Erro: "Email rate limit exceeded"
- Aguarde alguns minutos antes de tentar novamente
- Verifique se não está fazendo muitas requisições

### Sessão não persiste após refresh
- Verifique se as URLs de redirecionamento estão configuradas corretamente
- Verifique se as variáveis de ambiente estão corretas
- Verifique o console do navegador para erros

