# Configuração do Firebase para Autenticação Google

## Problema: Popup fecha imediatamente

Se o popup do Google abre e fecha imediatamente, geralmente é porque:

1. **Domínio não autorizado no Firebase Console**
2. **Configuração incorreta do authDomain**
3. **Popup bloqueado pelo navegador**

## Solução: Autorizar domínios no Firebase Console

### Passo 1: Acessar Firebase Console
1. Acesse: https://console.firebase.google.com/
2. Selecione o projeto: `agendamento-spa-vivaz-cat`

### Passo 2: Configurar domínios autorizados
1. Vá em **Authentication** → **Settings** → **Authorized domains**
2. Adicione os seguintes domínios:
   - `localhost` (já deve estar)
   - `spa.vivazcataratas.com.br` (seu domínio de produção)
   - O domínio do Vercel (ex: `agendamento-spa-vivaz.vercel.app`)

### Passo 3: Verificar configuração do app
1. Vá em **Project Settings** → **General**
2. Na seção **Your apps**, verifique se o app web está configurado corretamente
3. Verifique se o `authDomain` está correto: `agendamento-spa-vivaz-cat.firebaseapp.com`

## Verificar logs no console do navegador

Após o deploy, abra o console do navegador (F12) e verifique os logs:

- `[FirebaseClient] Iniciando signInWithPopup...` - Popup iniciado
- `[FirebaseClient] Popup concluído...` - Popup concluído com sucesso
- `[FirebaseClient] Erro no signInWithPopup:` - Erro específico

### Erros comuns:

- **`auth/unauthorized-domain`**: Domínio não autorizado no Firebase Console
- **`auth/popup-blocked`**: Popup bloqueado pelo navegador
- **`auth/popup-closed-by-user`**: Usuário fechou o popup

## Verificar variáveis de ambiente no Vercel

Certifique-se de que as seguintes variáveis estão configuradas no Vercel:

- `FIREBASE_PROJECT_ID`: `agendamento-spa-vivaz-cat`
- `FIREBASE_CLIENT_EMAIL`: Email da service account
- `FIREBASE_PRIVATE_KEY`: Chave privada da service account (com `\n` escapados)
- `SUPABASE_URL`: URL do Supabase
- `SUPABASE_SERVICE_ROLE_KEY`: Chave service role do Supabase

## Testar localmente

Para testar localmente, certifique-se de que:
1. O domínio `localhost` está autorizado no Firebase Console
2. As variáveis de ambiente estão configuradas no arquivo `.env.local`

## Solução alternativa: Usar redirect ao invés de popup

Se o popup continuar falhando, o código já tem fallback para usar `signInWithRedirect`, que redireciona a página inteira ao invés de abrir um popup.

