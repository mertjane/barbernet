import { Alert, Platform } from 'react-native';
import { User, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { getFirebaseAuth } from '../config/firebase-config';

// Check if we're in a development build with native modules
// const isDevBuild = Constants.appOwnership !== 'expo';
const isWeb = Platform.OS === 'web';

// Dynamic import to avoid crashes in Expo Go
let signInWithGoogleNative: any = null;

if (!isWeb) {
  try {
    // Only import native module in dev builds (not web)
    const nativeModule = require('./auth-native.service');
    signInWithGoogleNative = nativeModule.signInWithGoogleNative;
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
  console.log('Google Sign-In attempt - isWeb:', isWeb, 'hasNative:', !!signInWithGoogleNative);

  // Web: Use Firebase popup
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

  // Native: Use native module in development builds
  if (signInWithGoogleNative) {
    console.log('Using native Google Sign-In');
    return await signInWithGoogleNative();
  }

  // Fallback: Show alert (only in Expo Go)
  console.log('Google Sign-In not available');
  Alert.alert(
    "Not Available in Expo Go",
    "Google Sign-In requires a development build. Please use email/password login or build the app with 'npx expo run:android'."
  );
  throw new Error("Google Sign-In not available in Expo Go");
}

export const isGoogleSignInAvailable = isWeb || signInWithGoogleNative !== null;
