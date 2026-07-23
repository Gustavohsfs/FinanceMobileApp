/**
 * Hooks de React Query para transações. Criação é OTIMISTA (BRIEF §6.2): a
 * lista do mês atualiza antes da resposta do servidor; em erro, faz rollback.
 */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { buildTransactions, monthRangeUTC, nowISO } from "@core/domain";
import type { AggregationBasis, Transaction } from "@core/domain";
import { newId } from "@core/id";
import { usePeriodStore } from "@shared/stores/period-store";
import {
  createTransaction,
  deleteTransaction,
  getTransaction,
  listTransactions,
  updateTransaction,
  type CreateTransactionInput,
  type EditScope,
} from "./transactions-repo";

export const txKeys = {
  all: ["transactions"] as const,
  month: (monthKey: string, basis: AggregationBasis) =>
    [...txKeys.all, "month", monthKey, basis] as const,
  one: (id: string) => [...txKeys.all, "one", id] as const,
};

/** Transações do mês/base selecionados no period-store. */
export function useMonthTransactions() {
  const monthKey = usePeriodStore((s) => s.monthKey);
  const basis = usePeriodStore((s) => s.basis);
  const { from, to } = monthRangeUTC(monthKey);
  return useQuery({
    queryKey: txKeys.month(monthKey, basis),
    queryFn: () => listTransactions({ from, to, basis }),
  });
}

export function useTransaction(id: string) {
  return useQuery({
    queryKey: txKeys.one(id),
    queryFn: () => getTransaction(id),
    enabled: Boolean(id),
  });
}

export function useCreateTransaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateTransactionInput) => createTransaction(input),
    onMutate: async (input) => {
      const { monthKey, basis } = usePeriodStore.getState();
      const key = txKeys.month(monthKey, basis);
      await qc.cancelQueries({ queryKey: key });
      const previous = qc.getQueryData<Transaction[]>(key);
      const preview = buildTransactions(
        {
          userId: "optimistic",
          type: input.type,
          amountCents: input.amountCents,
          description: input.description,
          occurredAt: input.occurredAt,
          settledAt: input.settledAt,
          categoryId: input.categoryId ?? "",
          accountId: input.accountId,
          paymentMethod: input.paymentMethod,
          installments: input.installments,
          ...(input.currency ? { currency: input.currency } : {}),
        },
        { newId, now: nowISO },
      );
      qc.setQueryData<Transaction[]>(key, (old) => [...preview, ...(old ?? [])]);
      return { key, previous };
    },
    onError: (_e, _input, ctx) => {
      if (ctx) qc.setQueryData(ctx.key, ctx.previous);
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: txKeys.all });
      qc.invalidateQueries({ queryKey: ["insights"] });
      qc.invalidateQueries({ queryKey: ["accounts"] });
    },
  });
}

export function useDeleteTransaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, scope }: { id: string; scope: EditScope }) =>
      deleteTransaction(id, scope),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: txKeys.all });
      qc.invalidateQueries({ queryKey: ["insights"] });
    },
  });
}

export function useUpdateTransaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<Transaction> }) =>
      updateTransaction(id, patch),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: txKeys.all });
      qc.invalidateQueries({ queryKey: ["insights"] });
    },
  });
}
