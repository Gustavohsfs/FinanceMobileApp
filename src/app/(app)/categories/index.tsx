import { useMemo, useState } from "react";
import { Pressable, ScrollView, View } from "react-native";
import type { CategoryType } from "@core/domain";
import { MoneyText } from "@shared/ui";
import {
  Button,
  Card,
  Chip,
  EmptyState,
  Icon,
  Input,
  Screen,
  SegmentedControl,
  Text,
} from "@shared/ui";
import { colors } from "@core/theme";
import {
  useArchiveCategory,
  useCategories,
  useCreateCategory,
} from "@features/categories";

const ICON_PALETTE = [
  "shopping-cart", "bus", "house", "heart-pulse", "party-popper",
  "graduation-cap", "repeat", "wallet", "laptop", "trending-up", "credit-card", "ellipsis",
];
const COLOR_PALETTE = ["#FF6A00", "#FF8A2B", "#A1A1AA", "#2FBF71", "#E5484D", "#52525B"];

export default function CategoriesScreen() {
  const { data: categories } = useCategories();
  const createCat = useCreateCategory();
  const archive = useArchiveCategory();

  const [type, setType] = useState<CategoryType>("EXPENSE");
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const [icon, setIcon] = useState(ICON_PALETTE[0]!);
  const [color, setColor] = useState(COLOR_PALETTE[0]!);

  const rows = useMemo(
    () => (categories ?? []).filter((c) => c.type === type),
    [categories, type],
  );

  async function onCreate() {
    if (!name.trim()) return;
    await createCat.mutateAsync({ name: name.trim(), icon, color, type });
    setName("");
    setAdding(false);
  }

  return (
    <Screen scroll>
      <View className="gap-4 px-4 pt-3">
        <SegmentedControl
          options={[
            { value: "EXPENSE", label: "saídas" },
            { value: "INCOME", label: "entradas" },
          ]}
          value={type}
          onChange={setType}
        />

        {adding ? (
          <Card title="nova categoria">
            <View className="gap-3">
              <Input label="nome" placeholder="ex.: Pets" value={name} onChangeText={setName} />
              <Text variant="caption" className="text-bone-600">
                ícone
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View className="flex-row gap-2">
                  {ICON_PALETTE.map((ic) => (
                    <Pressable
                      key={ic}
                      onPress={() => setIcon(ic)}
                      className={`h-11 w-11 items-center justify-center rounded-full border ${
                        icon === ic ? "border-flame-500 bg-flame-950" : "border-ink-600"
                      }`}
                    >
                      <Icon name={ic} size={18} color={icon === ic ? colors.flame500 : colors.bone600} />
                    </Pressable>
                  ))}
                </View>
              </ScrollView>
              <Text variant="caption" className="text-bone-600">
                cor
              </Text>
              <View className="flex-row gap-2">
                {COLOR_PALETTE.map((c) => (
                  <Pressable
                    key={c}
                    onPress={() => setColor(c)}
                    className={`h-9 w-9 rounded-full border-2 ${
                      color === c ? "border-bone" : "border-transparent"
                    }`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </View>
              <View className="flex-row gap-2">
                <View className="flex-1">
                  <Button label="Cancelar" variant="ghost" onPress={() => setAdding(false)} />
                </View>
                <View className="flex-1">
                  <Button label="Criar categoria" onPress={onCreate} loading={createCat.isPending} />
                </View>
              </View>
            </View>
          </Card>
        ) : (
          <Button label="Nova categoria" icon="plus" variant="secondary" onPress={() => setAdding(true)} />
        )}

        {rows.length > 0 ? (
          <Card>
            <View className="-mx-4">
              {rows.map((c) => (
                <View
                  key={c.id}
                  className={`flex-row items-center gap-3 px-4 py-3 ${
                    c.isArchived ? "opacity-40" : ""
                  }`}
                >
                  <View
                    className="h-10 w-10 items-center justify-center rounded-full"
                    style={{ backgroundColor: c.color + "22" }}
                  >
                    <Icon name={c.icon} size={18} color={c.color} />
                  </View>
                  <View className="flex-1">
                    <Text variant="label">{c.name}</Text>
                    {c.monthlyBudgetCents ? (
                      <MoneyText
                        cents={c.monthlyBudgetCents}
                        variant="mono"
                        tone="muted"
                        className="text-xs"
                      />
                    ) : (
                      <Text variant="caption" className="text-bone-800">
                        sem orçamento
                      </Text>
                    )}
                  </View>
                  <Chip
                    label={c.isArchived ? "arquivada" : "arquivar"}
                    selected={c.isArchived}
                    onPress={() =>
                      archive.mutate({ id: c.id, archived: !c.isArchived })
                    }
                  />
                </View>
              ))}
            </View>
          </Card>
        ) : (
          <EmptyState icon="tags" title="nenhuma categoria aqui" />
        )}
      </View>
    </Screen>
  );
}
