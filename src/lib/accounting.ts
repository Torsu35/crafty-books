// Automated double-entry accounting engine.
// Users never see debits/credits — they call recordSale/recordPurchase/recordExpense.
import { all, getDb, one, persist, run } from "./db";

export type PaymentMethod = "cash" | "momo" | "credit";

interface JLine {
  account: string;
  debit?: number;
  credit?: number;
}

async function postEntry(
  date: string,
  memo: string,
  sourceType: string,
  sourceId: number | null,
  lines: JLine[],
): Promise<number> {
  const totalD = lines.reduce((s, l) => s + (l.debit || 0), 0);
  const totalC = lines.reduce((s, l) => s + (l.credit || 0), 0);
  if (totalD !== totalC) {
    throw new Error(`Unbalanced entry: DR ${totalD} vs CR ${totalC}`);
  }
  const db = await getDb();
  db.run("INSERT INTO journal_entries (date, memo, source_type, source_id) VALUES (?,?,?,?)", [
    date,
    memo,
    sourceType,
    sourceId,
  ] as never);
  const entryId = (db.exec("SELECT last_insert_rowid() AS id")[0]?.values[0]?.[0] as number) || 0;
  for (const l of lines) {
    db.run(
      "INSERT INTO journal_lines (entry_id, account_code, debit, credit) VALUES (?,?,?,?)",
      [entryId, l.account, l.debit || 0, l.credit || 0] as never,
    );
  }
  await persist(db);
  return entryId;
}

// ---------- Sales ----------
export interface SaleLineInput {
  itemId?: number | null;
  description?: string;
  qty: number;
  unitPricePesewas: number;
}

export interface SaleInput {
  date: string;
  customer?: string;
  paymentMethod: PaymentMethod;
  vatPesewas: number;
  notes?: string;
  lines: SaleLineInput[];
}

export async function recordSale(input: SaleInput): Promise<number> {
  const subtotal = input.lines.reduce(
    (s, l) => s + Math.round(l.qty * l.unitPricePesewas),
    0,
  );
  const total = subtotal + (input.vatPesewas || 0);

  // Insert sale + lines, gather COGS
  const db = await getDb();
  db.run(
    "INSERT INTO sales (date, customer, payment_method, subtotal_pesewas, vat_pesewas, total_pesewas, notes) VALUES (?,?,?,?,?,?,?)",
    [
      input.date,
      input.customer || null,
      input.paymentMethod,
      subtotal,
      input.vatPesewas || 0,
      total,
      input.notes || null,
    ] as never,
  );
  const saleId = (db.exec("SELECT last_insert_rowid() AS id")[0]?.values[0]?.[0] as number) || 0;

  let totalCogs = 0;
  for (const l of input.lines) {
    let unitCost = 0;
    if (l.itemId) {
      const item = await one<{ cost_pesewas: number; qty: number; name: string }>(
        "SELECT cost_pesewas, qty, name FROM inventory_items WHERE id = ?",
        [l.itemId],
      );
      if (item) unitCost = item.cost_pesewas;
    }
    totalCogs += Math.round(unitCost * l.qty);
    db.run(
      "INSERT INTO sale_lines (sale_id, item_id, description, qty, unit_price_pesewas, line_total_pesewas, unit_cost_pesewas) VALUES (?,?,?,?,?,?,?)",
      [
        saleId,
        l.itemId || null,
        l.description || null,
        l.qty,
        l.unitPricePesewas,
        Math.round(l.qty * l.unitPricePesewas),
        unitCost,
      ] as never,
    );
    if (l.itemId) {
      db.run("UPDATE inventory_items SET qty = qty - ? WHERE id = ?", [l.qty, l.itemId] as never);
      db.run(
        "INSERT INTO inventory_movements (item_id, date, qty_delta, unit_cost_pesewas, source_type, source_id) VALUES (?,?,?,?,?,?)",
        [l.itemId, input.date, -l.qty, unitCost, "sale", saleId] as never,
      );
    }
  }

  // Build accounting entry
  const debitAcct =
    input.paymentMethod === "cash"
      ? "1000"
      : input.paymentMethod === "momo"
        ? "1010"
        : "1100";

  const lines: JLine[] = [
    { account: debitAcct, debit: total },
    { account: "4000", credit: subtotal },
  ];
  if (input.vatPesewas > 0) lines.push({ account: "2200", credit: input.vatPesewas });
  if (totalCogs > 0) {
    lines.push({ account: "5000", debit: totalCogs });
    lines.push({ account: "1200", credit: totalCogs });
  }

  const entryId = await postEntry(
    input.date,
    `Sale #${saleId}${input.customer ? " — " + input.customer : ""}`,
    "sale",
    saleId,
    lines,
  );
  await run("UPDATE sales SET entry_id = ? WHERE id = ?", [entryId, saleId]);
  return saleId;
}

// ---------- Purchases ----------
export interface PurchaseLineInput {
  itemId?: number | null;
  description?: string;
  qty: number;
  unitCostPesewas: number;
}

export interface PurchaseInput {
  date: string;
  supplier?: string;
  paymentMethod: PaymentMethod;
  notes?: string;
  lines: PurchaseLineInput[];
}

export async function recordPurchase(input: PurchaseInput): Promise<number> {
  const total = input.lines.reduce(
    (s, l) => s + Math.round(l.qty * l.unitCostPesewas),
    0,
  );

  const db = await getDb();
  db.run(
    "INSERT INTO purchases (date, supplier, payment_method, total_pesewas, notes) VALUES (?,?,?,?,?)",
    [
      input.date,
      input.supplier || null,
      input.paymentMethod,
      total,
      input.notes || null,
    ] as never,
  );
  const purchaseId =
    (db.exec("SELECT last_insert_rowid() AS id")[0]?.values[0]?.[0] as number) || 0;

  for (const l of input.lines) {
    db.run(
      "INSERT INTO purchase_lines (purchase_id, item_id, description, qty, unit_cost_pesewas, line_total_pesewas) VALUES (?,?,?,?,?,?)",
      [
        purchaseId,
        l.itemId || null,
        l.description || null,
        l.qty,
        l.unitCostPesewas,
        Math.round(l.qty * l.unitCostPesewas),
      ] as never,
    );
    if (l.itemId) {
      // Weighted-avg cost update
      const item = await one<{ cost_pesewas: number; qty: number }>(
        "SELECT cost_pesewas, qty FROM inventory_items WHERE id = ?",
        [l.itemId],
      );
      if (item) {
        const oldVal = item.cost_pesewas * item.qty;
        const addVal = l.unitCostPesewas * l.qty;
        const newQty = item.qty + l.qty;
        const newCost = newQty > 0 ? Math.round((oldVal + addVal) / newQty) : l.unitCostPesewas;
        db.run("UPDATE inventory_items SET qty = ?, cost_pesewas = ? WHERE id = ?", [
          newQty,
          newCost,
          l.itemId,
        ] as never);
      }
      db.run(
        "INSERT INTO inventory_movements (item_id, date, qty_delta, unit_cost_pesewas, source_type, source_id) VALUES (?,?,?,?,?,?)",
        [l.itemId, input.date, l.qty, l.unitCostPesewas, "purchase", purchaseId] as never,
      );
    }
  }

  // DR Inventory (if items) OR generic Misc (if no items) ; CR cash/momo/AP
  const creditAcct =
    input.paymentMethod === "cash"
      ? "1000"
      : input.paymentMethod === "momo"
        ? "1010"
        : "2000";
  const hasItems = input.lines.some((l) => l.itemId);
  const debitAcct = hasItems ? "1200" : "6040";

  const entryId = await postEntry(
    input.date,
    `Purchase #${purchaseId}${input.supplier ? " — " + input.supplier : ""}`,
    "purchase",
    purchaseId,
    [
      { account: debitAcct, debit: total },
      { account: creditAcct, credit: total },
    ],
  );
  await run("UPDATE purchases SET entry_id = ? WHERE id = ?", [entryId, purchaseId]);
  return purchaseId;
}

// ---------- Expenses ----------
export interface ExpenseInput {
  date: string;
  categoryCode: string; // expense account code
  paymentMethod: PaymentMethod;
  amountPesewas: number;
  memo?: string;
}

export async function recordExpense(input: ExpenseInput): Promise<number> {
  const { lastId } = await run(
    "INSERT INTO expenses (date, category_code, payment_method, amount_pesewas, memo) VALUES (?,?,?,?,?)",
    [input.date, input.categoryCode, input.paymentMethod, input.amountPesewas, input.memo || null],
  );
  const creditAcct =
    input.paymentMethod === "cash"
      ? "1000"
      : input.paymentMethod === "momo"
        ? "1010"
        : "2000";
  const entryId = await postEntry(
    input.date,
    `Expense — ${input.memo || input.categoryCode}`,
    "expense",
    lastId,
    [
      { account: input.categoryCode, debit: input.amountPesewas },
      { account: creditAcct, credit: input.amountPesewas },
    ],
  );
  await run("UPDATE expenses SET entry_id = ? WHERE id = ?", [entryId, lastId]);
  return lastId;
}

// ---------- Opening balances (from setup wizard) ----------
export async function recordOpeningBalances(opening: {
  date: string;
  cash: number; // pesewas
  momo: number;
  inventoryValue: number;
  receivables: number;
  payables: number;
  loan: number;
}): Promise<void> {
  const lines: JLine[] = [];
  if (opening.cash > 0) lines.push({ account: "1000", debit: opening.cash });
  if (opening.momo > 0) lines.push({ account: "1010", debit: opening.momo });
  if (opening.inventoryValue > 0)
    lines.push({ account: "1200", debit: opening.inventoryValue });
  if (opening.receivables > 0)
    lines.push({ account: "1100", debit: opening.receivables });
  if (opening.payables > 0) lines.push({ account: "2000", credit: opening.payables });
  if (opening.loan > 0) lines.push({ account: "2100", credit: opening.loan });

  const debits = lines.reduce((s, l) => s + (l.debit || 0), 0);
  const credits = lines.reduce((s, l) => s + (l.credit || 0), 0);
  const equity = debits - credits;
  if (equity > 0) lines.push({ account: "3000", credit: equity });
  else if (equity < 0) lines.push({ account: "3000", debit: -equity });

  if (lines.length === 0) return;
  await postEntry(opening.date, "Opening balances", "opening", null, lines);
}

// ---------- Reporting ----------
export interface AccountBalance {
  code: string;
  name: string;
  type: string;
  normal: string;
  debit: number;
  credit: number;
  balance: number; // signed by normal balance
}

export async function trialBalance(asOf?: string): Promise<AccountBalance[]> {
  const rows = await all<{
    code: string;
    name: string;
    type: string;
    normal: string;
    debit: number;
    credit: number;
  }>(
    `SELECT a.code, a.name, a.type, a.normal,
            COALESCE(SUM(jl.debit), 0) AS debit,
            COALESCE(SUM(jl.credit), 0) AS credit
     FROM accounts a
     LEFT JOIN journal_lines jl ON jl.account_code = a.code
     LEFT JOIN journal_entries je ON je.id = jl.entry_id
     WHERE (? IS NULL OR je.date <= ?)
     GROUP BY a.code
     ORDER BY a.code`,
    [asOf || null, asOf || null],
  );
  return rows.map((r) => ({
    ...r,
    balance: r.normal === "DR" ? r.debit - r.credit : r.credit - r.debit,
  }));
}

export interface PeriodActivity {
  code: string;
  name: string;
  type: string;
  amount: number; // positive = normal-side activity in period
}

export async function periodActivity(start: string, end: string): Promise<PeriodActivity[]> {
  const rows = await all<{
    code: string;
    name: string;
    type: string;
    normal: string;
    debit: number;
    credit: number;
  }>(
    `SELECT a.code, a.name, a.type, a.normal,
            COALESCE(SUM(jl.debit), 0) AS debit,
            COALESCE(SUM(jl.credit), 0) AS credit
     FROM accounts a
     LEFT JOIN journal_lines jl ON jl.account_code = a.code
     LEFT JOIN journal_entries je ON je.id = jl.entry_id
     WHERE je.date >= ? AND je.date <= ?
     GROUP BY a.code
     ORDER BY a.code`,
    [start, end],
  );
  return rows.map((r) => ({
    code: r.code,
    name: r.name,
    type: r.type,
    amount: r.normal === "DR" ? r.debit - r.credit : r.credit - r.debit,
  }));
}

export interface IncomeStatement {
  revenueLines: PeriodActivity[];
  expenseLines: PeriodActivity[];
  totalRevenue: number;
  totalExpenses: number;
  netIncome: number;
}

export async function incomeStatement(start: string, end: string): Promise<IncomeStatement> {
  const rows = await periodActivity(start, end);
  const revenueLines = rows.filter((r) => r.type === "REVENUE" && r.amount !== 0);
  const expenseLines = rows.filter((r) => r.type === "EXPENSE" && r.amount !== 0);
  const totalRevenue = revenueLines.reduce((s, r) => s + r.amount, 0);
  const totalExpenses = expenseLines.reduce((s, r) => s + r.amount, 0);
  return {
    revenueLines,
    expenseLines,
    totalRevenue,
    totalExpenses,
    netIncome: totalRevenue - totalExpenses,
  };
}

export interface BalanceSheet {
  assets: AccountBalance[];
  liabilities: AccountBalance[];
  equity: AccountBalance[];
  totalAssets: number;
  totalLiabilities: number;
  retainedEarnings: number;
  totalEquity: number;
}

export async function balanceSheet(asOf: string): Promise<BalanceSheet> {
  const tb = await trialBalance(asOf);
  const assets = tb.filter((a) => a.type === "ASSET" && a.balance !== 0);
  const liabilities = tb.filter((a) => a.type === "LIABILITY" && a.balance !== 0);
  const equityRaw = tb.filter((a) => a.type === "EQUITY");
  // Retained earnings = all revenue - all expense to date
  const revenue = tb.filter((a) => a.type === "REVENUE").reduce((s, a) => s + a.balance, 0);
  const expense = tb.filter((a) => a.type === "EXPENSE").reduce((s, a) => s + a.balance, 0);
  const retainedEarnings = revenue - expense;

  const equity = equityRaw.filter((a) => a.balance !== 0);
  const totalAssets = assets.reduce((s, a) => s + a.balance, 0);
  const totalLiabilities = liabilities.reduce((s, a) => s + a.balance, 0);
  const totalEquity = equity.reduce((s, a) => s + a.balance, 0) + retainedEarnings;
  return {
    assets,
    liabilities,
    equity,
    totalAssets,
    totalLiabilities,
    retainedEarnings,
    totalEquity,
  };
}

export async function accountBalance(code: string, asOf?: string): Promise<number> {
  const tb = await trialBalance(asOf);
  return tb.find((a) => a.code === code)?.balance || 0;
}