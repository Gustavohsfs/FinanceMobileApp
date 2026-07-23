/**
 * Input de texto do design system. Label acima, mensagem de erro que explica
 * o que fazer (BRIEF §4.4).
 */
import { useState } from "react";
import { TextInput, View, type TextInputProps } from "react-native";
import { colors } from "@core/theme";
import { Text } from "./Text";

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
}

export function Input({ label, error, style, ...rest }: InputProps) {
  const [focused, setFocused] = useState(false);
  return (
    <View className="w-full gap-1.5">
      {label ? (
        <Text variant="label" className="text-bone-600">
          {label}
        </Text>
      ) : null}
      <TextInput
        placeholderTextColor={colors.bone800}
        selectionColor={colors.flame500}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        className={`h-12 rounded-xl border bg-ink-900 px-4 font-sans text-base text-bone ${
          error
            ? "border-ember"
            : focused
              ? "border-flame-500"
              : "border-ink-800"
        }`}
        style={style}
        {...rest}
      />
      {error ? (
        <Text variant="caption" className="text-ember">
          {error}
        </Text>
      ) : null}
    </View>
  );
}
