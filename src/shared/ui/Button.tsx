/**
 * Botão do design system. Voz ativa nos rótulos (BRIEF §4.4): "Salvar gasto".
 * Área de toque ≥ 44pt (DoD §11). Laranja = ação primária.
 */
import { ActivityIndicator, Pressable, View } from "react-native";
import { colors } from "@core/theme";
import { Text } from "./Text";
import { Icon, type IconName } from "./Icon";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "md" | "lg";

interface ButtonProps {
  label: string;
  onPress?: () => void;
  variant?: Variant;
  size?: Size;
  disabled?: boolean;
  loading?: boolean;
  icon?: IconName;
  fullWidth?: boolean;
  accessibilityLabel?: string;
}

const CONTAINER: Record<Variant, string> = {
  primary: "bg-flame-500 active:bg-flame-400",
  secondary: "bg-ink-800 active:bg-ink-600 border border-ink-600",
  ghost: "bg-transparent active:bg-ink-800",
  danger: "bg-transparent border border-ember active:bg-ink-800",
};

const TEXT_COLOR: Record<Variant, string> = {
  primary: "text-ink-950",
  secondary: "text-bone",
  ghost: "text-bone",
  danger: "text-ember",
};

const SIZE: Record<Size, string> = {
  md: "h-12 px-4",
  lg: "h-14 px-6",
};

export function Button({
  label,
  onPress,
  variant = "primary",
  size = "md",
  disabled = false,
  loading = false,
  icon,
  fullWidth = true,
  accessibilityLabel,
}: ButtonProps) {
  const isDisabled = disabled || loading;
  const iconColor = variant === "primary" ? colors.ink950 : colors.bone;
  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      className={`${SIZE[size]} ${CONTAINER[variant]} ${
        fullWidth ? "w-full" : "self-start"
      } flex-row items-center justify-center gap-2 rounded-xl ${
        isDisabled ? "opacity-40" : ""
      }`}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === "primary" ? colors.ink950 : colors.flame500}
        />
      ) : (
        <View className="flex-row items-center gap-2">
          {icon ? <Icon name={icon} size={20} color={iconColor} /> : null}
          <Text
            variant="label"
            className={`${TEXT_COLOR[variant]} font-sans-semibold`}
          >
            {label}
          </Text>
        </View>
      )}
    </Pressable>
  );
}
