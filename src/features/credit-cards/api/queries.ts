import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createCreditCard,
  deleteCreditCard,
  getInvoice,
  listCreditCards,
  updateCreditCard,
  type CreateCreditCardInput,
  type UpdateCreditCardInput,
} from "./credit-cards-repo";

export const creditCardKeys = {
  all: ["credit-cards"] as const,
  invoice: (id: string, month: string) =>
    ["credit-cards", id, "invoice", month] as const,
};

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

export function useUpdateCreditCard() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateCreditCardInput }) =>
      updateCreditCard(id, input),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: creditCardKeys.all });
      void qc.invalidateQueries({ queryKey: ["transactions"] });
      void qc.invalidateQueries({ queryKey: ["insights"] });
    },
  });
}

export function useDeleteCreditCard() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteCreditCard(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: creditCardKeys.all });
      void qc.invalidateQueries({ queryKey: ["transactions"] });
      void qc.invalidateQueries({ queryKey: ["insights"] });
    },
  });
}

export function useInvoice(cardId: string, month: string, enabled = true) {
  return useQuery({
    queryKey: creditCardKeys.invoice(cardId, month),
    queryFn: () => getInvoice(cardId, month),
    enabled,
  });
}
