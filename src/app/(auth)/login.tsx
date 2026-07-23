import { useState } from "react";
import { View } from "react-native";
import { Link } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuthStore } from "@features/auth";
import { Button, Input, Screen, Text } from "@shared/ui";

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const signIn = useAuthStore((s) => s.signIn);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit() {
    setError(null);
    setLoading(true);
    try {
      await signIn(email, password);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Não foi possível entrar");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen>
      <View
        className="flex-1 justify-center gap-8 px-6"
        style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}
      >
        <View className="gap-2">
          <Text variant="display" className="text-flame-500">
            fluxo
          </Text>
          <Text variant="body" className="text-bone-600">
            registrar um gasto custa menos que não registrar.
          </Text>
        </View>

        <View className="gap-4">
          <Input
            label="email"
            placeholder="voce@email.com"
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
          />
          <Input
            label="senha"
            placeholder="••••••••"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            {...(error ? { error } : {})}
          />
          <Button label="Entrar" onPress={onSubmit} loading={loading} />
        </View>

        <View className="flex-row justify-center gap-1">
          <Text variant="caption">novo por aqui?</Text>
          <Link href="/(auth)/register">
            <Text variant="caption" className="text-flame-500">
              criar conta
            </Text>
          </Link>
        </View>
      </View>
    </Screen>
  );
}
