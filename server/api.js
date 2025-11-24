import db from './db.js';
import { hostname } from 'os';
import { EventEmitter } from 'events';

// Event emitter for broadcasting state changes to SSE clients
export const stateEvents = new EventEmitter();

const ANSWERBOT_API_URL = 'https://answerbot-4j5vug.fly.dev:3002/api/v1';

// Get all messages
export function getAllMessages() {
  return db.prepare('SELECT * FROM messages ORDER BY order_index ASC').all();
}

// Get active messages (filtered by time and day)
export function getActiveMessages() {
  const now = new Date();
  const currentDay = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][now.getDay()];
  const currentTime = now.toTimeString().slice(0, 5); // HH:MM format

  const allMessages = getAllMessages();

  return allMessages.filter(msg => {
    if (!msg.enabled) return false;

    // Check if current day is in the message's allowed days
    const allowedDays = msg.days.split(',');
    if (!allowedDays.includes(currentDay)) return false;

    // Check if current time is within the message's time range
    if (currentTime < msg.time_start || currentTime > msg.time_end) return false;

    return true;
  });
}

// Create a new message
export function createMessage(data) {
  const maxOrder = db.prepare('SELECT MAX(order_index) as max FROM messages').get();
  const nextOrder = (maxOrder.max || 0) + 1;

  const stmt = db.prepare(`
    INSERT INTO messages (text, color, enabled, flash, order_index, time_start, time_end, days, display_mode, motion_activated)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const result = stmt.run(
    data.text,
    data.color || '#FFFFFF',
    data.enabled !== undefined ? data.enabled : 1,
    data.flash || 0,
    nextOrder,
    data.time_start || '00:00',
    data.time_end || '23:59',
    data.days || 'Mon,Tue,Wed,Thu,Fri,Sat,Sun',
    data.display_mode || 'both',
    data.motion_activated || 0
  );

  return { id: result.lastInsertRowid };
}

// Update a message
export function updateMessage(id, data) {
  const fields = [];
  const values = [];

  if (data.text !== undefined) {
    fields.push('text = ?');
    values.push(data.text);
  }
  if (data.color !== undefined) {
    fields.push('color = ?');
    values.push(data.color);
  }
  if (data.enabled !== undefined) {
    fields.push('enabled = ?');
    values.push(data.enabled);
  }
  if (data.flash !== undefined) {
    fields.push('flash = ?');
    values.push(data.flash);
  }
  if (data.time_start !== undefined) {
    fields.push('time_start = ?');
    values.push(data.time_start);
  }
  if (data.time_end !== undefined) {
    fields.push('time_end = ?');
    values.push(data.time_end);
  }
  if (data.days !== undefined) {
    fields.push('days = ?');
    values.push(data.days);
  }
  if (data.display_mode !== undefined) {
    fields.push('display_mode = ?');
    values.push(data.display_mode);
  }
  if (data.motion_activated !== undefined) {
    fields.push('motion_activated = ?');
    values.push(data.motion_activated);
  }

  if (fields.length === 0) return;

  values.push(id);
  const stmt = db.prepare(`UPDATE messages SET ${fields.join(', ')} WHERE id = ?`);
  stmt.run(...values);
}

// Delete a message
export function deleteMessage(id) {
  db.prepare('DELETE FROM messages WHERE id = ?').run(id);
}

// Reorder messages
export function reorderMessages(orderedIds) {
  const stmt = db.prepare('UPDATE messages SET order_index = ? WHERE id = ?');

  orderedIds.forEach((id, index) => {
    stmt.run(index, id);
  });
}

// Backup functions
export function shouldPromptBackup() {
  const lastPrompt = db.prepare('SELECT last_prompted FROM backup_prompts ORDER BY id DESC LIMIT 1').get();

  if (!lastPrompt) {
    return true;
  }

  const lastPromptDate = new Date(lastPrompt.last_prompted);
  const now = new Date();
  const hoursDiff = (now - lastPromptDate) / (1000 * 60 * 60);

  return hoursDiff >= 24;
}

export function recordBackupPrompt() {
  db.prepare('INSERT INTO backup_prompts (last_prompted) VALUES (CURRENT_TIMESTAMP)').run();
}

export function getBackupData() {
  const messages = getAllMessages();
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
  const host = hostname();

  return {
    filename: `backup_${host}_${timestamp}.json`,
    data: {
      version: 1,
      exported_at: new Date().toISOString(),
      hostname: host,
      messages
    }
  };
}

export function restoreFromBackup(backupData) {
  if (!backupData.messages || !Array.isArray(backupData.messages)) {
    throw new Error('Invalid backup data format');
  }

  // Clear existing messages
  db.prepare('DELETE FROM messages').run();

  // Insert messages from backup
  const stmt = db.prepare(`
    INSERT INTO messages (text, color, enabled, flash, order_index, time_start, time_end, days, display_mode, motion_activated)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  backupData.messages.forEach(msg => {
    stmt.run(
      msg.text,
      msg.color || '#FFFFFF',
      msg.enabled !== undefined ? msg.enabled : 1,
      msg.flash || 0,
      msg.order_index || 0,
      msg.time_start || '00:00',
      msg.time_end || '23:59',
      msg.days || 'Mon,Tue,Wed,Thu,Fri,Sat,Sun',
      msg.display_mode || 'both',
      msg.motion_activated || 0
    );
  });
}

// Settings functions
export function getAllSettings() {
  const rows = db.prepare('SELECT key, value FROM settings').all();
  const settings = {};
  rows.forEach(row => {
    settings[row.key] = row.value;
  });
  return settings;
}

export function getSetting(key) {
  const row = db.prepare('SELECT value FROM settings WHERE key = ?').get(key);
  return row ? row.value : null;
}

export function updateSetting(key, value) {
  db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)').run(key, value);
}

// Motion detection state (imported from pir.js if available)
let pirModule = null;
try {
  pirModule = await import('./pir.js');
} catch (error) {
  console.log('PIR module not available:', error.message);
}

// Screen control (for Pi Touch Display 2)
let screenModule = null;
try {
  screenModule = await import('./screen.js');
} catch (error) {
  console.log('Screen module not available:', error.message);
}

// Register motion callback to immediately turn on screen
if (pirModule && screenModule) {
  pirModule.onMotion(() => {
    // Turn on screen unless motion detection is explicitly disabled
    const motionEnabled = getSetting('motion_enabled');
    if (motionEnabled !== '0' && motionEnabled !== 0) {
      console.log('Motion detected - turning screen on immediately');
      screenModule.screenOn();
      // Emit event so SSE can notify browser immediately
      stateEvents.emit('screenWake', { screenOff: false, motionDetected: true });
    }
  });
}

export function controlScreen(turnOn) {
  if (screenModule) {
    if (turnOn) {
      screenModule.screenOn();
    } else {
      screenModule.screenOff();
    }
  }
}

export function isScreenOff() {
  if (screenModule) {
    return screenModule.isScreenOff();
  }
  return false;
}

export function isMotionDetected() {
  if (pirModule) {
    return pirModule.isMotionDetected();
  }
  return true; // Default to true if no sensor
}

export function getLastMotionTime() {
  if (pirModule) {
    return pirModule.getLastMotionTime();
  }
  return null;
}

export function isPirAvailable() {
  if (pirModule) {
    return pirModule.isPirAvailable();
  }
  return false;
}

export function setMotionDetected(state) {
  if (pirModule) {
    pirModule.setMotionDetected(state);
  }
}

// Log when a motion-activated message is displayed
export function logMotionDisplay(messageId) {
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0 = Sunday, 6 = Saturday
  const hours = now.getHours();
  const minutes = now.getMinutes();
  const timeSlot = hours * 4 + Math.floor(minutes / 15); // 0-95

  db.prepare(`
    INSERT INTO motion_display_logs (message_id, day_of_week, time_slot)
    VALUES (?, ?, ?)
  `).run(messageId, dayOfWeek, timeSlot);
}

// Get motion display grid data for visualization
// Returns aggregated data: for each day/time slot, count of displays
export function getMotionDisplayGrid(weeksBack = 4) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - (weeksBack * 7));

  const rows = db.prepare(`
    SELECT day_of_week, time_slot, COUNT(*) as count
    FROM motion_display_logs
    WHERE displayed_at >= ?
    GROUP BY day_of_week, time_slot
  `).all(cutoffDate.toISOString());

  // Build a grid: 7 days x 96 time slots
  const grid = {};
  for (let day = 0; day < 7; day++) {
    grid[day] = {};
    for (let slot = 0; slot < 96; slot++) {
      grid[day][slot] = 0;
    }
  }

  // Fill in the counts
  for (const row of rows) {
    grid[row.day_of_week][row.time_slot] = row.count;
  }

  return grid;
}

// Get recent motion display logs with message info
export function getRecentMotionDisplayLogs(limit = 100) {
  return db.prepare(`
    SELECT
      l.id,
      l.message_id,
      l.displayed_at,
      l.day_of_week,
      l.time_slot,
      m.text as message_text
    FROM motion_display_logs l
    LEFT JOIN messages m ON l.message_id = m.id
    ORDER BY l.displayed_at DESC
    LIMIT ?
  `).all(limit);
}

// Check if it's currently night time based on settings
export function isNightTime() {
  const nightStart = getSetting('night_start') || '22:00';
  const nightEnd = getSetting('night_end') || '07:00';
  const now = new Date();
  const currentTime = now.toTimeString().slice(0, 5); // HH:MM format

  // Handle overnight periods (e.g., 22:00 to 07:00)
  if (nightStart > nightEnd) {
    // Night spans midnight
    return currentTime >= nightStart || currentTime < nightEnd;
  } else {
    // Night doesn't span midnight (unusual but handle it)
    return currentTime >= nightStart && currentTime < nightEnd;
  }
}

// Check for recent calls from AnswerBot API
async function checkRecentCalls() {
  const apiKey = process.env.ANSWERBOT_API_KEY;
  if (!apiKey) {
    console.error('ANSWERBOT_API_KEY not configured');
    return null;
  }

  try {
    const response = await fetch(`${ANSWERBOT_API_URL}/calls/recent?limit=1`, {
      headers: {
        'Authorization': `Bearer ${apiKey}`
      }
    });

    if (!response.ok) {
      console.error('Failed to fetch recent calls:', response.status);
      return null;
    }

    const data = await response.json();
    if (data.success && data.calls && data.calls.length > 0) {
      return data.calls[0];
    }

    return null;
  } catch (error) {
    console.error('Error checking recent calls:', error);
    return null;
  }
}

// Track logged motion displays to avoid duplicate logging within the same time slot
const loggedMotionDisplays = new Map(); // key: "messageId-dayOfWeek-timeSlot", value: timestamp

// Get active messages with call throttle, night mode, and motion detection
export async function getActiveMessagesWithThrottle() {
  const throttleEnabled = getSetting('call_throttle_enabled') === '1';

  if (throttleEnabled) {
    const throttleMinutes = parseInt(getSetting('call_throttle_minutes') || '30');
    const recentCall = await checkRecentCalls();

    if (recentCall && recentCall.call_start_time) {
      const callTime = new Date(recentCall.call_start_time);
      const now = new Date();
      const minutesAgo = (now - callTime) / (1000 * 60);

      if (minutesAgo <= throttleMinutes) {
        // Return throttle message instead of regular messages
        const throttleMessage = getSetting('call_throttle_message') ||
          'You called Edward a few minutes ago - please wait a bit before calling again';

        return {
          messages: [{
            id: -1,
            text: throttleMessage,
            color: '#FFFFFF',
            enabled: 1,
            flash: 0,
            order_index: 0,
            time_start: '00:00',
            time_end: '23:59',
            days: 'Mon,Tue,Wed,Thu,Fri,Sat,Sun',
            display_mode: 'both',
            motion_activated: 0
          }],
          isNightTime: isNightTime(),
          motionDetected: isMotionDetected()
        };
      }
    }
  }

  // Get base active messages (filtered by time and day)
  const baseMessages = getActiveMessages();
  const nightTime = isNightTime();
  const motionDetected = isMotionDetected();

  // Filter messages based on display mode and motion
  const filteredMessages = baseMessages.filter(msg => {
    // Check display mode (daytime/nighttime/both)
    const displayMode = msg.display_mode || 'both';
    if (displayMode === 'daytime' && nightTime) return false;
    if (displayMode === 'nighttime' && !nightTime) return false;

    // Check motion activation
    // Normal messages (motion_activated = 0) always display
    // Motion-activated messages only display when motion is detected
    if (msg.motion_activated && !motionDetected) return false;

    return true;
  });

  // Log motion-activated messages that are being displayed (once per time slot)
  const now = new Date();
  const dayOfWeek = now.getDay();
  const hours = now.getHours();
  const minutes = now.getMinutes();
  const timeSlot = hours * 4 + Math.floor(minutes / 15);

  for (const msg of filteredMessages) {
    if (msg.motion_activated && motionDetected) {
      const key = `${msg.id}-${dayOfWeek}-${timeSlot}`;
      if (!loggedMotionDisplays.has(key)) {
        logMotionDisplay(msg.id);
        loggedMotionDisplays.set(key, Date.now());

        // Clean up old entries (older than 1 hour)
        const oneHourAgo = Date.now() - 3600000;
        for (const [k, v] of loggedMotionDisplays.entries()) {
          if (v < oneHourAgo) {
            loggedMotionDisplays.delete(k);
          }
        }
      }
    }
  }

  // Control screen based on night time and messages
  const shouldScreenBeOff = nightTime && filteredMessages.length === 0;
  controlScreen(!shouldScreenBeOff);

  return {
    messages: filteredMessages,
    isNightTime: nightTime,
    motionDetected: motionDetected,
    screenOff: shouldScreenBeOff
  };
}
