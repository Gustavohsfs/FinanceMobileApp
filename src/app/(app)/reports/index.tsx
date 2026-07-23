import { useMemo } from "react";
import { View } from "react-native";
import { PAYMENT_METHOD_LABEL } from "@core/domain";
import type { PaymentMethod } from "@core/domain";
import { sum } from "@core/money";
import { PeriodHeader } from "@shared/components";
import { Card, EmptyState, Icon, MoneyText, Screen, Text } from "@shared/ui";
import { useMonthTransactions } from "@features/transactions";
import { useCategories } from "@features/categories";

export default function ReportsScreen() {
  const { data: txs } = useMonthTransactions();
  const { data: cats } = useCategories();

  const catById = useMemo(() => new Map((cats ?? []).map((c) => [c.id, c])), [cats]);

  const expenses = useMemo(
    () => (txs ?? []).filter((t) => t.type === "EXPENSE"),
    [txs],
  );

  const byCategory = useMemo(() => {
    const map = new Map<string, number>();
    for (const t of expenses) {
      map.set(t.categoryId, (map.get(t.categoryId) ?? 0) + t.amountCents);
    }
    return [...map.entries()]
      .map(([categoryId, totalCents]) => ({ categoryId, totalCents }))
      .sort((a, b) => b.totalCents - a.totalCents);
  }, [expenses]);

  const byMethod = useMemo(() => {
    const map = new Map<PaymentMethod, number>();
    for (const t of expenses) {
      map.set(t.paymentMethod, (map.get(t.paymentMethod) ?? 0) + t.amountCents);
    }
    return [...map.entries()].sort((a, b) => b[1] - a[1]);
  }, [expenses]);

  const totalExpense = sum(byCategory.map((c) => c.totalCents));
  const hasData = byCategory.length > 0;

  return (
    <Screen scroll>
      <PeriodHeader />
      <View className="gap-4 px-4 pt-2">
        <Card title="saídas por categoria">
          {hasData ? (
            <View className="gap-3">
              {byCategory.map((c) => {
                const cat = catById.get(c.categoryId);
                const pct = totalExpense > 0 ? (c.totalCents / totalExpense) * 100 : 0;
                return (
                  <View key={c.categoryId} className="gap-1">
                    <View className="flex-row items-center justify-between">
                      <View className="flex-row items-center gap-2">
                        <Icon name={cat?.icon ?? "ellipsis"} size={16} color={cat?.color ?? "#A1A1AA"} />
                        <Text variant="label">{cat?.name ?? "—"}</Text>
                      </View>
                      <MoneyText cents={c.totalCents} tone="expense" variant="mono" />
                    </View>
                    <View className="h-1.5 overflow-hidden rounded-full bg-ink-800">
                      <View
                        className="h-full rounded-full"
                        style={{ width: `${pct}%`, backgroundColor: cat?.color ?? "#FF6A00" }}
                      />
                    </View>
                  </View>
                );
              })}
            </View>
          ) : (
            <EmptyState icon="banknote" title="sem saídas neste período" />
          )}
        </Card>

        <Card title="saídas por método">
          {byMethod.length > 0 ? (
            <View className="gap-2">
              {byMethod.map(([m, total]) => (
                <View key={m} className="flex-row items-center justify-between">
                  <Text variant="label">{PAYMENT_METHOD_LABEL[m]}</Text>
                  <MoneyText cents={total} tone="expense" variant="mono" />
                </View>
              ))}
            </View>
          ) : (
            <EmptyState icon="credit-card" title="sem dados de método" />
          )}
        </Card>

        <Text variant="caption" className="text-center text-bone-800">
          exportação CSV entra numa fase posterior.
        </Text>
      </View>
    </Screen>
  );
}
