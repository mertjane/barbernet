// services/auth.service.ts
import { getFirebaseAuth } from '../config/firebase-config';
import { 
  onAuthStateChanged, 
  GoogleAuthProvider, 
  signInWithCredential, 
  signOut as fbSignOut, 
  User 
} from 'firebase/auth';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';

WebBrowser.maybeCompleteAuthSession();

export type AuthState = { user: User | null; loading: boolean };

// Hook to create a Google auth request
export function useGoogleRequest() {
  const [request, response, promptAsync] = Google.useAuthRequest({
    iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
    androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
  });

  return { request, response, promptAsync };
}

export async function signInWithGoogleResponse(response: any) {
  const auth = getFirebaseAuth();
  const idToken = response?.authentication?.idToken;
  
  if (!idToken) {
    throw new Error('Google sign-in failed: missing idToken');
  }
  
  const credential = GoogleAuthProvider.credential(idToken);
  return await signInWithCredential(auth, credential);
}

export function onAuth(cb: (u: User | null) => void) {
  const auth = getFirebaseAuth();
  return onAuthStateChanged(auth, cb);
}

export async function signOut() {
  const auth = getFirebaseAuth();
  await fbSignOut(auth);
}

export function isFirstSession(u: User | null) {
  if (!u) return false;
  const c = u.metadata.creationTime;
  const l = u.metadata.lastSignInTime;
  return !!c && !!l && c === l;
}