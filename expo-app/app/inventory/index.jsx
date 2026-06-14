import { useState, useCallback } from "react";
import { View, Text } from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import { Plus, AlertCircle } from "lucide-react-native";
import { Screen } from "../../src/components/Screen";
import { Card, EmptyState } from "../../src/components/ui/Card";
import { Button } from "../../src/components/ui/Button";
import { all } from "../../src/lib/db";
import { formatGHS } from "../../src/lib/format";

export default function InventoryList() {
  const router = useRouter();
  const [items, setItems] = useState(null);
  useFocusEffect(
    useCallback(() => {
      setItems(all("SELECT id,name,unit,cost_pesewas,price_pesewas,qty,reorder_level FROM inventory_items WHERE archived = 0 ORDER BY name"));
    }, []),
  );

  return (
    <Screen
      title="Inventory"
      action={<Button size="sm" onPress={() => router.push("/inventory/new")} leftIcon={<Plus size={14} color="#fff" />}>New</Button>}
    >
      {!items ? null : items.length === 0 ? (
        <EmptyState title="No items yet" description="Add the products you buy and sell." />
      ) : (
        <Card>
          {items.map((it) => {
            const low = it.reorder_level > 0 && it.qty <= it.reorder_level;
            return (
              <View key={it.id} className="py-3 border-b border-border last:border-b-0">
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center gap-2 flex-1 pr-2">
                    {low && <AlertCircle size={16} color="#E2A03F" />}
                    <Text className="text-sm font-semibold text-foreground" numberOfLines={1}>{it.name}</Text>
                  </View>
                  <Text className="text-sm font-bold text-foreground">{formatGHS(Math.round(it.qty * it.cost_pesewas))}</Text>
                </View>
                <View className="flex-row justify-between mt-1">
                  <Text className="text-xs text-muted-foreground">{it.qty} {it.unit} · Cost {formatGHS(it.cost_pesewas)}</Text>
                  <Text className="text-xs text-muted-foreground">Price {formatGHS(it.price_pesewas)}</Text>
                </View>
              </View>
            );
          })}
        </Card>
      )}
    </Screen>
  );
}