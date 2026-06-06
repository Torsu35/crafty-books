import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AppShell, Loading } from "@/components/app-shell";
import { Card } from "@/components/page-section";
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
import { run } from "@/lib/db";
import { useProfile } from "@/lib/use-db";

export const Route = createFileRoute("/settings")({
  head: () => ({ meta: [{ title: "Settings — Ledger" }] }),
  component: Settings,
});

function Settings() {
  const { profile, loading, refetch } = useProfile();
  const [name, setName] = useState("");
  const [owner, setOwner] = useState("");
  const [period, setPeriod] = useState<"month" | "quarter" | "year">("month");
  const [vat, setVat] = useState(0);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!profile) return;
    setName(profile.business_name);
    setOwner(profile.owner_name);
    setPeriod(profile.period_pref);
    setVat(profile.vat_registered);
  }, [profile]);

  const save = async () => {
    setBusy(true);
    try {
      await run(
        "UPDATE business_profile SET business_name=?, owner_name=?, period_pref=?, vat_registered=? WHERE id=1",
        [name.trim(), owner.trim(), period, vat],
      );
      toast.success("Settings saved");
      refetch();
    } finally {
      setBusy(false);
    }
  };

  if (loading || !profile)
    return (
      <AppShell title="Settings">
        <Loading />
      </AppShell>
    );

  return (
    <AppShell title="Settings">
      <div className="mx-auto max-w-2xl space-y-4">
        <Card title="Business profile">
          <div className="space-y-3">
            <div>
              <Label htmlFor="n">Business name</Label>
              <Input id="n" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="o">Owner name</Label>
              <Input id="o" value={owner} onChange={(e) => setOwner(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Reporting period</Label>
                <Select value={period} onValueChange={(v) => setPeriod(v as "month" | "quarter" | "year")}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="month">Monthly</SelectItem>
                    <SelectItem value="quarter">Quarterly</SelectItem>
                    <SelectItem value="year">Yearly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>VAT-registered</Label>
                <Select value={String(vat)} onValueChange={(v) => setVat(Number(v))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">No</SelectItem>
                    <SelectItem value="1">Yes</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="pt-2">
              <Button onClick={save} disabled={busy}>
                {busy ? "Saving…" : "Save changes"}
              </Button>
            </div>
          </div>
        </Card>

        <Card title="About">
          <p className="text-sm text-muted-foreground">
            Ledger is an offline bookkeeping app. All your data is stored on this device. Download a backup
            from the Backup page to keep a safe copy.
          </p>
        </Card>
      </div>
    </AppShell>
  );
}