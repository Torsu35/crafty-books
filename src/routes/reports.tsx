import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell, Loading } from "@/components/app-shell";
import { Card } from "@/components/page-section";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  balanceSheet,
  incomeStatement,
  type BalanceSheet,
  type IncomeStatement,
} from "@/lib/accounting";
import { formatGHS, periodRange } from "@/lib/format";
import { useDbReady, useProfile } from "@/lib/use-db";
import jsPDF from "jspdf";

export const Route = createFileRoute("/reports")({
  head: () => ({ meta: [{ title: "Reports — Ledger" }] }),
  component: Reports,
});

type Kind = "month" | "quarter" | "year";

function Reports() {
  const ready = useDbReady();
  const { profile } = useProfile();
  const [kind, setKind] = useState<Kind>("month");
  const [is, setIs] = useState<IncomeStatement | null>(null);
  const [bs, setBs] = useState<BalanceSheet | null>(null);

  useEffect(() => {
    if (profile) setKind(profile.period_pref);
  }, [profile]);

  const range = periodRange(kind);

  useEffect(() => {
    if (!ready) return;
    incomeStatement(range.start, range.end).then(setIs);
    balanceSheet(range.end).then(setBs);
  }, [ready, kind, range.start, range.end]);

  const downloadPdf = () => {
    if (!is || !bs || !profile) return;
    const doc = new jsPDF();
    let y = 16;
    doc.setFontSize(16);
    doc.text(profile.business_name, 14, y);
    y += 6;
    doc.setFontSize(10);
    doc.text(`Financial Reports — ${range.label}`, 14, y);
    y += 10;

    doc.setFontSize(13);
    doc.text("Income Statement", 14, y);
    y += 6;
    doc.setFontSize(10);
    doc.text(`For period ${range.start} to ${range.end}`, 14, y);
    y += 6;
    const writeRow = (l: string, r: string, bold?: boolean) => {
      doc.setFont("helvetica", bold ? "bold" : "normal");
      doc.text(l, 14, y);
      doc.text(r, 196, y, { align: "right" });
      y += 5;
    };
    writeRow("Revenue", "", true);
    is.revenueLines.forEach((r) => writeRow("  " + r.name, formatGHS(r.amount)));
    writeRow("Total revenue", formatGHS(is.totalRevenue), true);
    y += 2;
    writeRow("Expenses", "", true);
    is.expenseLines.forEach((r) => writeRow("  " + r.name, formatGHS(r.amount)));
    writeRow("Total expenses", formatGHS(is.totalExpenses), true);
    y += 2;
    writeRow("Net profit", formatGHS(is.netIncome), true);

    y += 8;
    doc.setFontSize(13);
    doc.setFont("helvetica", "bold");
    doc.text("Statement of Financial Position", 14, y);
    y += 6;
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`As of ${range.end}`, 14, y);
    y += 6;
    writeRow("Assets", "", true);
    bs.assets.forEach((a) => writeRow("  " + a.name, formatGHS(a.balance)));
    writeRow("Total assets", formatGHS(bs.totalAssets), true);
    y += 2;
    writeRow("Liabilities", "", true);
    bs.liabilities.forEach((a) => writeRow("  " + a.name, formatGHS(a.balance)));
    writeRow("Total liabilities", formatGHS(bs.totalLiabilities), true);
    y += 2;
    writeRow("Equity", "", true);
    bs.equity.forEach((a) => writeRow("  " + a.name, formatGHS(a.balance)));
    writeRow("  Retained earnings", formatGHS(bs.retainedEarnings));
    writeRow("Total equity", formatGHS(bs.totalEquity), true);

    doc.save(`reports-${range.start}-${range.end}.pdf`);
  };

  return (
    <AppShell
      title="Reports"
      action={
        <div className="flex items-center gap-2">
          <Select value={kind} onValueChange={(v) => setKind(v as Kind)}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="month">This month</SelectItem>
              <SelectItem value="quarter">This quarter</SelectItem>
              <SelectItem value="year">This year</SelectItem>
            </SelectContent>
          </Select>
          <Button size="sm" onClick={downloadPdf} disabled={!is || !bs}>
            Download PDF
          </Button>
        </div>
      }
    >
      {!is || !bs ? (
        <Loading />
      ) : (
        <div className="space-y-6">
          <Card title={`Income Statement — ${range.label}`}>
            <ReportTable
              sections={[
                {
                  title: "Revenue",
                  rows: is.revenueLines.map((r) => ({ label: r.name, value: r.amount })),
                  total: { label: "Total revenue", value: is.totalRevenue },
                },
                {
                  title: "Expenses",
                  rows: is.expenseLines.map((r) => ({ label: r.name, value: r.amount })),
                  total: { label: "Total expenses", value: is.totalExpenses },
                },
              ]}
              grand={{
                label: is.netIncome >= 0 ? "Net profit" : "Net loss",
                value: Math.abs(is.netIncome),
                emphasize: true,
                tone: is.netIncome >= 0 ? "success" : "destructive",
              }}
            />
          </Card>

          <Card title={`Statement of Financial Position — as of ${range.end}`}>
            <ReportTable
              sections={[
                {
                  title: "Assets",
                  rows: bs.assets.map((a) => ({ label: a.name, value: a.balance })),
                  total: { label: "Total assets", value: bs.totalAssets },
                },
                {
                  title: "Liabilities",
                  rows: bs.liabilities.map((a) => ({ label: a.name, value: a.balance })),
                  total: { label: "Total liabilities", value: bs.totalLiabilities },
                },
                {
                  title: "Equity",
                  rows: [
                    ...bs.equity.map((a) => ({ label: a.name, value: a.balance })),
                    { label: "Retained earnings", value: bs.retainedEarnings },
                  ],
                  total: { label: "Total equity", value: bs.totalEquity },
                },
              ]}
              grand={{
                label: "Liabilities + Equity",
                value: bs.totalLiabilities + bs.totalEquity,
                emphasize: true,
              }}
            />
          </Card>
        </div>
      )}
    </AppShell>
  );
}

function ReportTable({
  sections,
  grand,
}: {
  sections: {
    title: string;
    rows: { label: string; value: number }[];
    total: { label: string; value: number };
  }[];
  grand?: { label: string; value: number; emphasize?: boolean; tone?: "success" | "destructive" };
}) {
  return (
    <div className="space-y-5">
      {sections.map((s) => (
        <div key={s.title}>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {s.title}
          </h3>
          {s.rows.length === 0 ? (
            <p className="text-sm text-muted-foreground">No activity.</p>
          ) : (
            <ul className="divide-y border-y">
              {s.rows.map((r, i) => (
                <li key={i} className="flex justify-between py-2 text-sm">
                  <span>{r.label}</span>
                  <span className="font-mono">{formatGHS(r.value)}</span>
                </li>
              ))}
            </ul>
          )}
          <div className="mt-2 flex justify-between text-sm font-semibold">
            <span>{s.total.label}</span>
            <span className="font-mono">{formatGHS(s.total.value)}</span>
          </div>
        </div>
      ))}
      {grand && (
        <div
          className={`mt-2 flex justify-between rounded-lg px-4 py-3 text-base font-semibold ${
            grand.tone === "success"
              ? "bg-[color:var(--success)]/10 text-[color:var(--success)]"
              : grand.tone === "destructive"
                ? "bg-destructive/10 text-destructive"
                : "bg-primary/5 text-primary"
          }`}
        >
          <span>{grand.label}</span>
          <span className="font-mono">{formatGHS(grand.value)}</span>
        </div>
      )}
    </div>
  );
}