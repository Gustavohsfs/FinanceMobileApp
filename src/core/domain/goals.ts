/**
 * Progresso e projeção de metas (BRIEF §6.6), PURO. Três tipos:
 *  - SPEND_LIMIT: não passar de X na categoria Y no mês.
 *  - SAVING: juntar X até a data Y.
 *  - INVESTMENT: aportar X/mês.
 *
 * "Efetivado" é sempre derivado das transações — nunca armazenado (§8.4).
 * A projeção é claramente uma estimativa (§1: nada de números mentirosos).
 */
import type { Cents } from "@core/money";
import { signOf } from "./types";
import type { Goal, ISODate, Transaction } from "./types";
import { basisDate, isAlive, type AggregationBasis } from "./rules";
import { monthKey, currentMonthKey } from "./dates";

export interface GoalProgress {
  plannedCents: Cents; // alvo (ou alvo proporcional ao tempo)
  effectuatedCents: Cents; // realizado, derivado das transações
  ratio: number; // 0..>1
  isOver: boolean; // só faz sentido para SPEND_LIMIT
  projectionLabel: string; // texto de projeção humano
}

const MS_PER_DAY = 86_400_000;

function daysBetween(a: ISODate, b: ISODate): number {
  return Math.max(1, Math.round((new Date(b).getTime() - new Date(a).getTime()) / MS_PER_DAY));
}

export function computeGoalProgress(
  goal: Goal,
  txs: readonly Transaction[],
  basis: AggregationBasis,
  now: ISODate,
): GoalProgress {
  const alive = txs.filter(isAlive);

  if (goal.kind === "SPEND_LIMIT") {
    const mk = currentMonthKey();
    const spent = alive
      .filter(
        (t) =>
          t.type === "EXPENSE" &&
          t.categoryId === goal.categoryId &&
          monthKey(basisDate(t, basis)) === mk,
      )
      .reduce((acc, t) => acc + t.amountCents, 0);
    const ratio = goal.targetCents > 0 ? spent / goal.targetCents : 0;
    const isOver = spent > goal.targetCents;
    return {
      plannedCents: goal.targetCents,
      effectuatedCents: spent,
      ratio,
      isOver,
      projectionLabel: isOver
        ? "limite estourado neste mês"
        : `restam ${Math.max(0, Math.round((1 - ratio) * 100))}% do limite`,
    };
  }

  // SAVING / INVESTMENT: quanto foi guardado (líquido) desde o início da meta.
  const saved = alive
    .filter((t) => basisDate(t, basis) >= goal.startDate && basisDate(t, basis) <= now)
    .reduce((acc, t) => acc + signOf(t.type) * t.amountCents, 0);
  const effectuated = Math.max(0, saved);
  const ratio = goal.targetCents > 0 ? effectuated / goal.targetCents : 0;

  // projeção: ao ritmo atual, quando bate o alvo?
  const elapsed = daysBetween(goal.startDate, now);
  const pacePerDay = effectuated / elapsed; // centavos/dia
  let projectionLabel: string;
  if (effectuated >= goal.targetCents) {
    projectionLabel = "alvo atingido";
  } else if (pacePerDay <= 0) {
    projectionLabel = "sem ritmo de aporte ainda";
  } else {
    const remaining = goal.targetCents - effectuated;
    const daysToTarget = Math.ceil(remaining / pacePerDay);
    const eta = new Date(new Date(now).getTime() + daysToTarget * MS_PER_DAY);
    const etaKey = monthKey(eta.toISOString());
    const late = eta.getTime() > new Date(goal.deadline).getTime();
    projectionLabel = late
      ? `no ritmo atual você chega em ${etaKey} — depois do alvo`
      : `no ritmo atual você chega em ${etaKey}`;
  }

  return {
    plannedCents: goal.targetCents,
    effectuatedCents: effectuated,
    ratio,
    isOver: false,
    projectionLabel,
  };
}
