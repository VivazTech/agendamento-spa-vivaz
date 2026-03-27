# Configuração do Firebase para Autenticação Google

## ⚠️ IMPORTANTE: Habilitar método Google no Firebase Console

**O erro `auth/operation-not-allowed` significa que o método Google não está habilitado!**

### Passo 1: Habilitar Google como método de autenticação

1. Acesse: https://console.firebase.google.com/
2. Selecione o projeto: `agendamento-spa-vivaz-cat`
3. Vá em **Authentication** → **Sign-in method**
4. Clique em **Google**
5. **Ative o toggle** para habilitar o método Google
6. Configure o **Support email** (pode ser o email do projeto)
7. Clique em **Save**

### Passo 2: Autorizar domínios no Firebase Console

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

## Método de autenticação: Redirect (não popup)

O código agora usa **`signInWithRedirect`** ao invés de popup, o que é mais confiável e funciona melhor em diferentes navegadores.

### Como funciona:

1. Usuário clica em "Entrar com Google"
2. A página inteira é redirecionada para o Google
3. Usuário seleciona a conta e autoriza
4. Google redireciona de volta para a aplicação
5. O código verifica o resultado e processa o login automaticamente

### Vantagens do redirect:

- ✅ Não depende de popups (que podem ser bloqueados)
- ✅ Funciona melhor em dispositivos móveis
- ✅ Mais confiável que popup
- ✅ Não precisa autorizar domínios especiais (apenas o domínio principal)

