import { useState, useCallback } from "react";
import { View, Text, Pressable } from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import { ArrowUpRight, AlertCircle, Settings as SettingsIcon } from "lucide-react-native";
import { Screen } from "../../src/components/Screen";
import { Card, StatCard, EmptyState } from "../../src/components/ui/Card";
import { accountBalance, incomeStatement } from "../../src/lib/accounting";
import { all } from "../../src/lib/db";
import { formatGHS, periodRange } from "../../src/lib/format";
import { useProfile } from "../../src/lib/use-db";

export default function Dashboard() {
  const router = useRouter();
  const { profile, loading } = useProfile();
  const [stats, setStats] = useState(null);

  useFocusEffect(
    useCallback(() => {
      if (loading) return;
      if (!profile) {
        router.replace("/setup");
        return;
      }
      const { start, end } = periodRange(profile.period_pref);
      setStats({
        cash: accountBalance("1000"),
        momo: accountBalance("1010"),
        receivables: accountBalance("1100"),
        payables: accountBalance("2000"),
        inventoryValue: accountBalance("1200"),
        is: incomeStatement(start, end),
        lowStock: all(
          "SELECT id, name, qty, reorder_level, unit FROM inventory_items WHERE archived = 0 AND reorder_level > 0 AND qty <= reorder_level ORDER BY qty ASC LIMIT 5",
        ),
        recent: all(
          `SELECT je.date, je.memo,
              COALESCE((SELECT SUM(debit) FROM journal_lines WHERE entry_id = je.id), 0) AS total
           FROM journal_entries je
           ORDER BY je.id DESC LIMIT 6`,
        ),
        range: periodRange(profile.period_pref),
      });
    }, [profile, loading, router]),
  );

  if (!profile || !stats) {
    return (
      <Screen title="Dashboard">
        <Text className="text-sm text-muted-foreground">Loading…</Text>
      </Screen>
    );
  }

  const serviceOnly = profile.business_type === "services";
  const firstName = (profile.owner_name || "").split(" ")[0];

  return (
    <Screen
      title={`Hi, ${firstName}`}
      action={
        <Pressable onPress={() => router.push("/settings")} className="p-2">
          <SettingsIcon size={20} color="#0F1F3D" />
        </Pressable>
      }
    >
      <Text className="text-[11px] uppercase tracking-wider text-muted-foreground mb-2">
        Performance — {stats.range.label}
      </Text>
      <View className="flex-row gap-2 mb-2">
        <StatCard label="Revenue" tone="primary" value={formatGHS(stats.is.totalRevenue)} hint={`${stats.range.start} → ${stats.range.end}`} />
        <StatCard label="Expenses" value={formatGHS(stats.is.totalExpenses)} hint="Inc. cost of goods sold" />
      </View>
      <View className="flex-row gap-2 mb-4">
        <StatCard
          label="Net profit"
          tone={stats.is.netIncome >= 0 ? "success" : "default"}
          value={formatGHS(stats.is.netIncome)}
          hint={stats.is.netIncome >= 0 ? "Profit" : "Loss"}
        />
        <StatCard label="Stock value" value={formatGHS(stats.inventoryValue)} hint={`${stats.lowStock.length} item${stats.lowStock.length === 1 ? "" : "s"} low`} />
      </View>

      <Card title="Money on hand" className="mb-4">
        <Row label="Cash" value={formatGHS(stats.cash)} />
        <Row label="Mobile wallet" value={formatGHS(stats.momo)} />
        <Row label="Customers owe you" value={formatGHS(stats.receivables)} />
        <Row label="You owe suppliers" value={formatGHS(stats.payables)} muted />
      </Card>

      <Card title="Quick actions" className="mb-4">
        <View className="flex-row flex-wrap -mx-1">
          <QuickLink onPress={() => router.push("/sales/new")} label={serviceOnly ? "Record service" : "Record sale"} />
          {!serviceOnly && <QuickLink onPress={() => router.push("/purchases/new")} label="Record purchase" />}
          <QuickLink onPress={() => router.push("/expenses/new")} label="Add expense" />
          {!serviceOnly && <QuickLink onPress={() => router.push("/inventory/new")} label="Add inventory" />}
          <QuickLink onPress={() => router.push("/(tabs)/reports")} label="View reports" />
          <QuickLink onPress={() => router.push("/backup")} label="Backup data" />
        </View>
      </Card>

      {!serviceOnly && (
        <Card
          title="Low stock alerts"
          action={
            <Pressable onPress={() => router.push("/inventory")}>
              <Text className="text-xs font-semibold text-accent">View all</Text>
            </Pressable>
          }
          className="mb-4"
        >
          {stats.lowStock.length === 0 ? (
            <Text className="text-sm text-muted-foreground">All items are well-stocked.</Text>
          ) : (
            stats.lowStock.map((it) => (
              <View key={it.id} className="flex-row items-center justify-between bg-muted rounded-lg px-3 py-2.5 mb-1.5">
                <View className="flex-row items-center gap-2">
                  <AlertCircle size={16} color="#E2A03F" />
                  <Text className="text-sm text-foreground">{it.name}</Text>
                </View>
                <Text className="text-xs text-muted-foreground">{it.qty} {it.unit} left</Text>
              </View>
            ))
          )}
        </Card>
      )}

      <Card title="Recent activity">
        {stats.recent.length === 0 ? (
          <EmptyState title="No activity yet" description="Record your first sale or expense to see it here." />
        ) : (
          stats.recent.map((r, i) => (
            <View key={i} className="flex-row items-center justify-between py-2.5 border-b border-border last:border-b-0">
              <View className="flex-1 pr-3">
                <Text className="text-sm font-medium text-foreground" numberOfLines={1}>{r.memo}</Text>
                <Text className="text-xs text-muted-foreground">{r.date}</Text>
              </View>
              <Text className="text-sm font-bold text-foreground">{formatGHS(r.total)}</Text>
            </View>
          ))
        )}
      </Card>
    </Screen>
  );
}

function Row({ label, value, muted }) {
  return (
    <View className="flex-row items-center justify-between py-1.5">
      <Text className="text-sm text-muted-foreground">{label}</Text>
      <Text className={`text-sm ${muted ? "text-muted-foreground" : "font-bold text-foreground"}`}>{value}</Text>
    </View>
  );
}

function QuickLink({ onPress, label }) {
  return (
    <View className="w-1/2 px-1 mb-2">
      <Pressable onPress={onPress} className="flex-row items-center justify-between bg-card border border-border rounded-xl px-3 py-3">
        <Text className="text-sm font-semibold text-foreground" numberOfLines={1}>{label}</Text>
        <ArrowUpRight size={16} color="#5B6A86" />
      </Pressable>
    </View>
  );
}