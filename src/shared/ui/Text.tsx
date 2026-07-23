/**
 * Componente de texto do design system. Encapsula os três papéis de fonte
 * (BRIEF §4.2) e a escala tipográfica. NUNCA hardcode fontFamily fora daqui.
 */
import { Text as RNText, type TextProps as RNTextProps } from "react-native";
import { cssInterop } from "nativewind";

export type TextVariant =
  | "display" // Sora 40 — saldos, valores de destaque
  | "h1" // Sora 28 — títulos de tela
  | "h2" // Sora 20 — títulos de seção
  | "body" // Inter 16 — corpo
  | "label" // Inter 14 medium — labels
  | "caption" // Inter 12 — secundário
  | "mono" // JetBrains Mono — valores em lista/tabela
  | "mono-lg"; // JetBrains Mono grande — valor do teclado

const VARIANT_CLASS: Record<TextVariant, string> = {
  display: "font-display-bold text-display text-bone",
  h1: "font-display text-h1 text-bone",
  h2: "font-display text-h2 text-bone",
  body: "font-sans text-base text-bone",
  label: "font-sans-medium text-sm text-bone",
  caption: "font-sans text-xs text-bone-600",
  mono: "font-mono text-base text-bone",
  "mono-lg": "font-mono text-display text-flame-500",
};

// tabular-nums é obrigatório em qualquer número de valor (BRIEF §4.2).
cssInterop(RNText, { className: "style" });

interface TextProps extends RNTextProps {
  variant?: TextVariant;
  className?: string;
  /** Ativa tabular-nums para alinhar colunas de valores. */
  tabular?: boolean;
}

export function Text({
  variant = "body",
  className = "",
  tabular = false,
  style,
  ...rest
}: TextProps) {
  const tab = tabular || variant === "mono" || variant === "mono-lg";
  return (
    <RNText
      className={`${VARIANT_CLASS[variant]} ${className}`}
      style={[tab ? { fontVariant: ["tabular-nums"] } : null, style]}
      {...rest}
    />
  );
}
