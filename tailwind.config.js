/** @type {import('tailwindcss').Config} */
// Design system tokens — see BRIEF section 4. Paleta fechada: preto, laranja, branco.
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        ink: {
          950: "#08080A", // fundo do app
          900: "#101014", // superfície (cards)
          800: "#1A1A20", // superfície elevada / borda
          600: "#2A2A33", // divisórias
        },
        flame: {
          950: "#241000", // fundo tingido (badges, área sob a linha)
          400: "#FF8A2B", // hover/pressed, gradiente
          500: "#FF6A00", // primária (ação, saídas, destaque)
        },
        bone: {
          DEFAULT: "#FFFFFF", // texto primário
          600: "#A1A1AA", // texto secundário
          800: "#52525B", // texto desabilitado
        },
        // semânticos — só em indicadores pequenos
        mint: "#2FBF71", // entradas, meta batida
        ember: "#E5484D", // estouro de orçamento, saldo negativo
      },
      fontFamily: {
        // Display: Sora — saldos, títulos, valores de destaque
        display: ["Sora_600SemiBold"],
        "display-bold": ["Sora_700Bold"],
        // Interface: Inter — labels, corpo, botões
        sans: ["Inter_400Regular"],
        "sans-medium": ["Inter_500Medium"],
        "sans-semibold": ["Inter_600SemiBold"],
        // Numérico: JetBrains Mono — colunas de valores, eixos
        mono: ["JetBrainsMono_500Medium"],
      },
      fontSize: {
        // Escala: 40 / 28 / 20 / 16 / 14 / 12
        display: ["40px", { lineHeight: "44px" }],
        h1: ["28px", { lineHeight: "34px" }],
        h2: ["20px", { lineHeight: "26px" }],
        base: ["16px", { lineHeight: "22px" }],
        sm: ["14px", { lineHeight: "20px" }],
        xs: ["12px", { lineHeight: "16px" }],
      },
    },
  },
  plugins: [],
};
