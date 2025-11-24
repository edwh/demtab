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

adminApp.use(express.static(join(__dirname, '../admin/.output/public')));
adminApp.get('*', (req, res) => {
  res.sendFile(join(__dirname, '../admin/.output/public/index.html'));
});

// Display app - serves on port 80
const displayApp = express();
displayApp.use(cors());

// Only need active messages endpoint for display
displayApp.get('/api/messages/active', async (req, res) => {
  try {
    const messages = await api.getActiveMessagesWithThrottle();
    res.json(messages);
  } catch (error) {
    console.error('Error getting active messages:', error);
    res.status(500).json({ error: 'Failed to get active messages' });
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
