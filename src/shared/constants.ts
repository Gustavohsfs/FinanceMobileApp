/**
 * Constantes compartilhadas. Chaves de armazenamento local centralizadas para
 * que repositórios de feature e o seeder de primeira execução apontem para o
 * mesmo lugar sem que uma feature precise importar de outra.
 */
export const STORAGE_KEYS = {
  transactions: "fluxo.col.transactions",
  categories: "fluxo.col.categories",
  accounts: "fluxo.col.accounts",
  goals: "fluxo.col.goals",
  seeded: "fluxo.flag.seeded",
} as const;

/** Usuário único da fase local. Vira o `sub` do JWT quando o backend entrar. */
export const LOCAL_USER_ID = "local-user";
