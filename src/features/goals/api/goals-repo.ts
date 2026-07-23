/**
 * Repositório de metas — API NestJS. O progresso (efetivado vs. planejado e a
 * projeção) é calculado pelo backend (GET /{id}/progress), não no cliente.
 */
import { api } from "@core/api";
import { basisParam } from "@core/domain";
import type { AggregationBasis, Goal, GoalKind, Recurrence } from "@core/domain";
import type { GoalFormValues } from "../schemas/goal-schema";

interface GoalDto {
  id: string;
  userId: string;
  name: string;
  kind: GoalKind;
  targetCents: number;
  categoryId: string | null;
  startDate: string;
  deadline: string;
  recurrence: Recurrence;
}

export interface GoalProgress {
  goalId: string;
  plannedCents: number;
  effectuatedCents: number;
  ratio: number;
  isOver: boolean;
  projectionLabel: string;
}

function toGoal(d: GoalDto): Goal {
  return {
    id: d.id,
    userId: d.userId,
    name: d.name,
    kind: d.kind,
    targetCents: d.targetCents,
    startDate: d.startDate,
    deadline: d.deadline,
    recurrence: d.recurrence,
    ...(d.categoryId ? { categoryId: d.categoryId } : {}),
  };
}

export async function listGoals(): Promise<Goal[]> {
  const dtos = await api.get<GoalDto[]>("/v1/goals");
  return dtos.map(toGoal);
}

export async function createGoal(v: GoalFormValues): Promise<Goal> {
  const body = {
    name: v.name,
    kind: v.kind,
    targetCents: v.targetCents,
    startDate: v.startDate,
    deadline: v.deadline,
    recurrence: v.recurrence,
    ...(v.categoryId ? { categoryId: v.categoryId } : {}),
  };
  return toGoal(await api.post<GoalDto>("/v1/goals", body));
}

export async function getGoalProgress(
  id: string,
  basis: AggregationBasis,
): Promise<GoalProgress> {
  return api.get<GoalProgress>(`/v1/goals/${id}/progress`, {
    basis: basisParam(basis),
  });
}
