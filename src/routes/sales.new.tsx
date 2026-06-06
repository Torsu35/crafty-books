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
import { recordSale, type PaymentMethod } from "@/lib/accounting";
import { all } from "@/lib/db";
import { todayISO, toPesewas } from "@/lib/format";
import { useDbReady } from "@/lib/use-db";

export const Route = createFileRoute("/sales/new")({
  head: () => ({ meta: [{ title: "New sale — Ledger" }] }),
  component: NewSale,
});

function NewSale() {
  const ready = useDbReady();
  const navigate = useNavigate();
  const [items, setItems] = useState<
    { id: number; name: string; unit: string; cost_pesewas: number; price_pesewas: number }[]
  >([]);
  const [date, setDate] = useState(todayISO());
  const [customer, setCustomer] = useState("");
  const [payment, setPayment] = useState<PaymentMethod>("cash");
  const [vat, setVat] = useState("");
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
        unitPricePesewas: toPesewas(l.unitPrice),
      }));
    if (validLines.length === 0) {
      toast.error("Add at least one item with a price and quantity.");
      return;
    }
    setBusy(true);
    try {
      await recordSale({
        date,
        customer: customer.trim() || undefined,
        paymentMethod: payment,
        vatPesewas: toPesewas(vat || "0"),
        lines: validLines,
      });
      toast.success("Sale recorded");
      navigate({ to: "/sales" });
    } catch (e) {
      toast.error((e as Error).message || "Could not save sale");
    } finally {
      setBusy(false);
    }
  };

  return (
    <AppShell title="Record a sale">
      <FormShell
        footer={
          <>
            <Button variant="ghost" onClick={() => navigate({ to: "/sales" })}>
              Cancel
            </Button>
            <Button onClick={submit} disabled={busy}>
              {busy ? "Saving…" : "Save sale"}
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
              <Label htmlFor="c">Customer (optional)</Label>
              <Input id="c" value={customer} onChange={(e) => setCustomer(e.target.value)} />
            </div>
          </div>

          <LineEditor
            lines={lines}
            setLines={setLines}
            items={items}
            unitLabel="Price"
            defaultPriceField="price_pesewas"
          />

          <div>
            <Label htmlFor="vat">VAT amount (optional, GHS)</Label>
            <Input id="vat" inputMode="decimal" value={vat} onChange={(e) => setVat(e.target.value)} placeholder="0.00" />
          </div>

          <div>
            <Label className="mb-2 block">How did the customer pay?</Label>
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
                  htmlFor={`pm-${o.v}`}
                  className="flex cursor-pointer items-center justify-center rounded-lg border bg-card px-3 py-3 text-sm hover:border-ring has-[input:checked]:border-primary has-[input:checked]:bg-primary has-[input:checked]:text-primary-foreground"
                >
                  <RadioGroupItem id={`pm-${o.v}`} value={o.v} className="sr-only" />
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