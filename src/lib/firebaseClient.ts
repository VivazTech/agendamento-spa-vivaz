import { initializeApp, getApps } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithRedirect, getRedirectResult, UserCredential } from 'firebase/auth';

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
const provider = new GoogleAuthProvider();
provider.setCustomParameters({ prompt: 'select_account' });

/**
 * Verifica se há resultado de redirect pendente (após redirecionamento do Google)
 * Deve ser chamado quando a página carrega para verificar se o usuário acabou de fazer login
 */
export async function checkRedirectResult(): Promise<{ idToken: string; cred: UserCredential } | null> {
	try {
		console.log('[FirebaseClient] Verificando redirect result...');
		const redirectResult = await getRedirectResult(auth);
		if (redirectResult) {
			console.log('[FirebaseClient] Redirect result encontrado, obtendo idToken...');
			const idToken = await redirectResult.user.getIdToken();
			console.log('[FirebaseClient] idToken obtido com sucesso');
			return { idToken, cred: redirectResult };
		}
		console.log('[FirebaseClient] Nenhum redirect result encontrado');
		return null;
	} catch (error: any) {
		console.error('[FirebaseClient] Erro ao verificar redirect result:', {
			code: error?.code,
			message: error?.message,
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
		await signInWithRedirect(auth, provider);
		// A página será redirecionada, então não retornamos nada
	} catch (error: any) {
		console.error('[FirebaseClient] Erro no signInWithRedirect:', {
			code: error?.code,
			message: error?.message,
		});
		throw error;
	}
}

export { app, auth };


