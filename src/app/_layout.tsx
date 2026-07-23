import "../../global.css";

import { useEffect } from "react";
import { View } from "react-native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useFonts } from "expo-font";
import { fontMap, colors } from "@core/theme";
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

function Splash() {
  return (
    <View className="flex-1 items-center justify-center bg-ink-950">
      <Text variant="h1" className="text-flame-500">
        fluxo
      </Text>
    </View>
  );
}

/**
 * Gate de autenticação via Stack.Protected: o grupo (app) só MONTA quando a
 * sessão está confirmada — nada de dashboard disparando queries sem token
 * durante o boot (era isso que corrompia a sessão ao reabrir o app). Enquanto
 * o bootstrap decide, mostramos o splash.
 */
function AuthGate() {
  const status = useAuthStore((s) => s.status);

  if (status === "loading") return <Splash />;

  const authed = status === "authenticated";
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.ink950 },
      }}
    >
      <Stack.Protected guard={!authed}>
        <Stack.Screen name="(auth)" />
      </Stack.Protected>
      <Stack.Protected guard={authed}>
        <Stack.Screen name="(app)" />
        <Stack.Screen
          name="(modals)"
          options={{ presentation: "transparentModal", animation: "fade" }}
        />
      </Stack.Protected>
    </Stack>
  );
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts(fontMap);
  const bootstrap = useAuthStore((s) => s.bootstrap);
  const hydrateBasis = usePeriodStore((s) => s.hydrateBasis);

  useEffect(() => {
    void bootstrap();
    void hydrateBasis();
  }, [bootstrap, hydrateBasis]);

  if (!fontsLoaded) return <Splash />;

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
