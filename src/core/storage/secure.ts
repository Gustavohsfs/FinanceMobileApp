/**
 * Armazenamento seguro para tokens e segredos (BRIEF §8.3: tokens NUNCA em
 * AsyncStorage/MMKV). Usa expo-secure-store (Keychain/Keystore).
 *
 * DEFENSIVO por obrigação: no Android, `getItemAsync` LANÇA exceção quando o
 * Keystore não consegue descriptografar (ex.: usuário cadastrou/alterou uma
 * digital e o sistema invalidou as chaves). Se isso vazar no boot, o app abre
 * com tela de erro. Aqui, falha de leitura = valor perdido: apagamos a entrada
 * corrompida e devolvemos null — o usuário volta para o login, nunca para um
 * crash.
 *
 * No web, expo-secure-store não existe; caímos num fallback só-de-dev.
 */
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

const memoryFallback = new Map<string, string>();
const isWeb = Platform.OS === "web";

export const secure = {
  async get(key: string): Promise<string | null> {
    if (isWeb) return memoryFallback.get(key) ?? null;
    try {
      return await SecureStore.getItemAsync(key);
    } catch {
      // valor indecriptável (Keystore invalidado) — remove e segue sem sessão
      try {
        await SecureStore.deleteItemAsync(key);
      } catch {
        // nem apagar deu — ignora; o set seguinte sobrescreve
      }
      return null;
    }
  },
  async set(key: string, value: string): Promise<void> {
    if (isWeb) {
      memoryFallback.set(key, value);
      return;
    }
    try {
      await SecureStore.setItemAsync(key, value);
    } catch {
      // não persiste, mas a sessão em memória continua válida nesta execução
    }
  },
  async delete(key: string): Promise<void> {
    if (isWeb) {
      memoryFallback.delete(key);
      return;
    }
    try {
      await SecureStore.deleteItemAsync(key);
    } catch {
      // ignora — entrada pode nem existir
    }
  },
};

export const SECURE_KEYS = {
  accessToken: "fluxo.access_token",
  refreshToken: "fluxo.refresh_token",
} as const;
