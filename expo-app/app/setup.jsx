import { useState } from "react";
import { View, Text, Alert } from "react-native";
import { useRouter } from "expo-router";
import { Screen } from "../src/components/Screen";
import { Button } from "../src/components/ui/Button";
import { Input, Label, Field } from "../src/components/ui/Input";
import { RadioGroup } from "../src/components/ui/RadioGroup";
import { Card } from "../src/components/ui/Card";
import { run } from "../src/lib/db";
import { recordOpeningBalances } from "../src/lib/accounting";
import { todayISO, toPesewas } from "../src/lib/format";

export default function Setup() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);
  const [biz, setBiz] = useState({
    business_name: "",
    owner_name: "",
    business_type: "goods",
    vat_registered: 0,
    tax_id: "",
    period_pref: "month",
  });
  const [opening, setOpening] = useState({
    cash: "", momo: "", inventory: "", receivables: "", payables: "", loan: "",
  });

  const canNext0 = biz.business_name.trim() && biz.owner_name.trim();

  const finish = async () => {
    setBusy(true);
    try {
      run(
        `INSERT INTO business_profile (id, business_name, owner_name, business_type, vat_registered, tax_id, currency, period_pref)
         VALUES (1,?,?,?,?,?,?,?)`,
        [
          biz.business_name.trim(), biz.owner_name.trim(), biz.business_type,
          biz.vat_registered, biz.tax_id || null, "GHS", biz.period_pref,
        ],
      );
      recordOpeningBalances({
        date: todayISO(),
        cash: toPesewas(opening.cash || "0"),
        momo: toPesewas(opening.momo || "0"),
        inventoryValue: toPesewas(opening.inventory || "0"),
        receivables: toPesewas(opening.receivables || "0"),
        payables: toPesewas(opening.payables || "0"),
        loan: toPesewas(opening.loan || "0"),
      });
      router.replace("/(tabs)/dashboard");
    } catch (e) {
      Alert.alert("Setup failed", e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen title={`Set up — Step ${step + 1} of 3`}>
      <Card>
        {step === 0 && (
          <View>
            <Text className="text-lg font-bold text-foreground mb-1">Tell us about your business</Text>
            <Text className="text-sm text-muted-foreground mb-4">Shown on your reports. You can change it later.</Text>
            <Field label="Business name">
              <Input value={biz.business_name} onChangeText={(v) => setBiz({ ...biz, business_name: v })} placeholder="e.g. Ama's Provisions" />
            </Field>
            <Field label="Owner name">
              <Input value={biz.owner_name} onChangeText={(v) => setBiz({ ...biz, owner_name: v })} placeholder="e.g. Ama Mensah" />
            </Field>
            <Field label="What does your business do?">
              <RadioGroup
                value={biz.business_type}
                onChange={(v) => setBiz({ ...biz, business_type: v })}
                options={[
                  { value: "goods", label: "Sells goods" },
                  { value: "services", label: "Renders services" },
                  { value: "both", label: "Both" },
                ]}
              />
            </Field>
            <Field label="Tax ID (optional)">
              <Input value={biz.tax_id} onChangeText={(v) => setBiz({ ...biz, tax_id: v })} placeholder="TIN" />
            </Field>
          </View>
        )}

        {step === 1 && (
          <View>
            <Text className="text-lg font-bold text-foreground mb-4">Reporting & tax</Text>
            <Field label="How often do you want reports?">
              <RadioGroup
                value={biz.period_pref}
                onChange={(v) => setBiz({ ...biz, period_pref: v })}
                options={[
                  { value: "month", label: "Monthly" },
                  { value: "quarter", label: "Quarterly" },
                  { value: "year", label: "Yearly" },
                ]}
              />
            </Field>
            <Field label="Are you VAT-registered?">
              <RadioGroup
                columns={2}
                value={String(biz.vat_registered)}
                onChange={(v) => setBiz({ ...biz, vat_registered: Number(v) })}
                options={[{ value: "0", label: "No" }, { value: "1", label: "Yes" }]}
              />
            </Field>
          </View>
        )}

        {step === 2 && (
          <View>
            <Text className="text-lg font-bold text-foreground mb-1">Opening balances</Text>
            <Text className="text-sm text-muted-foreground mb-4">Enter what you currently have. Leave blank if zero.</Text>
            {[
              { k: "cash", l: "Cash on hand (GHS)" },
              { k: "momo", l: "Mobile wallet (GHS)" },
              { k: "inventory", l: "Stock value (GHS)" },
              { k: "receivables", l: "Money owed to you (GHS)" },
              { k: "payables", l: "Money you owe (GHS)" },
              { k: "loan", l: "Outstanding loans (GHS)" },
            ].map((f) => (
              <Field key={f.k} label={f.l}>
                <Input
                  keyboardType="decimal-pad"
                  placeholder="0.00"
                  value={opening[f.k]}
                  onChangeText={(v) => setOpening({ ...opening, [f.k]: v })}
                />
              </Field>
            ))}
          </View>
        )}

        <View className="flex-row justify-between gap-2 mt-4">
          <View className="flex-1">
            <Button variant="ghost" onPress={() => setStep(Math.max(0, step - 1))} disabled={step === 0 || busy}>
              Back
            </Button>
          </View>
          <View className="flex-[1.4]">
            {step < 2 ? (
              <Button onPress={() => setStep(step + 1)} disabled={step === 0 && !canNext0}>
                Continue
              </Button>
            ) : (
              <Button onPress={finish} loading={busy}>
                {busy ? "Setting up…" : "Finish setup"}
              </Button>
            )}
          </View>
        </View>
      </Card>
    </Screen>
  );
}