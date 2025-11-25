import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { GoogleAuthProvider, signInWithCredential } from 'firebase/auth';
import { getFirebaseAuth } from '../config/firebase-config';

// Don't configure at top level - do it lazily
let isConfigured = false;

function ensureConfigured() {
  if (isConfigured) return;
  
  try {
    GoogleSignin.configure({
      webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
      iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
      offlineAccess: true,
      scopes: ['profile', 'email'],
    });
    isConfigured = true;
    console.log('✅ GoogleSignin configured');
  } catch (error) {
    console.error('❌ GoogleSignin.configure failed:', error);
    throw error;
  }
}

export async function signInWithGoogleNative() {
  try {
    console.log('Starting native Google Sign-In');
    
    // Configure on first use, not at module load
    ensureConfigured();
    
    // Check Play Services
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
    
    // Sign in
    const response = await GoogleSignin.signIn();
    console.log('Google Sign-In response received:', response);
    
    // Get idToken from the response
    const idToken = response.data?.idToken;
    
    if (!idToken) {
      console.error('No idToken in response');
      throw new Error('No idToken received from Google Sign-In');
    }
    
    console.log('Got idToken, signing in with Firebase');
    
    const credential = GoogleAuthProvider.credential(idToken);
    const auth = getFirebaseAuth();
    const result = await signInWithCredential(auth, credential);
    
    console.log('✅ Firebase sign-in successful');
    return result;
  } catch (error: any) {
    console.error('❌ Native Google Sign-In error:', error);
    throw error;
  }
}