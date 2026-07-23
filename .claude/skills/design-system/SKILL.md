---
name: design-system
description: Use em qualquer JSX ou estilo. Garante uso correto de tokens de cor, escala tipográfica, papéis de fonte e regras do laranja. Dispara ao criar/editar componentes, telas ou estilos.
---

# design-system

Paleta fechada **preto/laranja/branco**, dark-first. Zero cor ou fonte hardcoded.

## Tokens (tailwind.config.js + core/theme/tokens.ts)

- Fundos: `ink-950` (app), `ink-900` (card), `ink-800` (borda/elevado), `ink-600` (divisória).
- Laranja: `flame-500` (ação/saída), `flame-400` (pressed/gradiente), `flame-950` (tingido).
- Texto: `bone` (primário), `bone-600` (secundário), `bone-800` (desabilitado).
- Semânticos **só em indicadores pequenos**: `mint` (entrada/meta batida), `ember` (estouro/negativo).

Regra: **laranja = saída/ação · branco = neutro/entrada · verde/vermelho só pontuais.**

## Tipografia (usar `<Text variant=…>`)

- `display`/`h1`/`h2` → Sora. `body`/`label`/`caption` → Inter. `mono`/`mono-lg` → JetBrains Mono.
- Todo dinheiro em lista/tabela: `<MoneyText/>` (já aplica `tabular-nums`).
- Escala 40/28/20/16/14/12; espaçamento múltiplos de 4.

## Componentes prontos (`@shared/ui`)

Button, Card, Input, Chip, MoneyText, EmptyState, Badge, SegmentedControl, Screen, Text, Icon.
Use Skia/SVG (não className) só onde estilo nativo é necessário (gráficos) — pegue cor de `core/theme`.

## Voz

Verbo ativo, caixa baixa, sem simpatia postiça. Botão diz o que acontece
("Salvar gasto"). Erro diz o que fazer. Vazio é convite.

## Checklist

- [ ] Nenhum hex/rgb/fontFamily literal em JSX (fora de core/theme e tokens).
- [ ] Toque ≥ 44pt; ícone acionável com `accessibilityLabel`.
- [ ] Estados loading/erro/vazio desenhados.
