/**
 * core/domain — entidades e enums do domínio financeiro (BRIEF §5.2).
 * Tipos puros, sem dependência de I/O nem de framework.
 */
import type { Cents } from "@core/money";

export type TransactionType = "INCOME" | "EXPENSE" | "TRANSFER";
export type PaymentMethod = "CASH" | "PIX" | "DEBIT" | "CREDIT";
export type CategoryType = "INCOME" | "EXPENSE";
export type AccountKind = "CHECKING" | "CASH" | "SAVINGS" | "INVESTMENT";
export type GoalKind = "SAVING" | "INVESTMENT" | "SPEND_LIMIT";
export type Recurrence = "ONCE" | "MONTHLY";

/** Todas as datas trafegam como ISO 8601 (UTC) no wire. */
export type ISODate = string;

export interface Transaction {
  id: string;
  userId: string;
  type: TransactionType;
  /** Sempre POSITIVO; o sinal econômico vem do `type`. */
  amountCents: Cents;
  description: string;
  /** Quando aconteceu (competência). */
  occurredAt: ISODate;
  /** Quando afeta o caixa (fatura, compensação). null = mesma data. */
  settledAt: ISODate | null;
  categoryId: string;
  accountId: string;
  paymentMethod: PaymentMethod;
  creditCardId?: string;
  /** Agrupa parcelas da mesma compra. */
  installmentGroupId?: string;
  installmentNumber?: number; // 1..N
  installmentTotal?: number; // N
  /** true para parcelas futuras / lançamentos previstos. */
  isProjected: boolean;
  /** Origem do lançamento (manual, recorrência, open finance). */
  source?: "MANUAL" | "RECURRENCE" | "OPEN_FINANCE";
  recurrenceId?: string | null;
  /** Moeda modelada desde já (BRIEF §12); default BRL. */
  currency: string;
  notes?: string | null;
  createdAt: ISODate;
  updatedAt: ISODate;
  deletedAt: ISODate | null; // soft delete
}

export interface Category {
  id: string;
  userId: string;
  name: string;
  icon: string; // nome do ícone lucide
  color: string; // hex do design system
  type: CategoryType;
  parentId?: string; // subcategorias, 1 nível só
  monthlyBudgetCents?: Cents;
  isArchived: boolean;
}

export interface Account {
  id: string;
  userId: string;
  name: string;
  kind: AccountKind;
  openingBalanceCents: Cents;
}

export interface CreditCard {
  id: string;
  userId: string;
  name: string;
  limitCents: Cents;
  closingDay: number; // 1..31
  dueDay: number; // 1..31
  accountId: string;
}

export interface Goal {
  id: string;
  userId: string;
  name: string;
  kind: GoalKind;
  targetCents: Cents;
  categoryId?: string; // obrigatório quando kind = SPEND_LIMIT
  startDate: ISODate;
  deadline: ISODate;
  recurrence: Recurrence;
}

/** Sinal econômico de um tipo de transação: +1 entra, -1 sai. */
export function signOf(type: TransactionType): 1 | -1 | 0 {
  switch (type) {
    case "INCOME":
      return 1;
    case "EXPENSE":
      return -1;
    case "TRANSFER":
      return 0;
  }
}

export const PAYMENT_METHOD_LABEL: Record<PaymentMethod, string> = {
  CASH: "dinheiro",
  PIX: "pix",
  DEBIT: "débito",
  CREDIT: "crédito",
};

export const GOAL_KIND_LABEL: Record<GoalKind, string> = {
  SAVING: "guardar",
  INVESTMENT: "investir",
  SPEND_LIMIT: "limite de gasto",
};

export const ACCOUNT_KIND_LABEL: Record<AccountKind, string> = {
  CHECKING: "conta corrente",
  CASH: "dinheiro",
  SAVINGS: "poupança",
  INVESTMENT: "investimento",
};
