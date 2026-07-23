import { z } from "zod";

export const goalFormSchema = z
  .object({
    name: z.string().trim().min(1, "Nome é obrigatório").max(50),
    kind: z.enum(["SAVING", "INVESTMENT", "SPEND_LIMIT"]),
    targetCents: z.number().int().positive("Alvo precisa ser maior que zero"),
    categoryId: z.string().optional(),
    startDate: z.string(),
    deadline: z.string(),
    recurrence: z.enum(["ONCE", "MONTHLY"]),
  })
  .refine((v) => v.kind !== "SPEND_LIMIT" || !!v.categoryId, {
    message: "Limite de gasto exige uma categoria",
    path: ["categoryId"],
  });

export type GoalFormValues = z.infer<typeof goalFormSchema>;
