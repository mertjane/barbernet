import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { GoogleAuthProvider, signInWithCredential } from 'firebase/auth';
import { getFirebaseAuth } from '../config/firebase-config';

GoogleSignin.configure({
  webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
  offlineAccess: true,
  scopes: ['profile', 'email'],
}); 

export async function signInWithGoogleNative() {
  await GoogleSignin.hasPlayServices();
  const response = await GoogleSignin.signIn();
  
  // Get idToken from the response
  const idToken = response.data?.idToken;
  
  if (!idToken) {
    throw new Error('No idToken received from Google Sign-In');
  }
  
  const credential = GoogleAuthProvider.credential(idToken);
  const auth = getFirebaseAuth();
  return await signInWithCredential(auth, credential);
}