import { useQuery } from "@tanstack/react-query";
import { listCreditCards, ensureDefaultCreditCard } from "./api/credit-cards-repo";

export const creditCardKeys = { all: ["credit-cards"] as const };

export function useCreditCards() {
  return useQuery({ queryKey: creditCardKeys.all, queryFn: listCreditCards });
}

export { ensureDefaultCreditCard };
export type { CreditCard } from "./api/credit-cards-repo";
