import { useCallback } from "react";
import { Pressable, View, type ColorValue } from "react-native";
import {
  Drawer,
  DrawerContentScrollView,
  DrawerItemList,
  type DrawerContentComponentProps,
} from "expo-router/drawer";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { colors } from "@core/theme";
import { useAuthStore } from "@features/auth";
import { ConsolidatedBalance } from "@features/dashboard";
import { Icon, Text } from "@shared/ui";

function CustomDrawerContent(props: DrawerContentComponentProps) {
  const insets = useSafeAreaInsets();
  const user = useAuthStore((s) => s.user);
  return (
    <View className="flex-1 bg-ink-950">
      <View
        className="gap-1 border-b border-ink-800 px-4 pb-5"
        style={{ paddingTop: insets.top + 16 }}
      >
        <Text variant="h2">{user?.name ?? "você"}</Text>
        <Text variant="caption" className="mb-2 text-bone-600">
          {user?.email ?? ""}
        </Text>
        <ConsolidatedBalance />
      </View>
      <DrawerContentScrollView {...props} contentContainerStyle={{ paddingTop: 8 }}>
        <DrawerItemList {...props} />
      </DrawerContentScrollView>
    </View>
  );
}

function HeaderMenuButton() {
  return (
    <Pressable
      onPress={() => router.push("/(app)/settings")}
      accessibilityRole="button"
      accessibilityLabel="menu de opções"
      className="mr-3 h-11 w-11 items-center justify-center rounded-full active:bg-ink-800"
    >
      <Icon name="more-vertical" color={colors.bone} />
    </Pressable>
  );
}

const DRAWER_ITEM = {
  drawerActiveTintColor: colors.flame500,
  drawerInactiveTintColor: colors.bone600,
  drawerActiveBackgroundColor: colors.ink900,
  drawerLabelStyle: { fontFamily: "Inter_500Medium", marginLeft: -8 },
};

function icon(name: string) {
  return ({ color }: { color: ColorValue; size: number; focused: boolean }) => (
    <Icon name={name} size={20} color={color as string} />
  );
}

export default function AppLayout() {
  const openQuickEntry = useCallback(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push("/(modals)/quick-entry");
  }, []);

  return (
    <View className="flex-1 bg-ink-950">
      <Drawer
        drawerContent={(props) => <CustomDrawerContent {...props} />}
        screenOptions={{
          headerStyle: { backgroundColor: colors.ink950 },
          headerShadowVisible: false,
          headerTintColor: colors.bone,
          headerTitleStyle: { fontFamily: "Sora_600SemiBold", fontSize: 18 },
          headerRight: () => <HeaderMenuButton />,
          sceneStyle: { backgroundColor: colors.ink950 },
          drawerStyle: { backgroundColor: colors.ink950, width: 288 },
          ...DRAWER_ITEM,
        }}
      >
        <Drawer.Screen
          name="index"
          options={{ title: "Dashboard", drawerIcon: icon("trending-up") }}
        />
        <Drawer.Screen
          name="transactions"
          options={{ title: "Lançamentos", drawerIcon: icon("arrow-left-right") }}
        />
        <Drawer.Screen
          name="categories"
          options={{ title: "Categorias", drawerIcon: icon("tags") }}
        />
        <Drawer.Screen
          name="income"
          options={{ title: "Entradas", drawerIcon: icon("arrow-down-left") }}
        />
        <Drawer.Screen
          name="goals"
          options={{ title: "Metas", drawerIcon: icon("target") }}
        />
        <Drawer.Screen
          name="accounts"
          options={{ title: "Contas e cartões", drawerIcon: icon("credit-card") }}
        />
        <Drawer.Screen
          name="reports"
          options={{ title: "Relatórios", drawerIcon: icon("banknote") }}
        />
        <Drawer.Screen
          name="settings"
          options={{ title: "Configurações", drawerIcon: icon("settings") }}
        />
      </Drawer>

      {/* FAB de registro rápido — presente em todas as telas do grupo (BRIEF §7) */}
      <Pressable
        onPress={openQuickEntry}
        accessibilityRole="button"
        accessibilityLabel="registrar gasto"
        className="absolute bottom-8 right-6 h-16 w-16 items-center justify-center rounded-full bg-flame-500 shadow-lg active:bg-flame-400"
        style={{
          shadowColor: colors.flame500,
          shadowOpacity: 0.5,
          shadowRadius: 12,
          shadowOffset: { width: 0, height: 4 },
          elevation: 8,
        }}
      >
        <Icon name="plus" size={30} color={colors.ink950} strokeWidth={2.5} />
      </Pressable>
    </View>
  );
}
