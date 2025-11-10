-- Initial schema for messages display system

CREATE TABLE IF NOT EXISTS messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  text TEXT NOT NULL,
  color TEXT DEFAULT '#FFFFFF',
  enabled INTEGER DEFAULT 1,
  flash INTEGER DEFAULT 0,
  order_index INTEGER DEFAULT 0,
  time_start TEXT DEFAULT '00:00',
  time_end TEXT DEFAULT '23:59',
  days TEXT DEFAULT 'Mon,Tue,Wed,Thu,Fri,Sat,Sun',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS backup_prompts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  last_prompted DATETIME DEFAULT CURRENT_TIMESTAMP
);
