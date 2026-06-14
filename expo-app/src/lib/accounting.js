// Automated double-entry accounting engine.
// Users never see debits/credits — they call recordSale / recordPurchase / recordExpense.
import { all, one, run, tx, getDb } from "./db";

function postEntry(date, memo, sourceType, sourceId, lines) {
  const totalD = lines.reduce((s, l) => s + (l.debit || 0), 0);
  const totalC = lines.reduce((s, l) => s + (l.credit || 0), 0);
  if (totalD !== totalC) {
    throw new Error(`Unbalanced entry: DR ${totalD} vs CR ${totalC}`);
  }
  const db = getDb();
  const res = db.runSync(
    "INSERT INTO journal_entries (date, memo, source_type, source_id) VALUES (?,?,?,?)",
    [date, memo, sourceType, sourceId],
  );
  const entryId = res.lastInsertRowId;
  for (const l of lines) {
    db.runSync(
      "INSERT INTO journal_lines (entry_id, account_code, debit, credit) VALUES (?,?,?,?)",
      [entryId, l.account, l.debit || 0, l.credit || 0],
    );
  }
  return entryId;
}

function paymentDebitAcct(method) {
  return method === "cash" ? "1000" : method === "momo" ? "1010" : "1100";
}
function paymentCreditAcct(method) {
  return method === "cash" ? "1000" : method === "momo" ? "1010" : "2000";
}

// ---------- Sales ----------
export function recordSale(input) {
  let saleId = 0;
  tx((db) => {
    const subtotal = input.lines.reduce(
      (s, l) => s + Math.round(l.qty * l.unitPricePesewas),
      0,
    );
    const total = subtotal + (input.vatPesewas || 0);

    const res = db.runSync(
      "INSERT INTO sales (date, customer, payment_method, subtotal_pesewas, vat_pesewas, total_pesewas, notes) VALUES (?,?,?,?,?,?,?)",
      [
        input.date,
        input.customer || null,
        input.paymentMethod,
        subtotal,
        input.vatPesewas || 0,
        total,
        input.notes || null,
      ],
    );
    saleId = res.lastInsertRowId;

    let totalCogs = 0;
    for (const l of input.lines) {
      let unitCost = 0;
      if (l.itemId) {
        const item = db.getFirstSync(
          "SELECT cost_pesewas, qty FROM inventory_items WHERE id = ?",
          [l.itemId],
        );
        if (item) unitCost = item.cost_pesewas;
      }
      totalCogs += Math.round(unitCost * l.qty);
      db.runSync(
        "INSERT INTO sale_lines (sale_id, item_id, description, qty, unit_price_pesewas, line_total_pesewas, unit_cost_pesewas) VALUES (?,?,?,?,?,?,?)",
        [
          saleId,
          l.itemId || null,
          l.description || null,
          l.qty,
          l.unitPricePesewas,
          Math.round(l.qty * l.unitPricePesewas),
          unitCost,
        ],
      );
      if (l.itemId) {
        db.runSync("UPDATE inventory_items SET qty = qty - ? WHERE id = ?", [l.qty, l.itemId]);
        db.runSync(
          "INSERT INTO inventory_movements (item_id, date, qty_delta, unit_cost_pesewas, source_type, source_id) VALUES (?,?,?,?,?,?)",
          [l.itemId, input.date, -l.qty, unitCost, "sale", saleId],
        );
      }
    }

    const lines = [
      { account: paymentDebitAcct(input.paymentMethod), debit: total },
      { account: input.revenueAccount || "4000", credit: subtotal },
    ];
    if ((input.vatPesewas || 0) > 0) lines.push({ account: "2200", credit: input.vatPesewas });
    if (totalCogs > 0) {
      lines.push({ account: "5000", debit: totalCogs });
      lines.push({ account: "1200", credit: totalCogs });
    }
    const entryId = postEntry(
      input.date,
      `Sale #${saleId}${input.customer ? " — " + input.customer : ""}`,
      "sale",
      saleId,
      lines,
    );
    db.runSync("UPDATE sales SET entry_id = ? WHERE id = ?", [entryId, saleId]);
  });
  return saleId;
}

// ---------- Purchases ----------
export function recordPurchase(input) {
  let purchaseId = 0;
  tx((db) => {
    const total = input.lines.reduce(
      (s, l) => s + Math.round(l.qty * l.unitCostPesewas),
      0,
    );
    const res = db.runSync(
      "INSERT INTO purchases (date, supplier, payment_method, total_pesewas, notes) VALUES (?,?,?,?,?)",
      [input.date, input.supplier || null, input.paymentMethod, total, input.notes || null],
    );
    purchaseId = res.lastInsertRowId;

    for (const l of input.lines) {
      db.runSync(
        "INSERT INTO purchase_lines (purchase_id, item_id, description, qty, unit_cost_pesewas, line_total_pesewas) VALUES (?,?,?,?,?,?)",
        [
          purchaseId,
          l.itemId || null,
          l.description || null,
          l.qty,
          l.unitCostPesewas,
          Math.round(l.qty * l.unitCostPesewas),
        ],
      );
      if (l.itemId) {
        const item = db.getFirstSync(
          "SELECT cost_pesewas, qty FROM inventory_items WHERE id = ?",
          [l.itemId],
        );
        if (item) {
          const oldVal = item.cost_pesewas * item.qty;
          const addVal = l.unitCostPesewas * l.qty;
          const newQty = item.qty + l.qty;
          const newCost =
            newQty > 0 ? Math.round((oldVal + addVal) / newQty) : l.unitCostPesewas;
          db.runSync("UPDATE inventory_items SET qty = ?, cost_pesewas = ? WHERE id = ?", [
            newQty,
            newCost,
            l.itemId,
          ]);
        }
        db.runSync(
          "INSERT INTO inventory_movements (item_id, date, qty_delta, unit_cost_pesewas, source_type, source_id) VALUES (?,?,?,?,?,?)",
          [l.itemId, input.date, l.qty, l.unitCostPesewas, "purchase", purchaseId],
        );
      }
    }

    const hasItems = input.lines.some((l) => l.itemId);
    const debitAcct = hasItems ? "1200" : "6040";
    const entryId = postEntry(
      input.date,
      `Purchase #${purchaseId}${input.supplier ? " — " + input.supplier : ""}`,
      "purchase",
      purchaseId,
      [
        { account: debitAcct, debit: total },
        { account: paymentCreditAcct(input.paymentMethod), credit: total },
      ],
    );
    db.runSync("UPDATE purchases SET entry_id = ? WHERE id = ?", [entryId, purchaseId]);
  });
  return purchaseId;
}

// ---------- Expenses ----------
export function recordExpense(input) {
  const { lastId } = run(
    "INSERT INTO expenses (date, category_code, payment_method, amount_pesewas, memo) VALUES (?,?,?,?,?)",
    [
      input.date,
      input.categoryCode,
      input.paymentMethod,
      input.amountPesewas,
      input.memo || null,
    ],
  );
  const entryId = postEntry(
    input.date,
    `Expense — ${input.memo || input.categoryCode}`,
    "expense",
    lastId,
    [
      { account: input.categoryCode, debit: input.amountPesewas },
      { account: paymentCreditAcct(input.paymentMethod), credit: input.amountPesewas },
    ],
  );
  run("UPDATE expenses SET entry_id = ? WHERE id = ?", [entryId, lastId]);
  return lastId;
}

// ---------- Opening balances ----------
export function recordOpeningBalances(opening) {
  const lines = [];
  if (opening.cash > 0) lines.push({ account: "1000", debit: opening.cash });
  if (opening.momo > 0) lines.push({ account: "1010", debit: opening.momo });
  if (opening.inventoryValue > 0) lines.push({ account: "1200", debit: opening.inventoryValue });
  if (opening.receivables > 0) lines.push({ account: "1100", debit: opening.receivables });
  if (opening.payables > 0) lines.push({ account: "2000", credit: opening.payables });
  if (opening.loan > 0) lines.push({ account: "2100", credit: opening.loan });

  const debits = lines.reduce((s, l) => s + (l.debit || 0), 0);
  const credits = lines.reduce((s, l) => s + (l.credit || 0), 0);
  const equity = debits - credits;
  if (equity > 0) lines.push({ account: "3000", credit: equity });
  else if (equity < 0) lines.push({ account: "3000", debit: -equity });

  if (lines.length === 0) return;
  postEntry(opening.date, "Opening balances", "opening", null, lines);
}

// ---------- Reporting ----------
export function trialBalance(asOf) {
  const rows = all(
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

export function periodActivity(start, end) {
  const rows = all(
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

export function incomeStatement(start, end) {
  const rows = periodActivity(start, end);
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

export function balanceSheet(asOf) {
  const tb = trialBalance(asOf);
  const assets = tb.filter((a) => a.type === "ASSET" && a.balance !== 0);
  const liabilities = tb.filter((a) => a.type === "LIABILITY" && a.balance !== 0);
  const equityRaw = tb.filter((a) => a.type === "EQUITY");
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

export function accountBalance(code, asOf) {
  const tb = trialBalance(asOf);
  return tb.find((a) => a.code === code)?.balance || 0;
}

export function getProfile() {
  return one("SELECT * FROM business_profile WHERE id = 1");
}