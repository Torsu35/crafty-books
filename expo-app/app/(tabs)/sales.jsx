import { useState, useCallback } from "react";
import { View, Text, Pressable, FlatList } from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import { Plus } from "lucide-react-native";
import { Screen } from "../../src/components/Screen";
import { Card, EmptyState } from "../../src/components/ui/Card";
import { Button } from "../../src/components/ui/Button";
import { all } from "../../src/lib/db";
import { formatDate, formatGHS } from "../../src/lib/format";
import { useProfile } from "../../src/lib/use-db";

export function paymentLabel(m) {
  return m === "cash" ? "Cash" : m === "momo" ? "Mobile wallet" : "On credit";
}

export default function SalesList() {
  const router = useRouter();
  const { profile } = useProfile();
  const serviceOnly = profile?.business_type === "services";
  const [rows, setRows] = useState(null);

  useFocusEffect(
    useCallback(() => {
      setRows(
        all("SELECT id, date, customer, payment_method, total_pesewas FROM sales ORDER BY id DESC LIMIT 200"),
      );
    }, []),
  );

  return (
    <Screen
      title={serviceOnly ? "Services" : "Sales"}
      action={
        <Button size="sm" onPress={() => router.push("/sales/new")} leftIcon={<Plus size={14} color="#fff" />}>
          {serviceOnly ? "New" : "New sale"}
        </Button>
      }
    >
      {!rows ? null : rows.length === 0 ? (
        <EmptyState
          title={serviceOnly ? "No services recorded" : "No sales recorded"}
          description={serviceOnly ? "Tap New to log a service you provided." : "Tap New sale to log your first sale."}
        />
      ) : (
        <Card>
          {rows.map((r) => (
            <Pressable key={r.id} className="flex-row items-center justify-between py-3 border-b border-border last:border-b-0">
              <View className="flex-1 pr-3">
                <Text className="text-sm font-medium text-foreground">{r.customer || "Walk-in customer"}</Text>
                <Text className="text-xs text-muted-foreground">{formatDate(r.date)} · {paymentLabel(r.payment_method)}</Text>
              </View>
              <Text className="text-sm font-bold text-foreground">{formatGHS(r.total_pesewas)}</Text>
            </Pressable>
          ))}
        </Card>
      )}
    </Screen>
  );
}