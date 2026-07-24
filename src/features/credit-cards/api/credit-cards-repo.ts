/** Repositório de cartões de crédito — API NestJS. */
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

export interface UpdateCreditCardInput {
  accountId?: string;
  name?: string;
  limitCents?: number;
  closingDay?: number;
  dueDay?: number;
}

export interface Invoice {
  creditCardId: string;
  month: string;
  totalCents: number;
  status: "OPEN" | "CLOSED";
}

export async function updateCreditCard(
  id: string,
  input: UpdateCreditCardInput,
): Promise<CreditCard> {
  return api.patch<CreditCard>(`/v1/credit-cards/${id}`, input);
}

export async function deleteCreditCard(id: string): Promise<void> {
  await api.del(`/v1/credit-cards/${id}`);
}

export async function getInvoice(id: string, month: string): Promise<Invoice> {
  return api.get<Invoice>(`/v1/credit-cards/${id}/invoices`, { month });
}
