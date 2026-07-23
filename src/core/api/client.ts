/**
 * Cliente HTTP — preparado para o backend NestJS da próxima fase (BRIEF §12).
 *
 * Nesta fase o app é 100% local (repositórios em core/storage), então este
 * cliente ainda NÃO é chamado. Ele existe para fixar o contrato: padrão de erro,
 * Idempotency-Key em criações (§8.6), e o ponto onde o refresh token entrará
 * (§6.1). Quando `env.apiUrl` for definido, os repositórios locais são trocados
 * por chamadas a este cliente sem mudar as feature hooks.
 */
import { env } from "@core/config/env";
import { newIdempotencyKey } from "@core/id";

export interface ApiError {
  status: number;
  code: string;
  message: string;
}

export class ApiRequestError extends Error {
  constructor(public readonly error: ApiError) {
    super(error.message);
    this.name = "ApiRequestError";
  }
}

type Method = "GET" | "POST" | "PATCH" | "DELETE";

interface RequestOptions {
  method?: Method;
  body?: unknown;
  /** Mutações de criação levam Idempotency-Key automaticamente. */
  idempotent?: boolean;
  token?: string | null;
  signal?: AbortSignal;
}

export async function apiRequest<T>(
  path: string,
  opts: RequestOptions = {},
): Promise<T> {
  if (!env.apiUrl) {
    throw new ApiRequestError({
      status: 0,
      code: "NO_BACKEND",
      message: "backend ainda não configurado (fase local)",
    });
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (opts.token) headers.Authorization = `Bearer ${opts.token}`;
  if (opts.idempotent) headers["Idempotency-Key"] = newIdempotencyKey();

  const res = await fetch(`${env.apiUrl}${path}`, {
    method: opts.method ?? "GET",
    headers,
    ...(opts.body !== undefined ? { body: JSON.stringify(opts.body) } : {}),
    ...(opts.signal ? { signal: opts.signal } : {}),
  });

  if (!res.ok) {
    let payload: Partial<ApiError> = {};
    try {
      payload = (await res.json()) as Partial<ApiError>;
    } catch {
      // corpo não-JSON
    }
    throw new ApiRequestError({
      status: res.status,
      code: payload.code ?? "UNKNOWN",
      message: payload.message ?? `erro ${res.status}`,
    });
  }

  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}
