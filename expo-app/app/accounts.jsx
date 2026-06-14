import { useState, useCallback } from "react";
import { View, Text } from "react-native";
import { useFocusEffect } from "expo-router";
import { Banknote, Smartphone } from "lucide-react-native";
import { Screen } from "../src/components/Screen";
import { Card, StatCard } from "../src/components/ui/Card";
import { accountBalance } from "../src/lib/accounting";
import { all } from "../src/lib/db";
import { formatDate, formatGHS } from "../src/lib/format";

export default function Accounts() {
  const [data, setData] = useState(null);
  useFocusEffect(
    useCallback(() => {
      setData({
        cash: accountBalance("1000"),
        momo: accountBalance("1010"),
        receivables: accountBalance("1100"),
        payables: accountBalance("2000"),
        cashTx: all(`SELECT je.date, je.memo, jl.debit, jl.credit FROM journal_lines jl JOIN journal_entries je ON je.id = jl.entry_id WHERE jl.account_code = '1000' ORDER BY je.id DESC LIMIT 25`),
        momoTx: all(`SELECT je.date, je.memo, jl.debit, jl.credit FROM journal_lines jl JOIN journal_entries je ON je.id = jl.entry_id WHERE jl.account_code = '1010' ORDER BY je.id DESC LIMIT 25`),
      });
    }, []),
  );
  if (!data) return <Screen title="Money"><Text className="text-sm text-muted-foreground">Loading…</Text></Screen>;

  return (
    <Screen title="Money">
      <View className="flex-row gap-2 mb-2">
        <StatCard label="Cash on hand" tone="primary" value={formatGHS(data.cash)} />
        <StatCard label="Mobile wallet" value={formatGHS(data.momo)} />
      </View>
      <View className="flex-row gap-2 mb-4">
        <StatCard label="Customers owe you" value={formatGHS(data.receivables)} />
        <StatCard label="You owe suppliers" value={formatGHS(data.payables)} />
      </View>

      <Card title={<View className="flex-row items-center gap-2"><Banknote size={16} color="#0F1F3D" /><Text className="text-sm font-semibold text-foreground">Cash transactions</Text></View>} className="mb-4">
        <TxList rows={data.cashTx} />
      </Card>
      <Card title={<View className="flex-row items-center gap-2"><Smartphone size={16} color="#0F1F3D" /><Text className="text-sm font-semibold text-foreground">Mobile wallet transactions</Text></View>}>
        <TxList rows={data.momoTx} />
      </Card>
    </Screen>
  );
}

function TxList({ rows }) {
  if (rows.length === 0) return <Text className="text-sm text-muted-foreground">No transactions yet.</Text>;
  return rows.map((r, i) => {
    const amount = r.debit - r.credit;
    const positive = amount >= 0;
    return (
      <View key={i} className="flex-row items-center justify-between py-2.5 border-b border-border last:border-b-0">
        <View className="flex-1 pr-3">
          <Text className="text-sm font-medium text-foreground" numberOfLines={1}>{r.memo}</Text>
          <Text className="text-xs text-muted-foreground">{formatDate(r.date)}</Text>
        </View>
        <Text className={`text-sm font-bold ${positive ? "text-success" : "text-destructive"}`}>
          {positive ? "+" : "−"}{formatGHS(Math.abs(amount))}
        </Text>
      </View>
    );
  });
}