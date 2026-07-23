/**
 * Compõe o dashboard (BRIEF §6.5) a partir dos endpoints de insights do backend
 * + as transações do mês (para "últimos lançamentos" e filtro por categoria).
 */
import { useMemo } from "react";
import { monthShort } from "@core/domain";
import type { AggregationBasis } from "@core/domain";
import { useMonthTransactions } from "@features/transactions";
import { useCategories } from "@features/categories";
import type { LinePoint, DonutSlice, BarGroup } from "@shared/charts";
import {
  useBalanceSeries,
  useByCategory,
  useBudgetStatus,
  useMonthlyComparison,
  useSummary,
} from "../api/insights";

export function useDashboard(monthKey: string, basis: AggregationBasis) {
  const summaryQ = useSummary(monthKey, basis);
  const seriesQ = useBalanceSeries(monthKey, basis);
  const byCatQ = useByCategory(monthKey, "EXPENSE");
  const comparisonQ = useMonthlyComparison(6);
  const budgetQ = useBudgetStatus(monthKey, basis);
  const txQ = useMonthTransactions();
  const catQ = useCategories();

  const categories = useMemo(() => catQ.data ?? [], [catQ.data]);
  const catById = useMemo(
    () => new Map(categories.map((c) => [c.id, c])),
    [categories],
  );

  const data = useMemo(() => {
    const totals = {
      incomeCents: summaryQ.data?.incomeCents ?? 0,
      expenseCents: summaryQ.data?.expenseCents ?? 0,
      balanceCents: summaryQ.data?.balanceCents ?? 0,
    };
    const delta = summaryQ.data?.deltaPercent ?? null;

    const series = seriesQ.data ?? [];
    const linePoints: LinePoint[] = series.map((p, index) => ({
      index,
      value: p.cumulativeCents,
      iso: `${p.day}T12:00:00.000Z`,
    }));

    const byCat = byCatQ.data ?? [];
    const top = byCat.slice(0, 5);
    const rest = byCat.slice(5);
    const restTotal = rest.reduce((acc, c) => acc + c.totalCents, 0);
    const slices: DonutSlice[] = top.map((c) => {
      const cat = c.categoryId ? catById.get(c.categoryId) : undefined;
      return {
        key: c.categoryId ?? "__none__",
        label: c.categoryName ?? cat?.name ?? "sem categoria",
        value: c.totalCents,
        color: cat?.color ?? "#FF6A00",
      };
    });
    if (restTotal > 0) {
      slices.push({ key: "__other__", label: "outros", value: restTotal, color: "#52525B" });
    }

    const bars: BarGroup[] = (comparisonQ.data ?? []).map((m) => ({
      label: monthShort(m.month),
      incomeCents: m.incomeCents,
      expenseCents: m.expenseCents,
    }));

    const budgets = (budgetQ.data ?? []).filter((b) => b.overCents > 0);

    const monthTxs = (txQ.data ?? [])
      .slice()
      .sort((a, b) => b.occurredAt.localeCompare(a.occurredAt));
    const recent = monthTxs.slice(0, 5);

    return { totals, delta, linePoints, slices, bars, budgets, recent, monthTxs };
  }, [
    summaryQ.data,
    seriesQ.data,
    byCatQ.data,
    comparisonQ.data,
    budgetQ.data,
    txQ.data,
    catById,
  ]);

  return {
    ...data,
    categories,
    catById,
    isLoading: summaryQ.isLoading || txQ.isLoading,
  };
}
