/**
 * SEGUNDA ASSINATURA (BRIEF §4.3 e §6.5): o scrubber do gráfico.
 *
 * Linha/área da evolução do saldo acumulado no mês. Ao encostar o dedo:
 * hairline vertical + ponto laranja no dado exato + pílula flutuante com data e
 * valor. Cada troca de ponto dispara Haptics.selectionAsync(). Render por Skia
 * via victory-native (useChartPressState).
 *
 * `value` é plotado em centavos (inteiro); a formatação BRL acontece só na
 * pílula, via core/money. Nenhuma conta de dinheiro é feita aqui.
 */
import { useCallback, useEffect, useState } from "react";
import { View } from "react-native";
import {
  Circle,
  DashPathEffect,
  Line as SkiaLine,
  LinearGradient,
  vec,
} from "@shopify/react-native-skia";
import { CartesianChart, Line, Area, useChartPressState } from "victory-native";
import { useAnimatedReaction, runOnJS } from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { colors } from "@core/theme";
import { format, type Cents } from "@core/money";
import { dayLabel } from "@core/domain";
import { Text } from "@shared/ui";
import type { ISODate } from "@core/domain";

export interface LinePoint extends Record<string, unknown> {
  index: number;
  value: Cents;
  iso: ISODate;
}

interface LineAreaChartProps {
  data: LinePoint[];
  height?: number;
}

export function LineAreaChart({ data, height = 200 }: LineAreaChartProps) {
  const { state, isActive } = useChartPressState({ x: 0, y: { value: 0 } });
  const [active, setActive] = useState<{ label: string; value: Cents } | null>(
    null,
  );

  // Roda na THREAD JS. Worklet não pode chamar função importada comum
  // (dayLabel virava um "remote object" na UI thread → "is not a function").
  // O worklet manda só o índice; label e haptic acontecem aqui.
  const onScrub = useCallback(
    (idx: number) => {
      const p = data[idx];
      if (!p) return;
      void Haptics.selectionAsync();
      setActive({ label: dayLabel(p.iso), value: p.value });
    },
    [data],
  );

  // Atualiza a pílula quando o índice sob o dedo muda. prev === null é a
  // primeira avaliação (montagem) — ignora para não disparar pílula/haptic
  // sem toque.
  useAnimatedReaction(
    () => state.x.value.value,
    (curr, prev) => {
      if (prev === null || Math.round(curr) === Math.round(prev)) return;
      runOnJS(onScrub)(Math.round(curr));
    },
    [onScrub],
  );

  useEffect(() => {
    if (!isActive) setActive(null);
  }, [isActive]);

  if (data.length < 2) {
    return (
      <View
        style={{ height }}
        className="items-center justify-center rounded-xl border border-ink-800"
      >
        <Text variant="caption">dados insuficientes para o gráfico</Text>
      </View>
    );
  }

  return (
    <View style={{ height }}>
      {/* pílula flutuante */}
      <View className="h-6 flex-row items-center justify-center">
        {active ? (
          <View className="flex-row items-center gap-2 rounded-full border border-ink-800 bg-ink-900 px-3 py-0.5">
            <Text variant="caption" className="text-bone-600">
              {active.label}
            </Text>
            <Text
              className="font-mono text-xs text-flame-500"
              tabular
            >
              {format(active.value)}
            </Text>
          </View>
        ) : (
          <Text variant="caption" className="text-bone-800">
            arraste o dedo no gráfico
          </Text>
        )}
      </View>

      <View style={{ flex: 1 }}>
        <CartesianChart
          data={data}
          xKey="index"
          yKeys={["value"]}
          chartPressState={state}
          domainPadding={{ top: 16, bottom: 8 }}
          padding={{ left: 4, right: 4, top: 4, bottom: 4 }}
        >
          {({ points, chartBounds }) => (
            <>
              <Area
                points={points.value}
                y0={chartBounds.bottom}
                curveType="natural"
                animate={{ type: "timing", duration: 300 }}
              >
                <LinearGradient
                  start={vec(0, chartBounds.top)}
                  end={vec(0, chartBounds.bottom)}
                  colors={[colors.flame500 + "55", colors.flame950 + "00"]}
                />
              </Area>
              <Line
                points={points.value}
                color={colors.flame500}
                strokeWidth={2.5}
                curveType="natural"
                animate={{ type: "timing", duration: 300 }}
              />
              {isActive ? (
                <>
                  <SkiaLine
                    p1={vec(state.x.position.value, chartBounds.top)}
                    p2={vec(state.x.position.value, chartBounds.bottom)}
                    color={colors.bone600}
                    strokeWidth={1}
                  >
                    <DashPathEffect intervals={[4, 4]} />
                  </SkiaLine>
                  <Circle
                    cx={state.x.position}
                    cy={state.y.value.position}
                    r={5}
                    color={colors.flame500}
                  />
                  <Circle
                    cx={state.x.position}
                    cy={state.y.value.position}
                    r={9}
                    color={colors.flame500 + "33"}
                  />
                </>
              ) : null}
            </>
          )}
        </CartesianChart>
      </View>
    </View>
  );
}
