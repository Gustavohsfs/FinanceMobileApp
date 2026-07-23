import { createLocalCollection } from "@shared/utils";
import { STORAGE_KEYS } from "@shared/constants";
import type { Account } from "@core/domain";

export const accountsRepo = createLocalCollection<Account & { deletedAt?: null }>(
  STORAGE_KEYS.accounts,
);

export async function listAccounts(): Promise<Account[]> {
  return accountsRepo.list();
}
