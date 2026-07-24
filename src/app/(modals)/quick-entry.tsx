import { useEffect, useState } from "react";
import { Pressable, ScrollView, View } from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { nowISO } from "@core/domain";
import type { PaymentMethod, TransactionType } from "@core/domain";
import { format, splitInstallments as splitPreview } from "@core/money";
import { kv } from "@core/storage";
import { PAYMENT_METHOD_LABEL } from "@core/domain";
import { ApiRequestError } from "@core/api";
import { Button, Chip, Icon, Text } from "@shared/ui";
import { MoneyKeypad } from "@shared/components";
import { colors } from "@core/theme";
import {
  quickEntrySchema,
  supportsInstallments,
  useCreateTransaction,
} from "@features/transactions";
import { useCategoriesByType } from "@features/categories";
import { useAccounts } from "@features/accounts";
import { useCreditCards } from "@features/credit-cards";

const METHODS: PaymentMethod[] = ["CASH", "PIX", "DEBIT", "CREDIT"];
const LAST_METHOD_KEY = "fluxo.pref.lastMethod";

function yesterdayISO(): string {
  return new Date(Date.now() - 86_400_000).toISOString();
}

export default function QuickEntryScreen() {
  const insets = useSafeAreaInsets();
  const create = useCreateTransaction();
  const { data: accounts } = useAccounts();
  const { data: cards } = useCreditCards();

  const [type, setType] = useState<TransactionType>("EXPENSE");
  const [amountCents, setAmountCents] = useState(0);
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [method, setMethod] = useState<PaymentMethod>("PIX");
  const [installments, setInstallments] = useState(1);
  const [dayChoice, setDayChoice] = useState<"today" | "yesterday">("today");
  const [error, setError] = useState<string | null>(null);

  const { data: categories } = useCategoriesByType(
    type === "INCOME" ? "INCOME" : "EXPENSE",
  );

  // padrão inteligente: método = último usado
  useEffect(() => {
    void kv.getString(LAST_METHOD_KEY).then((m) => {
      if (m && METHODS.includes(m as PaymentMethod))
        setMethod(m as PaymentMethod);
    });
  }, []);

  // padrão inteligente: categoria = a primeira disponível do tipo
  useEffect(() => {
    if (categoryId && categories.some((c) => c.id === categoryId)) return;
    setCategoryId(categories[0]?.id ?? null);
  }, [categories, categoryId]);

  const canInstallment = supportsInstallments(method);
  useEffect(() => {
    if (!canInstallment && installments !== 1) setInstallments(1);
  }, [canInstallment, installments]);

  const perInstallment =
    amountCents > 0 && installments > 1
      ? (splitPreview(amountCents, installments)[0] ?? 0)
      : amountCents;

  function close() {
    router.back();
  }

  async function onSave() {
    setError(null);
    const occurredAt = dayChoice === "today" ? nowISO() : yesterdayISO();
    const account = accounts?.[0];
    // Crédito exige um cartão (regra do backend). settledAt fica a cargo do
    // servidor, que conhece fechamento/vencimento da fatura.
    const creditCardId = method === "CREDIT" ? cards?.[0]?.id : undefined;
    if (method === "CREDIT" && !creditCardId) {
      setError("Crie um cartão em Contas e cartões antes de usar crédito.");
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    const payload = {
      type,
      amountCents,
      categoryId: categoryId ?? "",
      accountId: account?.id ?? "",
      paymentMethod: method,
      installments,
      occurredAt,
      settledAt: null,
      description: "",
    };
    const parsed = quickEntrySchema.safeParse(payload);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Dados inválidos");
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    try {
      await create.mutateAsync({
        type: parsed.data.type,
        amountCents: parsed.data.amountCents,
        description: parsed.data.description ?? "",
        occurredAt: parsed.data.occurredAt,
        settledAt: parsed.data.settledAt,
        categoryId: parsed.data.categoryId,
        accountId: parsed.data.accountId,
        paymentMethod: parsed.data.paymentMethod,
        installments: parsed.data.installments,
        ...(creditCardId ? { creditCardId } : {}),
      });
      await kv.set(LAST_METHOD_KEY, method);
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      close();
    } catch (e) {
      setError(
        e instanceof ApiRequestError
          ? e.error.message
          : "Não foi possível salvar. Tente de novo.",
      );
    }
  }

  const isIncome = type === "INCOME";

  return (
    <View className="flex-1 justify-end">
      {/* backdrop */}
      <Pressable
        className="absolute inset-0 bg-black/60"
        onPress={close}
        accessibilityRole="button"
        accessibilityLabel="fechar"
      />

      <View
        className="rounded-t-3xl border-t border-ink-800 bg-ink-950 px-5 pt-3"
        style={{ paddingBottom: insets.bottom + 8 }}
      >
        {/* handle + fechar + tipo */}
        <View className="mb-1 items-center">
          <View className="h-1 w-10 rounded-full bg-ink-600" />
        </View>
        <View className="mb-2 flex-row items-center justify-between">
          <View className="flex-row gap-2">
            <Chip
              label="saída"
              selected={!isIncome}
              onPress={() => setType("EXPENSE")}
            />
            <Chip
              label="entrada"
              selected={isIncome}
              onPress={() => setType("INCOME")}
            />
          </View>
          <Pressable
            onPress={close}
            accessibilityRole="button"
            accessibilityLabel="fechar"
            className="h-10 w-10 items-center justify-center rounded-full active:bg-ink-800"
          >
            <Icon name="x" color={colors.bone600} />
          </Pressable>
        </View>

        {/* valor gigante */}
        <View className="items-center py-2">
          <Text
            className={`font-mono text-display ${
              amountCents > 0 ? "text-flame-500" : "text-bone-800"
            }`}
            tabular
          >
            {format(amountCents)}
          </Text>
          {installments > 1 ? (
            <Text variant="caption" className="mt-1 text-bone-600">
              {installments}x de {format(perInstallment)}
            </Text>
          ) : null}
        </View>

        {/* atalhos de data */}
        <View className="mb-2 flex-row justify-center gap-2">
          <Chip
            label="hoje"
            icon="calendar"
            selected={dayChoice === "today"}
            onPress={() => setDayChoice("today")}
          />
          <Chip
            label="ontem"
            selected={dayChoice === "yesterday"}
            onPress={() => setDayChoice("yesterday")}
          />
        </View>

        {/* categorias */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="mb-2"
          contentContainerStyle={{ gap: 8, paddingVertical: 2 }}
        >
          {categories.map((c) => (
            <Chip
              key={c.id}
              label={c.name}
              icon={c.icon}
              dotColor={c.color}
              selected={categoryId === c.id}
              onPress={() => setCategoryId(c.id)}
            />
          ))}
        </ScrollView>

        {/* métodos */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="mb-2"
          contentContainerStyle={{ gap: 8, paddingVertical: 2 }}
        >
          {METHODS.map((m) => (
            <Chip
              key={m}
              label={PAYMENT_METHOD_LABEL[m]}
              selected={method === m}
              onPress={() => setMethod(m)}
            />
          ))}
        </ScrollView>

        {/* parcelas (só crédito) */}
        {canInstallment ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="mb-2"
            contentContainerStyle={{ gap: 8, paddingVertical: 2 }}
          >
            {Array.from({ length: 24 }, (_, i) => i + 1).map((n) => (
              <Chip
                key={n}
                label={`${n}x`}
                selected={installments === n}
                onPress={() => setInstallments(n)}
              />
            ))}
          </ScrollView>
        ) : null}

        {error ? (
          <Text variant="caption" className="mb-1 text-center text-ember">
            {error}
          </Text>
        ) : null}

        {/* teclado de valor */}
        <MoneyKeypad value={amountCents} onChange={setAmountCents} />

        <Button
          label={isIncome ? "Salvar entrada" : "Salvar gasto"}
          onPress={onSave}
          loading={create.isPending}
          size="lg"
        />
      </View>
    </View>
  );
}
