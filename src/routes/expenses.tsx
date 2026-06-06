import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell, Loading } from "@/components/app-shell";
import { Card, EmptyState } from "@/components/page-section";
import { Button } from "@/components/ui/button";
import { all } from "@/lib/db";
import { formatDate, formatGHS } from "@/lib/format";
import { paymentLabel } from "./sales";
import { useDbReady } from "@/lib/use-db";
import { Plus } from "lucide-react";

export const Route = createFileRoute("/expenses")({
  head: () => ({ meta: [{ title: "Expenses — Ledger" }] }),
  component: ExpensesLayout,
});

function ExpensesLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  if (pathname !== "/expenses") return <Outlet />;
  return <ExpensesList />;
}

function ExpensesList() {
  const ready = useDbReady();
  const [rows, setRows] = useState<
    | {
        id: number;
        date: string;
        category_name: string;
        payment_method: string;
        amount_pesewas: number;
        memo: string | null;
      }[]
    | null
  >(null);
  useEffect(() => {
    if (!ready) return;
    all(
      `SELECT e.id, e.date, a.name AS category_name, e.payment_method, e.amount_pesewas, e.memo
       FROM expenses e JOIN accounts a ON a.code = e.category_code
       ORDER BY e.id DESC LIMIT 200`,
    ).then((r) => setRows(r as never));
  }, [ready]);

  return (
    <AppShell
      title="Expenses"
      action={
        <Button asChild size="sm">
          <Link to="/expenses/new">
            <Plus className="mr-1 h-4 w-4" /> New expense
          </Link>
        </Button>
      }
    >
      {!rows ? (
        <Loading />
      ) : rows.length === 0 ? (
        <EmptyState
          title="No expenses yet"
          description="Track rent, fuel, electricity and other costs."
          action={
            <Button asChild>
              <Link to="/expenses/new">Add expense</Link>
            </Button>
          }
        />
      ) : (
        <Card>
          <div className="-m-5 divide-y">
            {rows.map((r) => (
              <div key={r.id} className="flex items-center justify-between px-5 py-3">
                <div>
                  <p className="text-sm font-medium">{r.category_name}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(r.date)} · {paymentLabel(r.payment_method)}
                    {r.memo ? ` · ${r.memo}` : ""}
                  </p>
                </div>
                <span className="font-mono text-sm">{formatGHS(r.amount_pesewas)}</span>
              </div>
            ))}
          </div>
        </Card>
      )}
    </AppShell>
  );
}