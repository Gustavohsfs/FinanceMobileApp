/**
 * Key-value store para cache, preferências e persistência local.
 *
 * NOTA DE ARQUITETURA: o BRIEF §2.2 pede react-native-mmkv. MMKV é um módulo
 * nativo que NÃO roda no Expo Go (exige development build). Para manter o app
 * testável via QR code sem toolchain nativa, usamos AsyncStorage por trás desta
 * MESMA interface. Trocar para MMKV depois é só reescrever este arquivo —
 * nenhum consumidor muda. Tokens/segredos NUNCA passam por aqui (ver secure.ts,
 * guardrail §8.3).
 */
import AsyncStorage from "@react-native-async-storage/async-storage";

export interface KVStore {
  getString(key: string): Promise<string | null>;
  set(key: string, value: string): Promise<void>;
  delete(key: string): Promise<void>;
  getJSON<T>(key: string): Promise<T | null>;
  setJSON<T>(key: string, value: T): Promise<void>;
}

export const kv: KVStore = {
  async getString(key) {
    return AsyncStorage.getItem(key);
  },
  async set(key, value) {
    await AsyncStorage.setItem(key, value);
  },
  async delete(key) {
    await AsyncStorage.removeItem(key);
  },
  async getJSON<T>(key: string): Promise<T | null> {
    const raw = await AsyncStorage.getItem(key);
    if (raw === null) return null;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  },
  async setJSON<T>(key: string, value: T): Promise<void> {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  },
};

/** Limpa todo o KV (usado no logout, junto com o cache do React Query). */
export async function clearKV(): Promise<void> {
  await AsyncStorage.clear();
}
