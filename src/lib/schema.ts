// SQLite schema + seed for the AIS. All money is stored as INTEGER pesewas.
export const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS business_profile (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  business_name TEXT NOT NULL,
  owner_name TEXT NOT NULL,
  business_type TEXT,
  vat_registered INTEGER NOT NULL DEFAULT 0,
  tax_id TEXT,
  currency TEXT NOT NULL DEFAULT 'GHS',
  period_pref TEXT NOT NULL DEFAULT 'month',
  pin TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS accounts (
  code TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL,         -- ASSET | LIABILITY | EQUITY | REVENUE | EXPENSE
  normal TEXT NOT NULL        -- DR | CR
);

CREATE TABLE IF NOT EXISTS journal_entries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  date TEXT NOT NULL,
  memo TEXT,
  source_type TEXT,           -- sale | purchase | expense | opening | transfer | adjust
  source_id INTEGER,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_je_date ON journal_entries(date);

CREATE TABLE IF NOT EXISTS journal_lines (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  entry_id INTEGER NOT NULL REFERENCES journal_entries(id) ON DELETE CASCADE,
  account_code TEXT NOT NULL REFERENCES accounts(code),
  debit INTEGER NOT NULL DEFAULT 0,
  credit INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_jl_acct ON journal_lines(account_code);
CREATE INDEX IF NOT EXISTS idx_jl_entry ON journal_lines(entry_id);

CREATE TABLE IF NOT EXISTS inventory_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  sku TEXT,
  unit TEXT NOT NULL DEFAULT 'pcs',
  cost_pesewas INTEGER NOT NULL DEFAULT 0,
  price_pesewas INTEGER NOT NULL DEFAULT 0,
  qty REAL NOT NULL DEFAULT 0,
  reorder_level REAL NOT NULL DEFAULT 0,
  archived INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS inventory_movements (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  item_id INTEGER NOT NULL REFERENCES inventory_items(id),
  date TEXT NOT NULL,
  qty_delta REAL NOT NULL,
  unit_cost_pesewas INTEGER NOT NULL DEFAULT 0,
  source_type TEXT,
  source_id INTEGER
);

CREATE TABLE IF NOT EXISTS sales (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  date TEXT NOT NULL,
  customer TEXT,
  payment_method TEXT NOT NULL,   -- cash | momo | credit
  subtotal_pesewas INTEGER NOT NULL,
  vat_pesewas INTEGER NOT NULL DEFAULT 0,
  total_pesewas INTEGER NOT NULL,
  notes TEXT,
  entry_id INTEGER REFERENCES journal_entries(id)
);

CREATE TABLE IF NOT EXISTS sale_lines (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  sale_id INTEGER NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
  item_id INTEGER REFERENCES inventory_items(id),
  description TEXT,
  qty REAL NOT NULL,
  unit_price_pesewas INTEGER NOT NULL,
  line_total_pesewas INTEGER NOT NULL,
  unit_cost_pesewas INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS purchases (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  date TEXT NOT NULL,
  supplier TEXT,
  payment_method TEXT NOT NULL,
  total_pesewas INTEGER NOT NULL,
  notes TEXT,
  entry_id INTEGER REFERENCES journal_entries(id)
);

CREATE TABLE IF NOT EXISTS purchase_lines (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  purchase_id INTEGER NOT NULL REFERENCES purchases(id) ON DELETE CASCADE,
  item_id INTEGER REFERENCES inventory_items(id),
  description TEXT,
  qty REAL NOT NULL,
  unit_cost_pesewas INTEGER NOT NULL,
  line_total_pesewas INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS expenses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  date TEXT NOT NULL,
  category_code TEXT NOT NULL REFERENCES accounts(code),
  payment_method TEXT NOT NULL,
  amount_pesewas INTEGER NOT NULL,
  memo TEXT,
  entry_id INTEGER REFERENCES journal_entries(id)
);
`;

export const SEED_ACCOUNTS_SQL = `
INSERT OR IGNORE INTO accounts (code, name, type, normal) VALUES
  ('1000','Cash','ASSET','DR'),
  ('1010','Mobile Wallet','ASSET','DR'),
  ('1100','Accounts Receivable','ASSET','DR'),
  ('1200','Inventory','ASSET','DR'),
  ('2000','Accounts Payable','LIABILITY','CR'),
  ('2100','Loan Payable','LIABILITY','CR'),
  ('2200','VAT Payable','LIABILITY','CR'),
  ('3000','Owner Capital','EQUITY','CR'),
  ('3100','Drawings','EQUITY','DR'),
  ('4000','Sales Revenue','REVENUE','CR'),
  ('4100','Service Revenue','REVENUE','CR'),
  ('5000','Cost of Goods Sold','EXPENSE','DR'),
  ('6000','Rent','EXPENSE','DR'),
  ('6010','Electricity','EXPENSE','DR'),
  ('6020','Fuel','EXPENSE','DR'),
  ('6030','Bad Debts','EXPENSE','DR'),
  ('6040','Miscellaneous Expense','EXPENSE','DR'),
  ('6050','Transport','EXPENSE','DR'),
  ('6060','Salaries','EXPENSE','DR'),
  ('6070','Repairs & Maintenance','EXPENSE','DR'),
  ('6080','Internet & Phone','EXPENSE','DR');
`;

export const PAYMENT_ACCOUNT = {
  cash: "1000",
  momo: "1010",
  credit: "1100", // AR for sales / AP for purchases handled in engine
} as const;

export const EXPENSE_CATEGORIES: { code: string; label: string }[] = [
  { code: "6000", label: "Rent" },
  { code: "6010", label: "Electricity" },
  { code: "6020", label: "Fuel" },
  { code: "6030", label: "Bad Debts" },
  { code: "6040", label: "Miscellaneous" },
  { code: "6050", label: "Transport" },
  { code: "6060", label: "Salaries" },
  { code: "6070", label: "Repairs & Maintenance" },
  { code: "6080", label: "Internet & Phone" },
];