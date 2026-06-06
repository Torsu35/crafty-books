import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell, Loading } from "@/components/app-shell";
import { Card, EmptyState } from "@/components/page-section";
import { Button } from "@/components/ui/button";
import { all } from "@/lib/db";
import { formatDate, formatGHS } from "@/lib/format";
import { useDbReady } from "@/lib/use-db";
import { Plus } from "lucide-react";

export const Route = createFileRoute("/sales")({
  head: () => ({ meta: [{ title: "Sales — Ledger" }] }),
  component: SalesLayout,
});

function SalesLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  if (pathname !== "/sales") return <Outlet />;
  return <SalesList />;
}

interface SaleRow {
  id: number;
  date: string;
  customer: string | null;
  payment_method: string;
  total_pesewas: number;
}

function SalesList() {
  const ready = useDbReady();
  const [rows, setRows] = useState<SaleRow[] | null>(null);
  useEffect(() => {
    if (!ready) return;
    all<SaleRow>(
      "SELECT id, date, customer, payment_method, total_pesewas FROM sales ORDER BY id DESC LIMIT 200",
    ).then(setRows);
  }, [ready]);

  return (
    <AppShell
      title="Sales"
      action={
        <Button asChild size="sm">
          <Link to="/sales/new">
            <Plus className="mr-1 h-4 w-4" /> New sale
          </Link>
        </Button>
      }
    >
      {!rows ? (
        <Loading />
      ) : rows.length === 0 ? (
        <EmptyState
          title="No sales recorded"
          description="Start by recording your first sale."
          action={
            <Button asChild>
              <Link to="/sales/new">Record sale</Link>
            </Button>
          }
        />
      ) : (
        <Card>
          <div className="-m-5 divide-y">
            {rows.map((r) => (
              <div key={r.id} className="flex items-center justify-between px-5 py-3">
                <div>
                  <p className="text-sm font-medium">{r.customer || "Walk-in customer"}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(r.date)} · {paymentLabel(r.payment_method)}
                  </p>
                </div>
                <span className="font-mono text-sm">{formatGHS(r.total_pesewas)}</span>
              </div>
            ))}
          </div>
        </Card>
      )}
    </AppShell>
  );
}

export function paymentLabel(m: string): string {
  return m === "cash" ? "Cash" : m === "momo" ? "Mobile wallet" : "On credit";
}