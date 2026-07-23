import { createLocalCollection } from "@shared/utils";
import { STORAGE_KEYS } from "@shared/constants";
import type { Goal } from "@core/domain";

export const goalsRepo = createLocalCollection<Goal & { deletedAt?: null }>(
  STORAGE_KEYS.goals,
);

export async function listGoals(): Promise<Goal[]> {
  return goalsRepo.list();
}
