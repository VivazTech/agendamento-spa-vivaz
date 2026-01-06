import { initializeApp, getApps } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, UserCredential } from 'firebase/auth';

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
	const cred = await signInWithPopup(auth, provider);
	const idToken = await cred.user.getIdToken();
	return { idToken, cred };
}

export { app, auth };


