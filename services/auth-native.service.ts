import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { GoogleAuthProvider, signInWithCredential } from 'firebase/auth';
import { getFirebaseAuth } from '../config/firebase-config';

// Configure Google Sign-In
GoogleSignin.configure({
  webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
  iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
  offlineAccess: true,
  scopes: ['profile', 'email'],
});

export async function signInWithGoogleNative() {
  try {
    console.log('Starting native Google Sign-In');
    console.log('Config:', {
      webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
      iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID
    });
    
    // Check Play Services (Android only)
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
    
    // Sign in
    const response = await GoogleSignin.signIn();
    console.log('Google Sign-In response received:', response);
    
    // Get idToken from the response
    const idToken = response.data?.idToken;
    
    if (!idToken) {
      console.error('No idToken in response:', response);
      throw new Error('No idToken received from Google Sign-In');
    }
    
    console.log('Got idToken, signing in with Firebase');
    
    const credential = GoogleAuthProvider.credential(idToken);
    const auth = getFirebaseAuth();
    const result = await signInWithCredential(auth, credential);
    
    console.log('Firebase sign-in successful');
    return result;
  } catch (error: any) {
    console.error('Native Google Sign-In error:', error);
    
    // Handle specific error codes
    if (error.code === 'SIGN_IN_CANCELLED') {
      throw new Error('Sign in was cancelled');
    } else if (error.code === 'IN_PROGRESS') {
      throw new Error('Sign in already in progress');
    } else if (error.code === 'PLAY_SERVICES_NOT_AVAILABLE') {
      throw new Error('Google Play Services not available');
    }
    
    throw error;
  }
}