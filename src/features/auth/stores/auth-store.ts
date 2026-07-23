/**
 * Sessão de autenticação. FASE LOCAL: não há backend, então o "login" é
 * simulado e a sessão é um token opaco guardado no SecureStore (NUNCA em kv —
 * guardrail §8.3). O contrato (persistir sessão, renovar sem o usuário
 * perceber, logout limpa tudo — BRIEF §6.1) já fica desenhado aqui; a troca
 * pelo JWT/refresh real do NestJS mexe só neste arquivo.
 */
import { create } from "zustand";
import { secure, SECURE_KEYS, clearKV } from "@core/storage";

export const LOCAL_USER_ID = "local-user";

export interface SessionUser {
  id: string;
  name: string;
  email: string;
}

type Status = "loading" | "authenticated" | "unauthenticated";

interface AuthState {
  status: Status;
  user: SessionUser | null;
  bootstrap: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (name: string, email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const PROFILE_KEY = "fluxo.profile";

async function persistProfile(user: SessionUser) {
  await secure.set(PROFILE_KEY, JSON.stringify(user));
}

export const useAuthStore = create<AuthState>((set) => ({
  status: "loading",
  user: null,

  bootstrap: async () => {
    const token = await secure.get(SECURE_KEYS.accessToken);
    const rawProfile = await secure.get(PROFILE_KEY);
    if (token && rawProfile) {
      try {
        set({ status: "authenticated", user: JSON.parse(rawProfile) as SessionUser });
        return;
      } catch {
        // perfil corrompido → cai para login
      }
    }
    set({ status: "unauthenticated", user: null });
  },

  signIn: async (email, password) => {
    // FASE LOCAL: aceita qualquer credencial não-vazia. Simula token curto.
    if (!email.trim() || !password.trim()) {
      throw new Error("Preencha email e senha");
    }
    const user: SessionUser = {
      id: LOCAL_USER_ID,
      name: email.split("@")[0] ?? "você",
      email: email.trim(),
    };
    await secure.set(SECURE_KEYS.accessToken, `local.${Date.now()}`);
    await secure.set(SECURE_KEYS.refreshToken, `refresh.${Date.now()}`);
    await persistProfile(user);
    set({ status: "authenticated", user });
  },

  signUp: async (name, email, password) => {
    if (!name.trim() || !email.trim() || !password.trim()) {
      throw new Error("Preencha nome, email e senha");
    }
    const user: SessionUser = {
      id: LOCAL_USER_ID,
      name: name.trim(),
      email: email.trim(),
    };
    await secure.set(SECURE_KEYS.accessToken, `local.${Date.now()}`);
    await secure.set(SECURE_KEYS.refreshToken, `refresh.${Date.now()}`);
    await persistProfile(user);
    set({ status: "authenticated", user });
  },

  signOut: async () => {
    // Logout limpa SecureStore, kv e (no chamador) o cache do React Query.
    await secure.delete(SECURE_KEYS.accessToken);
    await secure.delete(SECURE_KEYS.refreshToken);
    await secure.delete(PROFILE_KEY);
    await clearKV();
    set({ status: "unauthenticated", user: null });
  },
}));
