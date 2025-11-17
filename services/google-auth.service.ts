import { Alert } from 'react-native';
import Constants from 'expo-constants';

// Check if we're in a development build with native modules
const isDevBuild = Constants.appOwnership !== 'expo';

// Dynamic import to avoid crashes in Expo Go
let GoogleSignin: any = null;
let signInWithGoogleNative: any = null;

if (isDevBuild) {
  try {
    // Only import native module in dev builds
    const nativeModule = require('./auth-native.service');
    signInWithGoogleNative = nativeModule.signInWithGoogleNative;
  } catch (error) {
    console.log('Native Google Sign-In not available');
  }
}

export async function handleGoogleSignIn() {
  if (isDevBuild && signInWithGoogleNative) {
    // Use native sign-in in development builds
    return await signInWithGoogleNative();
  } else {
    // Fallback for Expo Go
    Alert.alert(
      "Not Available in Expo Go",
      "Google Sign-In requires a development build. Please use email/password login or build the app with 'npx expo run:android'."
    );
    throw new Error("Google Sign-In not available in Expo Go");
  }
}

export const isGoogleSignInAvailable = isDevBuild && signInWithGoogleNative !== null;
