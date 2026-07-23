/**
 * Hooks de React Query para categorias. Estado de servidor vive aqui (não no
 * Zustand — guardrail §8.10). Na fase local a "fonte" é o repositório kv.
 */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { newId } from "@core/id";
import { nowISO } from "@core/domain";
import type { Category } from "@core/domain";
import { LOCAL_USER_ID } from "@shared/constants";
import {
  categoriesRepo,
  listCategories,
  archiveCategory,
  unarchiveCategory,
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
    mutationFn: async (values: CategoryFormValues) => {
      const category: Category = {
        id: newId(),
        userId: LOCAL_USER_ID,
        name: values.name,
        icon: values.icon,
        color: values.color,
        type: values.type,
        isArchived: false,
        ...(values.parentId ? { parentId: values.parentId } : {}),
        ...(values.monthlyBudgetCents !== undefined
          ? { monthlyBudgetCents: values.monthlyBudgetCents }
          : {}),
      };
      return categoriesRepo.insert({ ...category, deletedAt: null });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: categoryKeys.all }),
  });
}

export function useUpdateCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Partial<Category> }) => {
      return categoriesRepo.update(id, { ...patch, updatedAt: nowISO() } as never);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: categoryKeys.all }),
  });
}

export function useArchiveCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, archived }: { id: string; archived: boolean }) => {
      if (archived) await archiveCategory(id);
      else await unarchiveCategory(id);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: categoryKeys.all }),
  });
}
