# ✅ Verificar Variáveis de Ambiente no Vercel

## 📋 Variáveis Necessárias

Para a API `/api/auth` funcionar, você precisa das seguintes variáveis no Vercel:

### ✅ Variáveis que você JÁ tem:
- `VITE_SUPABASE_ANON_KEY` ✅
- `SUPABASE_SERVICE_ROLE_KEY` ✅

### ⚠️ Variável que pode estar faltando:
- `SUPABASE_URL` ou `VITE_SUPABASE_URL` ⚠️

## 🔍 Como Verificar

1. Acesse o [Vercel Dashboard](https://vercel.com)
2. Selecione seu projeto
3. Vá em **Settings** → **Environment Variables**
4. Verifique se existe:
   - `SUPABASE_URL` OU
   - `VITE_SUPABASE_URL`

## 🔧 Como Adicionar (se faltar)

### Opção 1: Adicionar `SUPABASE_URL` (Recomendado para API)

1. No Vercel Dashboard → **Settings** → **Environment Variables**
2. Clique em **Add New**
3. Preencha:
   - **Name:** `SUPABASE_URL`
   - **Value:** Cole a URL do seu projeto Supabase (ex: `https://xxxxx.supabase.co`)
   - **Environment:** Marque todas (Production, Preview, Development)
4. Clique em **Save**

### Opção 2: Usar `VITE_SUPABASE_URL` (já deve estar configurada)

Se você já tem `VITE_SUPABASE_URL` configurada, a API vai usar ela como fallback. Mas é melhor ter `SUPABASE_URL` também.

## 📝 Como Obter a URL do Supabase

1. Acesse o [Supabase Dashboard](https://app.supabase.com)
2. Selecione seu projeto
3. Vá em **Settings** → **API**
4. Copie o **Project URL** (ex: `https://abcdefghijklmnop.supabase.co`)

## ✅ Checklist Final

No Vercel, você deve ter:

- [ ] `VITE_SUPABASE_URL` (para o frontend)
- [ ] `VITE_SUPABASE_ANON_KEY` (para o frontend)
- [ ] `SUPABASE_URL` (para a API - pode ser o mesmo valor de VITE_SUPABASE_URL)
- [ ] `SUPABASE_SERVICE_ROLE_KEY` (para a API)

## 🔄 Após Adicionar

⚠️ **IMPORTANTE:** Após adicionar/modificar variáveis, faça um **novo deploy**:

1. Vá em **Deployments**
2. Clique nos **3 pontos** (⋯) do último deployment
3. Selecione **Redeploy**
4. Aguarde o deploy concluir

## 🧪 Testar

Após o redeploy, teste criar uma conta admin novamente. Se ainda der erro, verifique os logs do Vercel para ver o erro específico.

