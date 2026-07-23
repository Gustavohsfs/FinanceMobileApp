import { useMemo } from "react";
import { View } from "react-native";
import { signOf, ACCOUNT_KIND_LABEL } from "@core/domain";
import { Card, EmptyState, Icon, MoneyText, Screen, Text } from "@shared/ui";
import { colors } from "@core/theme";
import { useAccounts } from "@features/accounts";
import { useTransactions } from "@features/transactions";

export default function AccountsScreen() {
  const { data: accounts } = useAccounts();
  const { data: txs } = useTransactions();

  const balanceByAccount = useMemo(() => {
    const map = new Map<string, number>();
    for (const t of txs ?? []) {
      if (t.isProjected) continue;
      map.set(t.accountId, (map.get(t.accountId) ?? 0) + signOf(t.type) * t.amountCents);
    }
    return map;
  }, [txs]);

  return (
    <Screen scroll>
      <View className="gap-4 px-4 pt-3">
        <Card title="contas">
          <View className="gap-3">
            {(accounts ?? []).map((a) => {
              const bal = a.openingBalanceCents + (balanceByAccount.get(a.id) ?? 0);
              return (
                <View key={a.id} className="flex-row items-center gap-3">
                  <View className="h-10 w-10 items-center justify-center rounded-full bg-ink-800">
                    <Icon
                      name={a.kind === "CASH" ? "wallet" : "banknote"}
                      size={18}
                      color={colors.bone600}
                    />
                  </View>
                  <View className="flex-1">
                    <Text variant="label">{a.name}</Text>
                    <Text variant="caption">{ACCOUNT_KIND_LABEL[a.kind]}</Text>
                  </View>
                  <MoneyText cents={bal} tone={bal < 0 ? "over" : "neutral"} variant="mono" />
                </View>
              );
            })}
          </View>
        </Card>

        <Card title="cartões de crédito">
          <EmptyState
            icon="credit-card"
            title="nenhum cartão cadastrado"
            hint="cadastro de cartões com fatura entra numa próxima fase."
          />
        </Card>
      </View>
    </Screen>
  );
}
