import { Stack } from "expo-router";
import { colors } from "@core/theme";

export default function SectionLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.ink950 },
      }}
    />
  );
}
