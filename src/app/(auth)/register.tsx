import { useState } from "react";
import { View } from "react-native";
import { Link } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuthStore } from "@features/auth";
import { Button, Input, Screen, Text } from "@shared/ui";

export default function RegisterScreen() {
  const insets = useSafeAreaInsets();
  const signUp = useAuthStore((s) => s.signUp);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit() {
    setError(null);
    setLoading(true);
    try {
      await signUp(name, email, password);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Não foi possível criar a conta");
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
          <Text variant="h1">criar conta</Text>
          <Text variant="body" className="text-bone-600">
            leva menos de um minuto.
          </Text>
        </View>

        <View className="gap-4">
          <Input label="nome" placeholder="seu nome" value={name} onChangeText={setName} />
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
          <Button label="Criar conta" onPress={onSubmit} loading={loading} />
        </View>

        <View className="flex-row justify-center gap-1">
          <Text variant="caption">já tem conta?</Text>
          <Link href="/(auth)/login">
            <Text variant="caption" className="text-flame-500">
              entrar
            </Text>
          </Link>
        </View>
      </View>
    </Screen>
  );
}
