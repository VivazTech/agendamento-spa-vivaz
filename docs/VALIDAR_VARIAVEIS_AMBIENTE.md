# Validação de Variáveis de Ambiente

## ✅ Status Atual

### Frontend (Código React/TypeScript)
- ✅ **CORRETO**: Usa `import.meta.env.VITE_SUPABASE_URL`
- ✅ **CORRETO**: Usa `import.meta.env.VITE_SUPABASE_ANON_KEY`
- ✅ **Arquivos verificados:**
  - `src/lib/supabaseClient.ts` - ✅ Usa `import.meta.env`
  - `src/lib/testSupabaseConnection.ts` - ✅ Usa `import.meta.env`
  - `components/TestSupabaseConnection.tsx` - ✅ Usa `import.meta.env`

### Backend (API Routes - Vercel Serverless Functions)
- ✅ **CORRETO**: Usa `process.env.*` (correto para Node.js/server)
- ✅ **Arquivos verificados:**
  - `api/*.ts` - ✅ Usa `process.env` (correto para servidor)

## 📋 Checklist de Configuração

### 1. Arquivo .env (Local)
- [ ] Copie `.env.example` para `.env`
- [ ] Preencha `VITE_SUPABASE_URL` com a URL do seu projeto Supabase
- [ ] Preencha `VITE_SUPABASE_ANON_KEY` com a chave anon do Supabase

### 2. Variáveis no Vercel (Produção)
- [ ] `VITE_SUPABASE_URL` configurada
- [ ] `VITE_SUPABASE_ANON_KEY` configurada
- [ ] Variáveis marcadas para Production, Preview e Development

### 3. Como Obter as Credenciais

1. Acesse: https://app.supabase.com
2. Selecione seu projeto
3. Vá em **Settings** → **API**
4. Copie:
   - **Project URL** → `VITE_SUPABASE_URL`
   - **anon public** key → `VITE_SUPABASE_ANON_KEY`

## 🔍 Verificação

### Testar Localmente
```bash
# 1. Crie o arquivo .env com as variáveis
# 2. Execute o projeto
npm run dev

# 3. Acesse: http://localhost:3000/supabase-test
# Deve mostrar as variáveis como definidas
```

### Testar em Produção
1. Acesse: `https://seu-dominio.vercel.app/supabase-test`
2. Verifique se as variáveis aparecem como definidas
3. Teste a conexão com o Supabase

## ⚠️ Importante

- **Frontend**: Use `import.meta.env.VITE_*` (Vite)
- **Backend**: Use `process.env.*` (Node.js)
- **Nunca** use `process.env` no código frontend React/TypeScript
- Variáveis com prefixo `VITE_` são expostas ao frontend no build
- Não coloque chaves secretas (service_role) em variáveis `VITE_*`

