/**
 * Sessão de autenticação — integrada à API NestJS (BRIEF §6.1).
 *
 * JWT access curto (15 min) + refresh rotativo. Os tokens vivem no
 * `sessionStore` (memória + SecureStore); o client HTTP renova sozinho em 401.
 * Aqui cuidamos de login/registro/boot/logout e do estado de sessão do app.
 */
import { create } from "zustand";
import { api, ApiRequestError, sessionStore } from "@core/api";
import { clearKV } from "@core/storage";

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  timezone?: string;
  currency?: string;
}

interface SessionResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
  user: SessionUser;
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

function toMessage(e: unknown, fallback: string): string {
  if (e instanceof ApiRequestError) {
    return e.error.fieldErrors?.[0]?.message ?? e.error.message ?? fallback;
  }
  return fallback;
}

export const useAuthStore = create<AuthState>((set) => {
  // Quando o refresh falha, o client dispara isto: derruba para o login.
  sessionStore.setOnUnauthorized(() => {
    set({ status: "unauthenticated", user: null });
  });

  async function applySession(session: SessionResponse) {
    await sessionStore.set({
      accessToken: session.accessToken,
      refreshToken: session.refreshToken,
    });
    set({ status: "authenticated", user: session.user });
  }

  return {
    status: "loading",
    user: null,

    bootstrap: async () => {
      await sessionStore.hydrate();
      if (!sessionStore.hasSession()) {
        set({ status: "unauthenticated", user: null });
        return;
      }
      try {
        // /me dispara refresh automático se o access estiver expirado.
        const user = await api.get<SessionUser>("/v1/auth/me");
        set({ status: "authenticated", user });
      } catch {
        await sessionStore.clear();
        set({ status: "unauthenticated", user: null });
      }
    },

    signIn: async (email, password) => {
      try {
        const session = await api.post<SessionResponse>(
          "/v1/auth/login",
          { email: email.trim(), password },
          { auth: false },
        );
        await applySession(session);
      } catch (e) {
        throw new Error(toMessage(e, "Email ou senha inválidos"));
      }
    },

    signUp: async (name, email, password) => {
      try {
        const session = await api.post<SessionResponse>(
          "/v1/auth/register",
          { name: name.trim(), email: email.trim(), password },
          { auth: false },
        );
        await applySession(session);
      } catch (e) {
        throw new Error(toMessage(e, "Não foi possível criar a conta"));
      }
    },

    signOut: async () => {
      const refreshToken = sessionStore.getRefreshToken();
      // logout best-effort no servidor (revoga o refresh); segue mesmo se falhar.
      if (refreshToken) {
        try {
          await api.post("/v1/auth/logout", { refreshToken }, { auth: false });
        } catch {
          // ignore
        }
      }
      await sessionStore.clear();
      await clearKV();
      set({ status: "unauthenticated", user: null });
    },
  };
});
