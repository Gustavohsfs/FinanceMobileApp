/**
 * Estado vazio — convite, não erro (BRIEF §4.4): "Nenhum gasto em julho.
 * Registre o primeiro." Desenhado em toda lista/bloco (DoD §11).
 */
import { View } from "react-native";
import { colors } from "@core/theme";
import { Text } from "./Text";
import { Icon, type IconName } from "./Icon";
import { Button } from "./Button";

interface EmptyStateProps {
  icon?: IconName;
  title: string;
  hint?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({
  icon = "ellipsis",
  title,
  hint,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <View className="items-center justify-center gap-3 px-6 py-10">
      <View className="h-14 w-14 items-center justify-center rounded-full border border-ink-800 bg-ink-900">
        <Icon name={icon} size={26} color={colors.bone800} />
      </View>
      <Text variant="label" className="text-center text-bone">
        {title}
      </Text>
      {hint ? (
        <Text variant="caption" className="text-center text-bone-600">
          {hint}
        </Text>
      ) : null}
      {actionLabel && onAction ? (
        <View className="mt-2">
          <Button label={actionLabel} onPress={onAction} fullWidth={false} size="md" />
        </View>
      ) : null}
    </View>
  );
}
