
CREATE TABLE tasks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  external_id TEXT,
  user_id INTEGER NOT NULL,
  task_type_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL,
  priority TEXT,
  customer_name TEXT,
  customer_account TEXT,
  location_address TEXT,
  latitude REAL,
  longitude REAL,
  assigned_date DATE,
  due_date DATE,
  completed_date DATE,
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_tasks_user_id ON tasks(user_id);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_task_type_id ON tasks(task_type_id);
