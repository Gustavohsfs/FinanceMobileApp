import "../../global.css";

import { useEffect } from "react";
import { View } from "react-native";
import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useFonts } from "expo-font";
import { fontMap, colors } from "@core/theme";
import { ensureSeeded } from "@shared/bootstrap";
import { usePeriodStore } from "@shared/stores/period-store";
import { useAuthStore } from "@features/auth";
import { Text } from "@shared/ui";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 30,
      retry: false,
      refetchOnWindowFocus: false,
    },
  },
});

function AuthGate() {
  const status = useAuthStore((s) => s.status);
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (status === "loading") return;
    const inAuthGroup = segments[0] === "(auth)";
    if (status === "unauthenticated" && !inAuthGroup) {
      router.replace("/(auth)/login");
    } else if (status === "authenticated" && inAuthGroup) {
      router.replace("/(app)");
    }
  }, [status, segments, router]);

  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.ink950 } }}>
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(app)" />
      <Stack.Screen
        name="(modals)"
        options={{ presentation: "transparentModal", animation: "fade" }}
      />
    </Stack>
  );
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts(fontMap);
  const bootstrap = useAuthStore((s) => s.bootstrap);
  const hydrateBasis = usePeriodStore((s) => s.hydrateBasis);

  useEffect(() => {
    void ensureSeeded();
    void bootstrap();
    void hydrateBasis();
  }, [bootstrap, hydrateBasis]);

  if (!fontsLoaded) {
    return (
      <View className="flex-1 items-center justify-center bg-ink-950">
        <Text variant="h1" className="text-flame-500">
          fluxo
        </Text>
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <StatusBar style="light" />
          <AuthGate />
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
