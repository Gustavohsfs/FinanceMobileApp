/**
 * Badge pequeno. Usado para marcar valor projetado/previsto (guardrail §8.8)
 * e contadores. Fundo tingido de laranja para "projeção".
 */
import { View } from "react-native";
import { Text } from "./Text";

type BadgeTone = "flame" | "muted" | "over" | "income";

const TONE: Record<BadgeTone, { bg: string; text: string }> = {
  flame: { bg: "bg-flame-950", text: "text-flame-400" },
  muted: { bg: "bg-ink-800", text: "text-bone-600" },
  over: { bg: "bg-ink-800", text: "text-ember" },
  income: { bg: "bg-ink-800", text: "text-mint" },
};

export function Badge({
  label,
  tone = "muted",
}: {
  label: string;
  tone?: BadgeTone;
}) {
  const t = TONE[tone];
  return (
    <View className={`self-start rounded-full px-2 py-0.5 ${t.bg}`}>
      <Text variant="caption" className={`${t.text} font-sans-medium`}>
        {label}
      </Text>
    </View>
  );
}
