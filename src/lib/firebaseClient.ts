import { initializeApp, getApps } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signInWithRedirect, getRedirectResult, UserCredential } from 'firebase/auth';

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

export async function signInWithGoogleAndGetIdToken(): Promise<{ idToken: string; cred: UserCredential }> {
	try {
		console.log('[FirebaseClient] Verificando redirect result...');
		// Verificar se há resultado de redirect pendente
		const redirectResult = await getRedirectResult(auth);
		if (redirectResult) {
			console.log('[FirebaseClient] Redirect result encontrado');
			const idToken = await redirectResult.user.getIdToken();
			return { idToken, cred: redirectResult };
		}

		console.log('[FirebaseClient] Iniciando signInWithPopup...');
		const cred = await signInWithPopup(auth, provider);
		console.log('[FirebaseClient] Popup concluído, obtendo idToken...');
		const idToken = await cred.user.getIdToken();
		console.log('[FirebaseClient] idToken obtido com sucesso');
		return { idToken, cred };
	} catch (error: any) {
		console.error('[FirebaseClient] Erro no signInWithPopup:', {
			code: error?.code,
			message: error?.message,
			email: error?.email,
			credential: error?.credential,
		});
		
		// Se o popup foi bloqueado ou fechado, tentar redirect
		if (error?.code === 'auth/popup-blocked' || error?.code === 'auth/popup-closed-by-user') {
			console.log('[FirebaseClient] Popup bloqueado/fechado, tentando redirect...');
			await signInWithRedirect(auth, provider);
			// O redirect vai redirecionar a página, então não retornamos nada aqui
			throw new Error('Redirecionando para autenticação...');
		}
		
		throw error;
	}
}

export { app, auth };


