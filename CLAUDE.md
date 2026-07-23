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
- NativeWind v4 (Tailwind **v3.4**, não v4) · react-native-svg + Skia p/ gráficos
- @tanstack/react-query (estado de servidor) · zustand (estado de UI)
- react-hook-form + zod · victory-native (charts) · @shopify/flash-list
- date-fns + @date-fns/tz (America/Sao_Paulo)

### Fase atual: **app-only, sem backend**

Não há servidor ainda (NestJS entra numa fase futura — BRIEF §12). Toda a
persistência é local via `core/storage` (AsyncStorage por baixo, atrás de uma
interface). Isso é uma decisão para manter o app **testável no Expo Go** (sem
build nativa). Trocas planejadas quando o backend entrar:

- `react-native-mmkv` no lugar de AsyncStorage em `core/storage/kv.ts` (só este arquivo muda).
- Repositórios locais (`features/*/api/*-repo.ts`) passam a chamar `core/api/client.ts`.
- `features/auth` troca o mock por JWT access+refresh reais (o contrato já está desenhado).

Não introduza dependência de backend sem atualizar o BRIEF e esta seção.

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
