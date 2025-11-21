import Constants from 'expo-constants';
import { initializeApp, getApps, type FirebaseOptions } from 'firebase/app';
import { 
  getAuth, 
  initializeAuth, 
  indexedDBLocalPersistence,
  inMemoryPersistence 
} from 'firebase/auth';
import { Platform } from 'react-native';

const extra = (Constants?.expoConfig as any)?.extra || {};
const fromExtra: Partial<FirebaseOptions> = extra.firebase || {};

const firebaseConfig: FirebaseOptions = {
  apiKey: fromExtra.apiKey || 'YOUR_API_KEY',
  authDomain: fromExtra.authDomain || 'YOUR_AUTH_DOMAIN',
  projectId: fromExtra.projectId || 'YOUR_PROJECT_ID',
  appId: fromExtra.appId || 'YOUR_APP_ID',
  messagingSenderId: (fromExtra as any).messagingSenderId || 'YOUR_MESSAGING_SENDER_ID',
  storageBucket: (fromExtra as any).storageBucket || 'YOUR_STORAGE_BUCKET',
};

let firebaseApp: any;
let firebaseAuthInstance: any;

export function getFirebaseApp() {
  if (!firebaseApp) {
    firebaseApp = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
  }
  return firebaseApp;
}

export function getFirebaseAuth() {
  if (!firebaseAuthInstance) {
    const app = getFirebaseApp();
    try {
      // ✅ Use appropriate persistence based on platform
      const persistence = Platform.OS === 'web' 
        ? indexedDBLocalPersistence 
        : inMemoryPersistence;
        
      firebaseAuthInstance = initializeAuth(app, { persistence });
      console.log("✅ Firebase Auth initialized with persistence");
    } catch (error) {
      console.log("Auth already initialized");
      firebaseAuthInstance = getAuth(app);
    }
  }
  return firebaseAuthInstance;
}