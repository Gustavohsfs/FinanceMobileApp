/**
 * Header de período (BRIEF §6.5 item 1): mês corrente, setas para navegar e
 * toggle competência/caixa. Lê e escreve no period-store.
 */
import { Pressable, View } from "react-native";
import { colors } from "@core/theme";
import { monthLabel } from "@core/domain";
import { Icon, SegmentedControl, Text } from "@shared/ui";
import { usePeriodStore } from "@shared/stores/period-store";

export function PeriodHeader() {
  const { monthKey, basis, goToPrevMonth, goToNextMonth, setBasis } =
    usePeriodStore();

  return (
    <View className="gap-3 px-4 pb-2 pt-1">
      <View className="flex-row items-center justify-between">
        <Pressable
          onPress={goToPrevMonth}
          accessibilityRole="button"
          accessibilityLabel="mês anterior"
          className="h-11 w-11 items-center justify-center rounded-full active:bg-ink-800"
        >
          <Icon name="chevron-left" color={colors.bone600} />
        </Pressable>
        <Text variant="h2" className="capitalize">
          {monthLabel(monthKey)}
        </Text>
        <Pressable
          onPress={goToNextMonth}
          accessibilityRole="button"
          accessibilityLabel="próximo mês"
          className="h-11 w-11 items-center justify-center rounded-full active:bg-ink-800"
        >
          <Icon name="chevron-right" color={colors.bone600} />
        </Pressable>
      </View>
      <SegmentedControl
        options={[
          { value: "ACCRUAL", label: "competência" },
          { value: "CASH", label: "caixa" },
        ]}
        value={basis}
        onChange={setBasis}
      />
    </View>
  );
}
