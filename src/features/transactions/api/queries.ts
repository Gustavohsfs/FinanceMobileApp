/**
 * Hooks de React Query para transações. Criação é OTIMISTA (BRIEF §6.2): a
 * lista atualiza antes da resposta. Como não há servidor ainda, o "commit" é a
 * escrita no kv; a estrutura otimista já fica pronta para o backend.
 */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { NewTransactionInput, Transaction } from "@core/domain";
import {
  deleteTransaction,
  insertTransactions,
  listTransactions,
  makeTransactions,
  transactionsRepo,
  type EditScope,
} from "./transactions-repo";

export const txKeys = {
  all: ["transactions"] as const,
  list: () => [...txKeys.all, "list"] as const,
};

export function useTransactions() {
  return useQuery({
    queryKey: txKeys.list(),
    queryFn: listTransactions,
  });
}

export function useCreateTransaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: Omit<NewTransactionInput, "userId">) => {
      const txs = makeTransactions(input);
      return insertTransactions(txs);
    },
    onMutate: async (input) => {
      await qc.cancelQueries({ queryKey: txKeys.list() });
      const previous = qc.getQueryData<Transaction[]>(txKeys.list());
      const optimistic = makeTransactions(input);
      qc.setQueryData<Transaction[]>(txKeys.list(), (old) => [
        ...optimistic,
        ...(old ?? []),
      ]);
      return { previous };
    },
    onError: (_err, _input, ctx) => {
      if (ctx?.previous) qc.setQueryData(txKeys.list(), ctx.previous);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: txKeys.all }),
  });
}

export function useDeleteTransaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ tx, scope }: { tx: Transaction; scope: EditScope }) => {
      await deleteTransaction(tx, scope);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: txKeys.all }),
  });
}

export function useUpdateTransaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Partial<Transaction> }) =>
      transactionsRepo.update(id, patch),
    onSuccess: () => qc.invalidateQueries({ queryKey: txKeys.all }),
  });
}
