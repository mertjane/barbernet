import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { GoogleAuthProvider, signInWithCredential } from 'firebase/auth';
import { getFirebaseAuth } from '../config/firebase-config';

GoogleSignin.configure({
  webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
  iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
  offlineAccess: true,
  scopes: ['profile', 'email'],
});

export async function signInWithGoogleNative() {
  console.log('Starting native Google Sign-In');

  await GoogleSignin.hasPlayServices();
  const response = await GoogleSignin.signIn();

  console.log('Google Sign-In response received');

  // Get idToken from the response
  const idToken = response.data?.idToken;

  if (!idToken) {
    throw new Error('No idToken received from Google Sign-In');
  }


  console.log('Got idToken, signing in with Firebase');

  
  const credential = GoogleAuthProvider.credential(idToken);
  const auth = getFirebaseAuth();
  return await signInWithCredential(auth, credential);
}