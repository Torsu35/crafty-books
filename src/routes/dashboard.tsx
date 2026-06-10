import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell, Loading } from "@/components/app-shell";
import { Card, EmptyState, StatCard } from "@/components/page-section";
import { Button } from "@/components/ui/button";
import {
  accountBalance,
  incomeStatement,
  type IncomeStatement,
} from "@/lib/accounting";
import { all } from "@/lib/db";
import { formatGHS, periodRange } from "@/lib/format";
import { useDbReady, useProfile } from "@/lib/use-db";
import { ArrowUpRight, Plus, AlertCircle } from "lucide-react";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [{ title: "Dashboard — Ledger" }],
  }),
  component: Dashboard,
});

function Dashboard() {
  const navigate = useNavigate();
  const ready = useDbReady();
  const { profile, loading } = useProfile();
  const [stats, setStats] = useState<{
    cash: number;
    momo: number;
    receivables: number;
    payables: number;
    inventoryValue: number;
    is: IncomeStatement;
    lowStock: { id: number; name: string; qty: number; reorder_level: number; unit: string }[];
    recent: { date: string; memo: string; total: number }[];
  } | null>(null);

  useEffect(() => {
    if (!ready) return;
    if (!loading && !profile) {
      navigate({ to: "/setup", replace: true });
      return;
    }
    if (!profile) return;
    const { start, end } = periodRange(profile.period_pref);
    (async () => {
      const [cash, momo, receivables, payables, inv, is, lowStock, recent] = await Promise.all([
        accountBalance("1000"),
        accountBalance("1010"),
        accountBalance("1100"),
        accountBalance("2000"),
        accountBalance("1200"),
        incomeStatement(start, end),
        all<{ id: number; name: string; qty: number; reorder_level: number; unit: string }>(
          "SELECT id, name, qty, reorder_level, unit FROM inventory_items WHERE archived = 0 AND reorder_level > 0 AND qty <= reorder_level ORDER BY qty ASC LIMIT 5",
        ),
        all<{ date: string; memo: string; total: number }>(
          `SELECT je.date, je.memo,
              COALESCE((SELECT SUM(debit) FROM journal_lines WHERE entry_id = je.id), 0) AS total
           FROM journal_entries je
           ORDER BY je.id DESC LIMIT 6`,
        ),
      ]);
      setStats({
        cash,
        momo,
        receivables,
        payables,
        inventoryValue: inv,
        is,
        lowStock,
        recent,
      });
    })();
  }, [ready, profile, loading, navigate]);

  if (!ready || loading || !profile || !stats) {
    return (
      <AppShell title="Dashboard">
        <Loading />
      </AppShell>
    );
  }

  const { start, end, label } = periodRange(profile.period_pref);
  const serviceOnly = profile.business_type === "services";

  return (
    <AppShell
      title={`Hi, ${profile.owner_name.split(" ")[0]}`}
      action={
        <div className="hidden gap-2 sm:flex">
          <Button asChild size="sm" variant="outline">
            <Link to="/sales/new">
              <Plus className="mr-1 h-4 w-4" /> {serviceOnly ? "Service" : "Sale"}
            </Link>
          </Button>
          <Button asChild size="sm">
            <Link to="/expenses/new">
              <Plus className="mr-1 h-4 w-4" /> Expense
            </Link>
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        <div>
          <p className="text-xs uppercase tracking-wider text-muted-foreground">
            Performance — {label}
          </p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              label="Revenue"
              value={formatGHS(stats.is.totalRevenue)}
              tone="primary"
              hint={`${start} → ${end}`}
            />
            <StatCard
              label="Expenses"
              value={formatGHS(stats.is.totalExpenses)}
              hint="Includes cost of goods sold"
            />
            <StatCard
              label="Net profit"
              value={formatGHS(stats.is.netIncome)}
              hint={stats.is.netIncome >= 0 ? "Profit" : "Loss"}
              tone={stats.is.netIncome >= 0 ? "success" : "muted"}
            />
            <StatCard
              label="Stock value"
              value={formatGHS(stats.inventoryValue)}
              hint={`${stats.lowStock.length} item${stats.lowStock.length === 1 ? "" : "s"} low`}
            />
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <Card title="Money on hand">
            <div className="space-y-3">
              <Row label="Cash" value={formatGHS(stats.cash)} />
              <Row label="Mobile wallet" value={formatGHS(stats.momo)} />
              <Row label="Customers owe you" value={formatGHS(stats.receivables)} />
              <Row label="You owe suppliers" value={formatGHS(stats.payables)} muted />
            </div>
          </Card>

          <Card
            title="Quick actions"
          >
            <div className="grid grid-cols-2 gap-2">
              <QuickLink
                to="/sales/new"
                label={serviceOnly ? "Record service" : "Record sale"}
              />
              {!serviceOnly && <QuickLink to="/purchases/new" label="Record purchase" />}
              <QuickLink to="/expenses/new" label="Add expense" />
              {!serviceOnly && <QuickLink to="/inventory/new" label="Add inventory" />}
              <QuickLink to="/reports" label="View reports" />
              <QuickLink to="/backup" label="Backup data" />
            </div>
          </Card>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          {!serviceOnly && (
          <Card
            title="Low stock alerts"
            action={
              <Link to="/inventory" className="text-xs text-primary hover:underline">
                View all
              </Link>
            }
          >
            {stats.lowStock.length === 0 ? (
              <p className="text-sm text-muted-foreground">All items are well-stocked.</p>
            ) : (
              <ul className="space-y-2">
                {stats.lowStock.map((it) => (
                  <li
                    key={it.id}
                    className="flex items-center justify-between rounded-lg border bg-muted/30 px-3 py-2 text-sm"
                  >
                    <span className="flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-warning" />
                      {it.name}
                    </span>
                    <span className="text-muted-foreground">
                      {it.qty} {it.unit} left
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
          )}

          <Card title="Recent activity">
            {stats.recent.length === 0 ? (
              <EmptyState
                title="No activity yet"
                description="Record your first sale or expense to see it here."
              />
            ) : (
              <ul className="divide-y">
                {stats.recent.map((r, i) => (
                  <li key={i} className="flex items-center justify-between py-2.5 text-sm">
                    <div>
                      <p className="font-medium">{r.memo}</p>
                      <p className="text-xs text-muted-foreground">{r.date}</p>
                    </div>
                    <span className="font-mono text-sm">{formatGHS(r.total)}</span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>
    </AppShell>
  );
}

function Row({ label, value, muted }: { label: string; value: string; muted?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className={`font-mono text-sm ${muted ? "text-muted-foreground" : "font-medium"}`}>
        {value}
      </span>
    </div>
  );
}

function QuickLink({ to, label }: { to: string; label: string }) {
  return (
    <Link
      to={to}
      className="group flex items-center justify-between rounded-lg border bg-card px-3 py-3 text-sm font-medium transition-colors hover:border-primary hover:bg-primary/5"
    >
      {label}
      <ArrowUpRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
    </Link>
  );
}