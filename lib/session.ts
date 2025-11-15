// Lightweight session persistence with optional expo-secure-store
// Works even if the module is not yet installed (no-ops), but persistence
// will be enabled once expo-secure-store is added.

const KEY = 'app.hasEntered';

type SecureStoreModule = {
  setItemAsync: (k: string, v: string) => Promise<void>;
  getItemAsync: (k: string) => Promise<string | null>;
  deleteItemAsync: (k: string) => Promise<void>;
};

async function getSecureStore(): Promise<SecureStoreModule | null> {
  try {
    const mod = await import('expo-secure-store');
    return (mod as unknown) as SecureStoreModule;
  } catch {
    return null;
  }
}

export async function markEntered() {
  const s = await getSecureStore();
  if (!s) return;
  await s.setItemAsync(KEY, '1');
}

export async function clearEntered() {
  const s = await getSecureStore();
  if (!s) return;
  await s.deleteItemAsync(KEY);
}

export async function hasEntered(): Promise<boolean> {
  const s = await getSecureStore();
  if (!s) return false;
  const v = await s.getItemAsync(KEY);
  return v === '1';
}
