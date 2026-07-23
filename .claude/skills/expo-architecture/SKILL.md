---
name: expo-architecture
description: Use ao criar tela, rota, feature ou mover arquivo. Cobre estrutura de pastas, regra de dependência, anatomia de feature e padrões do Expo Router (SDK 57).
---

# expo-architecture

## Regra de dependência

`app/` → `features/` → `shared/` → `core/`. Nunca o contrário. Feature não
importa de feature; comum sobe para `shared/`. `src/app` é só rota + composição.

## Anatomia de feature

```
features/<nome>/
├── api/        # repos locais (fase atual) + hooks React Query (queries.ts)
├── components/ # só desta feature
├── hooks/
├── schemas/    # zod (xSchema)
├── stores/     # zustand só p/ UI da feature (não p/ estado de servidor)
└── index.ts    # barrel — única superfície pública
```

## Expo Router (SDK 57, dir = `src/app`)

- Grupos: `(auth)`, `(app)` (Drawer), `(modals)`.
- Cada pasta-seção do drawer tem `_layout.tsx` (Stack, `headerShown:false`) para virar **uma** rota no drawer.
- Drawer e helpers de conteúdo vêm de `expo-router/drawer` — **não** importe `@react-navigation/drawer` direto (proibido no SDK 56+).
- Modais: `presentation:"transparentModal"` no root Stack; a tela desenha backdrop + painel.
- `router.push("/(modals)/...")` para abrir; `router.back()` para fechar.
- Aliases: `@core/*`, `@shared/*`, `@features/*` (tsconfig paths, sem baseUrl → use `./src/*`).

## Ao adicionar uma rota

- Crie o arquivo, garanta `_layout` da seção, registre `Drawer.Screen` em `(app)/_layout.tsx` se for item de menu.
- Rode `npm run typecheck` e um `expo export -p android` como smoke test.
