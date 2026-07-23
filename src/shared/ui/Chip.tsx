/**
 * Chip selecionável — categoria, método, parcela. Substitui campos de
 * formulário empilhados no registro rápido (BRIEF §4.3). Toque ≥ 44pt.
 */
import { Pressable, View } from "react-native";
import { colors } from "@core/theme";
import { Text } from "./Text";
import { Icon, type IconName } from "./Icon";

interface ChipProps {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  icon?: IconName;
  /** Cor do ponto/ícone (ex.: cor da categoria). */
  dotColor?: string;
  accessibilityLabel?: string;
}

export function Chip({
  label,
  selected = false,
  onPress,
  icon,
  dotColor,
  accessibilityLabel,
}: ChipProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={accessibilityLabel ?? label}
      className={`h-11 flex-row items-center gap-2 rounded-full border px-4 ${
        selected
          ? "border-flame-500 bg-flame-950"
          : "border-ink-600 bg-ink-900 active:bg-ink-800"
      }`}
    >
      {icon ? (
        <Icon
          name={icon}
          size={16}
          color={selected ? colors.flame500 : colors.bone600}
        />
      ) : dotColor ? (
        <View
          className="h-2.5 w-2.5 rounded-full"
          style={{ backgroundColor: dotColor }}
        />
      ) : null}
      <Text
        variant="label"
        className={selected ? "text-flame-500" : "text-bone-600"}
      >
        {label}
      </Text>
    </Pressable>
  );
}
