import db from './db.js';
import { hostname } from 'os';

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
    INSERT INTO messages (text, color, enabled, flash, order_index, time_start, time_end, days)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const result = stmt.run(
    data.text,
    data.color || '#FFFFFF',
    data.enabled !== undefined ? data.enabled : 1,
    data.flash || 0,
    nextOrder,
    data.time_start || '00:00',
    data.time_end || '23:59',
    data.days || 'Mon,Tue,Wed,Thu,Fri,Sat,Sun'
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
    INSERT INTO messages (text, color, enabled, flash, order_index, time_start, time_end, days)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
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
      msg.days || 'Mon,Tue,Wed,Thu,Fri,Sat,Sun'
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

// Get active messages with call throttle check
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

        return [{
          id: -1,
          text: throttleMessage,
          color: '#FFFFFF',
          enabled: 1,
          flash: 0,
          order_index: 0,
          time_start: '00:00',
          time_end: '23:59',
          days: 'Mon,Tue,Wed,Thu,Fri,Sat,Sun'
        }];
      }
    }
  }

  // Return normal active messages
  return getActiveMessages();
}
