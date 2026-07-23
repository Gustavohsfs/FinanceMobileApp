/**
 * Deriva TODO o conteúdo do dashboard (BRIEF §6.5) a partir das transações e
 * categorias, usando as regras puras de core/domain. Nada é armazenado.
 */
import { useMemo } from "react";
import {
  addMonthsToKey,
  budgetStatuses,
  cumulativeBalanceSeries,
  expenseByCategory,
  lastNMonthKeys,
  monthShort,
  monthTotals,
  percentDelta,
  transactionsInMonth,
} from "@core/domain";
import type { AggregationBasis, Category, Transaction } from "@core/domain";
import { useTransactions } from "@features/transactions";
import { useCategories } from "@features/categories";
import type { LinePoint } from "@shared/charts";
import type { DonutSlice } from "@shared/charts";
import type { BarGroup } from "@shared/charts";

export function useDashboard(monthKey: string, basis: AggregationBasis) {
  const txQuery = useTransactions();
  const catQuery = useCategories();

  const txs = useMemo(() => txQuery.data ?? [], [txQuery.data]);
  const categories = useMemo(() => catQuery.data ?? [], [catQuery.data]);
  const catById = useMemo(
    () => new Map(categories.map((c) => [c.id, c])),
    [categories],
  );

  const data = useMemo(() => {
    const totals = monthTotals(txs, monthKey, basis);
    const prev = monthTotals(txs, addMonthsToKey(monthKey, -1), basis);
    const delta = percentDelta(totals.balanceCents, prev.balanceCents);

    // série de saldo acumulado
    const series = cumulativeBalanceSeries(txs, monthKey, basis);
    const linePoints: LinePoint[] = series.map((p) => ({
      index: p.index,
      value: p.cumulativeCents,
      iso: `${p.day}T12:00:00.000Z`,
    }));

    // donut: top 5 + outros
    const byCat = expenseByCategory(txs, monthKey, basis);
    const top = byCat.slice(0, 5);
    const rest = byCat.slice(5);
    const restTotal = rest.reduce((acc, c) => acc + c.totalCents, 0);
    const slices: DonutSlice[] = top.map((c) => {
      const cat = catById.get(c.categoryId);
      return {
        key: c.categoryId,
        label: cat?.name ?? "—",
        value: c.totalCents,
        color: cat?.color ?? "#FF6A00",
      };
    });
    if (restTotal > 0) {
      slices.push({ key: "__other__", label: "outros", value: restTotal, color: "#52525B" });
    }

    // barras: últimos 6 meses
    const bars: BarGroup[] = lastNMonthKeys(monthKey, 6).map((k) => {
      const t = monthTotals(txs, k, basis);
      return { label: monthShort(k), incomeCents: t.incomeCents, expenseCents: t.expenseCents };
    });

    // orçamentos estourados
    const budgets = budgetStatuses(
      txs,
      categories.map((c) => ({
        categoryId: c.id,
        ...(c.monthlyBudgetCents !== undefined
          ? { monthlyBudgetCents: c.monthlyBudgetCents }
          : {}),
      })),
      monthKey,
      basis,
    ).filter((b) => b.overCents > 0);

    // últimos lançamentos (5), por data desc
    const monthTxs = transactionsInMonth(txs, monthKey, basis).sort((a, b) =>
      (b.occurredAt).localeCompare(a.occurredAt),
    );
    const recent = monthTxs.slice(0, 5);

    return { totals, delta, linePoints, slices, bars, budgets, recent, monthTxs };
  }, [txs, categories, catById, monthKey, basis]);

  return {
    ...data,
    categories,
    catById,
    isLoading: txQuery.isLoading || catQuery.isLoading,
  };
}

export function categoryLookup(categories: Category[]) {
  return new Map<string, Category>(categories.map((c) => [c.id, c]));
}

export type { Transaction };
