import { useQuery } from "@tanstack/react-query";
import { listAccounts, accountsRepo } from "./api/accounts-repo";

export const accountKeys = { all: ["accounts"] as const };

export function useAccounts() {
  return useQuery({ queryKey: accountKeys.all, queryFn: listAccounts });
}

export { accountsRepo, listAccounts };
