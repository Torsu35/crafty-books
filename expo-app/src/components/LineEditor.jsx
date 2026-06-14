import { View, Text, Pressable } from "react-native";
import { Trash2, Plus } from "lucide-react-native";
import { Input, Label } from "./ui/Input";
import { Select } from "./ui/Select";
import { Button } from "./ui/Button";
import { formatGHS } from "../lib/format";

export const blankLine = () => ({ itemId: "", description: "", qty: "1", unitPrice: "" });

export function LineEditor({ lines, setLines, items, unitLabel, defaultPriceField }) {
  const update = (idx, patch) => {
    const next = lines.slice();
    next[idx] = { ...next[idx], ...patch };
    setLines(next);
  };
  const setItem = (idx, itemId) => {
    const it = items.find((i) => String(i.id) === itemId);
    update(idx, {
      itemId,
      description: it?.name || "",
      unitPrice: it ? (it[defaultPriceField] / 100).toFixed(2) : lines[idx].unitPrice,
    });
  };
  const remove = (idx) => setLines(lines.filter((_, i) => i !== idx));
  const add = () => setLines([...lines, blankLine()]);

  const subtotal = lines.reduce((s, l) => {
    const q = parseFloat(l.qty) || 0;
    const p = Math.round((parseFloat(l.unitPrice) || 0) * 100);
    return s + Math.round(q * p);
  }, 0);

  const itemOptions = [
    { value: "", label: "— Free-form (no inventory link) —" },
    ...items.map((it) => ({ value: String(it.id), label: `${it.name} (${it.unit})` })),
  ];

  return (
    <View>
      <Label>Items</Label>
      {lines.map((l, idx) => (
        <View key={idx} className="bg-muted/50 rounded-xl p-3 mb-2">
          <View className="mb-2">
            <Select
              value={l.itemId}
              onChange={(v) => setItem(idx, v)}
              options={itemOptions}
              placeholder="Pick inventory item or leave free-form"
            />
          </View>
          {!l.itemId && (
            <View className="mb-2">
              <Input
                placeholder="Description"
                value={l.description}
                onChangeText={(v) => update(idx, { description: v })}
              />
            </View>
          )}
          <View className="flex-row gap-2">
            <View className="flex-1">
              <Input
                placeholder="Qty"
                keyboardType="decimal-pad"
                value={l.qty}
                onChangeText={(v) => update(idx, { qty: v })}
              />
            </View>
            <View className="flex-[1.4]">
              <Input
                placeholder={`${unitLabel} (GHS)`}
                keyboardType="decimal-pad"
                value={l.unitPrice}
                onChangeText={(v) => update(idx, { unitPrice: v })}
              />
            </View>
            <Pressable
              onPress={() => remove(idx)}
              disabled={lines.length === 1}
              className="w-11 items-center justify-center rounded-xl border border-border bg-card"
            >
              <Trash2 size={18} color={lines.length === 1 ? "#9AA5BC" : "#D43A3A"} />
            </Pressable>
          </View>
        </View>
      ))}
      <Button variant="outline" size="sm" onPress={add} leftIcon={<Plus size={14} color="#0F1F3D" />}>
        Add another item
      </Button>
      <View className="mt-3 flex-row items-center justify-between rounded-xl bg-secondary px-3.5 py-3">
        <Text className="text-sm text-foreground">Subtotal</Text>
        <Text className="text-sm font-bold text-foreground">{formatGHS(subtotal)}</Text>
      </View>
    </View>
  );
}