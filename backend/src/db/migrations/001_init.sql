-- Settings: single row configuration for the shop
CREATE TABLE settings (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  shop_name TEXT NOT NULL DEFAULT '',
  address TEXT NOT NULL DEFAULT '',
  phone TEXT NOT NULL DEFAULT '',
  vat_number TEXT NOT NULL DEFAULT '',
  default_vat_percent REAL NOT NULL DEFAULT 0,
  receipt_footer TEXT NOT NULL DEFAULT '',
  printer_name TEXT NOT NULL DEFAULT '',
  paper_width INTEGER NOT NULL DEFAULT 80
);

INSERT INTO settings (id) VALUES (1);

CREATE TABLE categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE
);

CREATE TABLE items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  code TEXT NOT NULL UNIQUE,
  barcode TEXT UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  category_id INTEGER REFERENCES categories(id),
  unit TEXT NOT NULL CHECK (unit IN ('KG', 'PKT', 'PCS', 'BAG')),
  cost_price INTEGER NOT NULL DEFAULT 0,
  selling_price INTEGER NOT NULL DEFAULT 0,
  stock_qty REAL NOT NULL DEFAULT 0,
  reorder_level REAL NOT NULL DEFAULT 0,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE stock_movements (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  item_id INTEGER NOT NULL REFERENCES items(id),
  type TEXT NOT NULL CHECK (type IN ('OPENING', 'PURCHASE', 'SALE', 'RETURN', 'ADJUSTMENT', 'VOID')),
  qty_change REAL NOT NULL,
  unit_cost INTEGER,
  reference_id INTEGER,
  note TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE bills (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  bill_no TEXT NOT NULL UNIQUE,
  subtotal INTEGER NOT NULL,
  bill_discount_type TEXT CHECK (bill_discount_type IN ('PERCENT', 'FLAT')),
  bill_discount_value REAL NOT NULL DEFAULT 0,
  bill_discount_amount INTEGER NOT NULL DEFAULT 0,
  taxable_amount INTEGER NOT NULL,
  vat_percent REAL NOT NULL DEFAULT 0,
  vat_amount INTEGER NOT NULL DEFAULT 0,
  grand_total INTEGER NOT NULL,
  payment_method TEXT NOT NULL CHECK (payment_method IN ('CASH', 'CARD', 'CREDIT', 'OTHER')),
  amount_paid INTEGER NOT NULL DEFAULT 0,
  change_given INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'COMPLETED' CHECK (status IN ('COMPLETED', 'VOID')),
  customer_id INTEGER,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE bill_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  bill_id INTEGER NOT NULL REFERENCES bills(id),
  item_id INTEGER REFERENCES items(id),
  item_code TEXT NOT NULL,
  item_name TEXT NOT NULL,
  unit TEXT NOT NULL,
  qty REAL NOT NULL,
  rate INTEGER NOT NULL,
  discount_type TEXT CHECK (discount_type IN ('PERCENT', 'FLAT')),
  discount_value REAL NOT NULL DEFAULT 0,
  discount_amount INTEGER NOT NULL DEFAULT 0,
  line_total INTEGER NOT NULL
);

CREATE TABLE counters (
  name TEXT PRIMARY KEY,
  value INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX idx_items_name ON items(name);
CREATE INDEX idx_items_barcode ON items(barcode);
CREATE INDEX idx_stock_movements_item_id ON stock_movements(item_id);
CREATE INDEX idx_bills_created_at ON bills(created_at);
