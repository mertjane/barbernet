import * as SecureStore from 'expo-secure-store';

const SESSION_KEY = 'app.hasEntered';
const USER_ID_KEY = 'app.userId';

export async function markEntered(userId?: string): Promise<void> {
  try {
    await SecureStore.setItemAsync(SESSION_KEY, '1');
    if (userId) {
      await SecureStore.setItemAsync(USER_ID_KEY, userId);
    }
    console.log("✅ Session marked as entered", userId ? `with user ${userId}` : '');
  } catch (error) {
    console.error("Error marking session:", error);
  }
}

export async function clearEntered(): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(SESSION_KEY);
    await SecureStore.deleteItemAsync(USER_ID_KEY);
    console.log("🗑️ Session cleared");
  } catch (error) {
    console.error("Error clearing session:", error);
  }
}

export async function hasEntered(): Promise<boolean> {
  try {
    const value = await SecureStore.getItemAsync(SESSION_KEY);
    console.log("📱 Session check - value:", value);
    return value === '1';
  } catch (error) {
    console.error("Error checking session:", error);
    return false;
  }
}

export async function getStoredUserId(): Promise<string | null> {
  try {
    const userId = await SecureStore.getItemAsync(USER_ID_KEY);
    console.log("🔑 Stored user ID:", userId);
    return userId;
  } catch (error) {
    console.error("Error getting stored user ID:", error);
    return null;
  }
}