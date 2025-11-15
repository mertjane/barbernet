// Firebase initialization
import Constants from 'expo-constants';
import { initializeApp, getApps, type FirebaseOptions } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const extra = (Constants?.expoConfig as any)?.extra || {};
const fromExtra: Partial<FirebaseOptions> = extra.firebase || {};



const firebaseConfig: FirebaseOptions = {
  apiKey: fromExtra.apiKey || 'YOUR_API_KEY',
  authDomain: fromExtra.authDomain || 'YOUR_AUTH_DOMAIN',
  projectId: fromExtra.projectId || 'YOUR_PROJECT_ID',
  appId: fromExtra.appId || 'YOUR_APP_ID',
  messagingSenderId: (fromExtra as any).messagingSenderId || 'YOUR_MESSAGING_SENDER_ID',
  storageBucket: (fromExtra as any).storageBucket || 'YOUR_STORAGE_BUCKET',
};

export function getFirebaseApp() {
  if (!getApps().length) {
    return initializeApp(firebaseConfig);
  }
  return getApps()[0];
}

export function getFirebaseAuth() {
  const app = getFirebaseApp();
  return getAuth(app);
}