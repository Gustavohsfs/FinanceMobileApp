/**
 * Insights do dashboard — calculados pelo backend (BRIEF §6.5). O servidor é a
 * fonte da verdade das agregações; o app só apresenta (guardrail §8.2/§8.4).
 */
import { useQuery } from "@tanstack/react-query";
import { api } from "@core/api";
import { basisParam, monthRangeUTC } from "@core/domain";
import type { AggregationBasis } from "@core/domain";

export interface Summary {
  month: string;
  basis: "accrual" | "cash";
  incomeCents: number;
  expenseCents: number;
  balanceCents: number;
  previousBalanceCents: number;
  deltaPercent: number | null;
}

export interface BalancePoint {
  day: string;
  cumulativeCents: number;
}

export interface CategoryInsight {
  categoryId: string | null;
  categoryName: string | null;
  totalCents: number;
}

export interface MonthlyComparison {
  month: string;
  incomeCents: number;
  expenseCents: number;
}

export interface BudgetStatusInsight {
  categoryId: string;
  categoryName: string;
  budgetCents: number;
  spentCents: number;
  overCents: number;
  ratio: number;
}

export const insightKeys = {
  all: ["insights"] as const,
};

export function useSummary(monthKey: string, basis: AggregationBasis) {
  return useQuery({
    queryKey: [...insightKeys.all, "summary", monthKey, basis],
    queryFn: () =>
      api.get<Summary>("/v1/insights/summary", {
        month: monthKey,
        basis: basisParam(basis),
      }),
  });
}

export function useBalanceSeries(monthKey: string, basis: AggregationBasis) {
  const { from, to } = monthRangeUTC(monthKey);
  return useQuery({
    queryKey: [...insightKeys.all, "series", monthKey, basis],
    queryFn: () =>
      api.get<BalancePoint[]>("/v1/insights/balance-series", {
        from,
        to,
        granularity: "day",
        basis: basisParam(basis),
      }),
  });
}

export function useByCategory(
  monthKey: string,
  type: "INCOME" | "EXPENSE" = "EXPENSE",
) {
  const { from, to } = monthRangeUTC(monthKey);
  return useQuery({
    queryKey: [...insightKeys.all, "by-category", monthKey, type],
    queryFn: () =>
      api.get<CategoryInsight[]>("/v1/insights/by-category", { from, to, type }),
  });
}

export function useMonthlyComparison(months = 6) {
  return useQuery({
    queryKey: [...insightKeys.all, "monthly", months],
    queryFn: () =>
      api.get<MonthlyComparison[]>("/v1/insights/monthly-comparison", { months }),
  });
}

export function useBudgetStatus(monthKey: string, basis: AggregationBasis) {
  return useQuery({
    queryKey: [...insightKeys.all, "budget", monthKey, basis],
    queryFn: () =>
      api.get<BudgetStatusInsight[]>("/v1/insights/budget-status", {
        month: monthKey,
        basis: basisParam(basis),
      }),
  });
}
