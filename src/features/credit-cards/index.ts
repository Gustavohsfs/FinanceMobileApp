import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createCreditCard,
  ensureDefaultCreditCard,
  listCreditCards,
  type CreateCreditCardInput,
} from "./api/credit-cards-repo";

export const creditCardKeys = { all: ["credit-cards"] as const };

export function useCreditCards() {
  return useQuery({ queryKey: creditCardKeys.all, queryFn: listCreditCards });
}

export function useCreateCreditCard() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateCreditCardInput) => createCreditCard(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: creditCardKeys.all }),
  });
}

export { ensureDefaultCreditCard };
export type { CreditCard, CreateCreditCardInput } from "./api/credit-cards-repo";
