# 🔧 Como Configurar Variáveis de Ambiente no Vercel

## ⚠️ Problema
As variáveis `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` não estão configuradas.

## 📋 Passo a Passo

### 1️⃣ Obter as Credenciais do Supabase

1. Acesse: https://app.supabase.com
2. Selecione seu projeto (ou crie um novo)
3. Vá em **Settings** (⚙️) → **API**
4. Você verá:
   - **Project URL** → Copie este valor
   - **anon public** key → Copie este valor

### 2️⃣ Configurar no Vercel

1. Acesse: https://vercel.com
2. Faça login e selecione seu projeto
3. Vá em **Settings** → **Environment Variables**
4. Adicione as seguintes variáveis:

#### Variável 1: VITE_SUPABASE_URL
- **Name:** `VITE_SUPABASE_URL`
- **Value:** Cole o **Project URL** do Supabase (ex: `https://xxxxx.supabase.co`)
- **Environment:** Selecione todas (Production, Preview, Development)
- Clique em **Save**

#### Variável 2: VITE_SUPABASE_ANON_KEY
- **Name:** `VITE_SUPABASE_ANON_KEY`
- **Value:** Cole a **anon public** key do Supabase
- **Environment:** Selecione todas (Production, Preview, Development)
- Clique em **Save**

### 3️⃣ Fazer Novo Deploy

⚠️ **IMPORTANTE:** Após adicionar as variáveis, você DEVE fazer um novo deploy!

**Opção A - Deploy Automático:**
- Faça um commit e push para o repositório conectado ao Vercel
- O Vercel fará deploy automaticamente

**Opção B - Redeploy Manual:**
1. Vá em **Deployments**
2. Clique nos **3 pontos** (⋯) do último deployment
3. Selecione **Redeploy**
4. Aguarde o deploy concluir

### 4️⃣ Verificar se Funcionou

1. Após o deploy, acesse: `https://seu-dominio.vercel.app/supabase-test`
2. As variáveis devem aparecer como **✓ Definidas**
3. O teste de conexão deve ser executado automaticamente

---

## 🔍 Verificação Rápida

### No Supabase:
- ✅ Projeto criado
- ✅ Settings → API acessado
- ✅ Project URL copiado
- ✅ anon public key copiada

### No Vercel:
- ✅ Settings → Environment Variables acessado
- ✅ `VITE_SUPABASE_URL` adicionada
- ✅ `VITE_SUPABASE_ANON_KEY` adicionada
- ✅ Ambos marcados para Production, Preview e Development
- ✅ Novo deploy realizado

---

## 🆘 Problemas Comuns

### "Ainda mostra como não definida"
- ✅ Verifique se fez um **novo deploy** após adicionar as variáveis
- ✅ Confirme que o nome está exatamente: `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`
- ✅ Verifique se não há espaços extras no nome ou valor

### "Erro de conexão após configurar"
- ✅ Verifique se o Project URL está correto (deve começar com `https://`)
- ✅ Verifique se a anon key está completa (é uma string longa)
- ✅ Confirme que o projeto Supabase está ativo

### "Funciona localmente mas não no Vercel"
- ✅ Variáveis com `VITE_` são para o frontend (build time)
- ✅ Certifique-se de que as variáveis estão marcadas para **Production**
- ✅ Faça um novo deploy após qualquer alteração

---

## 📝 Exemplo de Valores

**VITE_SUPABASE_URL:**
```
https://abcdefghijklmnop.supabase.co
```

**VITE_SUPABASE_ANON_KEY:**
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprbG1ub3AiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTYzODk2NzI4MCwiZXhwIjoxOTU0NTQzMjgwfQ.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

⚠️ **NÃO compartilhe suas chaves publicamente!**

---

## ✅ Checklist Final

- [ ] Credenciais do Supabase obtidas
- [ ] `VITE_SUPABASE_URL` adicionada no Vercel
- [ ] `VITE_SUPABASE_ANON_KEY` adicionada no Vercel
- [ ] Variáveis marcadas para todos os ambientes
- [ ] Novo deploy realizado
- [ ] Teste em `/supabase-test` funcionando

---

## 🎯 Próximos Passos

Após configurar as variáveis de ambiente do frontend, você também precisará configurar as variáveis do backend (API Routes):

- `SUPABASE_URL` (mesmo valor de `VITE_SUPABASE_URL`)
- `SUPABASE_SERVICE_ROLE_KEY` (chave diferente, mais segura - pegue em Settings → API → service_role)

Essas são usadas pelas rotas da API (`/api/*`) e são mais seguras pois não são expostas no frontend.

