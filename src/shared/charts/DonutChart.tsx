/**
 * Donut por categoria (BRIEF §6.5 item 4): top 5 + "outros", laranja em
 * degradê de opacidade. Tocar numa fatia seleciona/filtra (onSelect).
 * Valores em centavos; formatação só no centro.
 */
import { useMemo } from "react";
import { Pressable, View } from "react-native";
import Svg, { Path, Circle } from "react-native-svg";
import { colors } from "@core/theme";
import { format, sum, type Cents } from "@core/money";
import { Text } from "@shared/ui";

export interface DonutSlice {
  key: string;
  label: string;
  value: Cents;
  color: string;
}

interface DonutChartProps {
  slices: DonutSlice[];
  selectedKey?: string | null;
  onSelect?: (key: string | null) => void;
  size?: number;
}

// tons de laranja/neutro em degradê de opacidade para as fatias sem cor própria
const FLAME_RAMP = ["#FF6A00", "#FF7A1A", "#FF8A2B", "#E0761F", "#B35F1A", "#52525B"];

function polar(cx: number, cy: number, r: number, angle: number) {
  const a = (angle - 90) * (Math.PI / 180);
  return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
}

function arcPath(
  cx: number,
  cy: number,
  rOuter: number,
  rInner: number,
  start: number,
  end: number,
) {
  const largeArc = end - start > 180 ? 1 : 0;
  const p1 = polar(cx, cy, rOuter, end);
  const p2 = polar(cx, cy, rOuter, start);
  const p3 = polar(cx, cy, rInner, start);
  const p4 = polar(cx, cy, rInner, end);
  return [
    `M ${p1.x} ${p1.y}`,
    `A ${rOuter} ${rOuter} 0 ${largeArc} 0 ${p2.x} ${p2.y}`,
    `L ${p3.x} ${p3.y}`,
    `A ${rInner} ${rInner} 0 ${largeArc} 1 ${p4.x} ${p4.y}`,
    "Z",
  ].join(" ");
}

export function DonutChart({
  slices,
  selectedKey,
  onSelect,
  size = 200,
}: DonutChartProps) {
  const total = useMemo(() => sum(slices.map((s) => s.value)), [slices]);
  const cx = size / 2;
  const cy = size / 2;
  const rOuter = size / 2;
  const rInner = size / 2 - 26;

  const segments = useMemo(() => {
    if (total === 0) return [];
    let angle = 0;
    return slices.map((s, i) => {
      const sweep = (s.value / total) * 360;
      const start = angle;
      const end = angle + sweep;
      angle = end;
      return {
        ...s,
        start,
        end,
        color: s.color ?? FLAME_RAMP[Math.min(i, FLAME_RAMP.length - 1)],
      };
    });
  }, [slices, total, cx, cy, rOuter, rInner]);

  const centerValue = selectedKey
    ? (slices.find((s) => s.key === selectedKey)?.value ?? total)
    : total;
  const centerLabel = selectedKey
    ? (slices.find((s) => s.key === selectedKey)?.label ?? "total")
    : "total do mês";

  return (
    <View className="items-center">
      <View style={{ width: size, height: size }}>
        <Svg width={size} height={size}>
          {segments.map((seg) => {
            const dim = selectedKey && selectedKey !== seg.key;
            return (
              <Path
                key={seg.key}
                d={arcPath(cx, cy, rOuter, rInner, seg.start, seg.end)}
                fill={seg.color}
                opacity={dim ? 0.25 : 1}
              />
            );
          })}
          {total === 0 ? (
            <Circle
              cx={cx}
              cy={cy}
              r={(rOuter + rInner) / 2}
              stroke={colors.ink800}
              strokeWidth={rOuter - rInner}
              fill="none"
            />
          ) : null}
        </Svg>
        {/* centro */}
        <View className="absolute inset-0 items-center justify-center">
          <Text variant="caption" className="text-bone-600">
            {centerLabel}
          </Text>
          <Text className="font-mono text-h2 text-bone" tabular>
            {format(centerValue)}
          </Text>
        </View>
      </View>

      {/* legenda tocável */}
      <View className="mt-4 w-full gap-2">
        {segments.map((seg) => {
          const selected = selectedKey === seg.key;
          return (
            <Pressable
              key={seg.key}
              onPress={() => onSelect?.(selected ? null : seg.key)}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              className={`flex-row items-center justify-between rounded-lg px-2 py-1.5 ${
                selected ? "bg-ink-800" : ""
              }`}
            >
              <View className="flex-row items-center gap-2">
                <View
                  className="h-3 w-3 rounded-sm"
                  style={{ backgroundColor: seg.color }}
                />
                <Text variant="label" className="text-bone-600">
                  {seg.label}
                </Text>
              </View>
              <Text className="font-mono text-sm text-bone" tabular>
                {format(seg.value)}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
