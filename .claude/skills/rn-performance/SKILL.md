---
name: rn-performance
description: Use ao mexer em listas, gráficos ou animações. Cobre FlashList, memoização, worklets e o que roda na UI thread.
---

# rn-performance

## Listas

- Use `@shopify/flash-list` para lançamentos. `keyExtractor` estável; `renderItem` memoizado.
- Não crie funções/objetos pesados no render de item — extraia mapas (`catById`) com `useMemo`.

## Gráficos

- Dados derivados sempre em `useMemo`. Plote centavos (inteiro).
- Scrubber roda no worklet (Reanimated); só `runOnJS` para haptic/estado da pílula, e só na troca de índice.

## Animações / worklets

- `react-native-worklets/plugin` é o **último** plugin do babel.
- Trabalho na UI thread fica em worklet; nada de I/O nem cálculo de dinheiro no worklet.

## Geral

- Selecione slices do zustand (`useStore(s => s.campo)`) para evitar re-render amplo.
- Evite recomputar agregações a cada render; derive uma vez por `monthKey`/`basis`.
- Cheque re-render com o perf-auditor antes de otimizar no escuro.
