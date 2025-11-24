import { Alert, Platform } from 'react-native';
import { User, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { getFirebaseAuth } from '../config/firebase-config';

// Import native sign-in directly (not conditionally)
import { signInWithGoogleNative } from '@/services/auth-native.service';

const isWeb = Platform.OS === 'web';

export type AuthState = {
  user: User | null;
  loading: boolean;
};

export function onAuth(callback: (user: User | null) => void) {
  const auth = getFirebaseAuth();
  return auth.onAuthStateChanged(callback);
}

export async function handleGoogleSignIn() {
  console.log('Google Sign-In attempt - Platform:', Platform.OS);
  
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
  
  /** ---- NATIVE (iOS/Android) ---- **/
  try {
    console.log('Using native Google Sign-In');
    return await signInWithGoogleNative();
  } catch (error: any) {
    console.error('Native Google Sign-In error:', error);
    
    // Only show Expo Go message if it's actually an Expo Go issue
    if (error.message?.includes('Expo Go')) {
      Alert.alert(
        "Not Available in Expo Go",
        "Google Sign-In requires a development build. Please use email/password login."
      );
    } else {
      // Show actual error for production builds
      Alert.alert(
        "Sign In Error",
        error.message || "Failed to sign in with Google. Please try again."
      );
    }
    throw error;
  }
}

export const isGoogleSignInAvailable = true; // Always available in production builds