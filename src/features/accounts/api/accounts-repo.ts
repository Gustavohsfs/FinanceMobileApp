import { api } from "@core/api";
import type { Account, AccountKind } from "@core/domain";

interface AccountDto {
  id: string;
  userId: string;
  name: string;
  kind: AccountKind;
  openingBalanceCents: number;
  currency: string;
}

function toAccount(d: AccountDto): Account {
  return {
    id: d.id,
    userId: d.userId,
    name: d.name,
    kind: d.kind,
    openingBalanceCents: d.openingBalanceCents,
  };
}

export async function listAccounts(): Promise<Account[]> {
  const dtos = await api.get<AccountDto[]>("/v1/accounts");
  return dtos.map(toAccount);
}

export interface CreateAccountInput {
  name: string;
  kind: AccountKind;
  openingBalanceCents: number;
}

export async function createAccount(input: CreateAccountInput): Promise<Account> {
  return toAccount(await api.post<AccountDto>("/v1/accounts", input));
}

/**
 * Garante ao menos uma conta. O backend cria categorias-semente no registro,
 * mas NÃO cria conta — e toda transação exige accountId. Chamado após o login.
 */
export async function ensureDefaultAccount(): Promise<void> {
  const list = await api.get<AccountDto[]>("/v1/accounts");
  if (list.length === 0) {
    await api.post("/v1/accounts", {
      name: "Conta corrente",
      kind: "CHECKING",
      openingBalanceCents: 0,
    });
  }
}
