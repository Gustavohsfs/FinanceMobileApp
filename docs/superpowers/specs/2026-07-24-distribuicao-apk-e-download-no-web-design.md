# Distribuição do APK (Fluxo mobile) + links de download no web

**Data:** 2026-07-24
**Repos envolvidos:** `FinanceMobileApp` (build), `FinanceWebApp` (download UX)

## Objetivo

Gerar um APK instalável do app Fluxo (Expo SDK 54) para uso próprio/beta e
disponibilizá-lo para download no site que já está no ar, de forma profissional:
um link discreto na tela de login e um botão no menu superior pós-login, ambos
levando a uma página `/baixar` dedicada.

## Decisões (definidas no brainstorming)

| Decisão            | Escolha                                                    |
| ------------------ | --------------------------------------------------------- |
| Build do APK       | **EAS Build (nuvem da Expo)** — sem toolchain local       |
| Hospedagem do APK  | **GitHub Releases** no repo `FinanceMobileApp`            |
| UX de download     | **Página `/baixar`** com instruções + botão + **QR code** |

## Parte 1 — Build do APK (FinanceMobileApp)

### `eas.json` (novo)

Profile `preview` que produz `.apk` (instalável direto), não `.aab` (loja):

```json
{
  "cli": { "version": ">= 3.0.0" },
  "build": {
    "preview": {
      "android": { "buildType": "apk" },
      "distribution": "internal"
    },
    "production": {
      "android": { "buildType": "app-bundle" },
      "autoIncrement": true
    }
  }
}
```

- A API de produção já está em `.env` (`EXPO_PUBLIC_API_URL=https://fluxo-api-...run.app`),
  e `EXPO_PUBLIC_*` é embutido no bundle em build time → o APK fala com produção.
- `distribution: internal` gera link de download interno na Expo além do artefato.

### Passos operacionais (rodados pelo Gustavo via `!`)

O build consome minutos da conta Expo do Gustavo, então quem dispara é ele:

1. `npx eas-cli login` (conta Expo já existe)
2. `npx eas-cli build:configure` (se pedir; cria/valida projectId em `app.json`)
3. `npx eas-cli build -p android --profile preview`
4. Baixar o `.apk` do link que a Expo retorna ao final.

### Release no GitHub (feito pelo Claude, ou Gustavo se preferir)

- Criar release `v1.0.0` no repo `FinanceMobileApp` com o `.apk` anexado como
  `fluxo.apk` (via `gh release create v1.0.0 fluxo.apk`).
- URL estável resultante:
  `https://github.com/Gustavohsfs/FinanceMobileApp/releases/latest/download/fluxo.apk`

## Parte 2 — Download UX (FinanceWebApp)

### Fonte única da URL

`src/shared/lib/download.ts`:

```ts
export const APP_DOWNLOAD_URL =
  "https://github.com/Gustavohsfs/FinanceMobileApp/releases/latest/download/fluxo.apk";
```

### Rota pública `/baixar`

- Fica **fora** do grupo `(app)` (que exige sessão) e fora do `(auth)` (que
  redireciona logados). Nova pasta `src/app/baixar/page.tsx` na raiz do app router.
- Server Component: gera o QR em build time com `qrcode` (`toString(url, {type:'svg'})`)
  e renderiza o SVG inline — zero JS no cliente, coerente com o guardrail de
  "servidor é a fonte da verdade".
- Conteúdo: título, subtítulo curto, passos de instalação Android
  ("baixe o APK", "permita instalação de fontes desconhecidas se pedir", "abra e
  instale"), botão primário **Baixar APK** (`<a href={APP_DOWNLOAD_URL} download>`),
  e o QR com legenda "Aponte a câmera do celular".
- Usa tokens do DS existente (ink/bone/flame, fontes display/body). Estados: a
  página é estática, sem loading/erro (é só apresentação de link).
- Nova dependência: `qrcode` + `@types/qrcode` (dev).

### Link na tela de login (`AuthVisualPanel`)

- Dentro do painel visual (já fala "O mobile registra em 5 segundos..."), adicionar
  abaixo do texto um link discreto: **"Baixe o app Android →"** apontando para `/baixar`.
- Estilo: texto `flame`/`bone-600`, sem poluir o visual existente.

### Botão no menu superior (`Topbar`)

- **À esquerda do input de busca** (`⌘K`), antes do bloco de busca, adicionar um
  `<a href="/baixar">` no mesmo estilo do botão de busca: `border-ink-800`,
  `bg-ink-900`, `text-bone-600` hover `text-bone`, ícone `Download` do lucide,
  label "Baixe o app" (escondido em telas pequenas, como o texto da busca).
- Toque/alvo ≥ 44pt equivalente, `aria-label`.

## Fora de escopo (YAGNI)

- Build iOS / TestFlight (só Android agora).
- Auto-update / detecção de versão no app.
- Página de changelog. O release do GitHub já serve de histórico.

## Divisão de trabalho

- **Claude:** `eas.json`, spec, edições no web (`/baixar`, `download.ts`,
  `AuthVisualPanel`, `Topbar`), dep de QR, typecheck, criar o GitHub release quando
  o `.apk` existir.
- **Gustavo:** `eas login` + `eas build` (conta/minutos Expo), e o deploy/promote
  na Vercel (ou autoriza o Claude a disparar).
