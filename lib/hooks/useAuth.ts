import { useState, useEffect } from 'react';
import { onAuth, type AuthState } from '@/services/google-auth.service';
import { User } from 'firebase/auth';
import * as AuthSession from 'expo-auth-session';

export function useAuth(): AuthState {

  const [state, setState] = useState<AuthState>({ user: null, loading: true });

  useEffect(() => {
    const redirectUri = AuthSession.makeRedirectUri();
    console.log("Default redirect URI:", redirectUri);

    // ✅ useProxy works at runtime — just cast to any to bypass TS
    const proxyRedirectUri = AuthSession.makeRedirectUri({ useProxy: true } as any);
    console.log("Proxy redirect URI:", proxyRedirectUri);
  }, []);


  useEffect(() => {
    const unsubscribe = onAuth((user: User | null) => {
      setState({ user, loading: false });
    });
    return unsubscribe;
  }, []);

  return state;
}