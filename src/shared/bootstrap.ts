/**
 * Semeadura de primeira execução (BRIEF §6.3). Cria categorias e contas semente
 * e — só para esta fase de testes sem backend — um conjunto de lançamentos de
 * exemplo para que dashboard e gráficos tenham o que mostrar. O usuário pode
 * limpar tudo em Configurações.
 *
 * Módulo self-contained: depende só de core/ e das constantes compartilhadas.
 * Não importa nenhuma feature (respeita a regra de dependência do BRIEF §3).
 */
import { kv } from "@core/storage";
import { newId } from "@core/id";
import {
  SEED_EXPENSE_CATEGORIES,
  SEED_INCOME_CATEGORIES,
  SEED_ACCOUNTS,
  buildTransactions,
  currentMonthKey,
  addMonthsToKey,
  nowISO,
} from "@core/domain";
import type { Account, Category, Goal, Transaction } from "@core/domain";
import { STORAGE_KEYS, LOCAL_USER_ID } from "./constants";

function isoInMonth(monthKey: string, day: number): string {
  const [y, m] = monthKey.split("-").map(Number);
  // 15:00 UTC ≈ 12:00 America/Sao_Paulo — evita virar o dia/mês por fuso.
  return new Date(Date.UTC(y ?? 1970, (m ?? 1) - 1, day, 15, 0, 0)).toISOString();
}

export async function isSeeded(): Promise<boolean> {
  return (await kv.getString(STORAGE_KEYS.seeded)) === "1";
}

export async function ensureSeeded(): Promise<void> {
  if (await isSeeded()) return;

  // 1) categorias
  const expenseCats: Category[] = SEED_EXPENSE_CATEGORIES.map((c) => ({
    id: newId(),
    userId: LOCAL_USER_ID,
    isArchived: false,
    ...c,
  }));
  const incomeCats: Category[] = SEED_INCOME_CATEGORIES.map((c) => ({
    id: newId(),
    userId: LOCAL_USER_ID,
    isArchived: false,
    ...c,
  }));
  const categories = [...expenseCats, ...incomeCats];
  await kv.setJSON(STORAGE_KEYS.categories, categories);

  // 2) contas
  const accounts: Account[] = SEED_ACCOUNTS.map((a) => ({
    id: newId(),
    userId: LOCAL_USER_ID,
    ...a,
  }));
  await kv.setJSON(STORAGE_KEYS.accounts, accounts);

  // 3) lançamentos de exemplo (2 meses anteriores + mês atual)
  const checking = accounts[0]!.id;
  const catByName = (name: string) =>
    categories.find((c) => c.name === name)!.id;
  const deps = { newId, now: nowISO };
  const txs: Transaction[] = [];

  const months = [
    addMonthsToKey(currentMonthKey(), -2),
    addMonthsToKey(currentMonthKey(), -1),
    currentMonthKey(),
  ];

  for (const mk of months) {
    // salário (entrada)
    txs.push(
      ...buildTransactions(
        {
          userId: LOCAL_USER_ID,
          type: "INCOME",
          amountCents: 780000,
          description: "Salário",
          occurredAt: isoInMonth(mk, 5),
          settledAt: null,
          categoryId: catByName("Salário"),
          accountId: checking,
          paymentMethod: "PIX",
          installments: 1,
        },
        deps,
      ),
    );
    // mercado (algumas idas)
    for (const [day, cents] of [
      [3, 18790],
      [11, 24310],
      [19, 15680],
      [26, 30120],
    ] as const) {
      txs.push(
        ...buildTransactions(
          {
            userId: LOCAL_USER_ID,
            type: "EXPENSE",
            amountCents: cents,
            description: "Mercado",
            occurredAt: isoInMonth(mk, day),
            settledAt: null,
            categoryId: catByName("Mercado"),
            accountId: checking,
            paymentMethod: "DEBIT",
            installments: 1,
          },
          deps,
        ),
      );
    }
    // transporte, lazer, assinaturas
    txs.push(
      ...buildTransactions(
        {
          userId: LOCAL_USER_ID,
          type: "EXPENSE",
          amountCents: 9990,
          description: "Streaming",
          occurredAt: isoInMonth(mk, 8),
          settledAt: null,
          categoryId: catByName("Assinaturas"),
          accountId: checking,
          paymentMethod: "CREDIT",
          installments: 1,
        },
        deps,
      ),
      ...buildTransactions(
        {
          userId: LOCAL_USER_ID,
          type: "EXPENSE",
          amountCents: 6400,
          description: "Uber",
          occurredAt: isoInMonth(mk, 14),
          settledAt: null,
          categoryId: catByName("Transporte"),
          accountId: checking,
          paymentMethod: "PIX",
          installments: 1,
        },
        deps,
      ),
      ...buildTransactions(
        {
          userId: LOCAL_USER_ID,
          type: "EXPENSE",
          amountCents: 12800,
          description: "Cinema e jantar",
          occurredAt: isoInMonth(mk, 21),
          settledAt: null,
          categoryId: catByName("Lazer"),
          accountId: checking,
          paymentMethod: "CREDIT",
          installments: 1,
        },
        deps,
      ),
    );
  }

  // compra parcelada 3x no crédito (mês anterior) — gera 3 registros ligados,
  // com a última parcela ainda projetada.
  txs.push(
    ...buildTransactions(
      {
        userId: LOCAL_USER_ID,
        type: "EXPENSE",
        amountCents: 100000,
        description: "Fone de ouvido 3x",
        occurredAt: isoInMonth(addMonthsToKey(currentMonthKey(), -1), 15),
        settledAt: null,
        categoryId: catByName("Outros"),
        accountId: checking,
        paymentMethod: "CREDIT",
        installments: 3,
      },
      deps,
    ),
  );

  await kv.setJSON(STORAGE_KEYS.transactions, txs);

  // orçamento de exemplo em Mercado, para exercitar "orçamento estourado"
  const mercado = categories.find((c) => c.name === "Mercado");
  if (mercado) {
    mercado.monthlyBudgetCents = 80000;
    await kv.setJSON(STORAGE_KEYS.categories, categories);
  }

  // metas de exemplo (uma de guardar, uma de limite de gasto)
  const goals: Goal[] = [
    {
      id: newId(),
      userId: LOCAL_USER_ID,
      name: "Reserva de emergência",
      kind: "SAVING",
      targetCents: 500000,
      startDate: isoInMonth(addMonthsToKey(currentMonthKey(), -2), 1),
      deadline: isoInMonth(addMonthsToKey(currentMonthKey(), 4), 28),
      recurrence: "ONCE",
    },
    {
      id: newId(),
      userId: LOCAL_USER_ID,
      name: "Segurar o mercado",
      kind: "SPEND_LIMIT",
      targetCents: 80000,
      ...(mercado ? { categoryId: mercado.id } : {}),
      startDate: isoInMonth(currentMonthKey(), 1),
      deadline: isoInMonth(currentMonthKey(), 28),
      recurrence: "MONTHLY",
    },
  ];
  await kv.setJSON(STORAGE_KEYS.goals, goals);

  await kv.set(STORAGE_KEYS.seeded, "1");
}

/** Limpa dados de negócio e refaz a semeadura (usado em Configurações). */
export async function resetData(): Promise<void> {
  await kv.delete(STORAGE_KEYS.transactions);
  await kv.delete(STORAGE_KEYS.categories);
  await kv.delete(STORAGE_KEYS.accounts);
  await kv.delete(STORAGE_KEYS.goals);
  await kv.delete(STORAGE_KEYS.seeded);
  await ensureSeeded();
}
