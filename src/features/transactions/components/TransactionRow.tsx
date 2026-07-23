/**
 * Linha de lançamento. Valor projetado é visualmente distinto (guardrail §8.8):
 * itálico, opaco e com badge "previsto". Números em tabular-nums.
 */
import { Pressable, View } from "react-native";
import type { Category, Transaction } from "@core/domain";
import { PAYMENT_METHOD_LABEL, dayLabel } from "@core/domain";
import { Badge, Icon, MoneyText, Text } from "@shared/ui";

interface TransactionRowProps {
  transaction: Transaction;
  category?: Category | undefined;
  onPress?: () => void;
}

export function TransactionRow({
  transaction: t,
  category,
  onPress,
}: TransactionRowProps) {
  const isExpense = t.type === "EXPENSE";
  const installmentTag =
    t.installmentTotal && t.installmentNumber
      ? `${t.installmentNumber}/${t.installmentTotal}`
      : null;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      className="flex-row items-center gap-3 px-4 py-3 active:bg-ink-900"
    >
      <View
        className="h-10 w-10 items-center justify-center rounded-full"
        style={{ backgroundColor: (category?.color ?? "#52525B") + "22" }}
      >
        <Icon
          name={category?.icon ?? "ellipsis"}
          size={18}
          color={category?.color ?? "#A1A1AA"}
        />
      </View>

      <View className="flex-1">
        <Text variant="label" numberOfLines={1}>
          {t.description || category?.name || "Sem descrição"}
        </Text>
        <View className="mt-0.5 flex-row items-center gap-2">
          <Text variant="caption">{dayLabel(t.occurredAt)}</Text>
          <Text variant="caption" className="text-bone-800">
            ·
          </Text>
          <Text variant="caption">{PAYMENT_METHOD_LABEL[t.paymentMethod]}</Text>
          {installmentTag ? (
            <Text variant="caption" className="text-bone-800">
              {installmentTag}
            </Text>
          ) : null}
        </View>
      </View>

      <View className="items-end gap-1">
        <MoneyText
          cents={t.amountCents}
          tone={isExpense ? "expense" : "income"}
          signed
          projected={t.isProjected}
        />
        {t.isProjected ? <Badge label="previsto" tone="flame" /> : null}
      </View>
    </Pressable>
  );
}
