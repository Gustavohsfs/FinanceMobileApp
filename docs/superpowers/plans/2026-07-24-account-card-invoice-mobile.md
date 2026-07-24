# Account, Card, and Invoice Mobile Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let mobile users edit and delete accounts and cards, view each card’s monthly invoice, and edit or delete the transactions that determine its total.

**Architecture:** Keep API calls and TanStack Query hooks inside their owning features, while Expo Router files only compose screens. Reuse the existing transaction detail modal for invoice item mutations and add a dedicated invoice modal that filters transactions by card and cash month.

**Tech Stack:** Expo SDK 54, React Native 0.81, React 19.1, Expo Router 6, TypeScript strict, NativeWind 4, TanStack Query v5, Zod 4.

## Global Constraints

- Preserve `app/ → features/ → shared/ → core/`; one feature never imports another feature.
- Money is integer cents and input is parsed only with `@core/money.fromInput`.
- No `float`, `parseFloat`, or `toFixed` in monetary calculations.
- Server state stays in TanStack Query, never Zustand.
- All touch targets are at least 44 points and icon-only controls have accessibility labels.
- Use existing design tokens and shared UI components; no hardcoded new colors or fonts.
- Dates use `core/domain/dates.ts`, with fixed UTC-3 São Paulo arithmetic.
- No new test framework: verification is TypeScript plus Android export smoke, matching the repository’s Definition of Done.
- Complete the API plan before executing this plan.

---

## File Structure

- `src/features/accounts/api/accounts-repo.ts`: account update/delete requests.
- `src/features/accounts/api/queries.ts`: account mutation hooks and cache invalidation.
- `src/features/accounts/index.ts`: public account feature exports.
- `src/features/accounts/components/account-editor.tsx`: create/edit account form.
- `src/features/accounts/components/account-row.tsx`: account display and accessible actions.
- `src/features/credit-cards/api/credit-cards-repo.ts`: card lifecycle and invoice requests.
- `src/features/credit-cards/api/queries.ts`: card lifecycle/invoice hooks and query keys.
- `src/features/credit-cards/index.ts`: public card feature exports.
- `src/features/credit-cards/components/credit-card-editor.tsx`: create/edit card form.
- `src/features/credit-cards/components/credit-card-row.tsx`: card, invoice summary, and actions.
- `src/features/transactions/api/transactions-repo.ts`: card filter and correct PATCH array contract.
- `src/features/transactions/api/queries.ts`: invoice-item query and scoped update mutation.
- `src/app/(app)/accounts/index.tsx`: compose rows, editors, and delete confirmations.
- `src/app/(app)/_layout.tsx`: stop recreating a deleted card.
- `src/app/(modals)/invoice/[cardId].tsx`: invoice total and item list.
- `src/app/(modals)/transaction/[id].tsx`: edit amount and choose installment scope.
- `src/app/(modals)/quick-entry.tsx`: actionable no-card state.

### Task 1: Add account lifecycle repository functions and hooks

**Files:**
- Modify: `src/features/accounts/api/accounts-repo.ts`
- Create: `src/features/accounts/api/queries.ts`
- Modify: `src/features/accounts/index.ts`

**Interfaces:**
- Produces:

```ts
export interface UpdateAccountInput {
  name?: string;
  kind?: AccountKind;
  openingBalanceCents?: number;
}

export async function updateAccount(
  id: string,
  input: UpdateAccountInput,
): Promise<Account>

export async function deleteAccount(id: string): Promise<void>

useUpdateAccount()
useDeleteAccount()
```

- [ ] **Step 1: Implement repository requests**

Add:

```ts
export async function updateAccount(
  id: string,
  input: UpdateAccountInput,
): Promise<Account> {
  return toAccount(await api.patch<AccountDto>(`/v1/accounts/${id}`, input));
}

export async function deleteAccount(id: string): Promise<void> {
  await api.del(`/v1/accounts/${id}`);
}
```

Keep DTO conversion centralized in `toAccount`.

- [ ] **Step 2: Move account hooks into the feature query module**

Move the existing account queries/mutations out of `index.ts` into
`api/queries.ts`, then add update/delete mutations there. On success invalidate:

```ts
void qc.invalidateQueries({ queryKey: accountKeys.all });
void qc.invalidateQueries({ queryKey: ["transactions"] });
void qc.invalidateQueries({ queryKey: ["insights"] });
```

The delete hook accepts an account ID. The update hook accepts `{ id, input }`.
`index.ts` re-exports the public hooks and types; components inside the feature
import `../api/queries` directly and never import their own barrel.

- [ ] **Step 3: Run TypeScript verification**

Run:

```powershell
npm run typecheck
```

Expected: PASS.

- [ ] **Step 4: Commit account clients**

```powershell
git add src/features/accounts
git commit -m "feat: add mobile account lifecycle"
```

### Task 2: Add card lifecycle and invoice queries, and remove auto-recreation

**Files:**
- Modify: `src/features/credit-cards/api/credit-cards-repo.ts`
- Create: `src/features/credit-cards/api/queries.ts`
- Modify: `src/features/credit-cards/index.ts`
- Modify: `src/app/(app)/_layout.tsx`
- Modify: `src/app/(modals)/quick-entry.tsx`

**Interfaces:**
- Produces:

```ts
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

updateCreditCard(id: string, input: UpdateCreditCardInput): Promise<CreditCard>
deleteCreditCard(id: string): Promise<void>
getInvoice(id: string, month: string): Promise<Invoice>
useUpdateCreditCard()
useDeleteCreditCard()
useInvoice(cardId: string, month: string, enabled?: boolean)
```

- [ ] **Step 1: Implement lifecycle and invoice requests**

Add API calls:

```ts
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
```

Remove `ensureDefaultCreditCard`; cards are optional after this feature.

- [ ] **Step 2: Move card hooks into the feature query module**

Move the existing hooks from `index.ts` to `api/queries.ts` and use:

```ts
export const creditCardKeys = {
  all: ["credit-cards"] as const,
  invoice: (id: string, month: string) =>
    ["credit-cards", id, "invoice", month] as const,
};
```

Update/delete invalidates `creditCardKeys.all`, `["transactions"]`, and
`["insights"]`. The invoice query uses its exact invoice key and the supplied
`enabled` flag. `index.ts` only re-exports public hooks/types; feature
components import `../api/queries` directly.

- [ ] **Step 3: Stop recreating deleted cards**

Remove the `ensureDefaultCreditCard` import and call from
`src/app/(app)/_layout.tsx`. Keep `ensureDefaultAccount`, because the backend
prevents deleting the final active account.

Update the comment to state: account is guaranteed; card is user-managed and
optional.

- [ ] **Step 4: Make the quick-entry no-card error actionable**

Replace “Tente de novo em instantes” with:

```ts
"Crie um cartão em Contas e cartões antes de usar crédito."
```

Do not silently switch payment method or create a card.

- [ ] **Step 5: Run TypeScript verification**

Run:

```powershell
npm run typecheck
```

Expected: PASS with no remaining `ensureDefaultCreditCard` reference:

```powershell
rg -n "ensureDefaultCreditCard" src
```

Expected: no matches.

- [ ] **Step 6: Commit card clients and bootstrap policy**

```powershell
git add src/features/credit-cards 'src/app/(app)/_layout.tsx' 'src/app/(modals)/quick-entry.tsx'
git commit -m "feat: manage optional mobile credit cards"
```

### Task 3: Correct scoped transaction updates and add invoice filtering

**Files:**
- Modify: `src/features/transactions/api/transactions-repo.ts`
- Modify: `src/features/transactions/api/queries.ts`
- Modify: `src/features/transactions/index.ts`

**Interfaces:**
- Produces:

```ts
export interface TransactionFilters {
  creditCardId?: string;
  // existing filters remain
}

export async function updateTransaction(
  id: string,
  patch: Partial<Transaction>,
  scope: EditScope = "ONE",
): Promise<Transaction[]>

export function useInvoiceTransactions(
  creditCardId: string,
  monthKey: string,
  enabled?: boolean,
): UseQueryResult<Transaction[]>
```

- [ ] **Step 1: Add the card query parameter**

Add `creditCardId?: string` to `TransactionFilters` and send it through
`listTransactions`:

```ts
creditCardId: filters.creditCardId,
```

- [ ] **Step 2: Correct the PATCH response contract**

Replace the single-object parser with:

```ts
export async function updateTransaction(
  id: string,
  patch: Partial<Transaction>,
  scope: EditScope = "ONE",
): Promise<Transaction[]> {
  const updated = await api.patch<TransactionDto[]>(
    `/v1/transactions/${id}?scope=${scope.toLowerCase()}`,
    patch,
  );
  return updated.map(toTransaction);
}
```

Do not cast an array to `TransactionDto`. Existing callers that ignore the
return remain compatible.

- [ ] **Step 3: Make update scope explicit in the hook**

Change the mutation variables to:

```ts
{
  id: string;
  patch: Partial<Transaction>;
  scope?: EditScope;
}
```

and call `updateTransaction(id, patch, scope ?? "ONE")`. Invalidate
`["transactions"]`, `["insights"]`, and `["credit-cards"]` after update/delete.

- [ ] **Step 4: Add the invoice-items query**

Use `monthRangeUTC(monthKey)` and:

```ts
listTransactions({
  creditCardId,
  from,
  to,
  type: "EXPENSE",
  method: "CREDIT",
  basis: "CASH",
})
```

The API adapter currently uses uppercase domain basis converted by `basisParam`;
preserve that convention. Key the query as:

```ts
["transactions", "invoice", creditCardId, monthKey]
```

- [ ] **Step 5: Run TypeScript verification**

Run:

```powershell
npm run typecheck
```

Expected: PASS, including existing income confirmation callers.

- [ ] **Step 6: Commit transaction contract fixes**

```powershell
git add src/features/transactions
git commit -m "fix: align mobile transaction update contract"
```

### Task 4: Extract account and card editors with accessible actions

**Files:**
- Create: `src/features/accounts/components/account-editor.tsx`
- Create: `src/features/accounts/components/account-row.tsx`
- Modify: `src/features/accounts/index.ts`
- Create: `src/features/credit-cards/components/credit-card-editor.tsx`
- Create: `src/features/credit-cards/components/credit-card-row.tsx`
- Modify: `src/features/credit-cards/index.ts`
- Modify: `src/app/(app)/accounts/index.tsx`

**Interfaces:**
- Consumes account/card hooks from Tasks 1–2.
- Produces:

```ts
interface AccountEditorProps {
  account?: Account;
  onCancel(): void;
  onSaved(): void;
}

interface AccountRowProps {
  account: Account;
  onEdit(): void;
  onDelete(): void;
}

interface CreditCardEditorProps {
  card?: CreditCard;
  accounts: readonly Account[];
  onCancel(): void;
  onSaved(): void;
}

interface CreditCardRowProps {
  card: CreditCard;
  month: string;
  onEdit(): void;
  onDelete(): void;
  onOpenInvoice(): void;
}
```

- [ ] **Step 1: Extract the account editor**

Move the current account form state and validation into `AccountEditor`. Import
hooks from `../api/queries`. Create
mode calls `useCreateAccount`; edit mode preloads the account and calls
`useUpdateAccount`.

Use `fromInput(balance || "0")`. Labels are “Criar conta” or “Salvar
alterações”. API errors remain visible in the editor instead of closing it.

- [ ] **Step 2: Extract the card editor**

Move the card form and day validation into `CreditCardEditor`. Import hooks
from `../api/queries`. Unlike the
current screen, expose an account selection using the existing
`SegmentedControl` when there are few accounts or a vertical list of accessible
pressables when labels would be truncated. Editing preloads all fields.

- [ ] **Step 3: Build accessible rows**

Each row preserves the existing icon, labels, and `MoneyText`, then adds two
44×44 `Pressable` controls:

```tsx
<Pressable accessibilityRole="button" accessibilityLabel={`editar ${name}`}>
  <Icon name="pencil" />
</Pressable>
<Pressable accessibilityRole="button" accessibilityLabel={`excluir ${name}`}>
  <Icon name="trash" />
</Pressable>
```

`CreditCardRow` also uses `useInvoice(card.id, month)` to display the current
total/status and a full-width “Ver fatura” action.

- [ ] **Step 4: Compose editing and confirmation in the route**

The route owns only selection state:

```ts
const [editingAccountId, setEditingAccountId] = useState<string | null>(null);
const [editingCardId, setEditingCardId] = useState<string | null>(null);
const [deleteTarget, setDeleteTarget] = useState<
  { kind: "account" | "card"; id: string; name: string } | null
>(null);
```

Show an inline confirmation panel with explicit “Sim, excluir” and “Cancelar”.
Keep it visible on a 409 error and render the API detail. Historical data
preservation is stated in the confirmation copy.

- [ ] **Step 5: Link cards to the invoice modal**

Use:

```ts
router.push({
  pathname: "/(modals)/invoice/[cardId]",
  params: { cardId: card.id, month },
});
```

Read the selected month from `usePeriodStore`; do not calculate it separately in
the component.

- [ ] **Step 6: Run TypeScript verification**

Run:

```powershell
npm run typecheck
```

Expected: PASS and `src/app/(app)/accounts/index.tsx` is primarily composition,
not duplicated form logic.

- [ ] **Step 7: Commit account/card UI**

```powershell
git add src/features/accounts src/features/credit-cards 'src/app/(app)/accounts/index.tsx'
git commit -m "feat: edit and delete accounts and cards"
```

### Task 5: Add the monthly invoice modal

**Files:**
- Create: `src/app/(modals)/invoice/[cardId].tsx`

**Interfaces:**
- Consumes:

```ts
useInvoice(cardId, month, true)
useInvoiceTransactions(cardId, month, true)
useCreditCards()
useCategories()
TransactionRow
```

- [ ] **Step 1: Parse route parameters and load data**

Read:

```ts
const { cardId, month } = useLocalSearchParams<{
  cardId: string;
  month: string;
}>();
```

Find the card in the cached card query. Load total and items with their exact
hooks. If either parameter is missing, render an error state with a close
button.

- [ ] **Step 2: Render total, status, and states**

Compose a bottom modal matching the transaction detail visual language:

- card name and month label;
- `MoneyText` with `invoice.totalCents`;
- badge “aberta” or “fechada”;
- loading placeholders;
- retry actions when either query errors;
- `EmptyState` with “nenhuma compra nesta fatura”.

No client-side sum is authoritative; always display the invoice endpoint total.

- [ ] **Step 3: Render invoice transactions**

Render `TransactionRow` for each item. Its `onPress` pushes:

```ts
router.push(`/(modals)/transaction/${transaction.id}`);
```

Use the existing category lookup. The list is already filtered by card, credit
method, cash basis, and month in the query hook.

- [ ] **Step 4: Run TypeScript verification**

Run:

```powershell
npm run typecheck
```

Expected: PASS.

- [ ] **Step 5: Commit the invoice modal**

```powershell
git add 'src/app/(modals)/invoice'
git commit -m "feat: show mobile credit card invoices"
```

### Task 6: Add scoped amount editing to transaction detail

**Files:**
- Modify: `src/app/(modals)/transaction/[id].tsx`

**Interfaces:**
- Consumes: `useUpdateTransaction`, `fromInput`, `EditScope`.
- Preserves existing scoped deletion.

- [ ] **Step 1: Add edit state**

Add:

```ts
const update = useUpdateTransaction();
const [editingAmount, setEditingAmount] = useState(false);
const [amountInput, setAmountInput] = useState("");
const [pendingAction, setPendingAction] = useState<"update" | "delete" | null>(null);
const [error, setError] = useState<string | null>(null);
```

Entering edit mode initializes `amountInput` with
`formatCompactNumber(tx.amountCents)`.

- [ ] **Step 2: Validate and persist a simple edit**

Parse with `fromInput`. Reject zero/negative values inline. For a simple
transaction call:

```ts
await update.mutateAsync({
  id: tx.id,
  patch: { amountCents },
  scope: "ONE",
});
```

Close edit mode only after success.

- [ ] **Step 3: Reuse the scope choices for installment edits**

When the transaction has `installmentGroupId`, set `pendingAction` to
`"update"`. Render the same three buttons already used for delete and call the
update mutation with `ONE`, `FUTURE`, or `ALL`. Keep delete behavior unchanged,
distinguishing actions by `pendingAction`.

- [ ] **Step 4: Invalidate and show the refreshed value**

The mutation hook invalidates transaction detail, invoice items, invoice total,
and insights. Do not mutate the displayed total locally. On failure show the
`ApiRequestError.message` and preserve the typed value.

- [ ] **Step 5: Run full mobile verification**

Run:

```powershell
npm run typecheck
npx expo export -p android --output-dir dist-smoke
git diff --check
```

Expected: TypeScript PASS and Android bundle export completes without route or
Metro resolution errors.

- [ ] **Step 6: Commit transaction editing**

```powershell
git add 'src/app/(modals)/transaction/[id].tsx' src/features/transactions
git commit -m "feat: edit mobile invoice transactions"
```

## Final Review Gate

- Confirm deleting the last card persists across app restarts and login.
- Confirm the last account is rejected by the API with actionable copy.
- Confirm edit/delete account and card controls have 44-point targets and labels.
- Confirm card invoice total comes from the invoice endpoint, not a client sum.
- Confirm invoice items use `creditCardId`, credit method, cash basis, and São Paulo month.
- Confirm installment update/delete asks `ONE`, `FUTURE`, or `ALL`.
- Confirm the PATCH response is parsed as `TransactionDto[]`.
- Confirm `npm run typecheck` and Android export smoke pass.
