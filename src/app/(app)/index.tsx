import { useMemo, useState } from "react";
import { View } from "react-native";
import { router } from "expo-router";
import { usePeriodStore } from "@shared/stores/period-store";
import { PeriodHeader } from "@shared/components";
import {
  Badge,
  Card,
  EmptyState,
  MoneyText,
  Screen,
  Text,
} from "@shared/ui";
import { BarsChart, DonutChart, LineAreaChart } from "@shared/charts";
import { useDashboard } from "@features/dashboard";
import { TransactionRow } from "@features/transactions";

export default function DashboardScreen() {
  const { monthKey, basis } = usePeriodStore();
  const dash = useDashboard(monthKey, basis);
  const [slice, setSlice] = useState<string | null>(null);

  const listTxs = useMemo(() => {
    if (!slice || slice === "__other__") return dash.recent;
    return dash.monthTxs.filter((t) => t.categoryId === slice).slice(0, 8);
  }, [slice, dash.recent, dash.monthTxs]);

  const hasData = dash.monthTxs.length > 0;

  return (
    <Screen scroll>
      <PeriodHeader />

      <View className="gap-4 px-4 pt-2">
        {/* Saldo do mês */}
        <Card>
          <Text variant="caption" className="text-bone-600">
            saldo do mês
          </Text>
          <View className="mt-1 flex-row items-end justify-between">
            <MoneyText
              cents={dash.totals.balanceCents}
              variant="display"
              tone={dash.totals.balanceCents < 0 ? "over" : "neutral"}
            />
            {dash.delta !== null ? (
              <View className="mb-2">
                <Badge
                  label={`${dash.delta >= 0 ? "+" : ""}${dash.delta}% vs mês anterior`}
                  tone={dash.delta >= 0 ? "income" : "over"}
                />
              </View>
            ) : null}
          </View>
          <View className="mt-3 flex-row gap-6">
            <View>
              <Text variant="caption" className="text-bone-600">
                entradas
              </Text>
              <MoneyText cents={dash.totals.incomeCents} tone="income" variant="mono" />
            </View>
            <View>
              <Text variant="caption" className="text-bone-600">
                saídas
              </Text>
              <MoneyText cents={dash.totals.expenseCents} tone="expense" variant="mono" />
            </View>
          </View>
        </Card>

        {/* Evolução do saldo acumulado */}
        <Card title="evolução do saldo">
          {hasData ? (
            <LineAreaChart data={dash.linePoints} />
          ) : (
            <EmptyState
              icon="trending-up"
              title="sem movimento neste mês"
              hint="registre um gasto para ver a curva."
            />
          )}
        </Card>

        {/* Donut por categoria */}
        <Card title="por categoria">
          {dash.slices.length > 0 ? (
            <DonutChart slices={dash.slices} selectedKey={slice} onSelect={setSlice} />
          ) : (
            <EmptyState icon="tags" title="nenhuma saída categorizada ainda" />
          )}
        </Card>

        {/* Barras 6 meses */}
        <Card title="últimos 6 meses">
          <BarsChart groups={dash.bars} />
        </Card>

        {/* Orçamentos estourados — só aparece se houver */}
        {dash.budgets.length > 0 ? (
          <Card title="orçamentos estourados">
            <View className="gap-3">
              {dash.budgets.map((b) => {
                const cat = dash.catById.get(b.categoryId);
                return (
                  <View key={b.categoryId} className="gap-1">
                    <View className="flex-row items-center justify-between">
                      <Text variant="label">{cat?.name ?? "—"}</Text>
                      <MoneyText cents={b.overCents} tone="over" signed variant="mono" />
                    </View>
                    <View className="h-2 overflow-hidden rounded-full bg-ink-800">
                      <View
                        className="h-full rounded-full bg-ember"
                        style={{ width: `${Math.min(100, b.ratio * 100)}%` }}
                      />
                    </View>
                  </View>
                );
              })}
            </View>
          </Card>
        ) : null}

        {/* Últimos lançamentos */}
        <Card
          title={slice ? "lançamentos da categoria" : "últimos lançamentos"}
          action={
            <Text
              variant="caption"
              className="text-flame-500"
              onPress={() => router.push("/(app)/transactions")}
            >
              ver todos
            </Text>
          }
        >
          {listTxs.length > 0 ? (
            <View className="-mx-4">
              {listTxs.map((t) => (
                <TransactionRow
                  key={t.id}
                  transaction={t}
                  category={dash.catById.get(t.categoryId)}
                  onPress={() => router.push(`/(modals)/transaction/${t.id}`)}
                />
              ))}
            </View>
          ) : (
            <EmptyState
              icon="arrow-left-right"
              title={`Nenhum gasto em ${monthKey}.`}
              hint="Registre o primeiro no botão laranja."
            />
          )}
        </Card>
      </View>
    </Screen>
  );
}
