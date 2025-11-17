import { Alert, Platform } from 'react-native';
import Constants from 'expo-constants';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { getFirebaseAuth } from '../config/firebase-config';

// Check if we're in a development build with native modules
const isDevBuild = Constants.appOwnership !== 'expo';
const isWeb = Platform.OS === 'web';

// Dynamic import to avoid crashes in Expo Go
let signInWithGoogleNative: any = null;

if (isDevBuild && !isWeb) {
  try {
    // Only import native module in dev builds (not web)
    const nativeModule = require('./auth-native.service');
    signInWithGoogleNative = nativeModule.signInWithGoogleNative;
  } catch (error) {
    console.log('Native Google Sign-In not available');
  }
}

export async function handleGoogleSignIn() {
  // ✅ Web: Use Firebase popup
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
  
  // ✅ Native: Use native module in development builds
  if (isDevBuild && signInWithGoogleNative) {
    return await signInWithGoogleNative();
  }
  
  // ✅ Expo Go: Show alert
  Alert.alert(
    "Not Available in Expo Go",
    "Google Sign-In requires a development build. Please use email/password login or build the app with 'npx expo run:android'."
  );
  throw new Error("Google Sign-In not available in Expo Go");
}

export const isGoogleSignInAvailable = isWeb || (isDevBuild && signInWithGoogleNative !== null);
