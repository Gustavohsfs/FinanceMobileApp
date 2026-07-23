/**
 * Estado de UI do período e da base de agregação (Zustand — BRIEF §2.2).
 * NUNCA guardar estado de servidor aqui (guardrail §8.10) — só contexto de
 * visualização. O toggle competência/caixa é global e PERSISTE (BRIEF §6.5).
 */
import { create } from "zustand";
import { addMonthsToKey, currentMonthKey } from "@core/domain";
import type { AggregationBasis } from "@core/domain";
import { kv } from "@core/storage";

const BASIS_KEY = "fluxo.pref.basis";

interface PeriodState {
  monthKey: string;
  basis: AggregationBasis;
  goToPrevMonth: () => void;
  goToNextMonth: () => void;
  setMonth: (key: string) => void;
  setBasis: (basis: AggregationBasis) => void;
  hydrateBasis: () => Promise<void>;
}

export const usePeriodStore = create<PeriodState>((set, get) => ({
  monthKey: currentMonthKey(),
  basis: "ACCRUAL",
  goToPrevMonth: () => set({ monthKey: addMonthsToKey(get().monthKey, -1) }),
  goToNextMonth: () => set({ monthKey: addMonthsToKey(get().monthKey, 1) }),
  setMonth: (key) => set({ monthKey: key }),
  setBasis: (basis) => {
    set({ basis });
    void kv.set(BASIS_KEY, basis);
  },
  hydrateBasis: async () => {
    const stored = await kv.getString(BASIS_KEY);
    if (stored === "ACCRUAL" || stored === "CASH") set({ basis: stored });
  },
}));
