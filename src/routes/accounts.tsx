import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell, Loading } from "@/components/app-shell";
import { Card, StatCard } from "@/components/page-section";
import { accountBalance } from "@/lib/accounting";
import { all } from "@/lib/db";
import { formatDate, formatGHS } from "@/lib/format";
import { useDbReady } from "@/lib/use-db";
import { Banknote, Smartphone } from "lucide-react";

export const Route = createFileRoute("/accounts")({
  head: () => ({ meta: [{ title: "Money — Ledger" }] }),
  component: Accounts,
});

function Accounts() {
  const ready = useDbReady();
  const [data, setData] = useState<{
    cash: number;
    momo: number;
    receivables: number;
    payables: number;
    cashTx: { date: string; memo: string; debit: number; credit: number }[];
    momoTx: { date: string; memo: string; debit: number; credit: number }[];
  } | null>(null);

  useEffect(() => {
    if (!ready) return;
    (async () => {
      const [cash, momo, receivables, payables, cashTx, momoTx] = await Promise.all([
        accountBalance("1000"),
        accountBalance("1010"),
        accountBalance("1100"),
        accountBalance("2000"),
        all<{ date: string; memo: string; debit: number; credit: number }>(
          `SELECT je.date, je.memo, jl.debit, jl.credit
             FROM journal_lines jl JOIN journal_entries je ON je.id = jl.entry_id
             WHERE jl.account_code = '1000' ORDER BY je.id DESC LIMIT 25`,
        ),
        all<{ date: string; memo: string; debit: number; credit: number }>(
          `SELECT je.date, je.memo, jl.debit, jl.credit
             FROM journal_lines jl JOIN journal_entries je ON je.id = jl.entry_id
             WHERE jl.account_code = '1010' ORDER BY je.id DESC LIMIT 25`,
        ),
      ]);
      setData({ cash, momo, receivables, payables, cashTx, momoTx });
    })();
  }, [ready]);

  if (!data)
    return (
      <AppShell title="Money">
        <Loading />
      </AppShell>
    );

  return (
    <AppShell title="Money">
      <div className="space-y-6">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Cash on hand" value={formatGHS(data.cash)} tone="primary" />
          <StatCard label="Mobile wallet" value={formatGHS(data.momo)} />
          <StatCard label="Customers owe you" value={formatGHS(data.receivables)} />
          <StatCard label="You owe suppliers" value={formatGHS(data.payables)} />
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <Card
            title={
              <span className="flex items-center gap-2">
                <Banknote className="h-4 w-4" /> Cash transactions
              </span>
            }
          >
            <TxList rows={data.cashTx} />
          </Card>
          <Card
            title={
              <span className="flex items-center gap-2">
                <Smartphone className="h-4 w-4" /> Mobile wallet transactions
              </span>
            }
          >
            <TxList rows={data.momoTx} />
          </Card>
        </div>
      </div>
    </AppShell>
  );
}

function TxList({
  rows,
}: {
  rows: { date: string; memo: string; debit: number; credit: number }[];
}) {
  if (rows.length === 0)
    return <p className="text-sm text-muted-foreground">No transactions yet.</p>;
  return (
    <ul className="divide-y">
      {rows.map((r, i) => {
        const amount = r.debit - r.credit;
        return (
          <li key={i} className="flex items-center justify-between py-2.5 text-sm">
            <div>
              <p className="font-medium">{r.memo}</p>
              <p className="text-xs text-muted-foreground">{formatDate(r.date)}</p>
            </div>
            <span
              className={`font-mono text-sm ${amount >= 0 ? "text-[color:var(--success)]" : "text-[color:var(--destructive)]"}`}
            >
              {amount >= 0 ? "+" : "−"}
              {formatGHS(Math.abs(amount))}
            </span>
          </li>
        );
      })}
    </ul>
  );
}