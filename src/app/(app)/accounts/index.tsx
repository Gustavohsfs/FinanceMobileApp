import { useState } from "react";
import { View } from "react-native";
import { ACCOUNT_KIND_LABEL } from "@core/domain";
import type { AccountKind } from "@core/domain";
import { fromInput } from "@core/money";
import {
  Button,
  Card,
  EmptyState,
  Icon,
  Input,
  MoneyText,
  Screen,
  SegmentedControl,
  Text,
} from "@shared/ui";
import { colors } from "@core/theme";
import { useAccounts, useCreateAccount } from "@features/accounts";
import { useCreateCreditCard, useCreditCards } from "@features/credit-cards";

export default function AccountsScreen() {
  const { data: accounts } = useAccounts();
  const { data: cards } = useCreditCards();
  const createAccount = useCreateAccount();
  const createCard = useCreateCreditCard();

  // form de conta
  const [addingAccount, setAddingAccount] = useState(false);
  const [accName, setAccName] = useState("");
  const [accKind, setAccKind] = useState<AccountKind>("CHECKING");
  const [accBalance, setAccBalance] = useState("");
  const [accError, setAccError] = useState<string | null>(null);

  // form de cartão
  const [addingCard, setAddingCard] = useState(false);
  const [cardName, setCardName] = useState("");
  const [cardLimit, setCardLimit] = useState("");
  const [cardClosing, setCardClosing] = useState("25");
  const [cardDue, setCardDue] = useState("10");
  const [cardError, setCardError] = useState<string | null>(null);

  async function onCreateAccount() {
    setAccError(null);
    if (!accName.trim()) return setAccError("Dê um nome à conta");
    try {
      await createAccount.mutateAsync({
        name: accName.trim(),
        kind: accKind,
        openingBalanceCents: fromInput(accBalance || "0"),
      });
      setAccName("");
      setAccBalance("");
      setAddingAccount(false);
    } catch {
      setAccError("Não foi possível criar a conta. Tente de novo.");
    }
  }

  async function onCreateCard() {
    setCardError(null);
    const accountId = accounts?.[0]?.id;
    if (!cardName.trim()) return setCardError("Dê um nome ao cartão");
    if (!accountId) return setCardError("Crie uma conta antes do cartão");
    const limitCents = fromInput(cardLimit);
    if (limitCents <= 0) return setCardError("Limite precisa ser maior que zero");
    const closingDay = parseInt(cardClosing, 10);
    const dueDay = parseInt(cardDue, 10);
    if (
      !Number.isInteger(closingDay) ||
      closingDay < 1 ||
      closingDay > 31 ||
      !Number.isInteger(dueDay) ||
      dueDay < 1 ||
      dueDay > 31
    ) {
      return setCardError("Dias de fechamento e vencimento vão de 1 a 31");
    }
    try {
      await createCard.mutateAsync({
        accountId,
        name: cardName.trim(),
        limitCents,
        closingDay,
        dueDay,
      });
      setCardName("");
      setCardLimit("");
      setAddingCard(false);
    } catch {
      setCardError("Não foi possível criar o cartão. Tente de novo.");
    }
  }

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
                <View className="items-end">
                  <Text variant="caption" className="text-bone-600">
                    saldo inicial
                  </Text>
                  <MoneyText
                    cents={a.openingBalanceCents}
                    tone={a.openingBalanceCents < 0 ? "over" : "muted"}
                    variant="mono"
                  />
                </View>
              </View>
            ))}

            {addingAccount ? (
              <View className="gap-3 rounded-xl border border-ink-800 p-3">
                <Input
                  label="nome"
                  placeholder="ex.: Nubank"
                  value={accName}
                  onChangeText={setAccName}
                />
                <Text variant="caption" className="text-bone-600">
                  tipo
                </Text>
                <SegmentedControl
                  options={[
                    { value: "CHECKING", label: "corrente" },
                    { value: "CASH", label: "dinheiro" },
                    { value: "SAVINGS", label: "poupança" },
                    { value: "INVESTMENT", label: "invest." },
                  ]}
                  value={accKind}
                  onChange={setAccKind}
                />
                <Input
                  label="saldo inicial (R$) — opcional"
                  placeholder="0,00"
                  keyboardType="numeric"
                  value={accBalance}
                  onChangeText={setAccBalance}
                />
                {accError ? (
                  <Text variant="caption" className="text-ember">
                    {accError}
                  </Text>
                ) : null}
                <View className="flex-row gap-2">
                  <View className="flex-1">
                    <Button
                      label="Cancelar"
                      variant="ghost"
                      onPress={() => setAddingAccount(false)}
                    />
                  </View>
                  <View className="flex-1">
                    <Button
                      label="Criar conta"
                      onPress={onCreateAccount}
                      loading={createAccount.isPending}
                    />
                  </View>
                </View>
              </View>
            ) : (
              <Button
                label="Nova conta"
                icon="plus"
                variant="secondary"
                onPress={() => setAddingAccount(true)}
              />
            )}
          </View>
        </Card>

        <Card title="cartões de crédito">
          <View className="gap-3">
            {(cards ?? []).length > 0 ? (
              (cards ?? []).map((c) => (
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
              ))
            ) : (
              <EmptyState icon="credit-card" title="nenhum cartão cadastrado" />
            )}

            {addingCard ? (
              <View className="gap-3 rounded-xl border border-ink-800 p-3">
                <Input
                  label="nome"
                  placeholder="ex.: Nubank Ultravioleta"
                  value={cardName}
                  onChangeText={setCardName}
                />
                <Input
                  label="limite (R$)"
                  placeholder="0,00"
                  keyboardType="numeric"
                  value={cardLimit}
                  onChangeText={setCardLimit}
                />
                <View className="flex-row gap-3">
                  <View className="flex-1">
                    <Input
                      label="dia de fechamento"
                      placeholder="25"
                      keyboardType="numeric"
                      value={cardClosing}
                      onChangeText={setCardClosing}
                    />
                  </View>
                  <View className="flex-1">
                    <Input
                      label="dia de vencimento"
                      placeholder="10"
                      keyboardType="numeric"
                      value={cardDue}
                      onChangeText={setCardDue}
                    />
                  </View>
                </View>
                {cardError ? (
                  <Text variant="caption" className="text-ember">
                    {cardError}
                  </Text>
                ) : null}
                <View className="flex-row gap-2">
                  <View className="flex-1">
                    <Button
                      label="Cancelar"
                      variant="ghost"
                      onPress={() => setAddingCard(false)}
                    />
                  </View>
                  <View className="flex-1">
                    <Button
                      label="Criar cartão"
                      onPress={onCreateCard}
                      loading={createCard.isPending}
                    />
                  </View>
                </View>
              </View>
            ) : (
              <Button
                label="Novo cartão"
                icon="plus"
                variant="secondary"
                onPress={() => setAddingCard(true)}
              />
            )}
          </View>
        </Card>

        <Text variant="caption" className="text-center text-bone-800">
          o gasto no crédito usa o primeiro cartão; fatura por cartão entra em
          breve.
        </Text>
      </View>
    </Screen>
  );
}
