-- Add night time settings
INSERT OR IGNORE INTO settings (key, value) VALUES ('night_start', '22:00');
INSERT OR IGNORE INTO settings (key, value) VALUES ('night_end', '07:00');

-- Add display_mode column to messages (daytime, nighttime, both)
ALTER TABLE messages ADD COLUMN display_mode TEXT DEFAULT 'both';

-- Add motion_activated column to messages (0 = normal, 1 = motion activated)
ALTER TABLE messages ADD COLUMN motion_activated INTEGER DEFAULT 0;
