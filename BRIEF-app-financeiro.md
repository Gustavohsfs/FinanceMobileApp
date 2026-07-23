# BRIEF MESTRE — App Financeiro Pessoal (React Native + Expo)

> Documento de Spec-Driven Development. Serve como fonte da verdade para o Claude Code.
> Codinome sugerido: **Fluxo** (troque livremente). Bundle id sugerido: `br.com.ght.fluxo`.

---

## 0. Como usar este brief

1. Coloque este arquivo em `docs/BRIEF.md` (fora do repo público se preferir, via `.git/info/exclude`, como no ghtpromo).
2. Gere o `CLAUDE.md` a partir da seção 9 deste documento.
3. Instale as **Expo Skills** oficiais para agentes de IA (`expo` publica skills próprias — use a `expo-upgrade` e as de setup) antes de qualquer scaffolding.
4. Trabalhe por fases (seção 10). Cada fase vira uma spec própria em `docs/specs/NN-nome.md` antes de virar código.
5. Regra dura: **nenhuma feature começa sem spec aprovada**; nenhuma spec é aprovada sem critérios de aceite verificáveis.

---

## 1. Visão e princípios de produto

**O que é:** um app de finanças pessoais em que registrar um gasto custa menos esforço do que não registrar. Tudo o mais (gráficos, metas, relatórios) existe para dar sentido ao que foi registrado.

**Métrica-mãe do produto:** tempo entre abrir o app e ter um gasto salvo. **Meta: < 5 segundos, 3 toques + digitar o valor.**

Princípios:

- **Registro primeiro, categorização depois.** Nunca bloquear o salvamento por falta de dado opcional.
- **Padrões inteligentes.** Data = hoje. Categoria = a mais usada no contexto. Método = o último usado.
- **Nada de números mentirosos.** Se um valor é projeção (parcela futura), a UI diz que é projeção.
- **Enxuto.** Cada tela responde a uma pergunta. Se responde a duas, são duas telas.
- **Offline não quebra.** Registro funciona sem rede e sincroniza depois.

---

## 2. Stack

### 2.1 Base

| Camada | Escolha | Por quê |
|---|---|---|
| Runtime | **Expo SDK 57** (React Native 0.86, React 19.2) | SDK atual; da 55 em diante roda 100% na New Architecture. Criar com `npx create-expo-app@latest --template default@sdk-57` |
| Linguagem | **TypeScript strict** (`strict`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`) | Domínio financeiro não tolera `any` |
| Navegação | **Expo Router** (file-based) — Drawer + Stack + modais | Deep link nativo, layout aninhado, tipagem de rotas |
| Estilo | **NativeWind** (Tailwind para RN) | É o padrão de mercado em RN e você já domina Tailwind |
| Componentes | **react-native-reusables** (shadcn/ui portado para RN) | Copy-paste, você é dono do código, casa com NativeWind |
| Ícones | `lucide-react-native` | Consistente com o ecossistema shadcn |

> **Nota de versão para o agente:** NativeWind tem v4 estável e uma v5 (preview) alinhada ao Tailwind v4. Existe também o **Uniwind** (time do Unistyles), com mesma sintaxe Tailwind e desempenho bem superior ao NativeWind em benchmark, e guia oficial de migração. **Decisão:** começar com NativeWind na versão estável mais recente compatível com SDK 57; se aparecer jank mensurável em listas/gráficos, migrar para Uniwind (o react-native-reusables suporta os dois). **O agente deve verificar a versão compatível no momento da instalação, não assumir.**

### 2.2 Bibliotecas

```
# Estado
@tanstack/react-query        # estado de servidor, cache, optimistic updates
zustand                      # estado de UI (filtros, período selecionado, tema)

# Formulários e validação
react-hook-form
zod                          # schemas compartilhados com o backend

# Gráficos (crítico para este app)
victory-native               # ex-Victory Native XL, render por Skia
@shopify/react-native-skia
react-native-reanimated
react-native-gesture-handler
expo-haptics                 # tick tátil ao arrastar o dedo no gráfico

# Dados e persistência
react-native-mmkv            # cache, preferências, persistência do React Query
expo-secure-store            # tokens (nunca em MMKV/AsyncStorage)
expo-sqlite                  # fila offline de mutações (fase 6)

# UI
@shopify/flash-list          # listas de lançamentos
@gorhom/bottom-sheet         # sheet de registro rápido
react-native-safe-area-context
expo-local-authentication    # biometria opcional no unlock

# Utilitários
date-fns + @date-fns/tz      # datas e fuso America/Sao_Paulo
expo-constants               # env validado com zod
```

### 2.3 Qualidade

ESLint 9 (flat config) + `typescript-eslint` + Prettier + `eslint-plugin-import` (fronteiras de camada) + Husky + lint-staged + commitlint (Conventional Commits). Sem testes unitários nesta etapa — mas **o código deve ser escrito testável**: domínio puro, sem I/O dentro de regra de negócio.

---

## 3. Estrutura de pastas

Arquitetura **feature-first** com núcleo compartilhado. Regra de dependência: `app/` → `features/` → `shared/` → `core/`. Nunca o contrário. Feature **não** importa de outra feature; o que for comum sobe para `shared/`.

```
src/
├── app/                              # Expo Router (só roteamento e composição)
│   ├── _layout.tsx                   # providers: QueryClient, Theme, GestureHandler, SafeArea
│   ├── (auth)/
│   │   ├── _layout.tsx
│   │   ├── login.tsx
│   │   └── register.tsx
│   ├── (app)/
│   │   ├── _layout.tsx               # Drawer (menu lateral esquerdo)
│   │   ├── index.tsx                 # Home / Dashboard
│   │   ├── transactions/
│   │   │   ├── index.tsx
│   │   │   └── [id].tsx
│   │   ├── categories/index.tsx
│   │   ├── income/index.tsx
│   │   ├── goals/index.tsx
│   │   ├── accounts/index.tsx        # contas e cartões
│   │   ├── reports/index.tsx
│   │   └── settings/index.tsx
│   └── (modals)/
│       ├── quick-entry.tsx           # registro rápido (a tela mais importante do app)
│       └── period-picker.tsx
│
├── features/
│   ├── auth/                         # { api, hooks, components, stores, types, schemas }
│   ├── transactions/
│   ├── categories/
│   ├── goals/
│   ├── accounts/
│   ├── dashboard/
│   └── reports/
│
├── shared/
│   ├── ui/                           # design system (react-native-reusables + custom)
│   ├── components/                   # compostos: MoneyInput, CategoryChip, PeriodHeader...
│   ├── charts/                       # wrappers do victory-native com tokens do DS
│   ├── hooks/
│   └── utils/
│
└── core/
    ├── money/                        # aritmética de dinheiro (centavos) — ZERO dependências
    ├── domain/                       # entidades, enums, regras puras (parcelamento, competência)
    ├── api/                          # cliente HTTP, interceptors, refresh token
    ├── storage/                      # MMKV, SecureStore
    ├── config/                       # env validado com zod
    └── theme/                        # tokens, fonts, dark/light
```

Anatomia padrão de uma feature:

```
features/transactions/
├── api/          # queries e mutations do React Query + funções HTTP
├── components/   # componentes só desta feature
├── hooks/
├── schemas/      # zod (form + DTO)
├── types/
└── index.ts      # barrel — única superfície pública da feature
```

---

## 4. Design system

Paleta fechada: **preto, laranja, branco.** Dark-first (finanças se consulta à noite, e o laranja rende muito mais sobre preto).

### 4.1 Tokens de cor

```
--ink-950   #08080A   fundo do app
--ink-900   #101014   superfície (cards)
--ink-800   #1A1A20   superfície elevada / borda
--ink-600   #2A2A33   divisórias
--flame-500 #FF6A00   primária (ação, saídas, destaque de dado)
--flame-400 #FF8A2B   hover/pressed, gradiente de gráfico
--flame-950 #241000   fundo tingido (badges, área sob a linha)
--bone      #FFFFFF   texto primário
--bone-600  #A1A1AA   texto secundário
--bone-800  #52525B   texto desabilitado
```

Semânticos, usados **só em indicadores pequenos** (nunca em áreas grandes, para não sujar a paleta):

```
--mint      #2FBF71   entradas, meta batida
--ember     #E5484D   estouro de orçamento, saldo negativo
```

Regra: **laranja = saída/ação. Branco = neutro/entrada em gráficos. Verde e vermelho só como pontuação.**

### 4.2 Tipografia

Três papéis, deliberadamente distintos (via `@expo-google-fonts`):

| Papel | Fonte | Uso |
|---|---|---|
| Display | **Sora** 600/700 | Saldos, títulos de tela, valores de destaque |
| Interface | **Inter** 400/500/600 | Labels, corpo, botões |
| Numérico | **JetBrains Mono** 500 | Colunas de valores, tabelas, eixos de gráfico |

Todo componente que mostra dinheiro em lista/tabela usa `fontVariant: ['tabular-nums']`. Números que não alinham verticalmente são um bug visual em app financeiro.

Escala: 40 / 28 / 20 / 16 / 14 / 12. Espaçamento em múltiplos de 4.

### 4.3 Elemento-assinatura

**O teclado de valor.** O sheet de registro rápido abre com um teclado numérico próprio (não o do sistema) ocupando a metade inferior. O valor aparece em cima, gigante, em JetBrains Mono laranja, formatado ao vivo em BRL. Categoria e método são chips logo abaixo do valor — nada de campos de formulário empilhados. É a tela que define o app; toda a boldness visual é gasta aqui, e o resto do app fica quieto e disciplinado.

**Segunda assinatura: o scrubber do gráfico.** Ao encostar o dedo na linha, aparece uma hairline vertical, um ponto laranja no dado exato e uma pílula flutuante com data e valor. Cada troca de ponto dispara um `Haptics.selectionAsync()`. Isso atende diretamente ao requisito de "mostrar o ponto onde clicou com o dedo".

### 4.4 Voz da interface

Verbo ativo, frase em caixa baixa, sem simpatia postiça. Botão diz o que acontece: "Salvar gasto", não "Confirmar". Erro explica o que fazer: "Valor precisa ser maior que zero", não "Ocorreu um erro". Tela vazia é convite: "Nenhum gasto em julho. Registre o primeiro."

---

## 5. Modelo de domínio

### 5.1 Regra número um: dinheiro é inteiro

**Nunca usar `float` para dinheiro.** Todo valor monetário é `amountCents: number` (inteiro, em centavos). Formatação só na borda de apresentação, via `Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })`.

`core/money/` expõe: `fromInput(string): Cents`, `add`, `subtract`, `multiplyByRate`, `splitInstallments(total, n): Cents[]` (distribui o resto de divisão nas primeiras parcelas para que a soma feche exata), `format(cents)`. Módulo puro, sem imports externos.

### 5.2 Entidades

```ts
type TransactionType = 'INCOME' | 'EXPENSE' | 'TRANSFER';
type PaymentMethod   = 'CASH' | 'PIX' | 'DEBIT' | 'CREDIT';

Transaction {
  id, userId
  type: TransactionType
  amountCents: number            // sempre positivo; o sinal vem do type
  description: string
  occurredAt: Date               // quando aconteceu (competência)
  settledAt: Date | null         // quando afeta o caixa (fatura, compensação)
  categoryId, accountId
  paymentMethod: PaymentMethod
  creditCardId?: string
  installmentGroupId?: string    // agrupa parcelas da mesma compra
  installmentNumber?: number     // 1..N
  installmentTotal?: number      // N
  isProjected: boolean           // true para parcelas futuras
  notes?: string
  createdAt, updatedAt, deletedAt // soft delete
}

Category {
  id, userId, name, icon, color
  type: 'INCOME' | 'EXPENSE'
  parentId?: string              // subcategorias, 1 nível só
  monthlyBudgetCents?: number
  isArchived: boolean            // nunca deletar categoria com histórico
}

Account { id, userId, name, kind: 'CHECKING'|'CASH'|'SAVINGS'|'INVESTMENT', openingBalanceCents }

CreditCard { id, userId, name, limitCents, closingDay: 1..31, dueDay: 1..31, accountId }

Goal {
  id, userId, name
  kind: 'SAVING' | 'INVESTMENT' | 'SPEND_LIMIT'
  targetCents: number
  categoryId?: string            // obrigatório quando kind = SPEND_LIMIT
  startDate, deadline
  recurrence: 'ONCE' | 'MONTHLY'
}
```

### 5.3 Regras de negócio

**Parcelamento.** Compra de R$ 1.000 em 3x no crédito gera **3 registros** ligados pelo mesmo `installmentGroupId`, com `occurredAt` mensal a partir da data da compra e valores `[333,34 / 333,33 / 333,33]` — a soma tem que bater com o total, sempre. Parcelas futuras nascem com `isProjected: true`.

**Competência vs. caixa.** Gasto no crédito em 20/jul com fatura fechando dia 25 e vencendo em 05/ago: `occurredAt = 20/jul`, `settledAt = 05/ago`. O dashboard usa **competência por padrão** (é o que responde "quanto eu gastei este mês") e oferece um toggle para caixa (responde "quanto vai sair da conta"). O toggle é global e persiste.

**Editar parcelamento.** Ao editar/excluir uma parcela, perguntar sempre: só esta / esta e as futuras / todas.

**Cálculos derivados nunca são armazenados.** Saldo, total por categoria e progresso de meta são calculados a partir das transações. Nada de campo `balance` desatualizado.

**Idempotência.** Toda mutação de criação carrega um `Idempotency-Key` (UUID gerado no cliente). Registro salvo offline e reenviado não pode virar dois lançamentos.

**Auditoria.** Soft delete em tudo. Nada some do banco.

**Fuso.** Todas as datas em UTC no wire; renderização e agregação em `America/Sao_Paulo`. Um gasto às 22h de 31/jul não pode cair em agosto.

---

## 6. Features e critérios de aceite

### 6.1 Autenticação

Login e senha. JWT **access curto (15 min) + refresh rotativo**, ambos no `expo-secure-store`. Interceptor faz refresh transparente com fila de requisições pendentes. Logout limpa SecureStore, MMKV e cache do React Query. Biometria opcional para reabrir o app.

*Aceite:* app fechado e reaberto mantém sessão; token expirado renova sem o usuário perceber; refresh inválido derruba para o login sem loop.

### 6.2 Registro rápido (a feature central)

FAB laranja fixo. Toca → bottom sheet abre com o teclado de valor já em foco. Fluxo: **valor → chip de categoria → chip de método → Salvar.** Se o método for crédito, aparece um seletor horizontal de parcelas (1x…24x) mostrando o valor da parcela ao vivo. Data em "hoje" com atalho para ontem/escolher.

*Aceite:* gasto à vista salvo em 3 toques + digitação. Salvamento otimista — a lista atualiza antes da resposta do servidor. Funciona em modo avião.

### 6.3 Categorias

CRUD com nome, ícone (lucide), cor e tipo. Subcategoria com um nível. Orçamento mensal opcional por categoria. Categorias-semente na primeira execução (Mercado, Transporte, Moradia, Saúde, Lazer, Educação, Assinaturas, Outros / Salário, Freela, Rendimentos, Outros). Categoria com histórico só pode ser arquivada, nunca excluída.

### 6.4 Entradas

Mesma máquina de registro, `type = INCOME`. Marcação de **recorrente** (salário: dia fixo, valor fixo) que gera lançamentos previstos. Tipos: salário, freela, rendimento de investimento, reembolso, outros.

*Aceite:* recorrência mensal aparece como previsto e vira efetivado com um toque de confirmação.

### 6.5 Dashboard (Home)

Ordem na tela:

1. **Header de período** — mês corrente, setas para navegar, toggle competência/caixa.
2. **Saldo do mês** — entradas − saídas, em Sora 40, com delta percentual contra o mês anterior.
3. **Gráfico de linha/área — evolução do saldo acumulado no mês.** Interativo: arrastar o dedo mostra hairline + ponto + pílula com data e valor, com haptic. Implementar com `victory-native` + `useChartPressState`.
4. **Donut por categoria** — top 5 + "outros", laranja em degradê de opacidade. Tocar numa fatia filtra a lista abaixo.
5. **Barras comparativas** — últimos 6 meses, entradas (branco) vs saídas (laranja).
6. **Orçamentos estourados** — só aparece se houver.
7. **Últimos lançamentos** — 5 itens, com link para a lista completa.

*Aceite:* scrub do gráfico a 60fps com 90 pontos; nenhum valor renderizado sem `tabular-nums`; estado vazio de cada bloco desenhado.

### 6.6 Metas

Três tipos: **guardar** (juntar R$ X até data Y), **investir** (aportar R$ X/mês) e **limite de gasto** (não passar de R$ X na categoria Y no mês). Cada meta mostra barra de progresso, valor efetivado vs. planejado, e projeção ("no ritmo atual você chega em out/26, 2 meses depois do alvo"). Limite estourado marca em `--ember`.

*Aceite:* comparativo planejado × efetivado do mês visível sem entrar no detalhe da meta.

### 6.7 Relatórios

Por categoria, por método de pagamento, por período customizado. Exportação CSV (fase posterior).

---

## 7. Navegação

**Drawer esquerdo** (`(app)/_layout.tsx`): Dashboard · Lançamentos · Categorias · Entradas · Metas · Contas e cartões · Relatórios · Configurações. Cabeçalho do drawer com nome do usuário e saldo consolidado.

**Menu superior** (header right, ícone de três pontos): seletor de período, filtros, toggle competência/caixa, tema, perfil, sair. Tudo o que é *contexto de visualização* mora aqui — nunca ocupa espaço na tela.

**FAB** de registro rápido presente em todas as telas do grupo `(app)`.

Sem tab bar inferior: drawer + menu superior + FAB já cobrem a navegação, e a ausência da tab bar devolve espaço vertical para os gráficos.

---

## 8. Guardrails de software financeiro

O agente deve tratar as regras abaixo como invioláveis:

1. Nenhum `float`, `parseFloat` ou `toFixed` em cálculo monetário. Só inteiros em centavos.
2. Nenhum cálculo de dinheiro dentro de componente. Regra vive em `core/domain` ou `core/money`, pura e sem I/O.
3. Nenhum token em AsyncStorage ou MMKV. Só `expo-secure-store`.
4. Nenhum dado sensível em log, Sentry breadcrumb ou console em produção.
5. Nenhum delete físico. Soft delete sempre.
6. Toda mutação de criação leva `Idempotency-Key`.
7. Toda soma de parcelas fecha exatamente com o total da compra.
8. Todo valor projetado é visualmente distinto de valor efetivado.
9. Toda data agregada respeita `America/Sao_Paulo`.
10. Nenhum estado de servidor no Zustand — isso é papel do React Query.

---

## 9. Configuração do Claude Code

### 9.1 `CLAUDE.md` (raiz)

Deve conter, curto e direto: stack e versões travadas; a regra de dependência entre camadas; os 10 guardrails da seção 8; convenção de nomes (arquivos `kebab-case`, componentes `PascalCase`, hooks `useX`, schemas zod `xSchema`); política de commits (Conventional Commits); e a instrução "leia `docs/BRIEF.md` e a spec da fase corrente antes de escrever código".

### 9.2 Skills (`.claude/skills/`)

| Skill | Quando dispara | Conteúdo |
|---|---|---|
| `money-domain` | qualquer código que toque valor, parcela, meta ou agregação | aritmética em centavos, `splitInstallments`, competência × caixa, formatação BRL, checklist de revisão |
| `expo-architecture` | criar tela, rota, feature ou mover arquivo | estrutura de pastas, regra de dependência, anatomia de feature, padrões do Expo Router |
| `design-system` | qualquer JSX/estilo | tokens de cor, escala tipográfica, papéis de fonte, regras de uso do laranja, componentes disponíveis no `shared/ui` |
| `victory-charts` | qualquer gráfico | setup Skia/Reanimated/Gesture, `useChartPressState`, padrão de scrubber com haptic, wrappers do DS |
| `api-contract` | qualquer chamada HTTP ou schema | contrato REST, schemas zod compartilhados, padrão de erro, idempotência, refresh token |
| `rn-performance` | listas, gráficos, animações | FlashList, memoização, worklets, o que roda na UI thread |

Cada skill é um `SKILL.md` com frontmatter:

```yaml
---
name: money-domain
description: Use sempre que o código envolver valores monetários, parcelamento, orçamentos, metas ou agregações financeiras. Dispara em qualquer arquivo sob core/money, core/domain, features/transactions e features/goals.
---
```

Descrições **específicas e acionáveis** — a qualidade do disparo depende disso.

### 9.3 Subagents (`.claude/agents/`)

- **`spec-writer`** — transforma pedido em spec com critérios de aceite; não escreve código.
- **`rn-ui-builder`** — só implementa UI a partir do design system; não inventa cor nem fonte.
- **`money-reviewer`** — revisor obsessivo dos 10 guardrails; roda antes de todo commit que toque em domínio.
- **`api-integrator`** — cliente HTTP, hooks do React Query, tratamento de erro e retry.
- **`perf-auditor`** — auditoria de re-render, lista e gráfico, sob demanda.

### 9.4 Slash commands (`.claude/commands/`)

- `/spec <feature>` — gera `docs/specs/NN-feature.md` seguindo o template do brief.
- `/feature <nome>` — cria o esqueleto completo da feature com barrel e pastas.
- `/screen <rota>` — cria rota do Expo Router já com layout, loading e empty state.
- `/entity <nome>` — tipo + schema zod + hooks de query/mutation.
- `/review-money` — dispara o `money-reviewer` no diff atual.

### 9.5 Higiene

Camada de prompting (`CLAUDE.md`, `docs/specs/`, `.claude/`) fora do repo público via `.git/info/exclude`, mesmo padrão do ghtpromo.

---

## 10. Roadmap

| Fase | Entrega | Pronto quando |
|---|---|---|
| 0 | Scaffolding: Expo 57, TS strict, NativeWind, ESLint, Husky, estrutura de pastas, tokens, fontes | `npx expo start` roda; lint limpo; tela em branco com as 3 fontes carregadas |
| 1 | Design system: `shared/ui` com Button, Input, Card, Sheet, Chip, MoneyText, EmptyState | Storybook-like screen em `/dev` mostrando todos os componentes |
| 2 | Auth + navegação: login, drawer, menu superior, guard de rota | Sessão persiste; rotas protegidas; logout limpa tudo |
| 3 | Domínio + registro rápido: `core/money`, `core/domain`, sheet de entrada, lista de lançamentos | Gasto à vista e parcelado salvos e listados corretamente |
| 4 | Categorias e entradas | CRUD completo; recorrência de salário funcionando |
| 5 | Dashboard e gráficos | Scrubber interativo com haptic; donut filtrando a lista |
| 6 | Metas e comparativos | Três tipos de meta com progresso e projeção |
| 7 | Polimento: offline queue, biometria, animações, empty states, acessibilidade | Registro funciona em modo avião e sincroniza ao voltar |

---

## 11. Definition of Done (toda feature)

- [ ] TypeScript sem erro e sem `any`
- [ ] Guardrails da seção 8 respeitados (rodar `/review-money` se tocar em domínio)
- [ ] Estados de loading, erro e vazio desenhados
- [ ] Tokens do design system — zero cor ou fonte hardcoded
- [ ] Funciona em iOS e Android
- [ ] Áreas de toque ≥ 44pt; labels de acessibilidade nos ícones
- [ ] Commit em Conventional Commits

---

## 12. Decisões em aberto

- Backend próprio em NestJS compartilhado com a web (ver recomendação separada) — **decidir antes da fase 3**, pois define o contrato do `core/api`.
- Multi-moeda: fora de escopo por ora, mas modelar `currency` na entidade desde já para não migrar depois.
- Sincronização com Open Finance (Pluggy): fora de escopo; manter a camada de repositório desacoplada para permitir a entrada de um provedor externo depois.
