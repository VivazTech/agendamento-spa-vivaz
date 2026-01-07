# Configuração de Redirect URIs para Firebase Google Auth

## ⚠️ IMPORTANTE: Configurar em DOIS lugares

O redirect URI precisa estar configurado em **DOIS lugares**:
1. **Firebase Console** (Authorized domains)
2. **Google Cloud Console** (OAuth 2.0 Client IDs)

---

## 1. Firebase Console - Authorized Domains

### Passo a passo:

1. Acesse: https://console.firebase.google.com/
2. Selecione o projeto: `agendamento-spa-vivaz-cat`
3. Vá em **Authentication** → **Settings** → **Authorized domains**
4. Verifique se os seguintes domínios estão na lista:
   - `localhost` (para desenvolvimento)
   - `spa.vivazcataratas.com.br` (seu domínio de produção)
   - O domínio do Vercel (ex: `agendamento-spa-vivaz.vercel.app`)

5. Se não estiver, clique em **Add domain** e adicione:
   - `spa.vivazcataratas.com.br`

---

## 2. Google Cloud Console - OAuth 2.0 Client IDs

### Passo a passo:

1. Acesse: https://console.cloud.google.com/
2. Selecione o projeto: `agendamento-spa-vivaz-cat` (ou o projeto associado ao Firebase)
3. Vá em **APIs & Services** → **Credentials**
4. Procure por **OAuth 2.0 Client IDs**
5. Encontre o client ID que corresponde ao seu app web Firebase:
   - O client ID deve ser: `929038939672-rhp0944t69idk0lci8acnrhf46vq4ahm.apps.googleusercontent.com`
   - (Este é o `client_id` que aparece na URL do Google após o redirect)

6. Clique no client ID para editar
7. Na seção **Authorized redirect URIs**, adicione os seguintes URIs:

```
https://spa.vivazcataratas.com.br/__/auth/handler
https://agendamento-spa-vivaz-cat.firebaseapp.com/__/auth/handler
```

⚠️ **IMPORTANTE:** 
- Use **DOIS underscores** (`__`) e não um (`_`)
- **NÃO** adicione `/admin/` no caminho - o Firebase usa o mesmo handler para todo o domínio
- O formato correto é: `https://[DOMINIO]/__/auth/handler` (com dois underscores)

❌ **ERRADO:**
```
https://spa.vivazcataratas.com.br/_/auth/handler  (um underscore)
https://spa.vivazcataratas.com.br/admin/__/auth/handler  (com /admin/)
```

✅ **CORRETO:**
```
https://spa.vivazcataratas.com.br/__/auth/handler  (dois underscores, sem /admin/)
```

8. Na seção **Authorized JavaScript origins**, adicione:

```
https://spa.vivazcataratas.com.br
https://agendamento-spa-vivaz-cat.firebaseapp.com
```

9. Clique em **Save**

---

## 3. Verificar configuração do Firebase App

### Passo a passo:

1. No Firebase Console, vá em **Project Settings** → **General**
2. Na seção **Your apps**, encontre o app web
3. Verifique se o **App ID** está correto: `1:929038939672:web:58281246f546f0d885b56d`
4. Verifique se o **authDomain** está correto: `agendamento-spa-vivaz-cat.firebaseapp.com`

---

## 4. Formato correto dos Redirect URIs

O Firebase usa um formato específico para redirect URIs. O formato padrão é:

```
https://[SEU-DOMINIO]/__/auth/handler
```

⚠️ **CRÍTICO:** Use **DOIS underscores** (`__`) e não um (`_`)

Para o seu caso, deve ser:

```
https://spa.vivazcataratas.com.br/__/auth/handler
```

**IMPORTANTE:** 
- O Firebase adiciona automaticamente `/__/auth/handler` ao final do domínio autorizado
- Você NÃO precisa adicionar isso manualmente no Firebase Console (Authorized domains)
- Mas você PRECISA adicionar no Google Cloud Console (OAuth 2.0 Client IDs)
- **NÃO** adicione `/admin/` ou outros caminhos - o Firebase usa o mesmo handler para todo o domínio
- Use **DOIS underscores** (`__`) e não um (`_`)

---

## 5. Verificar se está funcionando

Após configurar, teste o login e verifique:

1. **No console do navegador**, após o redirect do Google, a URL deve conter parâmetros como:
   - `?apiKey=...`
   - `#auth=...`
   - Ou outros parâmetros de autenticação

2. **Se a URL voltar limpa** (sem parâmetros), significa que:
   - O redirect URI não está configurado corretamente no Google Cloud Console
   - OU o domínio não está autorizado no Firebase Console

---

## 6. Troubleshooting

### Problema: URL volta limpa sem parâmetros de auth

**Solução:**
1. Verifique se o domínio está em **Authorized domains** no Firebase Console
2. Verifique se o redirect URI está em **Authorized redirect URIs** no Google Cloud Console
3. O formato deve ser: `https://spa.vivazcataratas.com.br/__/auth/handler`

### Problema: Erro "redirect_uri_mismatch"

**Solução:**
1. Verifique se o redirect URI no Google Cloud Console está EXATAMENTE igual ao que o Firebase está usando
2. O Firebase usa: `https://[DOMINIO]/__/auth/handler`
3. Certifique-se de que não há espaços ou caracteres extras

### Problema: Erro "unauthorized_domain"

**Solução:**
1. Adicione o domínio em **Authorized domains** no Firebase Console
2. Aguarde alguns minutos para a mudança propagar
3. Limpe o cache do navegador e tente novamente

---

## 7. Exemplo de configuração completa

### Firebase Console - Authorized domains:
```
localhost
spa.vivazcataratas.com.br
agendamento-spa-vivaz.vercel.app
```

### Google Cloud Console - Authorized redirect URIs:
```
https://spa.vivazcataratas.com.br/__/auth/handler
https://agendamento-spa-vivaz-cat.firebaseapp.com/__/auth/handler
http://localhost:5173/__/auth/handler
```

⚠️ **ATENÇÃO:** Use **DOIS underscores** (`__`) e não um (`_`)

### Google Cloud Console - Authorized JavaScript origins:
```
https://spa.vivazcataratas.com.br
https://agendamento-spa-vivaz-cat.firebaseapp.com
http://localhost:5173
```

---

## 8. Referências

- [Firebase Auth - Domains](https://firebase.google.com/docs/auth/web/custom-domain)
- [Google OAuth 2.0 - Redirect URIs](https://developers.google.com/identity/protocols/oauth2/web-server#uri-validation)
- [Firebase Auth - Redirect](https://firebase.google.com/docs/auth/web/redirect-best-practices)

