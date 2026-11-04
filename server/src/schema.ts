export const SCHEMA = `
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY,
  username TEXT NOT NULL UNIQUE COLLATE NOCASE,
  name TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'staff' CHECK (role IN ('admin','staff')),
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

-- Chart of accounts. Parties (traders, suppliers, farmers) are accounts too: one ledger for everything.
CREATE TABLE IF NOT EXISTS accounts (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL UNIQUE COLLATE NOCASE,
  type TEXT NOT NULL CHECK (type IN ('asset','liability','equity','income','expense')),
  category TEXT NOT NULL,
  subtype TEXT,                 -- supplier: feed | medicine | chicks | other
  sys_key TEXT UNIQUE,          -- 'wip', 'sales', 'cogs', 'suspense' ...
  phone TEXT,
  notes TEXT,
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_accounts_category ON accounts(category);

CREATE TABLE IF NOT EXISTS farms (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL UNIQUE COLLATE NOCASE,
  farmer_name TEXT,
  farmer_account_id INTEGER REFERENCES accounts(id),
  phone TEXT,
  location TEXT,
  capacity INTEGER,
  active INTEGER NOT NULL DEFAULT 1,
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- A batch (flock) = one grow-out cycle on one farm.
CREATE TABLE IF NOT EXISTS batches (
  id INTEGER PRIMARY KEY,
  farm_id INTEGER NOT NULL REFERENCES farms(id),
  batch_no INTEGER NOT NULL,
  placement_date TEXT,
  placed_qty INTEGER,
  status TEXT NOT NULL DEFAULT 'running' CHECK (status IN ('running','closed')),
  closed_date TEXT,
  notes TEXT,
  partial INTEGER NOT NULL DEFAULT 0,   -- 1 = incomplete history (e.g. carried forward from before this system)
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (farm_id, batch_no)
);
CREATE INDEX IF NOT EXISTS idx_batches_status ON batches(status);

CREATE TABLE IF NOT EXISTS vouchers (
  id INTEGER PRIMARY KEY,
  voucher_no INTEGER NOT NULL UNIQUE,
  type TEXT NOT NULL,
  date TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  party_id INTEGER REFERENCES accounts(id),
  farm_id INTEGER REFERENCES farms(id),
  batch_id INTEGER REFERENCES batches(id),
  bill_no INTEGER UNIQUE,
  meta TEXT,                    -- JSON: original form payload, weighing sheet, etc.
  source TEXT NOT NULL DEFAULT 'app',
  created_by INTEGER REFERENCES users(id),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_vouchers_date ON vouchers(date);
CREATE INDEX IF NOT EXISTS idx_vouchers_type ON vouchers(type);
CREATE INDEX IF NOT EXISTS idx_vouchers_batch ON vouchers(batch_id);

-- Double-entry lines. Every voucher's debits equal its credits.
CREATE TABLE IF NOT EXISTS entries (
  id INTEGER PRIMARY KEY,
  voucher_id INTEGER NOT NULL REFERENCES vouchers(id) ON DELETE CASCADE,
  seq INTEGER NOT NULL DEFAULT 0,
  date TEXT NOT NULL,
  account_id INTEGER NOT NULL REFERENCES accounts(id),
  farm_id INTEGER REFERENCES farms(id),
  batch_id INTEGER REFERENCES batches(id),
  debit REAL NOT NULL DEFAULT 0,
  credit REAL NOT NULL DEFAULT 0,
  category TEXT,                -- chicks | feed | feed_return | medicine | integration | misc | opening | cogs | live | weak | damage
  item TEXT,
  qty REAL,
  weight REAL,
  rate REAL,
  narration TEXT
);
CREATE INDEX IF NOT EXISTS idx_entries_account_date ON entries(account_id, date);
CREATE INDEX IF NOT EXISTS idx_entries_voucher ON entries(voucher_id);
CREATE INDEX IF NOT EXISTS idx_entries_batch ON entries(batch_id);
CREATE INDEX IF NOT EXISTS idx_entries_farm ON entries(farm_id);
CREATE INDEX IF NOT EXISTS idx_entries_date ON entries(date);

CREATE TABLE IF NOT EXISTS cash_counts (
  date TEXT PRIMARY KEY,
  denominations TEXT NOT NULL,   -- JSON {"500": 427, ...}
  damage REAL NOT NULL DEFAULT 0,
  total REAL NOT NULL DEFAULT 0,
  note TEXT,
  updated_by INTEGER REFERENCES users(id),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
`;
