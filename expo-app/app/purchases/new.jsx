import { useEffect, useState } from "react";
import { View, Alert } from "react-native";
import { useRouter } from "expo-router";
import { Screen } from "../../src/components/Screen";
import { Card } from "../../src/components/ui/Card";
import { Button } from "../../src/components/ui/Button";
import { Input, Field } from "../../src/components/ui/Input";
import { RadioGroup } from "../../src/components/ui/RadioGroup";
import { LineEditor, blankLine } from "../../src/components/LineEditor";
import { recordPurchase } from "../../src/lib/accounting";
import { all } from "../../src/lib/db";
import { todayISO, toPesewas } from "../../src/lib/format";

export default function NewPurchase() {
  const router = useRouter();
  const [items, setItems] = useState([]);
  const [date, setDate] = useState(todayISO());
  const [supplier, setSupplier] = useState("");
  const [payment, setPayment] = useState("cash");
  const [lines, setLines] = useState([blankLine()]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setItems(all("SELECT id, name, unit, cost_pesewas, price_pesewas FROM inventory_items WHERE archived = 0 ORDER BY name"));
  }, []);

  const submit = () => {
    const validLines = lines
      .filter((l) => (parseFloat(l.qty) || 0) > 0 && (parseFloat(l.unitPrice) || 0) > 0)
      .map((l) => ({
        itemId: l.itemId ? Number(l.itemId) : null,
        description: l.description,
        qty: parseFloat(l.qty),
        unitCostPesewas: toPesewas(l.unitPrice),
      }));
    if (validLines.length === 0) return Alert.alert("Missing items", "Add at least one item with cost and quantity.");
    setBusy(true);
    try {
      recordPurchase({ date, supplier: supplier.trim() || undefined, paymentMethod: payment, lines: validLines });
      router.back();
    } catch (e) {
      Alert.alert("Could not save", e.message || String(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen title="Record a purchase">
      <Card>
        <View className="flex-row gap-3">
          <View className="flex-1"><Field label="Date (YYYY-MM-DD)"><Input value={date} onChangeText={setDate} /></Field></View>
          <View className="flex-1"><Field label="Supplier"><Input value={supplier} onChangeText={setSupplier} placeholder="Optional" /></Field></View>
        </View>
        <LineEditor lines={lines} setLines={setLines} items={items} unitLabel="Cost" defaultPriceField="cost_pesewas" />
        <View className="mt-3">
          <Field label="How did you pay?">
            <RadioGroup
              value={payment}
              onChange={setPayment}
              options={[
                { value: "cash", label: "Cash" },
                { value: "momo", label: "Mobile" },
                { value: "credit", label: "Credit" },
              ]}
            />
          </Field>
        </View>
        <View className="flex-row gap-2 mt-2">
          <View className="flex-1"><Button variant="ghost" onPress={() => router.back()}>Cancel</Button></View>
          <View className="flex-[1.4]"><Button onPress={submit} loading={busy}>Save purchase</Button></View>
        </View>
      </Card>
    </Screen>
  );
}