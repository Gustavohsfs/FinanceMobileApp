/**
 * Repositório de categorias — API NestJS. Categoria com histórico só é
 * arquivada (POST /{id}/archive), nunca excluída (BRIEF §6.3). A API não expõe
 * desarquivar.
 */
import { api } from "@core/api";
import type { Category } from "@core/domain";
import type { CategoryFormValues } from "../schemas/category-schema";

interface CategoryDto {
  id: string;
  userId: string;
  name: string;
  icon: string;
  color: string;
  type: "INCOME" | "EXPENSE";
  parentId: string | null;
  monthlyBudgetCents: number | null;
  isArchived: boolean;
}

function toCategory(d: CategoryDto): Category {
  return {
    id: d.id,
    userId: d.userId,
    name: d.name,
    icon: d.icon,
    color: d.color,
    type: d.type,
    isArchived: d.isArchived,
    ...(d.parentId ? { parentId: d.parentId } : {}),
    ...(d.monthlyBudgetCents !== null
      ? { monthlyBudgetCents: d.monthlyBudgetCents }
      : {}),
  };
}

export async function listCategories(): Promise<Category[]> {
  const dtos = await api.get<CategoryDto[]>("/v1/categories", {
    includeArchived: true,
  });
  return dtos.map(toCategory);
}

export async function createCategory(v: CategoryFormValues): Promise<Category> {
  const body = {
    name: v.name,
    icon: v.icon,
    color: v.color,
    type: v.type,
    ...(v.parentId ? { parentId: v.parentId } : {}),
    ...(v.monthlyBudgetCents !== undefined
      ? { monthlyBudgetCents: v.monthlyBudgetCents }
      : {}),
  };
  return toCategory(await api.post<CategoryDto>("/v1/categories", body));
}

export async function updateCategory(
  id: string,
  patch: Partial<Pick<Category, "name" | "icon" | "color" | "monthlyBudgetCents">>,
): Promise<Category> {
  return toCategory(await api.patch<CategoryDto>(`/v1/categories/${id}`, patch));
}

export async function archiveCategory(id: string): Promise<void> {
  await api.post(`/v1/categories/${id}/archive`);
}
