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
import { Platform } from 'react-native';

WebBrowser.maybeCompleteAuthSession();

export type AuthState = { user: User | null; loading: boolean };

// Hook to create a Google auth request
export function useGoogleRequest() {
  const config = {
    expoClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID, // For Expo Go
    iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
    androidClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
  };

  console.log('Google Auth Config:', {
    platform: Platform.OS,
    iosClientId: config.iosClientId?.substring(0, 20) + '...',
    androidClientId: config.androidClientId?.substring(0, 20) + '...',
    webClientId: config.webClientId?.substring(0, 20) + '...',
  });

  const [request, response, promptAsync] = Google.useAuthRequest(config);

  return { request, response, promptAsync };
}

export async function signInWithGoogleResponse(response: any) {
  const auth = getFirebaseAuth();
  
  console.log('Google Response Type:', response?.type);
  console.log('Google Response:', JSON.stringify(response, null, 2));
  
  const idToken = response?.authentication?.idToken;
  const accessToken = response?.authentication?.accessToken;
  
  if (!idToken) {
    throw new Error('Google sign-in failed: missing idToken');
  }
  
  // Create credential with both idToken and accessToken for better compatibility
  const credential = GoogleAuthProvider.credential(idToken, accessToken);
  
  console.log('Attempting to sign in with Firebase...');
  const result = await signInWithCredential(auth, credential);
  console.log('Firebase sign-in successful!');
  
  return result;
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