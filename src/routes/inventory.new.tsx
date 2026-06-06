import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FormShell } from "@/components/transaction-form";
import { run } from "@/lib/db";
import { toPesewas } from "@/lib/format";

const UNITS = ["pcs", "bag", "carton", "sachet", "kg", "g", "L", "ml", "pack"];

export const Route = createFileRoute("/inventory/new")({
  head: () => ({ meta: [{ title: "Add item — Ledger" }] }),
  component: NewItem,
});

function NewItem() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [unit, setUnit] = useState("pcs");
  const [cost, setCost] = useState("");
  const [price, setPrice] = useState("");
  const [qty, setQty] = useState("0");
  const [reorder, setReorder] = useState("0");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!name.trim()) {
      toast.error("Please enter an item name.");
      return;
    }
    setBusy(true);
    try {
      await run(
        "INSERT INTO inventory_items (name, unit, cost_pesewas, price_pesewas, qty, reorder_level) VALUES (?,?,?,?,?,?)",
        [
          name.trim(),
          unit,
          toPesewas(cost || "0"),
          toPesewas(price || "0"),
          parseFloat(qty) || 0,
          parseFloat(reorder) || 0,
        ],
      );
      toast.success("Item added");
      navigate({ to: "/inventory" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <AppShell title="Add inventory item">
      <FormShell
        footer={
          <>
            <Button variant="ghost" onClick={() => navigate({ to: "/inventory" })}>
              Cancel
            </Button>
            <Button onClick={submit} disabled={busy}>
              {busy ? "Saving…" : "Save item"}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <Label htmlFor="n">Item name</Label>
            <Input id="n" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Rice (5kg bag)" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Unit</Label>
              <Select value={unit} onValueChange={setUnit}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {UNITS.map((u) => (
                    <SelectItem key={u} value={u}>
                      {u}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="q">Opening quantity</Label>
              <Input id="q" inputMode="decimal" value={qty} onChange={(e) => setQty(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="c">Cost price (GHS)</Label>
              <Input id="c" inputMode="decimal" value={cost} onChange={(e) => setCost(e.target.value)} placeholder="0.00" />
            </div>
            <div>
              <Label htmlFor="p">Selling price (GHS)</Label>
              <Input id="p" inputMode="decimal" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="0.00" />
            </div>
            <div className="col-span-2">
              <Label htmlFor="r">Reorder when stock drops to</Label>
              <Input id="r" inputMode="decimal" value={reorder} onChange={(e) => setReorder(e.target.value)} />
              <p className="mt-1 text-xs text-muted-foreground">
                You'll be alerted when stock falls to or below this level. Set 0 to disable.
              </p>
            </div>
          </div>
        </div>
      </FormShell>
    </AppShell>
  );
}