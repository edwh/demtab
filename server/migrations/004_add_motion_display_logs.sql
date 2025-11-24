-- Track when motion-activated messages are displayed
CREATE TABLE IF NOT EXISTS motion_display_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  message_id INTEGER NOT NULL,
  displayed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  day_of_week INTEGER NOT NULL,  -- 0 = Sunday, 1 = Monday, ... 6 = Saturday
  time_slot INTEGER NOT NULL,    -- 0-95 (15-minute intervals: 0 = 00:00-00:14, 1 = 00:15-00:29, etc.)
  FOREIGN KEY (message_id) REFERENCES messages(id) ON DELETE CASCADE
);

-- Index for efficient querying by day and time slot
CREATE INDEX IF NOT EXISTS idx_motion_logs_day_slot ON motion_display_logs(day_of_week, time_slot);

-- Index for querying by date range
CREATE INDEX IF NOT EXISTS idx_motion_logs_displayed_at ON motion_display_logs(displayed_at);
