/**
 * Repositório de categorias (fase local). Categoria com histórico só é
 * arquivada, nunca excluída (BRIEF §6.3) — por isso `archive`, não delete.
 */
import { createLocalCollection } from "@shared/utils";
import { STORAGE_KEYS } from "@shared/constants";
import type { Category } from "@core/domain";

export const categoriesRepo = createLocalCollection<Category & { deletedAt?: null }>(
  STORAGE_KEYS.categories,
);

export async function listCategories(): Promise<Category[]> {
  return categoriesRepo.list();
}

export async function archiveCategory(id: string): Promise<void> {
  await categoriesRepo.update(id, { isArchived: true });
}

export async function unarchiveCategory(id: string): Promise<void> {
  await categoriesRepo.update(id, { isArchived: false });
}
