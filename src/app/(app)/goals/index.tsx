import { useState } from "react";
import { View } from "react-native";
import { GOAL_KIND_LABEL, addMonthsISO, nowISO } from "@core/domain";
import type { AggregationBasis, Goal, GoalKind } from "@core/domain";
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
import { useCreateGoal, useGoalProgress, useGoals } from "@features/goals";
import { useCategoriesByType } from "@features/categories";

export default function GoalsScreen() {
  const basis = usePeriodStore((s) => s.basis);
  const { data: goals } = useGoals();
  const { data: expenseCats } = useCategoriesByType("EXPENSE");
  const createGoal = useCreateGoal();

  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const [kind, setKind] = useState<GoalKind>("SAVING");
  const [amount, setAmount] = useState("");
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onCreate() {
    setError(null);
    const targetCents = fromInput(amount);
    const now = nowISO();
    if (!name.trim()) return setError("Dê um nome à meta");
    if (targetCents <= 0) return setError("Alvo precisa ser maior que zero");
    if (kind === "SPEND_LIMIT" && !categoryId)
      return setError("Limite de gasto exige uma categoria");
    try {
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
    } catch {
      setError("Não foi possível criar a meta. Tente de novo.");
    }
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

        {(goals ?? []).length > 0 ? (
          (goals ?? []).map((goal) => (
            <GoalCard key={goal.id} goal={goal} basis={basis} />
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

function GoalCard({ goal, basis }: { goal: Goal; basis: AggregationBasis }) {
  const { data: progress } = useGoalProgress(goal.id, basis);
  const ratio = progress?.ratio ?? 0;
  const isOver = progress?.isOver ?? false;

  return (
    <Card>
      <View className="mb-2">
        <Text variant="h2">{goal.name}</Text>
        <Badge label={GOAL_KIND_LABEL[goal.kind]} tone="muted" />
      </View>

      <View className="mb-2 flex-row items-end justify-between">
        <MoneyText
          cents={progress?.effectuatedCents ?? 0}
          variant="h1"
          tone={isOver ? "over" : "neutral"}
        />
        <View className="flex-row items-center gap-1">
          <Text variant="caption" className="mb-1 text-bone-600">
            de
          </Text>
          <MoneyText cents={goal.targetCents} tone="muted" variant="mono" />
        </View>
      </View>

      <View className="h-2.5 overflow-hidden rounded-full bg-ink-800">
        <View
          className={`h-full rounded-full ${isOver ? "bg-ember" : "bg-flame-500"}`}
          style={{ width: `${Math.min(100, ratio * 100)}%` }}
        />
      </View>
      {progress ? (
        <Text variant="caption" className="mt-2 text-bone-600">
          {progress.projectionLabel}
        </Text>
      ) : null}
    </Card>
  );
}
