import { useState, useCallback } from "react";
import { View, Text, Pressable } from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import { Plus } from "lucide-react-native";
import { Screen } from "../../src/components/Screen";
import { Card, EmptyState } from "../../src/components/ui/Card";
import { Button } from "../../src/components/ui/Button";
import { all } from "../../src/lib/db";
import { formatDate, formatGHS } from "../../src/lib/format";
import { paymentLabel } from "./sales";

export default function ExpensesList() {
  const router = useRouter();
  const [rows, setRows] = useState(null);

  useFocusEffect(
    useCallback(() => {
      setRows(
        all(
          `SELECT e.id, e.date, a.name AS category_name, e.payment_method, e.amount_pesewas, e.memo
           FROM expenses e JOIN accounts a ON a.code = e.category_code
           ORDER BY e.id DESC LIMIT 200`,
        ),
      );
    }, []),
  );

  return (
    <Screen
      title="Expenses"
      action={
        <Button size="sm" onPress={() => router.push("/expenses/new")} leftIcon={<Plus size={14} color="#fff" />}>
          New
        </Button>
      }
    >
      {!rows ? null : rows.length === 0 ? (
        <EmptyState title="No expenses yet" description="Track rent, fuel, electricity and other costs." />
      ) : (
        <Card>
          {rows.map((r) => (
            <View key={r.id} className="flex-row items-center justify-between py-3 border-b border-border last:border-b-0">
              <View className="flex-1 pr-3">
                <Text className="text-sm font-medium text-foreground">{r.category_name}</Text>
                <Text className="text-xs text-muted-foreground">
                  {formatDate(r.date)} · {paymentLabel(r.payment_method)}{r.memo ? ` · ${r.memo}` : ""}
                </Text>
              </View>
              <Text className="text-sm font-bold text-foreground">{formatGHS(r.amount_pesewas)}</Text>
            </View>
          ))}
        </Card>
      )}
    </Screen>
  );
}