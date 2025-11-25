import { Alert, Platform } from 'react-native';
import { User, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { getFirebaseAuth } from '../config/firebase-config';

// Default: no native method available
let nativeGoogleSignIn: null | (() => Promise<any>) = null;

const isWeb = Platform.OS === 'web';

// Load native module only when not running on web
if (!isWeb) {
  try {
    const nativeModule = require('./auth-native.service');
    nativeGoogleSignIn = nativeModule.signInWithGoogleNative;
    console.log('Native Google Sign-In module loaded');
  } catch (error) {
    console.log('Native Google Sign-In not available');
  }
}

export type AuthState = {
  user: User | null;
  loading: boolean;
};

export function onAuth(callback: (user: User | null) => void) {
  const auth = getFirebaseAuth();
  return auth.onAuthStateChanged(callback);
}

export async function handleGoogleSignIn() {
  console.log('Google Sign-In attempt - isWeb:', isWeb, 'hasNative:', !!nativeGoogleSignIn);

  /** ---- WEB (Firebase popup) ---- **/
  if (isWeb) {
    try {
      const auth = getFirebaseAuth();
      const provider = new GoogleAuthProvider();
      provider.addScope('profile');
      provider.addScope('email');

      const result = await signInWithPopup(auth, provider);
      return result;
    } catch (error: any) {
      console.error('Web Google Sign-In error:', error);
      throw error;
    }
  }

  /** ---- NATIVE DEV BUILD (Native Google Auth) ---- **/
  if (nativeGoogleSignIn) {
    console.log('Using native Google Sign-In');
    return await nativeGoogleSignIn();
  }

  /** ---- EXPO GO FALLBACK ---- **/
  console.log('Google Sign-In not available');
  Alert.alert(
    "Not Available in Expo Go",
    "Google Sign-In requires a development build. Please use email/password login or build the app with 'npx expo run:android'."
  );

  throw new Error("Google Sign-In not available in Expo Go");
}

export const isGoogleSignInAvailable = isWeb || nativeGoogleSignIn !== null;
