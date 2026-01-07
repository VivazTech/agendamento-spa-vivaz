import { initializeApp, getApps } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithRedirect, getRedirectResult, onAuthStateChanged, setPersistence, browserLocalPersistence, UserCredential } from 'firebase/auth';

const firebaseConfig = {
	apiKey: "AIzaSyDSZoGmC0YHGIorbIM54DCzd2EKzpIvd1w",
	authDomain: "agendamento-spa-vivaz-cat.firebaseapp.com",
	projectId: "agendamento-spa-vivaz-cat",
	storageBucket: "agendamento-spa-vivaz-cat.firebasestorage.app",
	messagingSenderId: "929038939672",
	appId: "1:929038939672:web:58281246f546f0d885b56d"
};

const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
const auth = getAuth(app);

// Configurar persistência para manter o estado após redirect
setPersistence(auth, browserLocalPersistence).catch((error) => {
	console.error('[FirebaseClient] Erro ao configurar persistência:', error);
});

const provider = new GoogleAuthProvider();
provider.setCustomParameters({ prompt: 'select_account' });

// IMPORTANTE: Processar redirect result imediatamente quando o módulo carrega
// Isso garante que o Firebase processe o redirect antes de qualquer outra coisa
let redirectResultPromise: Promise<UserCredential | null> | null = null;

// Função para processar redirect result imediatamente
const processRedirectImmediately = async (): Promise<UserCredential | null> => {
	try {
		console.log('[FirebaseClient] Processando redirect imediatamente ao carregar módulo...');
		const result = await getRedirectResult(auth);
		if (result) {
			console.log('[FirebaseClient] Redirect result encontrado imediatamente!', {
				email: result.user.email,
				uid: result.user.uid,
			});
		} else {
			console.log('[FirebaseClient] Nenhum redirect result encontrado imediatamente');
		}
		return result;
	} catch (error: any) {
		console.error('[FirebaseClient] Erro ao processar redirect imediatamente:', error);
		return null;
	}
};

// Processar imediatamente quando o módulo carrega
redirectResultPromise = processRedirectImmediately();

/**
 * Verifica se há resultado de redirect pendente (após redirecionamento do Google)
 * Deve ser chamado quando a página carrega para verificar se o usuário acabou de fazer login
 */
export async function checkRedirectResult(): Promise<{ idToken: string; cred: UserCredential } | null> {
	try {
		console.log('[FirebaseClient] Verificando redirect result...');
		console.log('[FirebaseClient] URL atual:', window.location.href);
		console.log('[FirebaseClient] Auth instance:', auth);
		console.log('[FirebaseClient] Auth currentUser:', auth.currentUser);
		
		// Verificar se há parâmetros na URL que indicam redirect
		const urlParams = new URLSearchParams(window.location.search);
		const urlHash = window.location.hash;
		const hasAuthParams = urlParams.has('apiKey') || urlHash.includes('auth') || urlHash.includes('access_token');
		console.log('[FirebaseClient] URL tem parâmetros de auth?', hasAuthParams);
		console.log('[FirebaseClient] URL search:', window.location.search);
		console.log('[FirebaseClient] URL hash:', urlHash.substring(0, 200));
		
		// Primeiro, verificar se já processamos o redirect imediatamente
		if (redirectResultPromise) {
			console.log('[FirebaseClient] Verificando resultado do processamento imediato...');
			const immediateResult = await redirectResultPromise;
			if (immediateResult) {
				console.log('[FirebaseClient] Redirect result encontrado do processamento imediato!');
				const idToken = await immediateResult.user.getIdToken();
				return { idToken, cred: immediateResult };
			}
		}
		
		// Se não encontrou no processamento imediato, tentar getRedirectResult novamente
		console.log('[FirebaseClient] Tentando getRedirectResult novamente...');
		const redirectResult = await getRedirectResult(auth);
		console.log('[FirebaseClient] getRedirectResult retornou:', redirectResult ? 'resultado encontrado' : 'null');
		
		if (redirectResult) {
			console.log('[FirebaseClient] Redirect result encontrado!', {
				user: redirectResult.user.email,
				uid: redirectResult.user.uid,
			});
			console.log('[FirebaseClient] Obtendo idToken...');
			const idToken = await redirectResult.user.getIdToken();
			console.log('[FirebaseClient] idToken obtido com sucesso, tamanho:', idToken.length);
			return { idToken, cred: redirectResult };
		}
		
		// Se getRedirectResult não funcionou, verificar currentUser
		console.log('[FirebaseClient] getRedirectResult retornou null, verificando currentUser...');
		if (auth.currentUser) {
			console.log('[FirebaseClient] currentUser encontrado!', {
				email: auth.currentUser.email,
				uid: auth.currentUser.uid,
			});
			const idToken = await auth.currentUser.getIdToken();
			console.log('[FirebaseClient] idToken obtido do currentUser, tamanho:', idToken.length);
			// Criar um UserCredential simulado
			return { 
				idToken, 
				cred: {
					user: auth.currentUser,
					providerId: 'google.com',
					operationType: 'signIn'
				} as UserCredential
			};
		}
		
		console.log('[FirebaseClient] Nenhum redirect result encontrado e nenhum currentUser');
		return null;
	} catch (error: any) {
		console.error('[FirebaseClient] Erro ao verificar redirect result:', {
			code: error?.code,
			message: error?.message,
			stack: error?.stack,
		});
		return null;
	}
}

/**
 * Inicia o processo de autenticação com Google usando redirect
 * Redireciona a página para o Google, que depois redireciona de volta
 */
export async function signInWithGoogleRedirect(): Promise<void> {
	try {
		console.log('[FirebaseClient] Iniciando signInWithRedirect...');
		console.log('[FirebaseClient] URL atual antes do redirect:', window.location.href);
		console.log('[FirebaseClient] Auth instance:', auth);
		console.log('[FirebaseClient] Provider:', provider);
		
		await signInWithRedirect(auth, provider);
		// A página será redirecionada, então não retornamos nada
		console.log('[FirebaseClient] signInWithRedirect chamado, aguardando redirect...');
	} catch (error: any) {
		console.error('[FirebaseClient] Erro no signInWithRedirect:', {
			code: error?.code,
			message: error?.message,
			stack: error?.stack,
		});
		throw error;
	}
}

/**
 * Observa mudanças no estado de autenticação do Firebase
 * Útil para detectar quando o usuário faz login via redirect
 */
export function onAuthStateChange(callback: (user: any) => void): () => void {
	return onAuthStateChanged(auth, (user) => {
		console.log('[FirebaseClient] Auth state changed:', user ? `User: ${user.email}` : 'No user');
		callback(user);
	});
}

export { app, auth };


