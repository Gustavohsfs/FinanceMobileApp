import { View } from "react-native";
import { ACCOUNT_KIND_LABEL } from "@core/domain";
import { Card, EmptyState, Icon, MoneyText, Screen, Text } from "@shared/ui";
import { colors } from "@core/theme";
import { useAccounts } from "@features/accounts";
import { useCreditCards } from "@features/credit-cards";

export default function AccountsScreen() {
  const { data: accounts } = useAccounts();
  const { data: cards } = useCreditCards();

  return (
    <Screen scroll>
      <View className="gap-4 px-4 pt-3">
        <Card title="contas">
          <View className="gap-3">
            {(accounts ?? []).map((a) => (
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
                <MoneyText
                  cents={a.openingBalanceCents}
                  tone={a.openingBalanceCents < 0 ? "over" : "muted"}
                  variant="mono"
                />
              </View>
            ))}
          </View>
        </Card>

        <Card title="cartões de crédito">
          {(cards ?? []).length > 0 ? (
            <View className="gap-3">
              {(cards ?? []).map((c) => (
                <View key={c.id} className="flex-row items-center gap-3">
                  <View className="h-10 w-10 items-center justify-center rounded-full bg-ink-800">
                    <Icon name="credit-card" size={18} color={colors.flame500} />
                  </View>
                  <View className="flex-1">
                    <Text variant="label">{c.name}</Text>
                    <Text variant="caption">
                      fecha dia {c.closingDay} · vence dia {c.dueDay}
                    </Text>
                  </View>
                  <View className="items-end">
                    <Text variant="caption" className="text-bone-600">
                      limite
                    </Text>
                    <MoneyText cents={c.limitCents} tone="muted" variant="mono" />
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <EmptyState icon="credit-card" title="nenhum cartão cadastrado" />
          )}
        </Card>
      </View>
    </Screen>
  );
}
