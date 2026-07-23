import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createAccount,
  ensureDefaultAccount,
  listAccounts,
  type CreateAccountInput,
} from "./api/accounts-repo";

export const accountKeys = { all: ["accounts"] as const };

export function useAccounts() {
  return useQuery({ queryKey: accountKeys.all, queryFn: listAccounts });
}

export function useCreateAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateAccountInput) => createAccount(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: accountKeys.all }),
  });
}

export { listAccounts, ensureDefaultAccount };
export type { CreateAccountInput };
