// Shared building blocks for sale + purchase forms.
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
import { formatGHS } from "@/lib/format";
import { Trash2, Plus } from "lucide-react";
import type { ReactNode } from "react";

export interface LineDraft {
  itemId: string; // "" if free-form
  description: string;
  qty: string;
  unitPrice: string;
}

export const blankLine = (): LineDraft => ({
  itemId: "",
  description: "",
  qty: "1",
  unitPrice: "",
});

export function LineEditor({
  lines,
  setLines,
  items,
  unitLabel,
  defaultPriceField,
}: {
  lines: LineDraft[];
  setLines: (l: LineDraft[]) => void;
  items: { id: number; name: string; unit: string; cost_pesewas: number; price_pesewas: number }[];
  unitLabel: string;
  defaultPriceField: "cost_pesewas" | "price_pesewas";
}) {
  const update = (idx: number, patch: Partial<LineDraft>) => {
    const next = lines.slice();
    next[idx] = { ...next[idx], ...patch };
    setLines(next);
  };

  const setItem = (idx: number, itemId: string) => {
    const it = items.find((i) => String(i.id) === itemId);
    update(idx, {
      itemId,
      description: it?.name || "",
      unitPrice: it ? (it[defaultPriceField] / 100).toFixed(2) : lines[idx].unitPrice,
    });
  };

  const remove = (idx: number) => setLines(lines.filter((_, i) => i !== idx));
  const add = () => setLines([...lines, blankLine()]);

  const subtotal = lines.reduce((s, l) => {
    const q = parseFloat(l.qty) || 0;
    const p = Math.round((parseFloat(l.unitPrice) || 0) * 100);
    return s + Math.round(q * p);
  }, 0);

  return (
    <div className="space-y-3">
      <Label>Items</Label>
      {lines.map((l, idx) => (
        <div key={idx} className="rounded-lg border bg-muted/20 p-3">
          <div className="grid grid-cols-12 gap-2">
            <div className="col-span-12">
              <Select value={l.itemId || "_none"} onValueChange={(v) => setItem(idx, v === "_none" ? "" : v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Pick inventory item or type below" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_none">— Free-form (no inventory link) —</SelectItem>
                  {items.map((it) => (
                    <SelectItem key={it.id} value={String(it.id)}>
                      {it.name} ({it.unit})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {!l.itemId && (
              <div className="col-span-12">
                <Input
                  placeholder="Description"
                  value={l.description}
                  onChange={(e) => update(idx, { description: e.target.value })}
                />
              </div>
            )}
            <div className="col-span-4">
              <Input
                inputMode="decimal"
                placeholder="Qty"
                value={l.qty}
                onChange={(e) => update(idx, { qty: e.target.value })}
              />
            </div>
            <div className="col-span-6">
              <Input
                inputMode="decimal"
                placeholder={`${unitLabel} (GHS)`}
                value={l.unitPrice}
                onChange={(e) => update(idx, { unitPrice: e.target.value })}
              />
            </div>
            <div className="col-span-2 flex items-center justify-end">
              <Button
                type="button"
                size="icon"
                variant="ghost"
                onClick={() => remove(idx)}
                disabled={lines.length === 1}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      ))}
      <Button type="button" variant="outline" size="sm" onClick={add}>
        <Plus className="mr-1 h-4 w-4" /> Add another item
      </Button>
      <div className="flex items-center justify-between rounded-lg bg-muted/40 px-3 py-2 text-sm">
        <span>Subtotal</span>
        <span className="font-mono font-medium">{formatGHS(subtotal)}</span>
      </div>
    </div>
  );
}

export function FormShell({
  children,
  footer,
}: {
  children: ReactNode;
  footer: ReactNode;
}) {
  return (
    <div className="mx-auto max-w-2xl">
      <div className="rounded-xl border bg-card p-6 shadow-[var(--shadow-card)]">{children}</div>
      <div className="mt-4 flex items-center justify-end gap-2">{footer}</div>
    </div>
  );
}