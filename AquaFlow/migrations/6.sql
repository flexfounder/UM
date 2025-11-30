
CREATE TABLE meter_readings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  external_id TEXT,
  user_id INTEGER NOT NULL,
  meter_number TEXT NOT NULL,
  customer_account TEXT,
  customer_name TEXT,
  previous_reading REAL,
  current_reading REAL NOT NULL,
  reading_date DATETIME NOT NULL,
  consumption REAL,
  meter_status TEXT,
  latitude REAL,
  longitude REAL,
  notes TEXT,
  photo_url TEXT,
  is_synced BOOLEAN DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_meter_readings_user_id ON meter_readings(user_id);
CREATE INDEX idx_meter_readings_meter_number ON meter_readings(meter_number);
CREATE INDEX idx_meter_readings_is_synced ON meter_readings(is_synced);
