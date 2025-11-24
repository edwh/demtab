import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import * as api from './api.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();

app.use(cors());
app.use(express.json());

// API Routes
app.get('/api/messages', (req, res) => {
  try {
    const messages = api.getAllMessages();
    res.json(messages);
  } catch (error) {
    console.error('Error getting messages:', error);
    res.status(500).json({ error: 'Failed to get messages' });
  }
});

app.get('/api/messages/active', async (req, res) => {
  try {
    const messages = await api.getActiveMessagesWithThrottle();
    res.json(messages);
  } catch (error) {
    console.error('Error getting active messages:', error);
    res.status(500).json({ error: 'Failed to get active messages' });
  }
});

app.post('/api/messages', (req, res) => {
  try {
    const result = api.createMessage(req.body);
    res.json(result);
  } catch (error) {
    console.error('Error creating message:', error);
    res.status(500).json({ error: 'Failed to create message' });
  }
});

app.put('/api/messages/:id', (req, res) => {
  try {
    api.updateMessage(parseInt(req.params.id), req.body);
    res.json({ success: true });
  } catch (error) {
    console.error('Error updating message:', error);
    res.status(500).json({ error: 'Failed to update message' });
  }
});

app.delete('/api/messages/:id', (req, res) => {
  try {
    api.deleteMessage(parseInt(req.params.id));
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting message:', error);
    res.status(500).json({ error: 'Failed to delete message' });
  }
});

app.post('/api/messages/reorder', (req, res) => {
  try {
    api.reorderMessages(req.body.orderedIds);
    res.json({ success: true });
  } catch (error) {
    console.error('Error reordering messages:', error);
    res.status(500).json({ error: 'Failed to reorder messages' });
  }
});

app.get('/api/settings', (req, res) => {
  try {
    const settings = api.getAllSettings();
    res.json(settings);
  } catch (error) {
    console.error('Error getting settings:', error);
    res.status(500).json({ error: 'Failed to get settings' });
  }
});

app.put('/api/settings', (req, res) => {
  try {
    Object.keys(req.body).forEach(key => {
      api.updateSetting(key, String(req.body[key]));
    });
    res.json({ success: true });
  } catch (error) {
    console.error('Error updating settings:', error);
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

app.get('/api/backup/should-prompt', (req, res) => {
  try {
    const shouldPrompt = api.shouldPromptBackup();
    res.json({ shouldPrompt });
  } catch (error) {
    console.error('Error checking backup prompt:', error);
    res.status(500).json({ error: 'Failed to check backup prompt' });
  }
});

app.post('/api/backup/record-prompt', (req, res) => {
  try {
    api.recordBackupPrompt();
    res.json({ success: true });
  } catch (error) {
    console.error('Error recording backup prompt:', error);
    res.status(500).json({ error: 'Failed to record backup prompt' });
  }
});

app.get('/api/backup/download', (req, res) => {
  try {
    const { filename, data } = api.getBackupData();
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.json(data);
  } catch (error) {
    console.error('Error generating backup:', error);
    res.status(500).json({ error: 'Failed to generate backup' });
  }
});

app.post('/api/backup/restore', (req, res) => {
  try {
    api.restoreFromBackup(req.body);
    res.json({ success: true });
  } catch (error) {
    console.error('Error restoring backup:', error);
    res.status(500).json({ error: error.message || 'Failed to restore backup' });
  }
});

// Admin app - serves on port 8080
const adminApp = express();
adminApp.use(cors());
adminApp.use(express.json());

// API routes for admin app
adminApp.get('/api/messages', (req, res) => {
  try {
    const messages = api.getAllMessages();
    res.json(messages);
  } catch (error) {
    console.error('Error getting messages:', error);
    res.status(500).json({ error: 'Failed to get messages' });
  }
});

adminApp.post('/api/messages', (req, res) => {
  try {
    const result = api.createMessage(req.body);
    res.json(result);
  } catch (error) {
    console.error('Error creating message:', error);
    res.status(500).json({ error: 'Failed to create message' });
  }
});

adminApp.put('/api/messages/:id', (req, res) => {
  console.log('Update request for id:', req.params.id, 'body:', req.body);
  try {
    api.updateMessage(parseInt(req.params.id), req.body);
    console.log('Update successful');
    res.json({ success: true });
  } catch (error) {
    console.error('Error updating message:', error);
    res.status(500).json({ error: 'Failed to update message' });
  }
});

adminApp.delete('/api/messages/:id', (req, res) => {
  try {
    api.deleteMessage(parseInt(req.params.id));
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting message:', error);
    res.status(500).json({ error: 'Failed to delete message' });
  }
});

adminApp.post('/api/messages/reorder', (req, res) => {
  try {
    api.reorderMessages(req.body.orderedIds);
    res.json({ success: true });
  } catch (error) {
    console.error('Error reordering messages:', error);
    res.status(500).json({ error: 'Failed to reorder messages' });
  }
});

adminApp.get('/api/settings', (req, res) => {
  try {
    const settings = api.getAllSettings();
    res.json(settings);
  } catch (error) {
    console.error('Error getting settings:', error);
    res.status(500).json({ error: 'Failed to get settings' });
  }
});

adminApp.put('/api/settings', (req, res) => {
  try {
    Object.keys(req.body).forEach(key => {
      api.updateSetting(key, String(req.body[key]));
    });
    res.json({ success: true });
  } catch (error) {
    console.error('Error updating settings:', error);
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

adminApp.get('/api/backup/should-prompt', (req, res) => {
  try {
    const shouldPrompt = api.shouldPromptBackup();
    res.json({ shouldPrompt });
  } catch (error) {
    console.error('Error checking backup prompt:', error);
    res.status(500).json({ error: 'Failed to check backup prompt' });
  }
});

adminApp.post('/api/backup/record-prompt', (req, res) => {
  try {
    api.recordBackupPrompt();
    res.json({ success: true });
  } catch (error) {
    console.error('Error recording backup prompt:', error);
    res.status(500).json({ error: 'Failed to record backup prompt' });
  }
});

adminApp.get('/api/backup/download', (req, res) => {
  try {
    const { filename, data } = api.getBackupData();
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.json(data);
  } catch (error) {
    console.error('Error generating backup:', error);
    res.status(500).json({ error: 'Failed to generate backup' });
  }
});

adminApp.post('/api/backup/restore', (req, res) => {
  try {
    api.restoreFromBackup(req.body);
    res.json({ success: true });
  } catch (error) {
    console.error('Error restoring backup:', error);
    res.status(500).json({ error: error.message || 'Failed to restore backup' });
  }
});

// Motion status endpoint for admin (same as display)
adminApp.get('/api/motion', (req, res) => {
  try {
    res.json({
      pirAvailable: api.isPirAvailable(),
      motionDetected: api.isMotionDetected(),
      lastMotionTime: api.getLastMotionTime(),
      isNightTime: api.isNightTime()
    });
  } catch (error) {
    console.error('Error getting motion status:', error);
    res.status(500).json({ error: 'Failed to get motion status' });
  }
});

// Motion display grid data for visualization
adminApp.get('/api/motion/grid', (req, res) => {
  try {
    const weeksBack = parseInt(req.query.weeks) || 4;
    const grid = api.getMotionDisplayGrid(weeksBack);
    res.json(grid);
  } catch (error) {
    console.error('Error getting motion display grid:', error);
    res.status(500).json({ error: 'Failed to get motion display grid' });
  }
});

// Recent motion display logs
adminApp.get('/api/motion/logs', (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 100;
    const logs = api.getRecentMotionDisplayLogs(limit);
    res.json(logs);
  } catch (error) {
    console.error('Error getting motion display logs:', error);
    res.status(500).json({ error: 'Failed to get motion display logs' });
  }
});

adminApp.use(express.static(join(__dirname, '../admin/.output/public')));
adminApp.get('*', (req, res) => {
  res.sendFile(join(__dirname, '../admin/.output/public/index.html'));
});

// Display app - serves on port 80
const displayApp = express();
displayApp.use(cors());

// SSE clients for real-time updates
const sseClients = new Set();

// SSE endpoint for real-time screen state updates
displayApp.get('/api/events', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  // Send initial connection message
  res.write('data: {"connected":true}\n\n');

  // Add client to set
  sseClients.add(res);
  console.log(`SSE client connected (total: ${sseClients.size})`);

  // Remove client on disconnect
  req.on('close', () => {
    sseClients.delete(res);
    console.log(`SSE client disconnected (total: ${sseClients.size})`);
  });
});

// Listen for screen wake events and broadcast to all SSE clients
api.stateEvents.on('screenWake', (data) => {
  const message = `data: ${JSON.stringify(data)}\n\n`;
  for (const client of sseClients) {
    client.write(message);
  }
  console.log(`Broadcast screenWake to ${sseClients.size} clients`);
});

// Active messages endpoint for display (with night mode and motion state)
displayApp.get('/api/messages/active', async (req, res) => {
  try {
    const result = await api.getActiveMessagesWithThrottle();
    res.json(result);
  } catch (error) {
    console.error('Error getting active messages:', error);
    res.status(500).json({ error: 'Failed to get active messages' });
  }
});

// Motion status endpoint
displayApp.get('/api/motion', (req, res) => {
  try {
    res.json({
      pirAvailable: api.isPirAvailable(),
      motionDetected: api.isMotionDetected(),
      lastMotionTime: api.getLastMotionTime(),
      isNightTime: api.isNightTime()
    });
  } catch (error) {
    console.error('Error getting motion status:', error);
    res.status(500).json({ error: 'Failed to get motion status' });
  }
});

// Simulate motion (for testing without actual PIR sensor)
displayApp.post('/api/motion/simulate', (req, res) => {
  try {
    api.setMotionDetected(true);
    res.json({ success: true, message: 'Motion simulated' });
  } catch (error) {
    console.error('Error simulating motion:', error);
    res.status(500).json({ error: 'Failed to simulate motion' });
  }
});

// Screen control endpoint
displayApp.post('/api/screen/:action', (req, res) => {
  try {
    const action = req.params.action;
    if (action === 'on') {
      api.controlScreen(true);
      res.json({ success: true, screenOn: true });
    } else if (action === 'off') {
      api.controlScreen(false);
      res.json({ success: true, screenOn: false });
    } else {
      res.status(400).json({ error: 'Invalid action. Use "on" or "off"' });
    }
  } catch (error) {
    console.error('Error controlling screen:', error);
    res.status(500).json({ error: 'Failed to control screen' });
  }
});

displayApp.get('/api/screen', (req, res) => {
  try {
    res.json({ screenOff: api.isScreenOff() });
  } catch (error) {
    console.error('Error getting screen status:', error);
    res.status(500).json({ error: 'Failed to get screen status' });
  }
});

displayApp.use(express.static(join(__dirname, '../display/.output/public')));
displayApp.get('*', (req, res) => {
  res.sendFile(join(__dirname, '../display/.output/public/index.html'));
});

// Start servers
adminApp.listen(8080, () => {
  console.log('Admin interface running on http://localhost:8080');
});

displayApp.listen(80, () => {
  console.log('Display interface running on http://localhost:80');
});
