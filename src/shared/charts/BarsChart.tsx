/**
 * Barras comparativas (BRIEF §6.5 item 5): últimos 6 meses, entradas (branco)
 * vs saídas (laranja). Puro SVG, valores em centavos.
 */
import { View } from "react-native";
import Svg, { Rect } from "react-native-svg";
import { colors } from "@core/theme";
import type { Cents } from "@core/money";
import { Text } from "@shared/ui";

export interface BarGroup {
  label: string; // ex.: "jul/26"
  incomeCents: Cents;
  expenseCents: Cents;
}

interface BarsChartProps {
  groups: BarGroup[];
  height?: number;
}

export function BarsChart({ groups, height = 160 }: BarsChartProps) {
  const max = Math.max(
    1,
    ...groups.flatMap((g) => [g.incomeCents, g.expenseCents]),
  );
  const chartH = height - 22;

  return (
    <View>
      <View style={{ height: chartH }} className="flex-row items-end justify-between">
        {groups.map((g, i) => {
          const inH = (g.incomeCents / max) * chartH;
          const exH = (g.expenseCents / max) * chartH;
          return (
            <View key={i} className="flex-1 items-center justify-end">
              <Svg width={34} height={chartH}>
                <Rect
                  x={2}
                  y={chartH - inH}
                  width={13}
                  height={Math.max(inH, 1)}
                  rx={3}
                  fill={colors.bone}
                  opacity={0.9}
                />
                <Rect
                  x={19}
                  y={chartH - exH}
                  width={13}
                  height={Math.max(exH, 1)}
                  rx={3}
                  fill={colors.flame500}
                />
              </Svg>
            </View>
          );
        })}
      </View>
      <View className="mt-1.5 flex-row justify-between">
        {groups.map((g, i) => (
          <View key={i} className="flex-1 items-center">
            <Text variant="caption" className="text-bone-800">
              {g.label}
            </Text>
          </View>
        ))}
      </View>
      <View className="mt-2 flex-row justify-center gap-4">
        <Legend color={colors.bone} label="entradas" />
        <Legend color={colors.flame500} label="saídas" />
      </View>
    </View>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <View className="flex-row items-center gap-1.5">
      <View className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: color }} />
      <Text variant="caption" className="text-bone-600">
        {label}
      </Text>
    </View>
  );
}
