import { useEffect, useState } from "react";
import { View, Text, Alert } from "react-native";
import { useRouter } from "expo-router";
import { Screen } from "../src/components/Screen";
import { Card } from "../src/components/ui/Card";
import { Button } from "../src/components/ui/Button";
import { Input, Field } from "../src/components/ui/Input";
import { Select } from "../src/components/ui/Select";
import { run } from "../src/lib/db";
import { useProfile } from "../src/lib/use-db";

export default function Settings() {
  const router = useRouter();
  const { profile, loading, refetch } = useProfile();
  const [name, setName] = useState("");
  const [owner, setOwner] = useState("");
  const [period, setPeriod] = useState("month");
  const [vat, setVat] = useState(0);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!profile) return;
    setName(profile.business_name);
    setOwner(profile.owner_name);
    setPeriod(profile.period_pref);
    setVat(profile.vat_registered);
  }, [profile]);

  const save = () => {
    setBusy(true);
    try {
      run(
        "UPDATE business_profile SET business_name=?, owner_name=?, period_pref=?, vat_registered=? WHERE id=1",
        [name.trim(), owner.trim(), period, vat],
      );
      refetch();
      Alert.alert("Saved", "Settings updated.");
    } finally {
      setBusy(false);
    }
  };

  if (loading || !profile) return <Screen title="Settings"><Text className="text-sm text-muted-foreground">Loading…</Text></Screen>;

  return (
    <Screen title="Settings">
      <Card title="Business profile" className="mb-4">
        <Field label="Business name"><Input value={name} onChangeText={setName} /></Field>
        <Field label="Owner name"><Input value={owner} onChangeText={setOwner} /></Field>
        <View className="flex-row gap-3">
          <View className="flex-1">
            <Field label="Reporting period">
              <Select value={period} onChange={setPeriod} options={[
                { value: "month", label: "Monthly" },
                { value: "quarter", label: "Quarterly" },
                { value: "year", label: "Yearly" },
              ]} />
            </Field>
          </View>
          <View className="flex-1">
            <Field label="VAT-registered">
              <Select value={String(vat)} onChange={(v) => setVat(Number(v))} options={[
                { value: "0", label: "No" },
                { value: "1", label: "Yes" },
              ]} />
            </Field>
          </View>
        </View>
        <Button onPress={save} loading={busy}>Save changes</Button>
      </Card>

      <Card title="More" className="mb-4">
        <Button variant="outline" onPress={() => router.push("/accounts")} className="mb-2">Money & accounts</Button>
        <Button variant="outline" onPress={() => router.push("/inventory")} className="mb-2">Inventory</Button>
        <Button variant="outline" onPress={() => router.push("/purchases")} className="mb-2">Purchases</Button>
        <Button variant="outline" onPress={() => router.push("/backup")}>Backup & restore</Button>
      </Card>

      <Card title="About">
        <Text className="text-sm text-muted-foreground">
          Ledger is an offline bookkeeping app. All data is stored on this device. Download a backup from the Backup screen to keep a safe copy.
        </Text>
      </Card>
    </Screen>
  );
}