import { useMemo } from "react";
import { View } from "react-native";
import { router } from "expo-router";
import { transactionsInMonth } from "@core/domain";
import { usePeriodStore } from "@shared/stores/period-store";
import { PeriodHeader } from "@shared/components";
import { Button, Card, EmptyState, MoneyText, Screen, Text } from "@shared/ui";
import {
  TransactionRow,
  useTransactions,
  useUpdateTransaction,
} from "@features/transactions";
import { useCategories } from "@features/categories";

export default function IncomeScreen() {
  const { monthKey, basis } = usePeriodStore();
  const { data: txs } = useTransactions();
  const { data: cats } = useCategories();
  const update = useUpdateTransaction();

  const catById = useMemo(() => new Map((cats ?? []).map((c) => [c.id, c])), [cats]);

  const incomes = useMemo(
    () =>
      transactionsInMonth(txs ?? [], monthKey, basis)
        .filter((t) => t.type === "INCOME")
        .sort((a, b) => b.occurredAt.localeCompare(a.occurredAt)),
    [txs, monthKey, basis],
  );

  const projected = incomes.filter((t) => t.isProjected);
  const confirmed = incomes.filter((t) => !t.isProjected);
  const total = confirmed.reduce((a, t) => a + t.amountCents, 0);

  return (
    <Screen scroll>
      <PeriodHeader />
      <View className="gap-4 px-4 pt-2">
        <Card>
          <Text variant="caption" className="text-bone-600">
            entradas efetivadas no mês
          </Text>
          <MoneyText cents={total} variant="h1" tone="income" />
        </Card>

        {projected.length > 0 ? (
          <Card title="previstas">
            <View className="gap-2">
              {projected.map((t) => (
                <View key={t.id} className="flex-row items-center justify-between">
                  <View>
                    <Text variant="label">{t.description || catById.get(t.categoryId)?.name}</Text>
                    <MoneyText cents={t.amountCents} tone="muted" projected variant="mono" />
                  </View>
                  <Button
                    label="Confirmar"
                    fullWidth={false}
                    size="md"
                    onPress={() => update.mutate({ id: t.id, patch: { isProjected: false } })}
                  />
                </View>
              ))}
            </View>
          </Card>
        ) : null}

        <Card title="lançadas">
          {confirmed.length > 0 ? (
            <View className="-mx-4">
              {confirmed.map((t) => (
                <TransactionRow
                  key={t.id}
                  transaction={t}
                  category={catById.get(t.categoryId)}
                  onPress={() => router.push(`/(modals)/transaction/${t.id}`)}
                />
              ))}
            </View>
          ) : (
            <EmptyState
              icon="arrow-down-left"
              title="nenhuma entrada neste mês"
              hint="registre com o botão laranja e escolha 'entrada'."
            />
          )}
        </Card>
      </View>
    </Screen>
  );
}
