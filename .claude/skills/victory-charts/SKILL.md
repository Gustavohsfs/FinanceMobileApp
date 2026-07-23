---
name: victory-charts
description: Use em qualquer gráfico. Cobre setup Skia/Reanimated/Gesture, useChartPressState, o scrubber com haptic e os wrappers do design system.
---

# victory-charts

Gráficos via `victory-native` (Skia) e SVG (`react-native-svg`). Wrappers prontos
em `@shared/charts`: `LineAreaChart`, `DonutChart`, `BarsChart`.

## Valores

Plote em **centavos** (inteiro). Formate só nos rótulos com `format()` de `core/money`.

## Scrubber (LineAreaChart)

- `useChartPressState({ x: 0, y: { value: 0 } })` → `{ state, isActive }`.
- Passe `chartPressState={state}` no `CartesianChart`.
- Hairline/ponto: elementos Skia posicionados por `state.x.position` / `state.y.value.position` (SharedValues).
- Pílula + haptic: `useAnimatedReaction(() => state.x.value.value, ...)` + `runOnJS(Haptics.selectionAsync)` a cada troca de índice.
- Dados precisam de index signature (`interface X extends Record<string, unknown>`) p/ o tipo do CartesianChart.

## Cores

Sempre de `core/theme` (Skia/SVG não leem className). Laranja na linha/área/saídas,
branco em entradas, opacidade em degradê nas fatias do donut.

## Performance

Curva a 60fps com ~90 pontos. Não recalcule dados no render — memoize. Haptic só na
troca real de ponto (compare curr/prev no reaction).
