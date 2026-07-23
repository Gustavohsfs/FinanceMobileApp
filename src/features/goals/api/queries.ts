import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { AggregationBasis } from "@core/domain";
import { createGoal, getGoalProgress, listGoals } from "./goals-repo";
import type { GoalFormValues } from "../schemas/goal-schema";

export const goalKeys = {
  all: ["goals"] as const,
  progress: (id: string, basis: AggregationBasis) =>
    [...goalKeys.all, "progress", id, basis] as const,
};

export function useGoals() {
  return useQuery({ queryKey: goalKeys.all, queryFn: listGoals });
}

export function useGoalProgress(id: string, basis: AggregationBasis) {
  return useQuery({
    queryKey: goalKeys.progress(id, basis),
    queryFn: () => getGoalProgress(id, basis),
    enabled: Boolean(id),
  });
}

export function useCreateGoal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (values: GoalFormValues) => createGoal(values),
    onSuccess: () => qc.invalidateQueries({ queryKey: goalKeys.all }),
  });
}
