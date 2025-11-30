
CREATE TABLE customers (
  id INTEGER PRIMARY KEY,
  account_number TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  address TEXT,
  meter_number TEXT,
  service_area_id INTEGER,
  service_zone_id INTEGER,
  meter_book_id INTEGER,
  meter_sheet_id INTEGER,
  connection_status TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_customers_account_number ON customers(account_number);
CREATE INDEX idx_customers_meter_number ON customers(meter_number);
CREATE INDEX idx_customers_name ON customers(name);
