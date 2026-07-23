import { useEffect, useState } from "react";
import { Switch, View } from "react-native";
import { useQueryClient } from "@tanstack/react-query";
import * as LocalAuthentication from "expo-local-authentication";
import { colors } from "@core/theme";
import { kv } from "@core/storage";
import { Button, Card, Icon, Screen, SegmentedControl, Text } from "@shared/ui";
import { usePeriodStore } from "@shared/stores/period-store";
import { resetData } from "@shared/bootstrap";
import { useAuthStore } from "@features/auth";

const BIOMETRICS_KEY = "fluxo.pref.biometrics";

export default function SettingsScreen() {
  const qc = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const signOut = useAuthStore((s) => s.signOut);
  const { basis, setBasis } = usePeriodStore();

  const [biometrics, setBiometrics] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);

  useEffect(() => {
    void kv.getString(BIOMETRICS_KEY).then((v) => setBiometrics(v === "1"));
  }, []);

  async function toggleBiometrics(next: boolean) {
    if (next) {
      const has = await LocalAuthentication.hasHardwareAsync();
      const enrolled = await LocalAuthentication.isEnrolledAsync();
      if (!has || !enrolled) {
        setBiometrics(false);
        return;
      }
      const res = await LocalAuthentication.authenticateAsync({
        promptMessage: "Confirme para ativar a biometria",
      });
      if (!res.success) return;
    }
    setBiometrics(next);
    await kv.set(BIOMETRICS_KEY, next ? "1" : "0");
  }

  async function onReset() {
    await resetData();
    await qc.invalidateQueries();
    setConfirmReset(false);
  }

  async function onSignOut() {
    await signOut();
    qc.clear();
  }

  return (
    <Screen scroll>
      <View className="gap-4 px-4 pt-3">
        <Card title="perfil">
          <View className="flex-row items-center gap-3">
            <View className="h-12 w-12 items-center justify-center rounded-full bg-flame-950">
              <Icon name="wallet" color={colors.flame500} />
            </View>
            <View>
              <Text variant="label">{user?.name ?? "você"}</Text>
              <Text variant="caption">{user?.email ?? ""}</Text>
            </View>
          </View>
        </Card>

        <Card title="visualização">
          <Text variant="caption" className="mb-2 text-bone-600">
            base padrão das agregações
          </Text>
          <SegmentedControl
            options={[
              { value: "ACCRUAL", label: "competência" },
              { value: "CASH", label: "caixa" },
            ]}
            value={basis}
            onChange={setBasis}
          />
        </Card>

        <Card title="segurança">
          <View className="flex-row items-center justify-between">
            <View className="flex-1 pr-3">
              <Text variant="label">biometria ao abrir</Text>
              <Text variant="caption" className="text-bone-600">
                pede Face ID / digital ao reabrir o app.
              </Text>
            </View>
            <Switch
              value={biometrics}
              onValueChange={toggleBiometrics}
              trackColor={{ false: colors.ink800, true: colors.flame500 }}
              thumbColor={colors.bone}
            />
          </View>
        </Card>

        <Card title="tema">
          <Text variant="caption" className="text-bone-600">
            fluxo é dark-first. o modo claro entra numa fase de polimento.
          </Text>
        </Card>

        <Card title="dados">
          {confirmReset ? (
            <View className="gap-2">
              <Text variant="caption" className="text-bone-600">
                isso apaga seus lançamentos e recria os dados de exemplo. sem volta.
              </Text>
              <Button label="Sim, recriar dados" variant="danger" onPress={onReset} />
              <Button label="Cancelar" variant="ghost" onPress={() => setConfirmReset(false)} />
            </View>
          ) : (
            <Button
              label="Limpar e recriar dados de exemplo"
              variant="secondary"
              icon="trash"
              onPress={() => setConfirmReset(true)}
            />
          )}
        </Card>

        <Button label="Sair" variant="ghost" icon="log-out" onPress={onSignOut} />
      </View>
    </Screen>
  );
}
