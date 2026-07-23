/**
 * Saldo consolidado de todas as contas (cabeçalho do drawer, BRIEF §7).
 * Derivado das transações vivas (income - expense) — nunca armazenado.
 */
import { useMemo } from "react";
import { signOf } from "@core/domain";
import { useTransactions } from "@features/transactions";
import { MoneyText, Text } from "@shared/ui";

export function ConsolidatedBalance() {
  const { data } = useTransactions();
  const balance = useMemo(
    () =>
      (data ?? []).reduce(
        (acc, t) => acc + (t.isProjected ? 0 : signOf(t.type) * t.amountCents),
        0,
      ),
    [data],
  );
  return (
    <>
      <Text variant="caption" className="text-bone-600">
        saldo consolidado
      </Text>
      <MoneyText
        cents={balance}
        variant="h2"
        tone={balance < 0 ? "over" : "neutral"}
      />
    </>
  );
}
