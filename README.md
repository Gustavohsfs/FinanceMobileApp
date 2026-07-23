# Fluxo — app de finanças pessoais

App mobile (React Native + Expo SDK 54) construído a partir de `BRIEF-app-financeiro.md`.
(O brief pedia SDK 57, mas o Expo Go das lojas hoje só suporta SDK 54 — por isso
rodamos no 54 para você testar via QR code sem build nativa.)
Esta é a **fase app-only**: sem backend ainda (o NestJS entra depois). Toda a
persistência é local e o app já está preparado para plugar a API futura sem
reescrever as telas.

## Como rodar (no seu celular, sem build nativa)

1. Instale o app **Expo Go** no seu celular (Play Store / App Store).
2. No projeto:
   ```bash
   npm start
   ```
3. Escaneie o QR code que aparece no terminal com o Expo Go (Android) ou a
   câmera (iOS). O app abre direto no celular.

> Feito de propósito para rodar no **Expo Go** — você não precisa de Android
> Studio, Xcode nem Java. (Por isso trocamos o MMKV do brief por um storage
> compatível com Expo Go, atrás da mesma interface; a volta pro MMKV é trivial
> quando fizermos o development build.)

Alternativas: `npm run android` (emulador), `npm run ios` (Mac), `npm run web`.

## Login

Não há servidor: o login é **simulado**. Digite qualquer email e senha não
vazios e entre. A sessão persiste ao fechar/reabrir o app.

## O que já dá pra testar

- **Registro rápido** (FAB laranja): teclado de valor próprio, chips de categoria
  e método, parcelamento 1–24x no crédito com valor da parcela ao vivo, haptics,
  salvamento otimista. À vista sai em 3 toques + digitar o valor.
- **Dashboard**: saldo do mês com delta %, gráfico de saldo acumulado com
  **scrubber** (arraste o dedo → hairline + ponto + pílula + haptic), donut por
  categoria (toque numa fatia filtra a lista), barras de 6 meses, orçamentos
  estourados, últimos lançamentos. Toggle **competência/caixa** persistente.
- **Lançamentos**: lista com filtro; detalhe com exclusão respeitando
  parcelamento (só esta / esta e futuras / todas).
- **Categorias**: CRUD com ícone/cor/orçamento; arquivar (nunca excluir com histórico).
- **Entradas**: lista do mês; previstas viram efetivadas com um toque.
- **Metas**: guardar / investir / limite de gasto, com progresso e projeção.
- **Contas**, **Relatórios** (por categoria e método), **Configurações**
  (base padrão, biometria, limpar/recriar dados de exemplo, sair).

Na primeira execução o app **semeia dados de exemplo** (categorias, contas, ~3
meses de lançamentos, 2 metas) para os gráficos terem o que mostrar. Você pode
apagar tudo em **Configurações → Limpar e recriar dados de exemplo**.

## Estrutura

Arquitetura feature-first: `src/app` (rotas), `src/features` (auth, transactions,
categories, income, goals, accounts, dashboard), `src/shared` (ui, components,
charts, stores, utils), `src/core` (money, domain, storage, api, theme, config).
Regra de dependência e guardrails financeiros em `CLAUDE.md`.

## Limitações conhecidas desta fase

- Sem backend: dados vivem só no aparelho; login é mock.
- Sem seletor de data completo no registro rápido (só hoje/ontem por enquanto).
- Cartões de crédito com fatura, offline-queue e biometria-no-unlock reais são
  fases seguintes do roadmap (BRIEF §10, fases 6–7).
- Modo claro não implementado (app é dark-first).
