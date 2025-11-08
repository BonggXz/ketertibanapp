import { initializeApp, getApp, getApps } from 'firebase/app';
import {
  getAuth,
  signInAnonymously,
  signInWithCustomToken,
  browserLocalPersistence,
  setPersistence
} from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const appId = globalThis.__app_id;
const firebaseConfig = globalThis.__firebase_config;
const initialAuthToken = globalThis.__initial_auth_token;

if (!appId || !firebaseConfig) {
  throw new Error('Firebase environment variables are missing.');
}

const app = getApps().length ? getApp() : initializeApp(firebaseConfig, appId);
const auth = getAuth(app);
setPersistence(auth, browserLocalPersistence).catch((error) => {
  console.warn('Unable to set auth persistence:', error);
});
const db = getFirestore(app);

export const ensureInitialAuth = (async () => {
  if (auth.currentUser) return;
  if (initialAuthToken) {
    try {
      await signInWithCustomToken(auth, initialAuthToken);
      return;
    } catch (error) {
      console.warn('Custom token sign-in failed, falling back to anonymous auth.', error);
    }
  }
  try {
    await signInAnonymously(auth);
  } catch (error) {
    console.error('Anonymous authentication failed.', error);
  }
})();

export { app, auth, db, appId };
