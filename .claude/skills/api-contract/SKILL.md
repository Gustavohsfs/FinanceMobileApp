---
name: api-contract
description: Use em qualquer chamada HTTP ou schema de dados. Cobre o contrato REST futuro, schemas zod compartilhados, padrão de erro, idempotência e refresh token.
---

# api-contract

**Fase atual: sem backend.** Os dados vêm de repositórios locais
(`features/*/api/*-repo.ts`) sobre `core/storage`. O contrato abaixo já está
fixado para a entrada do NestJS (BRIEF §12) — implemente as features de forma que
a troca seja só no repositório, não nas hooks.

## Cliente (`core/api/client.ts`)

- `apiRequest<T>(path, { method, body, idempotent, token })`.
- Erro tipado `ApiError { status, code, message }` → `ApiRequestError`.
- Criação leva `Idempotency-Key` automático (`idempotent: true`).
- Auth: `Authorization: Bearer <access>`; refresh rotativo entra no interceptor (fila de pendentes).

## Schemas (zod)

- Form e DTO em `features/<f>/schemas/*.ts`, sufixo `xSchema`.
- Valide no boundary (antes de mutar). Mensagens de erro dizem o que fazer.
- Reaproveite os mesmos schemas quando o backend existir (contrato compartilhado).

## React Query

- Estado de servidor **só** em React Query (nunca Zustand — guardrail §10).
- Criação otimista: `onMutate` atualiza cache, `onError` faz rollback, `onSettled` invalida.
- Query keys por feature (`txKeys`, `categoryKeys`, …).

## Ao ligar o backend

Reescreva o corpo das funções em `*-repo.ts` para chamar `apiRequest`; mantenha
as assinaturas. Troque o mock de `features/auth` por JWT access+refresh.
