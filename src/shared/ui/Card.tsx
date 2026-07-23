/**
 * Card — superfície elevada (ink-900). Cada card responde a uma pergunta
 * (BRIEF §1). Título opcional em Sora.
 */
import { View, type ViewProps } from "react-native";
import { Text } from "./Text";

interface CardProps extends ViewProps {
  title?: string;
  action?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}

export function Card({ title, action, className = "", children, ...rest }: CardProps) {
  return (
    <View
      className={`rounded-2xl border border-ink-800 bg-ink-900 p-4 ${className}`}
      {...rest}
    >
      {title || action ? (
        <View className="mb-3 flex-row items-center justify-between">
          {title ? <Text variant="h2">{title}</Text> : <View />}
          {action}
        </View>
      ) : null}
      {children}
    </View>
  );
}
