import { useState, useCallback } from "react";
import { View, Text } from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import { Plus } from "lucide-react-native";
import { Screen } from "../../src/components/Screen";
import { Card, EmptyState } from "../../src/components/ui/Card";
import { Button } from "../../src/components/ui/Button";
import { all } from "../../src/lib/db";
import { formatDate, formatGHS } from "../../src/lib/format";
import { paymentLabel } from "../(tabs)/sales";

export default function PurchasesList() {
  const router = useRouter();
  const [rows, setRows] = useState(null);
  useFocusEffect(
    useCallback(() => {
      setRows(all("SELECT id, date, supplier, payment_method, total_pesewas FROM purchases ORDER BY id DESC LIMIT 200"));
    }, []),
  );

  return (
    <Screen
      title="Purchases"
      action={
        <Button size="sm" onPress={() => router.push("/purchases/new")} leftIcon={<Plus size={14} color="#fff" />}>New</Button>
      }
    >
      {!rows ? null : rows.length === 0 ? (
        <EmptyState title="No purchases yet" description="Record stock you bought or expenses you paid." />
      ) : (
        <Card>
          {rows.map((r) => (
            <View key={r.id} className="flex-row items-center justify-between py-3 border-b border-border last:border-b-0">
              <View className="flex-1 pr-3">
                <Text className="text-sm font-medium text-foreground">{r.supplier || "Supplier"}</Text>
                <Text className="text-xs text-muted-foreground">{formatDate(r.date)} · {paymentLabel(r.payment_method)}</Text>
              </View>
              <Text className="text-sm font-bold text-foreground">{formatGHS(r.total_pesewas)}</Text>
            </View>
          ))}
        </Card>
      )}
    </Screen>
  );
}