-- Create settings table for call throttle configuration
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

-- Insert default settings for call throttle feature
INSERT OR IGNORE INTO settings (key, value) VALUES ('call_throttle_enabled', '0');
INSERT OR IGNORE INTO settings (key, value) VALUES ('call_throttle_minutes', '30');
INSERT OR IGNORE INTO settings (key, value) VALUES ('call_throttle_message', 'You called Edward a few minutes ago - please wait a bit before calling again');
