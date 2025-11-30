
CREATE TABLE meter_reading_sheets (
  id INTEGER PRIMARY KEY,
  sheet TEXT NOT NULL,
  assigned INTEGER NOT NULL,
  returned INTEGER NOT NULL,
  date_due DATE NOT NULL,
  is_active BOOLEAN NOT NULL,
  is_closed BOOLEAN NOT NULL,
  user_id INTEGER NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE meter_reading_accounts (
  id INTEGER PRIMARY KEY,
  account_number TEXT NOT NULL,
  meters_id INTEGER,
  meter_no TEXT,
  location TEXT,
  assoc_name TEXT NOT NULL,
  assoc_phone TEXT,
  assoc_email TEXT,
  accounts_id INTEGER,
  prev_read REAL,
  prev_date DATE,
  last_date DATE,
  status_id INTEGER,
  geolat REAL,
  geolon REAL,
  connection INTEGER,
  acc_balance REAL,
  walk_no REAL,
  sheet_id INTEGER NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE meter_reading_captures (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  account_id INTEGER NOT NULL,
  sheet_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  case_id INTEGER NOT NULL,
  current_reading REAL,
  meter_number TEXT,
  anomaly_id INTEGER,
  anomaly_case_id INTEGER,
  photo_url TEXT,
  latitude REAL NOT NULL,
  longitude REAL NOT NULL,
  accuracy REAL,
  reading_date DATETIME NOT NULL,
  is_synced BOOLEAN DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
