import { Platform } from 'react-native';

// Expo web runs in your desktop browser, so it can call the Next.js API on localhost.
const WEB_API_BASE_URL = 'http://localhost:3000';

// Expo Go on a physical phone can't reach localhost. Use your computer's LAN IP.
// Your current Metro URL is exp://192.168.168.153:8081, so the matching API host is:
const NATIVE_API_BASE_URL = 'http://192.168.168.153:3000';

export const API_BASE_URL = Platform.OS === 'web' ? WEB_API_BASE_URL : NATIVE_API_BASE_URL;
