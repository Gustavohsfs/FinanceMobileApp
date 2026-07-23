/**
 * Hooks de React Query para categorias. Estado de servidor vive aqui (§8.10).
 */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Category } from "@core/domain";
import {
  archiveCategory,
  createCategory,
  listCategories,
  updateCategory,
} from "./categories-repo";
import type { CategoryFormValues } from "../schemas/category-schema";

export const categoryKeys = {
  all: ["categories"] as const,
  list: () => [...categoryKeys.all, "list"] as const,
};

export function useCategories() {
  return useQuery({
    queryKey: categoryKeys.list(),
    queryFn: listCategories,
  });
}

export function useCategoriesByType(type: "INCOME" | "EXPENSE") {
  const q = useCategories();
  return {
    ...q,
    data: (q.data ?? []).filter((c) => c.type === type && !c.isArchived),
  };
}

export function useCreateCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (values: CategoryFormValues) => createCategory(values),
    onSuccess: () => qc.invalidateQueries({ queryKey: categoryKeys.all }),
  });
}

export function useUpdateCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      patch,
    }: {
      id: string;
      patch: Partial<Pick<Category, "name" | "icon" | "color" | "monthlyBudgetCents">>;
    }) => updateCategory(id, patch),
    onSuccess: () => qc.invalidateQueries({ queryKey: categoryKeys.all }),
  });
}

export function useArchiveCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => archiveCategory(id),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: categoryKeys.all }),
  });
}
