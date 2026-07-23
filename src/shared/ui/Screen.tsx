/**
 * Casca de tela: fundo ink-950 + safe area. Versão scroll e versão fixa.
 */
import type { ReactNode } from "react";
import { ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface ScreenProps {
  children: ReactNode;
  scroll?: boolean;
  className?: string;
  contentClassName?: string;
}

export function Screen({
  children,
  scroll = false,
  className = "",
  contentClassName = "",
}: ScreenProps) {
  const insets = useSafeAreaInsets();
  if (scroll) {
    return (
      <View className={`flex-1 bg-ink-950 ${className}`}>
        <ScrollView
          contentContainerStyle={{ paddingBottom: insets.bottom + 96 }}
          showsVerticalScrollIndicator={false}
          className={contentClassName}
        >
          {children}
        </ScrollView>
      </View>
    );
  }
  return <View className={`flex-1 bg-ink-950 ${className}`}>{children}</View>;
}
