import { Pressable, ScrollView, View } from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { addMonthsToKey, currentMonthKey, monthLabel } from "@core/domain";
import { usePeriodStore } from "@shared/stores/period-store";
import { Text } from "@shared/ui";

export default function PeriodPickerScreen() {
  const insets = useSafeAreaInsets();
  const { monthKey, setMonth } = usePeriodStore();
  const months = Array.from({ length: 15 }, (_, i) =>
    addMonthsToKey(currentMonthKey(), 2 - i),
  );

  return (
    <View className="flex-1 justify-end">
      <Pressable
        className="absolute inset-0 bg-black/60"
        onPress={() => router.back()}
        accessibilityRole="button"
        accessibilityLabel="fechar"
      />
      <View
        className="max-h-[70%] rounded-t-3xl border-t border-ink-800 bg-ink-950 px-5 pt-4"
        style={{ paddingBottom: insets.bottom + 16 }}
      >
        <Text variant="h2" className="mb-3">
          escolher mês
        </Text>
        <ScrollView showsVerticalScrollIndicator={false}>
          {months.map((k) => {
            const active = k === monthKey;
            return (
              <Pressable
                key={k}
                onPress={() => {
                  setMonth(k);
                  router.back();
                }}
                className={`h-12 justify-center rounded-xl px-4 ${
                  active ? "bg-flame-950" : "active:bg-ink-900"
                }`}
              >
                <Text
                  variant="label"
                  className={`capitalize ${active ? "text-flame-500" : "text-bone"}`}
                >
                  {monthLabel(k)}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>
    </View>
  );
}
