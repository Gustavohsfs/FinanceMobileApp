/**
 * Saldo do mês corrente no cabeçalho do drawer (BRIEF §7). Vem do endpoint de
 * summary do backend — derivado, nunca armazenado.
 */
import { currentMonthKey } from "@core/domain";
import { usePeriodStore } from "@shared/stores/period-store";
import { MoneyText, Text } from "@shared/ui";
import { useSummary } from "../api/insights";

export function ConsolidatedBalance() {
  const basis = usePeriodStore((s) => s.basis);
  const { data } = useSummary(currentMonthKey(), basis);
  const balance = data?.balanceCents ?? 0;
  return (
    <>
      <Text variant="caption" className="text-bone-600">
        saldo do mês
      </Text>
      <MoneyText
        cents={balance}
        variant="h2"
        tone={balance < 0 ? "over" : "neutral"}
      />
    </>
  );
}
