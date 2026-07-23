import { useMemo, useState } from "react";
import { View } from "react-native";
import {
  GOAL_KIND_LABEL,
  addMonthsISO,
  computeGoalProgress,
  nowISO,
} from "@core/domain";
import type { GoalKind } from "@core/domain";
import { fromInput } from "@core/money";
import { usePeriodStore } from "@shared/stores/period-store";
import {
  Badge,
  Button,
  Card,
  Chip,
  EmptyState,
  Input,
  MoneyText,
  Screen,
  SegmentedControl,
  Text,
} from "@shared/ui";
import { useCreateGoal, useDeleteGoal, useGoals } from "@features/goals";
import { useCategoriesByType } from "@features/categories";
import { useTransactions } from "@features/transactions";

export default function GoalsScreen() {
  const { basis } = usePeriodStore();
  const { data: goals } = useGoals();
  const { data: txs } = useTransactions();
  const { data: expenseCats } = useCategoriesByType("EXPENSE");
  const createGoal = useCreateGoal();
  const deleteGoal = useDeleteGoal();

  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const [kind, setKind] = useState<GoalKind>("SAVING");
  const [amount, setAmount] = useState("");
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const now = nowISO();
  const progresses = useMemo(
    () =>
      (goals ?? []).map((g) => ({
        goal: g,
        progress: computeGoalProgress(g, txs ?? [], basis, now),
      })),
    [goals, txs, basis, now],
  );

  async function onCreate() {
    setError(null);
    const targetCents = fromInput(amount);
    if (!name.trim()) return setError("Dê um nome à meta");
    if (targetCents <= 0) return setError("Alvo precisa ser maior que zero");
    if (kind === "SPEND_LIMIT" && !categoryId)
      return setError("Limite de gasto exige uma categoria");
    await createGoal.mutateAsync({
      name: name.trim(),
      kind,
      targetCents,
      startDate: now,
      deadline: addMonthsISO(now, 6),
      recurrence: kind === "INVESTMENT" || kind === "SPEND_LIMIT" ? "MONTHLY" : "ONCE",
      ...(categoryId ? { categoryId } : {}),
    });
    setName("");
    setAmount("");
    setCategoryId(null);
    setAdding(false);
  }

  return (
    <Screen scroll>
      <View className="gap-4 px-4 pt-3">
        {adding ? (
          <Card title="nova meta">
            <View className="gap-3">
              <SegmentedControl
                options={[
                  { value: "SAVING", label: "guardar" },
                  { value: "INVESTMENT", label: "investir" },
                  { value: "SPEND_LIMIT", label: "limite" },
                ]}
                value={kind}
                onChange={setKind}
              />
              <Input label="nome" placeholder="ex.: Reserva" value={name} onChangeText={setName} />
              <Input
                label={kind === "SPEND_LIMIT" ? "limite mensal (R$)" : "alvo (R$)"}
                placeholder="0,00"
                keyboardType="numeric"
                value={amount}
                onChangeText={setAmount}
              />
              {kind === "SPEND_LIMIT" ? (
                <View className="flex-row flex-wrap gap-2">
                  {expenseCats.map((c) => (
                    <Chip
                      key={c.id}
                      label={c.name}
                      dotColor={c.color}
                      selected={categoryId === c.id}
                      onPress={() => setCategoryId(c.id)}
                    />
                  ))}
                </View>
              ) : null}
              {error ? (
                <Text variant="caption" className="text-ember">
                  {error}
                </Text>
              ) : null}
              <View className="flex-row gap-2">
                <View className="flex-1">
                  <Button label="Cancelar" variant="ghost" onPress={() => setAdding(false)} />
                </View>
                <View className="flex-1">
                  <Button label="Criar meta" onPress={onCreate} loading={createGoal.isPending} />
                </View>
              </View>
            </View>
          </Card>
        ) : (
          <Button label="Nova meta" icon="plus" variant="secondary" onPress={() => setAdding(true)} />
        )}

        {progresses.length > 0 ? (
          progresses.map(({ goal, progress }) => (
            <Card key={goal.id}>
              <View className="mb-2 flex-row items-start justify-between">
                <View className="flex-1">
                  <Text variant="h2">{goal.name}</Text>
                  <Badge label={GOAL_KIND_LABEL[goal.kind]} tone="muted" />
                </View>
                <Text
                  variant="caption"
                  className="text-ember"
                  onPress={() => deleteGoal.mutate(goal.id)}
                >
                  excluir
                </Text>
              </View>

              <View className="mb-2 flex-row items-end justify-between">
                <MoneyText
                  cents={progress.effectuatedCents}
                  variant="h1"
                  tone={progress.isOver ? "over" : "neutral"}
                />
                <View className="flex-row items-center gap-1">
                  <Text variant="caption" className="mb-1 text-bone-600">
                    de
                  </Text>
                  <MoneyText cents={progress.plannedCents} tone="muted" variant="mono" />
                </View>
              </View>

              <View className="h-2.5 overflow-hidden rounded-full bg-ink-800">
                <View
                  className={`h-full rounded-full ${progress.isOver ? "bg-ember" : "bg-flame-500"}`}
                  style={{ width: `${Math.min(100, progress.ratio * 100)}%` }}
                />
              </View>
              <Text variant="caption" className="mt-2 text-bone-600">
                {progress.projectionLabel}
              </Text>
            </Card>
          ))
        ) : (
          <EmptyState
            icon="target"
            title="nenhuma meta ainda"
            hint="crie uma para guardar, investir ou segurar um gasto."
          />
        )}
      </View>
    </Screen>
  );
}
