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

export const Route = createFileRoute("/purchases")({
  head: () => ({ meta: [{ title: "Purchases — Ledger" }] }),
  component: PurchasesLayout,
});

function PurchasesLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  if (pathname !== "/purchases") return <Outlet />;
  return <PurchasesList />;
}

function PurchasesList() {
  const ready = useDbReady();
  const [rows, setRows] = useState<
    { id: number; date: string; supplier: string | null; payment_method: string; total_pesewas: number }[] | null
  >(null);
  useEffect(() => {
    if (!ready) return;
    all<{ id: number; date: string; supplier: string | null; payment_method: string; total_pesewas: number }>(
      "SELECT id, date, supplier, payment_method, total_pesewas FROM purchases ORDER BY id DESC LIMIT 200",
    ).then(setRows);
  }, [ready]);

  return (
    <AppShell
      title="Purchases"
      action={
        <Button asChild size="sm">
          <Link to="/purchases/new">
            <Plus className="mr-1 h-4 w-4" /> New purchase
          </Link>
        </Button>
      }
    >
      {!rows ? (
        <Loading />
      ) : rows.length === 0 ? (
        <EmptyState
          title="No purchases yet"
          description="Record stock you bought or expenses you paid for."
          action={
            <Button asChild>
              <Link to="/purchases/new">Record purchase</Link>
            </Button>
          }
        />
      ) : (
        <Card>
          <div className="-m-5 divide-y">
            {rows.map((r) => (
              <div key={r.id} className="flex items-center justify-between px-5 py-3">
                <div>
                  <p className="text-sm font-medium">{r.supplier || "Supplier"}</p>
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