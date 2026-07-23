import { z } from "zod";

/** Form do registro rápido (BRIEF §6.2). Valor em centavos, sempre > 0. */
export const quickEntrySchema = z.object({
  type: z.enum(["INCOME", "EXPENSE"]),
  amountCents: z
    .number()
    .int()
    .positive("Valor precisa ser maior que zero"),
  description: z.string().trim().max(80).optional(),
  categoryId: z.string().min(1, "Escolha uma categoria"),
  accountId: z.string().min(1),
  paymentMethod: z.enum(["CASH", "PIX", "DEBIT", "CREDIT"]),
  installments: z.number().int().min(1).max(24),
  occurredAt: z.string(),
  settledAt: z.string().nullable(),
  creditCardId: z.string().optional(),
  notes: z.string().optional(),
});

export type QuickEntryValues = z.infer<typeof quickEntrySchema>;

/** Métodos que não permitem parcelamento têm installments travado em 1. */
export function supportsInstallments(method: QuickEntryValues["paymentMethod"]) {
  return method === "CREDIT";
}
