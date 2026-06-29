import AsyncStorage from '@react-native-async-storage/async-storage';

const SESSION_KEY = 'eventpass_session';

export async function getSession() {
  try {
    const json = await AsyncStorage.getItem(SESSION_KEY);
    return json ? JSON.parse(json) : null;
  } catch {
    return null;
  }
}

export async function saveSession(session) {
  await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export async function clearSession() {
  await AsyncStorage.removeItem(SESSION_KEY);
}
