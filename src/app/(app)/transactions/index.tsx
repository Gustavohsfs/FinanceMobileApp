import { useMemo, useState } from "react";
import { View } from "react-native";
import { router } from "expo-router";
import { FlashList } from "@shopify/flash-list";
import { transactionsInMonth } from "@core/domain";
import type { TransactionType } from "@core/domain";
import { usePeriodStore } from "@shared/stores/period-store";
import { PeriodHeader } from "@shared/components";
import { EmptyState, Screen, SegmentedControl } from "@shared/ui";
import { TransactionRow, useTransactions } from "@features/transactions";
import { useCategories } from "@features/categories";

type Filter = "ALL" | "EXPENSE" | "INCOME";

export default function TransactionsScreen() {
  const { monthKey, basis } = usePeriodStore();
  const { data: txs } = useTransactions();
  const { data: cats } = useCategories();
  const [filter, setFilter] = useState<Filter>("ALL");

  const catById = useMemo(
    () => new Map((cats ?? []).map((c) => [c.id, c])),
    [cats],
  );

  const rows = useMemo(() => {
    const inMonth = transactionsInMonth(txs ?? [], monthKey, basis).sort((a, b) =>
      b.occurredAt.localeCompare(a.occurredAt),
    );
    if (filter === "ALL") return inMonth;
    return inMonth.filter((t) => t.type === (filter as TransactionType));
  }, [txs, monthKey, basis, filter]);

  return (
    <Screen>
      <PeriodHeader />
      <View className="px-4 pb-2">
        <SegmentedControl
          options={[
            { value: "ALL", label: "todos" },
            { value: "EXPENSE", label: "saídas" },
            { value: "INCOME", label: "entradas" },
          ]}
          value={filter}
          onChange={setFilter}
        />
      </View>

      {rows.length > 0 ? (
        <FlashList
          data={rows}
          keyExtractor={(t) => t.id}
          renderItem={({ item }) => (
            <TransactionRow
              transaction={item}
              category={catById.get(item.categoryId)}
              onPress={() => router.push(`/(modals)/transaction/${item.id}`)}
            />
          )}
          contentContainerStyle={{ paddingBottom: 120 }}
        />
      ) : (
        <EmptyState
          icon="arrow-left-right"
          title="nenhum lançamento neste período"
          hint="use o botão laranja para registrar."
        />
      )}
    </Screen>
  );
}
