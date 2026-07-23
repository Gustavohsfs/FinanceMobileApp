/**
 * Categorias e contas semente, criadas na primeira execução (BRIEF §6.3).
 * As cores saem do design system (laranja + neutros; verde/vermelho pontuais).
 */
import type { Account, Category } from "./types";

type SeedCategory = Pick<Category, "name" | "icon" | "color" | "type">;

export const SEED_EXPENSE_CATEGORIES: SeedCategory[] = [
  { name: "Mercado", icon: "shopping-cart", color: "#FF6A00", type: "EXPENSE" },
  { name: "Transporte", icon: "bus", color: "#FF8A2B", type: "EXPENSE" },
  { name: "Moradia", icon: "house", color: "#A1A1AA", type: "EXPENSE" },
  { name: "Saúde", icon: "heart-pulse", color: "#2FBF71", type: "EXPENSE" },
  { name: "Lazer", icon: "party-popper", color: "#FF6A00", type: "EXPENSE" },
  { name: "Educação", icon: "graduation-cap", color: "#FF8A2B", type: "EXPENSE" },
  { name: "Assinaturas", icon: "repeat", color: "#A1A1AA", type: "EXPENSE" },
  { name: "Outros", icon: "ellipsis", color: "#52525B", type: "EXPENSE" },
];

export const SEED_INCOME_CATEGORIES: SeedCategory[] = [
  { name: "Salário", icon: "wallet", color: "#2FBF71", type: "INCOME" },
  { name: "Freela", icon: "laptop", color: "#FF8A2B", type: "INCOME" },
  { name: "Rendimentos", icon: "trending-up", color: "#2FBF71", type: "INCOME" },
  { name: "Outros", icon: "ellipsis", color: "#52525B", type: "INCOME" },
];

export const SEED_ACCOUNTS: Pick<Account, "name" | "kind" | "openingBalanceCents">[] = [
  { name: "Conta corrente", kind: "CHECKING", openingBalanceCents: 0 },
  { name: "Carteira", kind: "CASH", openingBalanceCents: 0 },
];
