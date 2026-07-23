---
name: money-domain
description: Use sempre que o código envolver valores monetários, parcelamento, orçamentos, metas ou agregações financeiras. Dispara em qualquer arquivo sob core/money, core/domain, features/transactions e features/goals.
---

# money-domain

Dinheiro em Fluxo é **inteiro, em centavos** (`Cents = number`). Nunca float.

## Regras

- Formatação só na borda de apresentação: `format(cents)` (Intl BRL) — nunca `toFixed`.
- Toda conta vive em `core/money` (pura, zero deps) ou `core/domain` (regras puras). Componente não calcula dinheiro.
- Parcelamento: `splitInstallments(total, n)` distribui o resto nas primeiras parcelas; a soma **fecha exata**. Use `buildTransactions` (core/domain) para gerar N registros ligados por `installmentGroupId`; parcelas futuras nascem `isProjected: true`.
- Competência (`occurredAt`) × caixa (`settledAt`): use `basisDate(t, basis)` e `AggregationBasis`. Dashboard usa competência por padrão.
- Agregação por mês respeita `America/Sao_Paulo` (`monthKey`, `dayKey` em core/domain/dates).
- Cálculos derivados (saldo, totais, progresso) **nunca** são armazenados — sempre recalculados das transações vivas (`isAlive`).

## Checklist de revisão

- [ ] Nenhum `parseFloat`/`toFixed`/`* 100`/`/ 100` fora de `core/money`.
- [ ] Soma de parcelas == total.
- [ ] Valor projetado marcado (`isProjected`) e distinto na UI.
- [ ] Datas de agregação passam pelo fuso.
- [ ] Idempotency-Key em criação (`core/id`).
