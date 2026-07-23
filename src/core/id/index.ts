/**
 * Geração de identificadores. UUID v4 via expo-crypto (CSPRNG nativo).
 * Usado para ids de entidade e para Idempotency-Key (guardrail §8.6).
 */
import * as Crypto from "expo-crypto";

export function newId(): string {
  return Crypto.randomUUID();
}

/** Chave de idempotência para uma mutação de criação. */
export function newIdempotencyKey(): string {
  return Crypto.randomUUID();
}
