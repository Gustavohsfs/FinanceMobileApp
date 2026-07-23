/**
 * Controle segmentado — usado no toggle competência/caixa (BRIEF §6.5) e em
 * filtros de tipo. Genérico sobre o valor selecionado.
 */
import { Pressable, View } from "react-native";
import { Text } from "./Text";

export interface SegmentOption<T extends string> {
  value: T;
  label: string;
}

interface SegmentedControlProps<T extends string> {
  options: readonly SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
}

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
}: SegmentedControlProps<T>) {
  return (
    <View className="flex-row rounded-full border border-ink-800 bg-ink-900 p-1">
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <Pressable
            key={opt.value}
            onPress={() => onChange(opt.value)}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            className={`h-9 flex-1 items-center justify-center rounded-full px-3 ${
              active ? "bg-flame-500" : ""
            }`}
          >
            <Text
              variant="label"
              className={active ? "text-ink-950 font-sans-semibold" : "text-bone-600"}
            >
              {opt.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
