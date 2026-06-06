import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  blankLine,
  FormShell,
  LineEditor,
  type LineDraft,
} from "@/components/transaction-form";
import { recordPurchase, type PaymentMethod } from "@/lib/accounting";
import { all } from "@/lib/db";
import { todayISO, toPesewas } from "@/lib/format";
import { useDbReady } from "@/lib/use-db";

export const Route = createFileRoute("/purchases/new")({
  head: () => ({ meta: [{ title: "New purchase — Ledger" }] }),
  component: NewPurchase,
});

function NewPurchase() {
  const ready = useDbReady();
  const navigate = useNavigate();
  const [items, setItems] = useState<
    { id: number; name: string; unit: string; cost_pesewas: number; price_pesewas: number }[]
  >([]);
  const [date, setDate] = useState(todayISO());
  const [supplier, setSupplier] = useState("");
  const [payment, setPayment] = useState<PaymentMethod>("cash");
  const [lines, setLines] = useState<LineDraft[]>([blankLine()]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!ready) return;
    all<{ id: number; name: string; unit: string; cost_pesewas: number; price_pesewas: number }>(
      "SELECT id, name, unit, cost_pesewas, price_pesewas FROM inventory_items WHERE archived = 0 ORDER BY name",
    ).then(setItems);
  }, [ready]);

  const submit = async () => {
    const validLines = lines
      .filter((l) => (parseFloat(l.qty) || 0) > 0 && (parseFloat(l.unitPrice) || 0) > 0)
      .map((l) => ({
        itemId: l.itemId ? Number(l.itemId) : null,
        description: l.description,
        qty: parseFloat(l.qty),
        unitCostPesewas: toPesewas(l.unitPrice),
      }));
    if (validLines.length === 0) {
      toast.error("Add at least one item with a cost and quantity.");
      return;
    }
    setBusy(true);
    try {
      await recordPurchase({
        date,
        supplier: supplier.trim() || undefined,
        paymentMethod: payment,
        lines: validLines,
      });
      toast.success("Purchase recorded");
      navigate({ to: "/purchases" });
    } catch (e) {
      toast.error((e as Error).message || "Could not save purchase");
    } finally {
      setBusy(false);
    }
  };

  return (
    <AppShell title="Record a purchase">
      <FormShell
        footer={
          <>
            <Button variant="ghost" onClick={() => navigate({ to: "/purchases" })}>
              Cancel
            </Button>
            <Button onClick={submit} disabled={busy}>
              {busy ? "Saving…" : "Save purchase"}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="d">Date</Label>
              <Input id="d" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="s">Supplier (optional)</Label>
              <Input id="s" value={supplier} onChange={(e) => setSupplier(e.target.value)} />
            </div>
          </div>

          <LineEditor
            lines={lines}
            setLines={setLines}
            items={items}
            unitLabel="Cost"
            defaultPriceField="cost_pesewas"
          />

          <div>
            <Label className="mb-2 block">How did you pay?</Label>
            <RadioGroup
              value={payment}
              onValueChange={(v) => setPayment(v as PaymentMethod)}
              className="grid grid-cols-3 gap-2"
            >
              {[
                { v: "cash", l: "Cash" },
                { v: "momo", l: "Mobile wallet" },
                { v: "credit", l: "On credit" },
              ].map((o) => (
                <label
                  key={o.v}
                  htmlFor={`pp-${o.v}`}
                  className="flex cursor-pointer items-center justify-center rounded-lg border bg-card px-3 py-3 text-sm hover:border-ring has-[input:checked]:border-primary has-[input:checked]:bg-primary has-[input:checked]:text-primary-foreground"
                >
                  <RadioGroupItem id={`pp-${o.v}`} value={o.v} className="sr-only" />
                  {o.l}
                </label>
              ))}
            </RadioGroup>
          </div>
        </div>
      </FormShell>
    </AppShell>
  );
}