# 🔧 Configurar RLS no Supabase para API de Admins

## ⚠️ Problema

A API `/api/auth` está retornando erro 500 porque a tabela `admins` tem RLS (Row Level Security) habilitado, mas não tem políticas para INSERT e UPDATE.

## 📋 Solução

### Opção 1: Adicionar Políticas RLS (Recomendado se usar ANON_KEY)

Se você estiver usando `VITE_SUPABASE_ANON_KEY` na API (não recomendado para produção), execute o script SQL:

1. Acesse o [Supabase Dashboard](https://app.supabase.com)
2. Selecione seu projeto
3. Vá em **SQL Editor**
4. Cole o conteúdo do arquivo `configurar-rls-admins.sql`
5. Execute o script

### Opção 2: Usar SERVICE_ROLE_KEY (Recomendado para Produção)

A melhor prática é usar `SUPABASE_SERVICE_ROLE_KEY` na API, que bypassa o RLS automaticamente.

#### Passo 1: Obter a Service Role Key

1. Acesse o [Supabase Dashboard](https://app.supabase.com)
2. Selecione seu projeto
3. Vá em **Settings** → **API**
4. Copie a **service_role** key (⚠️ NUNCA exponha esta chave no frontend!)

#### Passo 2: Configurar no Vercel

1. Acesse o [Vercel Dashboard](https://vercel.com)
2. Selecione seu projeto
3. Vá em **Settings** → **Environment Variables**
4. Adicione:
   - **Name:** `SUPABASE_SERVICE_ROLE_KEY`
   - **Value:** Cole a service_role key do Supabase
   - **Environment:** Production, Preview, Development
5. Clique em **Save**

#### Passo 3: Verificar Variáveis

Certifique-se de que as seguintes variáveis estão configuradas no Vercel:

- ✅ `SUPABASE_URL` (ou `VITE_SUPABASE_URL`)
- ✅ `SUPABASE_SERVICE_ROLE_KEY` (para a API)

### Opção 3: Desabilitar RLS Temporariamente (NÃO RECOMENDADO)

⚠️ **ATENÇÃO:** Isso reduz a segurança. Use apenas para testes.

```sql
-- Desabilitar RLS na tabela admins
ALTER TABLE public.admins DISABLE ROW LEVEL SECURITY;
```

## 🔍 Verificar Configuração

Após configurar, teste a API:

```bash
curl -X PUT https://spa.vivazcataratas.com.br/api/auth \
  -H "Content-Type: application/json" \
  -d '{
    "username": "teste",
    "password": "teste123",
    "name": "Teste",
    "email": "teste@exemplo.com"
  }'
```

Se retornar JSON com `"ok": true`, está funcionando!

## 📝 Notas Importantes

1. **Service Role Key vs Anon Key:**
   - `SUPABASE_SERVICE_ROLE_KEY`: Bypassa RLS, use apenas no backend
   - `VITE_SUPABASE_ANON_KEY`: Respeita RLS, pode ser exposta no frontend

2. **Segurança:**
   - NUNCA use `SUPABASE_SERVICE_ROLE_KEY` no frontend
   - Sempre use `VITE_SUPABASE_ANON_KEY` no frontend
   - Use `SUPABASE_SERVICE_ROLE_KEY` apenas nas APIs serverless

3. **RLS:**
   - Se usar `SUPABASE_SERVICE_ROLE_KEY`, não precisa configurar políticas RLS
   - Se usar `VITE_SUPABASE_ANON_KEY`, precisa configurar políticas RLS

## 🐛 Troubleshooting

### Erro: "new row violates row-level security policy"
- **Causa:** RLS está habilitado mas não há política para INSERT
- **Solução:** Execute `configurar-rls-admins.sql` ou use `SUPABASE_SERVICE_ROLE_KEY`

### Erro: "permission denied for table admins"
- **Causa:** A chave usada não tem permissão
- **Solução:** Verifique se está usando `SUPABASE_SERVICE_ROLE_KEY` na API

### Erro: "FUNCTION_INVOCATION_FAILED"
- **Causa:** Erro no código da função ou variáveis de ambiente não configuradas
- **Solução:** Verifique os logs do Vercel e as variáveis de ambiente

