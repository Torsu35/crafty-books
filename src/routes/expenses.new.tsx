import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FormShell } from "@/components/transaction-form";
import { recordExpense, type PaymentMethod } from "@/lib/accounting";
import { todayISO, toPesewas } from "@/lib/format";
import { EXPENSE_CATEGORIES } from "@/lib/schema";

export const Route = createFileRoute("/expenses/new")({
  head: () => ({ meta: [{ title: "Add expense — Ledger" }] }),
  component: NewExpense,
});

function NewExpense() {
  const navigate = useNavigate();
  const [date, setDate] = useState(todayISO());
  const [category, setCategory] = useState(EXPENSE_CATEGORIES[0].code);
  const [amount, setAmount] = useState("");
  const [memo, setMemo] = useState("");
  const [payment, setPayment] = useState<PaymentMethod>("cash");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    const pes = toPesewas(amount);
    if (pes <= 0) {
      toast.error("Please enter a valid amount.");
      return;
    }
    setBusy(true);
    try {
      await recordExpense({
        date,
        categoryCode: category,
        paymentMethod: payment,
        amountPesewas: pes,
        memo: memo.trim() || undefined,
      });
      toast.success("Expense recorded");
      navigate({ to: "/expenses" });
    } catch (e) {
      toast.error((e as Error).message || "Could not save expense");
    } finally {
      setBusy(false);
    }
  };

  return (
    <AppShell title="Add an expense">
      <FormShell
        footer={
          <>
            <Button variant="ghost" onClick={() => navigate({ to: "/expenses" })}>
              Cancel
            </Button>
            <Button onClick={submit} disabled={busy}>
              {busy ? "Saving…" : "Save expense"}
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
              <Label htmlFor="a">Amount (GHS)</Label>
              <Input
                id="a"
                inputMode="decimal"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>
          </div>
          <div>
            <Label>Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {EXPENSE_CATEGORIES.map((c) => (
                  <SelectItem key={c.code} value={c.code}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="m">Note (optional)</Label>
            <Input id="m" value={memo} onChange={(e) => setMemo(e.target.value)} placeholder="What was this for?" />
          </div>
          <div>
            <Label className="mb-2 block">Paid from</Label>
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
                  htmlFor={`px-${o.v}`}
                  className="flex cursor-pointer items-center justify-center rounded-lg border bg-card px-3 py-3 text-sm hover:border-ring has-[input:checked]:border-primary has-[input:checked]:bg-primary has-[input:checked]:text-primary-foreground"
                >
                  <RadioGroupItem id={`px-${o.v}`} value={o.v} className="sr-only" />
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