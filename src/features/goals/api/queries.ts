import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { newId } from "@core/id";
import type { Goal } from "@core/domain";
import { LOCAL_USER_ID } from "@shared/constants";
import { goalsRepo, listGoals } from "./goals-repo";
import type { GoalFormValues } from "../schemas/goal-schema";

export const goalKeys = { all: ["goals"] as const };

export function useGoals() {
  return useQuery({ queryKey: goalKeys.all, queryFn: listGoals });
}

export function useCreateGoal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (values: GoalFormValues) => {
      const goal: Goal = {
        id: newId(),
        userId: LOCAL_USER_ID,
        name: values.name,
        kind: values.kind,
        targetCents: values.targetCents,
        startDate: values.startDate,
        deadline: values.deadline,
        recurrence: values.recurrence,
        ...(values.categoryId ? { categoryId: values.categoryId } : {}),
      };
      return goalsRepo.insert({ ...goal, deletedAt: null });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: goalKeys.all }),
  });
}

export function useDeleteGoal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => goalsRepo.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: goalKeys.all }),
  });
}
