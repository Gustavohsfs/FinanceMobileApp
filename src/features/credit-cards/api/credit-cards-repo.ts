/**
 * Repositório de cartões de crédito — API NestJS. Pagamento no crédito (e todo
 * parcelamento) exige um cartão no backend, então garantimos um cartão default
 * após o login, como fazemos com a conta.
 */
import { api } from "@core/api";

export interface CreditCard {
  id: string;
  userId: string;
  accountId: string;
  name: string;
  limitCents: number;
  closingDay: number;
  dueDay: number;
}

export async function listCreditCards(): Promise<CreditCard[]> {
  return api.get<CreditCard[]>("/v1/credit-cards");
}

export interface CreateCreditCardInput {
  accountId: string;
  name: string;
  limitCents: number;
  closingDay: number;
  dueDay: number;
}

export async function createCreditCard(
  input: CreateCreditCardInput,
): Promise<CreditCard> {
  return api.post<CreditCard>("/v1/credit-cards", input);
}

/** Garante ao menos um cartão (usa a primeira conta). */
export async function ensureDefaultCreditCard(): Promise<void> {
  const cards = await api.get<CreditCard[]>("/v1/credit-cards");
  if (cards.length > 0) return;
  const accounts = await api.get<{ id: string }[]>("/v1/accounts");
  const accountId = accounts[0]?.id;
  if (!accountId) return;
  await createCreditCard({
    accountId,
    name: "Meu cartão",
    limitCents: 500000,
    closingDay: 25,
    dueDay: 10,
  });
}
