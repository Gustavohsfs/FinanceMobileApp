/**
 * Cliente HTTP do Fluxo. Fala com a API NestJS (BRIEF §12, agora ativa).
 *
 * - Autentica com Bearer <access>; renova sozinho em 401 (refresh rotativo,
 *   single-flight com fila implícita) e refaz a requisição. Se o refresh falha,
 *   limpa a sessão e dispara o logout (BRIEF §6.1: sem loop de refresh).
 * - Erros no formato RFC 7807 Problem Details (`application/problem+json`) do
 *   backend viram `ApiRequestError` com code/message/fieldErrors.
 * - Criações levam header `idempotency-key` (guardrail §8.6), estável entre
 *   tentativas da mesma requisição lógica.
 * - Base sem `/v1` (health/docs ficam fora); paths de dados começam com `/v1/...`.
 */
import { env } from "@core/config/env";
import { newIdempotencyKey } from "@core/id";
import { sessionStore } from "./session";

export interface FieldError {
  field: string;
  message: string;
}

export interface ApiError {
  status: number;
  code: string;
  message: string;
  fieldErrors?: FieldError[];
}

export class ApiRequestError extends Error {
  constructor(public readonly error: ApiError) {
    super(error.message);
    this.name = "ApiRequestError";
  }
  get code(): string {
    return this.error.code;
  }
  get status(): number {
    return this.error.status;
  }
}

const BASE = env.apiUrl ?? "";

type Query = Record<string, string | number | boolean | undefined | null>;

interface RequestOptions {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  body?: unknown;
  query?: Query | undefined;
  /** Mutações de criação: envia idempotency-key. */
  idempotent?: boolean;
  /** Anexa Authorization: Bearer (default true). */
  auth?: boolean;
  /** Interno: chave de idempotência estável entre retries. */
  _idemKey?: string;
  /** Interno: já tentou refresh. */
  _retry?: boolean;
}

function buildUrl(path: string, query?: Query): string {
  const url = new URL(`${BASE}${path}`);
  if (query) {
    for (const [k, v] of Object.entries(query)) {
      if (v !== undefined && v !== null && v !== "") url.searchParams.set(k, String(v));
    }
  }
  return url.toString();
}

async function toApiError(res: Response): Promise<ApiError> {
  try {
    const p = (await res.json()) as {
      code?: string;
      detail?: string;
      title?: string;
      errors?: FieldError[];
    };
    return {
      status: res.status,
      code: p.code ?? "UNKNOWN",
      message: p.detail ?? p.title ?? `erro ${res.status}`,
      ...(p.errors ? { fieldErrors: p.errors } : {}),
    };
  } catch {
    return { status: res.status, code: "UNKNOWN", message: `erro ${res.status}` };
  }
}

let refreshInFlight: Promise<boolean> | null = null;

async function performRefresh(): Promise<boolean> {
  const rt = sessionStore.getRefreshToken();
  if (!rt) return false;
  try {
    const res = await fetch(`${BASE}/v1/auth/refresh`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ refreshToken: rt }),
    });
    if (!res.ok) return false;
    const data = (await res.json()) as { accessToken: string; refreshToken: string };
    await sessionStore.set({
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
    });
    return true;
  } catch {
    return false;
  }
}

/** Refresh single-flight: chamadas concorrentes esperam o mesmo refresh. */
function refreshOnce(): Promise<boolean> {
  if (!refreshInFlight) {
    refreshInFlight = performRefresh().finally(() => {
      refreshInFlight = null;
    });
  }
  return refreshInFlight;
}

export async function apiFetch<T>(path: string, opts: RequestOptions = {}): Promise<T> {
  if (!env.apiUrl) {
    throw new ApiRequestError({
      status: 0,
      code: "NO_BACKEND",
      message: "API não configurada (defina EXPO_PUBLIC_API_URL).",
    });
  }

  const auth = opts.auth ?? true;
  const headers: Record<string, string> = { "content-type": "application/json" };
  if (auth) {
    const at = sessionStore.getAccessToken();
    if (at) headers.Authorization = `Bearer ${at}`;
  }
  if (opts.idempotent) {
    opts._idemKey = opts._idemKey ?? newIdempotencyKey();
    headers["idempotency-key"] = opts._idemKey;
  }

  const res = await fetch(buildUrl(path, opts.query), {
    method: opts.method ?? "GET",
    headers,
    ...(opts.body !== undefined ? { body: JSON.stringify(opts.body) } : {}),
  });

  if (res.status === 401 && auth && !opts._retry) {
    const refreshed = await refreshOnce();
    if (refreshed) return apiFetch<T>(path, { ...opts, _retry: true });
    await sessionStore.clear();
    sessionStore.fireUnauthorized();
    throw new ApiRequestError(await toApiError(res));
  }

  if (!res.ok) throw new ApiRequestError(await toApiError(res));
  if (res.status === 204) return undefined as T;

  const text = await res.text();
  return (text ? JSON.parse(text) : undefined) as T;
}

export const api = {
  get: <T>(path: string, query?: Query) => apiFetch<T>(path, { method: "GET", query }),
  post: <T>(path: string, body?: unknown, extra?: Partial<RequestOptions>) =>
    apiFetch<T>(path, { method: "POST", body, ...extra }),
  patch: <T>(path: string, body?: unknown) =>
    apiFetch<T>(path, { method: "PATCH", body }),
  del: <T>(path: string, query?: Query) =>
    apiFetch<T>(path, { method: "DELETE", query }),
};
