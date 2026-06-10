import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { recordOpeningBalances } from "@/lib/accounting";
import { run } from "@/lib/db";
import { todayISO, toPesewas } from "@/lib/format";
import { useDbReady, useProfile } from "@/lib/use-db";

export const Route = createFileRoute("/setup")({
  head: () => ({
    meta: [
      { title: "Set up your business — Ledger" },
      { name: "description", content: "One-time setup to start tracking your business." },
    ],
  }),
  component: Setup,
});

function Setup() {
  const navigate = useNavigate();
  const dbReady = useDbReady();
  const { profile, loading } = useProfile();
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);

  const [biz, setBiz] = useState({
    business_name: "",
    owner_name: "",
    business_type: "goods" as "goods" | "services" | "both",
    vat_registered: 0,
    tax_id: "",
    period_pref: "month" as "month" | "quarter" | "year",
  });
  const [opening, setOpening] = useState({
    cash: "",
    momo: "",
    inventory: "",
    receivables: "",
    payables: "",
    loan: "",
  });

  if (!dbReady || loading) {
    return <div className="grid min-h-screen place-items-center text-sm text-muted-foreground">Preparing your books…</div>;
  }
  if (profile) {
    navigate({ to: "/dashboard", replace: true });
    return null;
  }

  const next = () => setStep((s) => s + 1);
  const back = () => setStep((s) => Math.max(0, s - 1));

  const finish = async () => {
    setBusy(true);
    try {
      await run(
        `INSERT INTO business_profile
          (id, business_name, owner_name, business_type, vat_registered, tax_id, currency, period_pref)
          VALUES (1,?,?,?,?,?,?,?)`,
        [
          biz.business_name.trim(),
          biz.owner_name.trim(),
          biz.business_type,
          biz.vat_registered,
          biz.tax_id || null,
          "GHS",
          biz.period_pref,
        ],
      );
      await recordOpeningBalances({
        date: todayISO(),
        cash: toPesewas(opening.cash || "0"),
        momo: toPesewas(opening.momo || "0"),
        inventoryValue: toPesewas(opening.inventory || "0"),
        receivables: toPesewas(opening.receivables || "0"),
        payables: toPesewas(opening.payables || "0"),
        loan: toPesewas(opening.loan || "0"),
      });
      navigate({ to: "/dashboard", replace: true });
    } finally {
      setBusy(false);
    }
  };

  const canNext0 = biz.business_name.trim() && biz.owner_name.trim();

  return (
    <div className="min-h-screen" style={{ backgroundImage: "var(--gradient-subtle)" }}>
      <div className="mx-auto flex min-h-screen max-w-xl flex-col px-4 py-10">
        <div className="mb-6 flex items-center gap-3">
          <div
            className="flex h-10 w-10 items-center justify-center rounded-xl font-bold text-primary-foreground"
            style={{ backgroundImage: "var(--gradient-primary)" }}
          >
            L
          </div>
          <div>
            <h1 className="text-lg font-semibold tracking-tight">Set up your business</h1>
            <p className="text-xs text-muted-foreground">Step {step + 1} of 3</p>
          </div>
        </div>

        <div className="flex-1 rounded-2xl border bg-card p-6 shadow-[var(--shadow-card)]">
          {step === 0 && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Tell us about your business</h2>
              <p className="text-sm text-muted-foreground">
                This information appears on your reports. You can change it later.
              </p>
              <div>
                <Label htmlFor="bn">Business name</Label>
                <Input
                  id="bn"
                  value={biz.business_name}
                  onChange={(e) => setBiz({ ...biz, business_name: e.target.value })}
                  placeholder="e.g. Ama's Provisions"
                />
              </div>
              <div>
                <Label htmlFor="on">Owner name</Label>
                <Input
                  id="on"
                  value={biz.owner_name}
                  onChange={(e) => setBiz({ ...biz, owner_name: e.target.value })}
                  placeholder="e.g. Ama Mensah"
                />
              </div>
              <div>
                <Label className="mb-2 block">What does your business do?</Label>
                <RadioGroup
                  value={biz.business_type}
                  onValueChange={(v) =>
                    setBiz({ ...biz, business_type: v as "goods" | "services" | "both" })
                  }
                  className="grid grid-cols-3 gap-2"
                >
                  {[
                    { v: "goods", l: "Sells goods" },
                    { v: "services", l: "Renders services" },
                    { v: "both", l: "Both" },
                  ].map((o) => (
                    <label
                      key={o.v}
                      htmlFor={`bt-${o.v}`}
                      className="flex cursor-pointer items-center justify-center rounded-lg border bg-card px-3 py-3 text-center text-sm hover:border-ring has-[input:checked]:border-primary has-[input:checked]:bg-primary has-[input:checked]:text-primary-foreground"
                    >
                      <RadioGroupItem id={`bt-${o.v}`} value={o.v} className="sr-only" />
                      {o.l}
                    </label>
                  ))}
                </RadioGroup>
              </div>
              <div>
                <Label htmlFor="tx">Tax ID (optional)</Label>
                <Input
                  id="tx"
                  value={biz.tax_id}
                  onChange={(e) => setBiz({ ...biz, tax_id: e.target.value })}
                  placeholder="TIN"
                />
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-5">
              <h2 className="text-xl font-semibold">Reporting & tax</h2>
              <div>
                <Label className="mb-2 block">How often do you want reports?</Label>
                <RadioGroup
                  value={biz.period_pref}
                  onValueChange={(v) =>
                    setBiz({ ...biz, period_pref: v as "month" | "quarter" | "year" })
                  }
                  className="grid grid-cols-3 gap-2"
                >
                  {[
                    { v: "month", l: "Monthly" },
                    { v: "quarter", l: "Quarterly" },
                    { v: "year", l: "Yearly" },
                  ].map((o) => (
                    <label
                      key={o.v}
                      htmlFor={`p-${o.v}`}
                      className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border bg-card px-3 py-3 text-sm hover:border-ring has-[input:checked]:border-primary has-[input:checked]:bg-primary has-[input:checked]:text-primary-foreground"
                    >
                      <RadioGroupItem id={`p-${o.v}`} value={o.v} className="sr-only" />
                      {o.l}
                    </label>
                  ))}
                </RadioGroup>
              </div>
              <div>
                <Label className="mb-2 block">Are you VAT-registered?</Label>
                <RadioGroup
                  value={String(biz.vat_registered)}
                  onValueChange={(v) => setBiz({ ...biz, vat_registered: Number(v) })}
                  className="grid grid-cols-2 gap-2"
                >
                  {[
                    { v: "0", l: "No" },
                    { v: "1", l: "Yes" },
                  ].map((o) => (
                    <label
                      key={o.v}
                      htmlFor={`v-${o.v}`}
                      className="flex cursor-pointer items-center justify-center rounded-lg border bg-card px-3 py-3 text-sm hover:border-ring has-[input:checked]:border-primary has-[input:checked]:bg-primary has-[input:checked]:text-primary-foreground"
                    >
                      <RadioGroupItem id={`v-${o.v}`} value={o.v} className="sr-only" />
                      {o.l}
                    </label>
                  ))}
                </RadioGroup>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Opening balances</h2>
              <p className="text-sm text-muted-foreground">
                Enter what you currently have. Leave blank if zero. All amounts in GHS.
              </p>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { k: "cash", l: "Cash on hand" },
                  { k: "momo", l: "Mobile wallet" },
                  { k: "inventory", l: "Stock value" },
                  { k: "receivables", l: "Money owed to you" },
                  { k: "payables", l: "Money you owe" },
                  { k: "loan", l: "Outstanding loans" },
                ].map((f) => (
                  <div key={f.k}>
                    <Label htmlFor={f.k}>{f.l}</Label>
                    <Input
                      id={f.k}
                      inputMode="decimal"
                      placeholder="0.00"
                      value={opening[f.k as keyof typeof opening]}
                      onChange={(e) =>
                        setOpening({ ...opening, [f.k]: e.target.value })
                      }
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="mt-8 flex items-center justify-between gap-3">
            <Button variant="ghost" onClick={back} disabled={step === 0 || busy}>
              Back
            </Button>
            {step < 2 ? (
              <Button onClick={next} disabled={step === 0 ? !canNext0 : false}>
                Continue
              </Button>
            ) : (
              <Button onClick={finish} disabled={busy}>
                {busy ? "Setting up…" : "Finish setup"}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}