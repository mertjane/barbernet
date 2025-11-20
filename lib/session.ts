import * as SecureStore from 'expo-secure-store';

const KEY = 'app.hasEntered';

type SecureStoreModule = {
  setItemAsync: (k: string, v: string) => Promise<void>;
  getItemAsync: (k: string) => Promise<string | null>;
  deleteItemAsync: (k: string) => Promise<void>;
};

function getSecureStore(): SecureStoreModule | null {
  try {
    return SecureStore as SecureStoreModule;
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
