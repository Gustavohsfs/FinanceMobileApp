/**
 * ELEMENTO-ASSINATURA (BRIEF §4.3): o teclado de valor.
 *
 * Teclado numérico próprio (não o do sistema). Cada dígito entra pela DIREITA
 * em centavos: digitar 1,2,3,4 → R$ 12,34. Toda a aritmética é inteira (nada de
 * float). Haptic leve a cada tecla. Ocupa a metade inferior do sheet.
 */
import { useCallback } from "react";
import { Pressable, View } from "react-native";
import * as Haptics from "expo-haptics";
import type { Cents } from "@core/money";
import { colors } from "@core/theme";
import { Icon, Text } from "@shared/ui";

const MAX_CENTS = 99_999_999_99; // R$ 99.999.999,99 — trava de sanidade

type Key = string; // "0".."9" | "00" | "back"

const KEYS: Key[] = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "00", "0", "back"];

interface MoneyKeypadProps {
  value: Cents;
  onChange: (cents: Cents) => void;
}

export function MoneyKeypad({ value, onChange }: MoneyKeypadProps) {
  const press = useCallback(
    (key: Key) => {
      void Haptics.selectionAsync();
      if (key === "back") {
        onChange(Math.floor(value / 10));
        return;
      }
      const appended = key === "00" ? value * 100 : value * 10 + Number(key);
      onChange(Math.min(appended, MAX_CENTS));
    },
    [value, onChange],
  );

  return (
    <View className="flex-row flex-wrap">
      {KEYS.map((key) => (
        <Pressable
          key={key}
          onPress={() => press(key)}
          accessibilityRole="button"
          accessibilityLabel={key === "back" ? "apagar" : key}
          className="h-16 w-1/3 items-center justify-center active:opacity-50"
        >
          {key === "back" ? (
            <Icon name="chevron-left" size={26} color={colors.bone600} />
          ) : (
            <Text className="font-mono text-h1 text-bone">{key}</Text>
          )}
        </Pressable>
      ))}
    </View>
  );
}
