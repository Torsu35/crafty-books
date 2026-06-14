import { useEffect, useState } from "react";
import { View, Text, Alert } from "react-native";
import { useRouter } from "expo-router";
import { Screen } from "../../src/components/Screen";
import { Card } from "../../src/components/ui/Card";
import { Button } from "../../src/components/ui/Button";
import { Input, Field } from "../../src/components/ui/Input";
import { RadioGroup } from "../../src/components/ui/RadioGroup";
import { LineEditor, blankLine } from "../../src/components/LineEditor";
import { recordSale } from "../../src/lib/accounting";
import { all } from "../../src/lib/db";
import { todayISO, toPesewas } from "../../src/lib/format";
import { useProfile } from "../../src/lib/use-db";

export default function NewSale() {
  const router = useRouter();
  const { profile } = useProfile();
  const [items, setItems] = useState([]);
  const [date, setDate] = useState(todayISO());
  const [customer, setCustomer] = useState("");
  const [payment, setPayment] = useState("cash");
  const [vat, setVat] = useState("");
  const [lines, setLines] = useState([blankLine()]);
  const [busy, setBusy] = useState(false);
  const [kind, setKind] = useState("goods");
  const [serviceDesc, setServiceDesc] = useState("");
  const [serviceAmount, setServiceAmount] = useState("");

  useEffect(() => {
    if (profile?.business_type === "services") setKind("service");
    else if (profile?.business_type === "goods") setKind("goods");
  }, [profile?.business_type]);

  useEffect(() => {
    setItems(
      all("SELECT id, name, unit, cost_pesewas, price_pesewas FROM inventory_items WHERE archived = 0 ORDER BY name"),
    );
  }, []);

  const offersGoods = profile?.business_type !== "services";
  const offersServices = profile?.business_type === "services" || profile?.business_type === "both";

  const submit = () => {
    setBusy(true);
    try {
      if (kind === "service") {
        const amt = toPesewas(serviceAmount || "0");
        if (!serviceDesc.trim()) return Alert.alert("Missing info", "Describe the service rendered.");
        if (amt <= 0) return Alert.alert("Missing info", "Enter the service amount.");
        recordSale({
          date,
          customer: customer.trim() || undefined,
          paymentMethod: payment,
          vatPesewas: 0,
          revenueAccount: "4100",
          lines: [{ itemId: null, description: serviceDesc.trim(), qty: 1, unitPricePesewas: amt }],
        });
        router.back();
        return;
      }
      const validLines = lines
        .filter((l) => (parseFloat(l.qty) || 0) > 0 && (parseFloat(l.unitPrice) || 0) > 0)
        .map((l) => ({
          itemId: l.itemId ? Number(l.itemId) : null,
          description: l.description,
          qty: parseFloat(l.qty),
          unitPricePesewas: toPesewas(l.unitPrice),
        }));
      if (validLines.length === 0) return Alert.alert("Missing items", "Add at least one item with price and quantity.");
      recordSale({
        date,
        customer: customer.trim() || undefined,
        paymentMethod: payment,
        vatPesewas: toPesewas(vat || "0"),
        lines: validLines,
      });
      router.back();
    } catch (e) {
      Alert.alert("Could not save", e.message || String(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen title={kind === "service" ? "Record a service" : "Record a sale"}>
      <Card>
        {offersGoods && offersServices && (
          <Field label="What are you recording?">
            <RadioGroup
              columns={2}
              value={kind}
              onChange={setKind}
              options={[{ value: "goods", label: "Goods sold" }, { value: "service", label: "Service rendered" }]}
            />
          </Field>
        )}
        <View className="flex-row gap-3">
          <View className="flex-1">
            <Field label="Date (YYYY-MM-DD)"><Input value={date} onChangeText={setDate} /></Field>
          </View>
          <View className="flex-1">
            <Field label="Customer"><Input value={customer} onChangeText={setCustomer} placeholder="Optional" /></Field>
          </View>
        </View>

        {kind === "goods" ? (
          <>
            <LineEditor lines={lines} setLines={setLines} items={items} unitLabel="Price" defaultPriceField="price_pesewas" />
            <View className="mt-3">
              <Field label="VAT amount (GHS, optional)">
                <Input keyboardType="decimal-pad" value={vat} onChangeText={setVat} placeholder="0.00" />
              </Field>
            </View>
          </>
        ) : (
          <>
            <Field label="Service description">
              <Input value={serviceDesc} onChangeText={setServiceDesc} placeholder="e.g. Haircut, phone repair, consulting" />
            </Field>
            <Field label="Amount (GHS)">
              <Input keyboardType="decimal-pad" value={serviceAmount} onChangeText={setServiceAmount} placeholder="0.00" />
            </Field>
          </>
        )}

        <Field label="How did the customer pay?">
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
          <View className="flex-[1.4]"><Button onPress={submit} loading={busy}>{kind === "service" ? "Save service" : "Save sale"}</Button></View>
        </View>
      </Card>
    </Screen>
  );
}