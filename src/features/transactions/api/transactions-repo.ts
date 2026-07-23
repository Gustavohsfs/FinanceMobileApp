/**
 * Repositório de transações — API NestJS.
 *
 * Parcelamento é responsabilidade do backend: enviamos `installmentTotal` e o
 * servidor gera N registros ligados (retorna o array). Exclusão respeita o
 * escopo de parcelamento via ?scope=one|future|all (BRIEF §5.3).
 * Toda criação leva `idempotency-key` (guardrail §8.6, exigido pela API).
 */
import { api } from "@core/api";
import { basisParam } from "@core/domain";
import type {
  AggregationBasis,
  PaymentMethod,
  Transaction,
  TransactionType,
} from "@core/domain";

interface TransactionDto {
  id: string;
  userId: string;
  type: TransactionType;
  amountCents: number;
  description: string;
  occurredAt: string;
  settledAt: string | null;
  categoryId: string | null;
  accountId: string;
  creditCardId: string | null;
  paymentMethod: PaymentMethod;
  installmentGroupId: string | null;
  installmentNumber: number | null;
  installmentTotal: number | null;
  isProjected: boolean;
  recurrenceId: string | null;
  currency: string;
  notes: string | null;
  source: "MANUAL" | "RECURRENCE" | "OPEN_FINANCE";
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

interface TransactionsPage {
  data: TransactionDto[];
  meta: { nextCursor: string | null; hasMore: boolean; limit: number };
}

export function toTransaction(d: TransactionDto): Transaction {
  return {
    id: d.id,
    userId: d.userId,
    type: d.type,
    amountCents: d.amountCents,
    description: d.description,
    occurredAt: d.occurredAt,
    settledAt: d.settledAt,
    categoryId: d.categoryId ?? "",
    accountId: d.accountId,
    paymentMethod: d.paymentMethod,
    isProjected: d.isProjected,
    currency: d.currency,
    source: d.source,
    recurrenceId: d.recurrenceId,
    notes: d.notes,
    createdAt: d.createdAt,
    updatedAt: d.updatedAt,
    deletedAt: d.deletedAt,
    ...(d.creditCardId ? { creditCardId: d.creditCardId } : {}),
    ...(d.installmentGroupId ? { installmentGroupId: d.installmentGroupId } : {}),
    ...(d.installmentNumber !== null ? { installmentNumber: d.installmentNumber } : {}),
    ...(d.installmentTotal !== null ? { installmentTotal: d.installmentTotal } : {}),
  };
}

export interface TransactionFilters {
  from?: string;
  to?: string;
  type?: TransactionType;
  categoryId?: string;
  method?: PaymentMethod;
  basis?: AggregationBasis;
}

/** Lista transações do período (uma página de até 100 — cobre um mês). */
export async function listTransactions(
  filters: TransactionFilters = {},
): Promise<Transaction[]> {
  const page = await api.get<TransactionsPage>("/v1/transactions", {
    from: filters.from,
    to: filters.to,
    type: filters.type,
    categoryId: filters.categoryId,
    method: filters.method,
    basis: filters.basis ? basisParam(filters.basis) : undefined,
    limit: 100,
  });
  return page.data.map(toTransaction);
}

export async function getTransaction(id: string): Promise<Transaction | null> {
  try {
    return toTransaction(await api.get<TransactionDto>(`/v1/transactions/${id}`));
  } catch {
    return null;
  }
}

export interface CreateTransactionInput {
  type: TransactionType;
  amountCents: number;
  description: string;
  occurredAt: string;
  settledAt: string | null;
  categoryId?: string;
  accountId: string;
  creditCardId?: string;
  paymentMethod: PaymentMethod;
  installments: number;
  currency?: string;
  notes?: string;
}

export async function createTransaction(
  input: CreateTransactionInput,
): Promise<Transaction[]> {
  const body = {
    type: input.type,
    amountCents: input.amountCents,
    description: input.description,
    occurredAt: input.occurredAt,
    settledAt: input.settledAt,
    accountId: input.accountId,
    paymentMethod: input.paymentMethod,
    ...(input.categoryId ? { categoryId: input.categoryId } : {}),
    ...(input.creditCardId ? { creditCardId: input.creditCardId } : {}),
    ...(input.installments > 1 ? { installmentTotal: input.installments } : {}),
    ...(input.currency ? { currency: input.currency } : {}),
    ...(input.notes ? { notes: input.notes } : {}),
  };
  const created = await api.post<TransactionDto[]>("/v1/transactions", body, {
    idempotent: true,
  });
  return created.map(toTransaction);
}

export type EditScope = "ONE" | "FUTURE" | "ALL";

export async function updateTransaction(
  id: string,
  patch: Partial<Transaction>,
): Promise<Transaction> {
  return toTransaction(await api.patch<TransactionDto>(`/v1/transactions/${id}`, patch));
}

export async function deleteTransaction(id: string, scope: EditScope): Promise<void> {
  await api.del(`/v1/transactions/${id}`, { scope: scope.toLowerCase() });
}
