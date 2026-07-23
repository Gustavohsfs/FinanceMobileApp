import { z } from "zod";

export const categoryFormSchema = z.object({
  name: z.string().trim().min(1, "Nome é obrigatório").max(40),
  icon: z.string().min(1),
  color: z.string().regex(/^#([0-9a-fA-F]{6})$/, "Cor inválida"),
  type: z.enum(["INCOME", "EXPENSE"]),
  parentId: z.string().optional(),
  monthlyBudgetCents: z.number().int().nonnegative().optional(),
});

export type CategoryFormValues = z.infer<typeof categoryFormSchema>;
