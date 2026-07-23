/**
 * Tokens de cor e tipografia em JS (BRIEF §4). Espelham o tailwind.config.js.
 * Use estes tokens onde className não alcança: Skia (gráficos), navegação,
 * StatusBar, props nativas. Em JSX comum, prefira as classes NativeWind.
 */
export const colors = {
  ink950: "#08080A",
  ink900: "#101014",
  ink800: "#1A1A20",
  ink600: "#2A2A33",
  flame950: "#241000",
  flame400: "#FF8A2B",
  flame500: "#FF6A00",
  bone: "#FFFFFF",
  bone600: "#A1A1AA",
  bone800: "#52525B",
  mint: "#2FBF71",
  ember: "#E5484D",
} as const;

export const fonts = {
  display: "Sora_600SemiBold",
  displayBold: "Sora_700Bold",
  sans: "Inter_400Regular",
  sansMedium: "Inter_500Medium",
  sansSemibold: "Inter_600SemiBold",
  mono: "JetBrainsMono_500Medium",
} as const;

export const radii = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  pill: 999,
} as const;

export const spacing = (n: number) => n * 4;
