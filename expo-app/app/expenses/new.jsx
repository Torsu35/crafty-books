import { useState } from "react";
import { View, Alert } from "react-native";
import { useRouter } from "expo-router";
import { Screen } from "../../src/components/Screen";
import { Card } from "../../src/components/ui/Card";
import { Button } from "../../src/components/ui/Button";
import { Input, Field } from "../../src/components/ui/Input";
import { Select } from "../../src/components/ui/Select";
import { RadioGroup } from "../../src/components/ui/RadioGroup";
import { recordExpense } from "../../src/lib/accounting";
import { todayISO, toPesewas } from "../../src/lib/format";
import { EXPENSE_CATEGORIES } from "../../src/lib/schema";

export default function NewExpense() {
  const router = useRouter();
  const [date, setDate] = useState(todayISO());
  const [category, setCategory] = useState(EXPENSE_CATEGORIES[0].code);
  const [amount, setAmount] = useState("");
  const [memo, setMemo] = useState("");
  const [payment, setPayment] = useState("cash");
  const [busy, setBusy] = useState(false);

  const submit = () => {
    const pes = toPesewas(amount);
    if (pes <= 0) return Alert.alert("Invalid amount", "Please enter a valid amount.");
    setBusy(true);
    try {
      recordExpense({
        date,
        categoryCode: category,
        paymentMethod: payment,
        amountPesewas: pes,
        memo: memo.trim() || undefined,
      });
      router.back();
    } catch (e) {
      Alert.alert("Could not save", e.message || String(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen title="Add an expense">
      <Card>
        <View className="flex-row gap-3">
          <View className="flex-1">
            <Field label="Date (YYYY-MM-DD)"><Input value={date} onChangeText={setDate} /></Field>
          </View>
          <View className="flex-1">
            <Field label="Amount (GHS)"><Input keyboardType="decimal-pad" placeholder="0.00" value={amount} onChangeText={setAmount} /></Field>
          </View>
        </View>
        <Field label="Category">
          <Select
            value={category}
            onChange={setCategory}
            options={EXPENSE_CATEGORIES.map((c) => ({ value: c.code, label: c.label }))}
          />
        </Field>
        <Field label="Note (optional)">
          <Input value={memo} onChangeText={setMemo} placeholder="What was this for?" />
        </Field>
        <Field label="Paid from">
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
        <View className="flex-row gap-2 mt-2">
          <View className="flex-1"><Button variant="ghost" onPress={() => router.back()}>Cancel</Button></View>
          <View className="flex-[1.4]"><Button onPress={submit} loading={busy}>Save expense</Button></View>
        </View>
      </Card>
    </Screen>
  );
}