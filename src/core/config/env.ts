/**
 * Configuração de ambiente validada com zod (BRIEF §2.2).
 * Lê de expo-constants (app.json > extra) e de process.env em dev.
 *
 * Enquanto não há backend (fase atual), API_URL é opcional e o app opera
 * 100% local. Quando o NestJS entrar, basta preencher `extra.apiUrl`.
 */
import Constants from "expo-constants";
import { z } from "zod";

const envSchema = z.object({
  apiUrl: z.string().url().optional(),
  appEnv: z.enum(["development", "staging", "production"]).default("development"),
});

const raw = {
  apiUrl:
    (Constants.expoConfig?.extra as Record<string, unknown> | undefined)?.apiUrl ??
    process.env.EXPO_PUBLIC_API_URL,
  appEnv: process.env.EXPO_PUBLIC_APP_ENV ?? "development",
};

const parsed = envSchema.safeParse(raw);

export const env = parsed.success
  ? parsed.data
  : { apiUrl: undefined, appEnv: "development" as const };

export const isBackendConfigured = Boolean(env.apiUrl);
