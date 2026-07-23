/**
 * Regras de negócio PURAS (BRIEF §5.3 e §8). Sem I/O.
 *
 * - Parcelamento: N registros ligados por installmentGroupId; a soma das
 *   parcelas fecha EXATAMENTE com o total; parcelas futuras são isProjected.
 * - Competência (occurredAt) × caixa (settledAt): duas visões de agregação.
 * - Cálculos derivados (saldo, totais, progresso) NUNCA são armazenados.
 */
import { splitInstallments, sum, type Cents } from "@core/money";
import { addMonthsISO, monthKey, dayKey } from "./dates";
import { signOf, type ISODate, type Transaction } from "./types";

export type AggregationBasis = "ACCRUAL" | "CASH"; // competência × caixa

/** Converte a base para o valor esperado pela API (lowercase). */
export function basisParam(basis: AggregationBasis): "accrual" | "cash" {
  return basis === "CASH" ? "cash" : "accrual";
}

/** Data usada por uma transação conforme a base de agregação escolhida. */
export function basisDate(t: Transaction, basis: AggregationBasis): ISODate {
  if (basis === "CASH") return t.settledAt ?? t.occurredAt;
  return t.occurredAt;
}

/** Uma transação está viva (não soft-deleted)? */
export function isAlive(t: Transaction): boolean {
  return t.deletedAt === null;
}

export interface NewTransactionInput {
  userId: string;
  type: Transaction["type"];
  amountCents: Cents; // total da compra (positivo)
  description: string;
  occurredAt: ISODate;
  settledAt: ISODate | null;
  categoryId: string;
  accountId: string;
  paymentMethod: Transaction["paymentMethod"];
  creditCardId?: string;
  installments: number; // 1 = à vista
  currency?: string;
  notes?: string;
}

export interface BuildDeps {
  /** Gera um id único (repo injeta expo-crypto.randomUUID). */
  newId: () => string;
  /** "Agora" como ISO (injetável para testes). */
  now: () => ISODate;
}

/**
 * Constrói 1..N transações a partir de um input. Para compras parceladas gera
 * N registros com occurredAt mensal e valores que somam o total exato.
 * A parcela cuja data ainda é futura em relação a `now` nasce isProjected.
 */
export function buildTransactions(
  input: NewTransactionInput,
  deps: BuildDeps,
): Transaction[] {
  const now = deps.now();
  const currency = input.currency ?? "BRL";
  const n = Math.max(1, Math.trunc(input.installments));

  if (n === 1) {
    return [
      {
        id: deps.newId(),
        userId: input.userId,
        type: input.type,
        amountCents: Math.abs(input.amountCents),
        description: input.description,
        occurredAt: input.occurredAt,
        settledAt: input.settledAt,
        categoryId: input.categoryId,
        accountId: input.accountId,
        paymentMethod: input.paymentMethod,
        ...(input.creditCardId ? { creditCardId: input.creditCardId } : {}),
        isProjected: input.occurredAt > now,
        currency,
        ...(input.notes ? { notes: input.notes } : {}),
        createdAt: now,
        updatedAt: now,
        deletedAt: null,
      },
    ];
  }

  const groupId = deps.newId();
  const parts = splitInstallments(Math.abs(input.amountCents), n);
  return parts.map((amountCents, i) => {
    const occurredAt = addMonthsISO(input.occurredAt, i);
    const settledAt = input.settledAt ? addMonthsISO(input.settledAt, i) : null;
    return {
      id: deps.newId(),
      userId: input.userId,
      type: input.type,
      amountCents,
      description: input.description,
      occurredAt,
      settledAt,
      categoryId: input.categoryId,
      accountId: input.accountId,
      paymentMethod: input.paymentMethod,
      ...(input.creditCardId ? { creditCardId: input.creditCardId } : {}),
      installmentGroupId: groupId,
      installmentNumber: i + 1,
      installmentTotal: n,
      isProjected: occurredAt > now,
      currency,
      ...(input.notes ? { notes: input.notes } : {}),
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    };
  });
}

/** Transações vivas que caem no mês `key` conforme a base. */
export function transactionsInMonth(
  txs: readonly Transaction[],
  key: string,
  basis: AggregationBasis,
): Transaction[] {
  return txs.filter((t) => isAlive(t) && monthKey(basisDate(t, basis)) === key);
}

export interface MonthTotals {
  incomeCents: Cents;
  expenseCents: Cents;
  balanceCents: Cents; // income - expense
}

export function monthTotals(
  txs: readonly Transaction[],
  key: string,
  basis: AggregationBasis,
): MonthTotals {
  const inMonth = transactionsInMonth(txs, key, basis);
  const incomeCents = sum(
    inMonth.filter((t) => t.type === "INCOME").map((t) => t.amountCents),
  );
  const expenseCents = sum(
    inMonth.filter((t) => t.type === "EXPENSE").map((t) => t.amountCents),
  );
  return { incomeCents, expenseCents, balanceCents: incomeCents - expenseCents };
}

/** Delta percentual (inteiro, em pontos) entre dois valores. null se base 0. */
export function percentDelta(current: Cents, previous: Cents): number | null {
  if (previous === 0) return null;
  return Math.round(((current - previous) / Math.abs(previous)) * 100);
}

export interface CategoryTotal {
  categoryId: string;
  totalCents: Cents;
}

/** Total de SAÍDAS por categoria no mês, desc. */
export function expenseByCategory(
  txs: readonly Transaction[],
  key: string,
  basis: AggregationBasis,
): CategoryTotal[] {
  const inMonth = transactionsInMonth(txs, key, basis).filter(
    (t) => t.type === "EXPENSE",
  );
  const map = new Map<string, Cents>();
  for (const t of inMonth) {
    map.set(t.categoryId, (map.get(t.categoryId) ?? 0) + t.amountCents);
  }
  return [...map.entries()]
    .map(([categoryId, totalCents]) => ({ categoryId, totalCents }))
    .sort((a, b) => b.totalCents - a.totalCents);
}

export interface DayPoint {
  day: string; // YYYY-MM-DD
  index: number; // 0..dias
  cumulativeCents: Cents; // saldo acumulado no mês até o dia
}

/**
 * Série de saldo acumulado ao longo do mês (para o gráfico de linha/área).
 * Ordena por dia e acumula (entradas - saídas).
 */
export function cumulativeBalanceSeries(
  txs: readonly Transaction[],
  key: string,
  basis: AggregationBasis,
): DayPoint[] {
  const inMonth = transactionsInMonth(txs, key, basis).sort((a, b) =>
    basisDate(a, basis).localeCompare(basisDate(b, basis)),
  );
  const byDay = new Map<string, Cents>();
  for (const t of inMonth) {
    const d = dayKey(basisDate(t, basis));
    const signed = signOf(t.type) * t.amountCents;
    byDay.set(d, (byDay.get(d) ?? 0) + signed);
  }
  const days = [...byDay.keys()].sort();
  let running = 0;
  return days.map((day, index) => {
    running += byDay.get(day) ?? 0;
    return { day, index, cumulativeCents: running };
  });
}

export interface BudgetStatus {
  categoryId: string;
  budgetCents: Cents;
  spentCents: Cents;
  overCents: Cents; // > 0 se estourou
  ratio: number; // 0..>1
}

/** Status de orçamento por categoria no mês. */
export function budgetStatuses(
  txs: readonly Transaction[],
  budgets: readonly { categoryId: string; monthlyBudgetCents?: Cents }[],
  key: string,
  basis: AggregationBasis,
): BudgetStatus[] {
  const spentByCat = new Map(
    expenseByCategory(txs, key, basis).map((c) => [c.categoryId, c.totalCents]),
  );
  const out: BudgetStatus[] = [];
  for (const b of budgets) {
    if (!b.monthlyBudgetCents || b.monthlyBudgetCents <= 0) continue;
    const spentCents = spentByCat.get(b.categoryId) ?? 0;
    out.push({
      categoryId: b.categoryId,
      budgetCents: b.monthlyBudgetCents,
      spentCents,
      overCents: Math.max(0, spentCents - b.monthlyBudgetCents),
      ratio: spentCents / b.monthlyBudgetCents,
    });
  }
  return out;
}
