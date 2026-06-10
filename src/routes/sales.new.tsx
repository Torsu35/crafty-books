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
import { useDbReady, useProfile } from "@/lib/use-db";

export const Route = createFileRoute("/sales/new")({
  head: () => ({ meta: [{ title: "New sale — Ledger" }] }),
  component: NewSale,
});

function NewSale() {
  const ready = useDbReady();
  const navigate = useNavigate();
  const { profile } = useProfile();
  const [items, setItems] = useState<
    { id: number; name: string; unit: string; cost_pesewas: number; price_pesewas: number }[]
  >([]);
  const [date, setDate] = useState(todayISO());
  const [customer, setCustomer] = useState("");
  const [payment, setPayment] = useState<PaymentMethod>("cash");
  const [vat, setVat] = useState("");
  const [lines, setLines] = useState<LineDraft[]>([blankLine()]);
  const [busy, setBusy] = useState(false);
  const [kind, setKind] = useState<"goods" | "service">("goods");
  const [serviceDesc, setServiceDesc] = useState("");
  const [serviceAmount, setServiceAmount] = useState("");

  // Default kind based on business profile
  useEffect(() => {
    if (profile?.business_type === "services") setKind("service");
    else if (profile?.business_type === "goods") setKind("goods");
  }, [profile?.business_type]);

  const offersGoods = profile?.business_type !== "services";
  const offersServices =
    profile?.business_type === "services" || profile?.business_type === "both";

  useEffect(() => {
    if (!ready) return;
    all<{ id: number; name: string; unit: string; cost_pesewas: number; price_pesewas: number }>(
      "SELECT id, name, unit, cost_pesewas, price_pesewas FROM inventory_items WHERE archived = 0 ORDER BY name",
    ).then(setItems);
  }, [ready]);

  const submit = async () => {
    if (kind === "service") {
      const amt = toPesewas(serviceAmount || "0");
      if (!serviceDesc.trim()) {
        toast.error("Describe the service rendered.");
        return;
      }
      if (amt <= 0) {
        toast.error("Enter the service amount.");
        return;
      }
      setBusy(true);
      try {
        await recordSale({
          date,
          customer: customer.trim() || undefined,
          paymentMethod: payment,
          vatPesewas: 0,
          revenueAccount: "4100",
          lines: [
            {
              itemId: null,
              description: serviceDesc.trim(),
              qty: 1,
              unitPricePesewas: amt,
            },
          ],
        });
        toast.success("Service recorded");
        navigate({ to: "/sales" });
      } catch (e) {
        toast.error((e as Error).message || "Could not save service");
      } finally {
        setBusy(false);
      }
      return;
    }
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
    <AppShell title={kind === "service" ? "Record a service" : "Record a sale"}>
      <FormShell
        footer={
          <>
            <Button variant="ghost" onClick={() => navigate({ to: "/sales" })}>
              Cancel
            </Button>
            <Button onClick={submit} disabled={busy}>
              {busy ? "Saving…" : kind === "service" ? "Save service" : "Save sale"}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          {offersGoods && offersServices && (
            <div>
              <Label className="mb-2 block">What are you recording?</Label>
              <RadioGroup
                value={kind}
                onValueChange={(v) => setKind(v as "goods" | "service")}
                className="grid grid-cols-2 gap-2"
              >
                {[
                  { v: "goods", l: "Goods sold" },
                  { v: "service", l: "Service rendered" },
                ].map((o) => (
                  <label
                    key={o.v}
                    htmlFor={`k-${o.v}`}
                    className="flex cursor-pointer items-center justify-center rounded-lg border bg-card px-3 py-3 text-sm hover:border-ring has-[input:checked]:border-primary has-[input:checked]:bg-primary has-[input:checked]:text-primary-foreground"
                  >
                    <RadioGroupItem id={`k-${o.v}`} value={o.v} className="sr-only" />
                    {o.l}
                  </label>
                ))}
              </RadioGroup>
            </div>
          )}

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

          {kind === "goods" ? (
            <>
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
            </>
          ) : (
            <>
              <div>
                <Label htmlFor="sd">Service description</Label>
                <Input
                  id="sd"
                  value={serviceDesc}
                  onChange={(e) => setServiceDesc(e.target.value)}
                  placeholder="e.g. Haircut, Phone repair, Consulting"
                />
              </div>
              <div>
                <Label htmlFor="sa">Amount (GHS)</Label>
                <Input
                  id="sa"
                  inputMode="decimal"
                  placeholder="0.00"
                  value={serviceAmount}
                  onChange={(e) => setServiceAmount(e.target.value)}
                />
              </div>
            </>
          )}

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