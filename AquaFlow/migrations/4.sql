
CREATE TABLE incidents (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  external_id TEXT,
  user_id INTEGER NOT NULL,
  incident_type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  severity TEXT,
  status TEXT NOT NULL,
  location_address TEXT,
  latitude REAL,
  longitude REAL,
  reported_date DATETIME,
  resolved_date DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_incidents_user_id ON incidents(user_id);
CREATE INDEX idx_incidents_status ON incidents(status);
