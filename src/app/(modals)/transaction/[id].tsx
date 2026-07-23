import { useMemo, useState } from "react";
import { Pressable, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  PAYMENT_METHOD_LABEL,
  dayLabel,
  monthKey as toMonthKey,
} from "@core/domain";
import { Badge, Button, MoneyText, Text } from "@shared/ui";
import {
  TransactionRow,
  useDeleteTransaction,
  useTransactions,
  type EditScope,
} from "@features/transactions";
import { useCategories } from "@features/categories";

export default function TransactionDetailScreen() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: txs } = useTransactions();
  const { data: cats } = useCategories();
  const del = useDeleteTransaction();
  const [confirming, setConfirming] = useState(false);

  const tx = useMemo(() => (txs ?? []).find((t) => t.id === id), [txs, id]);
  const category = useMemo(
    () => (cats ?? []).find((c) => c.id === tx?.categoryId),
    [cats, tx],
  );

  function close() {
    router.back();
  }

  async function remove(scope: EditScope) {
    if (!tx) return;
    await del.mutateAsync({ tx, scope });
    close();
  }

  const isInstallment = Boolean(tx?.installmentGroupId);

  return (
    <View className="flex-1 justify-end">
      <Pressable
        className="absolute inset-0 bg-black/60"
        onPress={close}
        accessibilityRole="button"
        accessibilityLabel="fechar"
      />
      <View
        className="rounded-t-3xl border-t border-ink-800 bg-ink-950 px-5 pt-3"
        style={{ paddingBottom: insets.bottom + 16 }}
      >
        <View className="mb-3 items-center">
          <View className="h-1 w-10 rounded-full bg-ink-600" />
        </View>

        {!tx ? (
          <View className="items-center py-10">
            <Text variant="label">lançamento não encontrado</Text>
            <View className="mt-4">
              <Button label="Fechar" onPress={close} fullWidth={false} />
            </View>
          </View>
        ) : (
          <>
            <View className="mb-4 items-center gap-1">
              <Text variant="caption" className="text-bone-600">
                {tx.type === "INCOME" ? "entrada" : "saída"}
              </Text>
              <MoneyText
                cents={tx.amountCents}
                variant="display"
                tone={tx.type === "INCOME" ? "income" : "expense"}
                signed
                projected={tx.isProjected}
              />
              {tx.isProjected ? <Badge label="valor previsto" tone="flame" /> : null}
            </View>

            <View className="gap-3 rounded-2xl border border-ink-800 bg-ink-900 p-4">
              <Row label="descrição" value={tx.description || category?.name || "—"} />
              <Row label="categoria" value={category?.name ?? "—"} />
              <Row label="método" value={PAYMENT_METHOD_LABEL[tx.paymentMethod]} />
              <Row label="competência" value={dayLabel(tx.occurredAt)} />
              {tx.settledAt ? (
                <Row label="caixa (compensa)" value={dayLabel(tx.settledAt)} />
              ) : null}
              {isInstallment ? (
                <Row
                  label="parcela"
                  value={`${tx.installmentNumber}/${tx.installmentTotal}`}
                />
              ) : null}
              <Row label="mês" value={toMonthKey(tx.occurredAt)} />
            </View>

            {!confirming ? (
              <View className="mt-5 gap-2">
                <Button
                  label="Excluir lançamento"
                  variant="danger"
                  icon="trash"
                  onPress={() => setConfirming(true)}
                />
                <Button label="Fechar" variant="ghost" onPress={close} />
              </View>
            ) : isInstallment ? (
              <View className="mt-5 gap-2">
                <Text variant="caption" className="text-center text-bone-600">
                  este lançamento é parcelado. o que excluir?
                </Text>
                <Button label="Só esta parcela" variant="secondary" onPress={() => remove("ONE")} />
                <Button
                  label="Esta e as futuras"
                  variant="secondary"
                  onPress={() => remove("FUTURE")}
                />
                <Button label="Todas as parcelas" variant="danger" onPress={() => remove("ALL")} />
                <Button label="Cancelar" variant="ghost" onPress={() => setConfirming(false)} />
              </View>
            ) : (
              <View className="mt-5 gap-2">
                <Text variant="caption" className="text-center text-bone-600">
                  excluir este lançamento?
                </Text>
                <Button label="Sim, excluir" variant="danger" onPress={() => remove("ONE")} />
                <Button label="Cancelar" variant="ghost" onPress={() => setConfirming(false)} />
              </View>
            )}
          </>
        )}
      </View>
    </View>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row items-center justify-between">
      <Text variant="caption" className="text-bone-600">
        {label}
      </Text>
      <Text variant="label">{value}</Text>
    </View>
  );
}
