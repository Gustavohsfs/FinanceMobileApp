/**
 * Armazenamento seguro para tokens e segredos (BRIEF §8.3: tokens NUNCA em
 * AsyncStorage/MMKV). Usa expo-secure-store (Keychain/Keystore).
 *
 * No web, expo-secure-store não existe; caímos num fallback só-de-dev para o
 * app não quebrar ao rodar `expo start --web`. Em produção mobile isso não roda.
 */
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

const memoryFallback = new Map<string, string>();
const isWeb = Platform.OS === "web";

export const secure = {
  async get(key: string): Promise<string | null> {
    if (isWeb) return memoryFallback.get(key) ?? null;
    return SecureStore.getItemAsync(key);
  },
  async set(key: string, value: string): Promise<void> {
    if (isWeb) {
      memoryFallback.set(key, value);
      return;
    }
    await SecureStore.setItemAsync(key, value);
  },
  async delete(key: string): Promise<void> {
    if (isWeb) {
      memoryFallback.delete(key);
      return;
    }
    await SecureStore.deleteItemAsync(key);
  },
};

export const SECURE_KEYS = {
  accessToken: "fluxo.access_token",
  refreshToken: "fluxo.refresh_token",
} as const;
