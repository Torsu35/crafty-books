import { useState, useCallback, useEffect } from "react";
import { View, Text, Alert } from "react-native";
import { useFocusEffect } from "expo-router";
import { FileText } from "lucide-react-native";
import { Screen } from "../../src/components/Screen";
import { Card } from "../../src/components/ui/Card";
import { Button } from "../../src/components/ui/Button";
import { RadioGroup } from "../../src/components/ui/RadioGroup";
import { balanceSheet, incomeStatement } from "../../src/lib/accounting";
import { formatGHS, periodRange } from "../../src/lib/format";
import { useProfile } from "../../src/lib/use-db";
import { shareFinancialReport } from "../../src/lib/reports";

export default function Reports() {
  const { profile } = useProfile();
  const [kind, setKind] = useState("month");
  const [is, setIs] = useState(null);
  const [bs, setBs] = useState(null);
  const [sharing, setSharing] = useState(false);

  useEffect(() => { if (profile) setKind(profile.period_pref); }, [profile]);

  const range = periodRange(kind);
  useFocusEffect(
    useCallback(() => {
      setIs(incomeStatement(range.start, range.end));
      setBs(balanceSheet(range.end));
    }, [range.start, range.end]),
  );

  const handleShare = async () => {
    if (!is || !bs) return;
    setSharing(true);
    try {
      await shareFinancialReport(range, profile);
    } catch (e) {
      Alert.alert("Share failed", e.message);
    } finally {
      setSharing(false);
    }
  };

  return (
    <Screen title="Reports">
      <View className="mb-4">
        <RadioGroup
          value={kind}
          onChange={setKind}
          options={[
            { value: "month", label: "Month" },
            { value: "quarter", label: "Quarter" },
            { value: "year", label: "Year" },
          ]}
        />
      </View>

      <View className="mb-4">
        <Button
          onPress={handleShare}
          loading={sharing}
          leftIcon={<FileText size={16} color="#fff" />}
        >
          Share PDF report
        </Button>
      </View>

      {is && (
        <Card title={`Income Statement — ${range.label}`} className="mb-4">
          <Section title="Revenue" rows={is.revenueLines.map((r) => ({ label: r.name, value: r.amount }))} total={{ label: "Total revenue", value: is.totalRevenue }} />
          <Section title="Expenses" rows={is.expenseLines.map((r) => ({ label: r.name, value: r.amount }))} total={{ label: "Total expenses", value: is.totalExpenses }} />
          <Grand
            label={is.netIncome >= 0 ? "Net profit" : "Net loss"}
            value={Math.abs(is.netIncome)}
            tone={is.netIncome >= 0 ? "success" : "destructive"}
          />
        </Card>
      )}

      {bs && (
        <Card title={`Statement of Financial Position — ${range.end}`}>
          <Section title="Assets" rows={bs.assets.map((a) => ({ label: a.name, value: a.balance }))} total={{ label: "Total assets", value: bs.totalAssets }} />
          <Section title="Liabilities" rows={bs.liabilities.map((a) => ({ label: a.name, value: a.balance }))} total={{ label: "Total liabilities", value: bs.totalLiabilities }} />
          <Section
            title="Equity"
            rows={[
              ...bs.equity.map((a) => ({ label: a.name, value: a.balance })),
              { label: "Retained earnings", value: bs.retainedEarnings },
            ]}
            total={{ label: "Total equity", value: bs.totalEquity }}
          />
          <Grand label="Liabilities + Equity" value={bs.totalLiabilities + bs.totalEquity} />
        </Card>
      )}
    </Screen>
  );
}

function Section({ title, rows, total }) {
  return (
    <View className="mb-4">
      <Text className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-2">{title}</Text>
      {rows.length === 0 ? (
        <Text className="text-sm text-muted-foreground py-2">No activity.</Text>
      ) : (
        rows.map((r, i) => (
          <View key={i} className="flex-row items-center justify-between py-2 border-b border-border">
            <Text className="text-sm text-foreground">{r.label}</Text>
            <Text className="text-sm text-foreground">{formatGHS(r.value)}</Text>
          </View>
        ))
      )}
      <View className="flex-row items-center justify-between pt-2.5">
        <Text className="text-sm font-bold text-foreground">{total.label}</Text>
        <Text className="text-sm font-bold text-foreground">{formatGHS(total.value)}</Text>
      </View>
    </View>
  );
}

function Grand({ label, value, tone }) {
  const bg = tone === "success" ? "bg-success" : tone === "destructive" ? "bg-destructive" : "bg-primary";
  return (
    <View className={`${bg} rounded-xl px-4 py-3 flex-row items-center justify-between mt-2`}>
      <Text className="text-base font-bold text-primary-foreground">{label}</Text>
      <Text className="text-base font-bold text-primary-foreground">{formatGHS(value)}</Text>
    </View>
  );
}