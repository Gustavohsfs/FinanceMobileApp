# CLAUDE.md — Fluxo (app financeiro pessoal)

> Antes de escrever código: leia `BRIEF-app-financeiro.md` (fonte da verdade) e,
> quando existir, a spec da fase corrente em `docs/specs/NN-*.md`.

## Stack (versões travadas)

- Expo SDK **54** · React Native 0.81 · React 19.1 · expo-router 6 · New Architecture
  - Rebaixado de SDK 57 → 54 porque o **Expo Go das lojas só suporta SDK 54**
    (SDK 57 dava "Project is incompatible"). Não volte para 57 sem migrar para
    dev/EAS build. Use `expo install --fix` ao mexer em versões.
  - Helpers de conteúdo do drawer (`DrawerContentScrollView`, `DrawerItemList`,
    `DrawerContentComponentProps`) vêm de `@react-navigation/drawer` (permitido no
    SDK 54; proibido a partir do 56). `Drawer` vem de `expo-router/drawer`.
- TypeScript **strict** (`strict`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`)
- Expo Router (file-based) — Drawer + Stack + modais · dir de rotas: `src/app`
- **Datas: NÃO use `@date-fns/tz`/`TZDate` nem `Intl` para calendário.** O Hermes
  não suporta `timeZoneName: 'longOffset'` e a TZDate gerava datas erradas no
  dispositivo (ex.: "dezembro de 2025" em pleno julho/2026). `core/domain/dates.ts`
  usa offset fixo UTC-3 (Brasil sem DST desde 2019) com aritmética pura — é o
  único lugar que converte fuso. `Intl.NumberFormat` (BRL) pode, funciona no Hermes.
- NativeWind v4 (Tailwind **v3.4**, não v4) · react-native-svg + Skia p/ gráficos
- @tanstack/react-query (estado de servidor) · zustand (estado de UI)
- react-hook-form + zod · victory-native (charts) · @shopify/flash-list
- date-fns + @date-fns/tz (America/Sao_Paulo)

### Fase atual: **integrado ao backend NestJS**

O app fala com a API NestJS (`EXPO_PUBLIC_API_URL`, sem `/v1` na base). Contrato
em `/docs/openapi.json`. Pontos-chave:

- **Auth** JWT: access 15m + refresh rotativo. `core/api/session.ts` guarda tokens
  (memória + SecureStore); `core/api/client.ts` injeta Bearer e **renova sozinho
  em 401** (single-flight); se o refresh falha, limpa sessão e derruba pro login.
- **Erros** em RFC 7807 Problem Details (`application/problem+json`) → `ApiRequestError`
  com `code`/`message`/`fieldErrors`.
- **Criação de transação** exige header `idempotency-key` (guardrail §8.6) e o
  **backend gera as parcelas** a partir de `installmentTotal` (retorna o array).
  Crédito **exige `creditCardId`**; parcelamento exige crédito.
- **Agregações** do dashboard vêm dos endpoints `/v1/insights/*` (o servidor é a
  fonte da verdade; o app só apresenta). Listas usam `GET /v1/transactions?from&to&basis`.
- Backend semeia categorias no registro, mas **não** conta nem cartão — o app
  garante ambos no login (`ensureDefaultAccount`, `ensureDefaultCreditCard`).
- `kv` (AsyncStorage) guarda só preferências de UI (base, biometria). Tokens só no
  SecureStore. `react-native-mmkv` continua adiado (Expo Go). Roda no Expo Go SDK 54.

Storage AsyncStorage segue atrás de `core/storage/kv.ts`; trocar por MMKV = só esse arquivo.

## Regra de dependência entre camadas

`app/` → `features/` → `shared/` → `core/`. **Nunca o contrário.**
Uma feature **não** importa de outra feature; o comum sobe para `shared/`.
`src/app/` é só roteamento e composição. Exceção documentada: `shared/bootstrap.ts`
(seeder de 1ª execução) compõe dados usando só `core/` — não importa features.

## Os 10 guardrails (BRIEF §8) — invioláveis

1. Nenhum `float`/`parseFloat`/`toFixed` em cálculo monetário. Só inteiros em centavos.
2. Nenhum cálculo de dinheiro dentro de componente. Regra vive em `core/domain` ou `core/money`, pura e sem I/O.
3. Nenhum token em AsyncStorage/MMKV. Só `expo-secure-store` (`core/storage/secure.ts`).
4. Nenhum dado sensível em log/console em produção.
5. Nenhum delete físico. Soft delete sempre (`deletedAt`).
6. Toda mutação de criação leva `Idempotency-Key` (`core/id`).
7. Toda soma de parcelas fecha exatamente com o total (`splitInstallments`).
8. Todo valor projetado é visualmente distinto do efetivado (`isProjected`).
9. Toda data agregada respeita `America/Sao_Paulo` (`core/domain/dates.ts`).
10. Nenhum estado de servidor no Zustand — isso é papel do React Query.

## Design system (BRIEF §4) — zero cor/fonte hardcoded

- Paleta fechada preto/laranja/branco em `tailwind.config.js` e `core/theme/tokens.ts`.
- Fontes: **Sora** (display), **Inter** (interface), **JetBrains Mono** (números).
- Todo dinheiro em lista/tabela usa `tabular-nums` (use `<MoneyText/>`).
- Laranja = saída/ação. Branco = neutro/entrada. Verde/vermelho só pontuais.
- Componentes prontos em `src/shared/ui` (Button, Card, Input, Chip, MoneyText, EmptyState, Badge, SegmentedControl, Screen, Text, Icon).

## Convenções

- Arquivos `kebab-case`; componentes `PascalCase`; hooks `useX`; schemas zod `xSchema`.
- Cada feature expõe superfície pública só pelo `index.ts` (barrel).
- Imports por alias: `@core/*`, `@shared/*`, `@features/*`.
- Commits em **Conventional Commits** (`feat:`, `fix:`, `chore:`…).

## Comandos

- `npm start` — inicia o Metro (abra no Expo Go via QR code).
- `npm run typecheck` — `tsc --noEmit` (deve passar sempre).
- `npx expo export -p android --output-dir dist-smoke` — smoke test de bundle.

## Definition of Done (BRIEF §11)

TS sem erro e sem `any` · guardrails §8 respeitados · loading/erro/vazio desenhados ·
tokens do DS (zero hardcode) · iOS e Android · toque ≥ 44pt + labels de a11y · Conventional Commit.
