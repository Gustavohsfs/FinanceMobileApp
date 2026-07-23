/**
 * Exibe um valor monetário. SEMPRE tabular-nums e SEMPRE formatado via
 * core/money (nunca toFixed). Sinal por cor só como pontuação (BRIEF §4.1):
 * laranja = saída, branco = neutro, verde/vermelho pontuais.
 */
import { format, formatSigned, type Cents } from "@core/money";
import { Text, type TextVariant } from "./Text";

type Tone = "neutral" | "expense" | "income" | "over" | "muted";

interface MoneyTextProps {
  cents: Cents;
  variant?: TextVariant;
  tone?: Tone;
  signed?: boolean;
  /** Valor projetado é visualmente distinto (guardrail §8.8). */
  projected?: boolean;
  className?: string;
}

const TONE_CLASS: Record<Tone, string> = {
  neutral: "text-bone",
  expense: "text-flame-500",
  income: "text-mint",
  over: "text-ember",
  muted: "text-bone-600",
};

export function MoneyText({
  cents,
  variant = "mono",
  tone = "neutral",
  signed = false,
  projected = false,
  className = "",
}: MoneyTextProps) {
  return (
    <Text
      variant={variant}
      tabular
      className={`${TONE_CLASS[tone]} ${projected ? "italic opacity-60" : ""} ${className}`}
    >
      {signed ? formatSigned(cents) : format(cents)}
    </Text>
  );
}
