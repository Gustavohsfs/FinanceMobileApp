/**
 * Sessão de autenticação em memória + persistência segura.
 *
 * Tokens vivem em memória (acesso síncrono para o interceptor) e no
 * expo-secure-store (guardrail §8.3 — nunca em kv/AsyncStorage). O client HTTP
 * lê daqui; a feature de auth escreve aqui.
 */
import { secure, SECURE_KEYS } from "@core/storage";

export interface Session {
  accessToken: string;
  refreshToken: string;
}

let accessToken: string | null = null;
let refreshToken: string | null = null;
let onUnauthorized: (() => void) | null = null;

export const sessionStore = {
  /** Carrega tokens persistidos para a memória (no boot). */
  async hydrate(): Promise<void> {
    accessToken = await secure.get(SECURE_KEYS.accessToken);
    refreshToken = await secure.get(SECURE_KEYS.refreshToken);
  },
  getAccessToken(): string | null {
    return accessToken;
  },
  getRefreshToken(): string | null {
    return refreshToken;
  },
  hasSession(): boolean {
    return refreshToken !== null;
  },
  async set(session: Session): Promise<void> {
    accessToken = session.accessToken;
    refreshToken = session.refreshToken;
    await secure.set(SECURE_KEYS.accessToken, session.accessToken);
    await secure.set(SECURE_KEYS.refreshToken, session.refreshToken);
  },
  async clear(): Promise<void> {
    accessToken = null;
    refreshToken = null;
    await secure.delete(SECURE_KEYS.accessToken);
    await secure.delete(SECURE_KEYS.refreshToken);
  },
  /** Registrado pela feature de auth: dispara logout quando o refresh falha. */
  setOnUnauthorized(cb: () => void): void {
    onUnauthorized = cb;
  },
  fireUnauthorized(): void {
    onUnauthorized?.();
  },
};
