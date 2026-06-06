import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell, Loading } from "@/components/app-shell";
import { Card, EmptyState } from "@/components/page-section";
import { Button } from "@/components/ui/button";
import { all } from "@/lib/db";
import { formatGHS } from "@/lib/format";
import { useDbReady } from "@/lib/use-db";
import { Plus, AlertCircle } from "lucide-react";

export const Route = createFileRoute("/inventory")({
  head: () => ({ meta: [{ title: "Inventory — Ledger" }] }),
  component: InvLayout,
});

function InvLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  if (pathname !== "/inventory") return <Outlet />;
  return <InvList />;
}

interface Item {
  id: number;
  name: string;
  unit: string;
  cost_pesewas: number;
  price_pesewas: number;
  qty: number;
  reorder_level: number;
}

function InvList() {
  const ready = useDbReady();
  const [items, setItems] = useState<Item[] | null>(null);
  useEffect(() => {
    if (!ready) return;
    all<Item>(
      "SELECT id,name,unit,cost_pesewas,price_pesewas,qty,reorder_level FROM inventory_items WHERE archived = 0 ORDER BY name",
    ).then(setItems);
  }, [ready]);

  return (
    <AppShell
      title="Inventory"
      action={
        <Button asChild size="sm">
          <Link to="/inventory/new">
            <Plus className="mr-1 h-4 w-4" /> New item
          </Link>
        </Button>
      }
    >
      {!items ? (
        <Loading />
      ) : items.length === 0 ? (
        <EmptyState
          title="No items yet"
          description="Add the products you buy and sell."
          action={
            <Button asChild>
              <Link to="/inventory/new">Add item</Link>
            </Button>
          }
        />
      ) : (
        <Card>
          <div className="-m-5 overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead className="border-b text-left text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-5 py-3">Item</th>
                  <th className="px-5 py-3">Qty</th>
                  <th className="px-5 py-3">Cost</th>
                  <th className="px-5 py-3">Price</th>
                  <th className="px-5 py-3">Stock value</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {items.map((it) => {
                  const low = it.reorder_level > 0 && it.qty <= it.reorder_level;
                  return (
                    <tr key={it.id}>
                      <td className="px-5 py-3 font-medium">
                        <div className="flex items-center gap-2">
                          {low && <AlertCircle className="h-4 w-4 text-warning" />}
                          {it.name}
                        </div>
                      </td>
                      <td className="px-5 py-3 font-mono text-muted-foreground">
                        {it.qty} {it.unit}
                      </td>
                      <td className="px-5 py-3 font-mono">{formatGHS(it.cost_pesewas)}</td>
                      <td className="px-5 py-3 font-mono">{formatGHS(it.price_pesewas)}</td>
                      <td className="px-5 py-3 font-mono">
                        {formatGHS(Math.round(it.qty * it.cost_pesewas))}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </AppShell>
  );
}