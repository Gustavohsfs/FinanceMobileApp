/**
 * Repositório de transações (fase local). Toda criação passa por
 * buildTransactions (core/domain) — parcelamento, projeção e soma exata vivem
 * lá, puros. Aqui é só I/O.
 */
import { createLocalCollection } from "@shared/utils";
import { STORAGE_KEYS, LOCAL_USER_ID } from "@shared/constants";
import { newId } from "@core/id";
import { buildTransactions, nowISO } from "@core/domain";
import type { NewTransactionInput, Transaction } from "@core/domain";

export const transactionsRepo = createLocalCollection<Transaction>(
  STORAGE_KEYS.transactions,
);

export async function listTransactions(): Promise<Transaction[]> {
  return transactionsRepo.list();
}

/** Cria 1..N transações a partir do input do registro rápido. */
export function makeTransactions(
  input: Omit<NewTransactionInput, "userId">,
): Transaction[] {
  return buildTransactions(
    { ...input, userId: LOCAL_USER_ID },
    { newId, now: nowISO },
  );
}

export async function insertTransactions(txs: Transaction[]): Promise<Transaction[]> {
  return transactionsRepo.insertMany(txs);
}

export type EditScope = "ONE" | "FUTURE" | "ALL";

/** Exclui (soft) respeitando o escopo de parcelamento (BRIEF §5.3). */
export async function deleteTransaction(
  tx: Transaction,
  scope: EditScope,
): Promise<void> {
  if (!tx.installmentGroupId || scope === "ONE") {
    await transactionsRepo.remove(tx.id);
    return;
  }
  const groupId = tx.installmentGroupId;
  if (scope === "ALL") {
    await transactionsRepo.removeWhere((t) => t.installmentGroupId === groupId);
    return;
  }
  // FUTURE: esta e as seguintes (número >= atual)
  const from = tx.installmentNumber ?? 1;
  await transactionsRepo.removeWhere(
    (t) => t.installmentGroupId === groupId && (t.installmentNumber ?? 1) >= from,
  );
}
