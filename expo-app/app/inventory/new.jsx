import { useState } from "react";
import { View, Alert, Text } from "react-native";
import { useRouter } from "expo-router";
import { Screen } from "../../src/components/Screen";
import { Card } from "../../src/components/ui/Card";
import { Button } from "../../src/components/ui/Button";
import { Input, Field } from "../../src/components/ui/Input";
import { Select } from "../../src/components/ui/Select";
import { run } from "../../src/lib/db";
import { toPesewas } from "../../src/lib/format";

const UNITS = ["pcs", "bag", "carton", "sachet", "kg", "g", "L", "ml", "pack"];

export default function NewItem() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [unit, setUnit] = useState("pcs");
  const [cost, setCost] = useState("");
  const [price, setPrice] = useState("");
  const [qty, setQty] = useState("0");
  const [reorder, setReorder] = useState("0");
  const [busy, setBusy] = useState(false);

  const submit = () => {
    if (!name.trim()) return Alert.alert("Missing name", "Please enter an item name.");
    setBusy(true);
    try {
      run(
        "INSERT INTO inventory_items (name, unit, cost_pesewas, price_pesewas, qty, reorder_level) VALUES (?,?,?,?,?,?)",
        [name.trim(), unit, toPesewas(cost || "0"), toPesewas(price || "0"), parseFloat(qty) || 0, parseFloat(reorder) || 0],
      );
      router.back();
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen title="Add inventory item">
      <Card>
        <Field label="Item name">
          <Input value={name} onChangeText={setName} placeholder="e.g. Rice (5kg bag)" />
        </Field>
        <View className="flex-row gap-3">
          <View className="flex-1">
            <Field label="Unit">
              <Select value={unit} onChange={setUnit} options={UNITS.map((u) => ({ value: u, label: u }))} />
            </Field>
          </View>
          <View className="flex-1">
            <Field label="Opening qty"><Input keyboardType="decimal-pad" value={qty} onChangeText={setQty} /></Field>
          </View>
        </View>
        <View className="flex-row gap-3">
          <View className="flex-1">
            <Field label="Cost (GHS)"><Input keyboardType="decimal-pad" placeholder="0.00" value={cost} onChangeText={setCost} /></Field>
          </View>
          <View className="flex-1">
            <Field label="Selling price (GHS)"><Input keyboardType="decimal-pad" placeholder="0.00" value={price} onChangeText={setPrice} /></Field>
          </View>
        </View>
        <Field label="Reorder when stock drops to">
          <Input keyboardType="decimal-pad" value={reorder} onChangeText={setReorder} />
        </Field>
        <Text className="text-xs text-muted-foreground -mt-2 mb-2">You'll be alerted when stock falls to or below this level. Set 0 to disable.</Text>
        <View className="flex-row gap-2 mt-2">
          <View className="flex-1"><Button variant="ghost" onPress={() => router.back()}>Cancel</Button></View>
          <View className="flex-[1.4]"><Button onPress={submit} loading={busy}>Save item</Button></View>
        </View>
      </Card>
    </Screen>
  );
}