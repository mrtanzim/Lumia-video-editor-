const express = require('express');
const db = require('../db');
const { v4: uuidv4 } = require('uuid');

const router = express.Router();

// Get all projects
router.get('/', (req, res) => {
    const rows = db.prepare('SELECT id, name, lastModified FROM projects ORDER BY lastModified DESC').all();
    res.json(rows);
});

// Get project by ID
router.get('/:id', (req, res) => {
    const row = db.prepare('SELECT * FROM projects WHERE id = ?').get(req.params.id);
    if (row) {
        res.json({ ...row, data: JSON.parse(row.data) });
    } else {
        res.status(404).json({ error: 'Project not found' });
    }
});

// Save or Create project
router.post('/', (req, res) => {
    const { id, name, tracks, currentTime, duration, width, height, fps, lastModified } = req.body;
    const projectId = id || uuidv4();
    const data = JSON.stringify({ tracks, currentTime, duration, width, height, fps });

    const stmt = db.prepare(`
    INSERT INTO projects (id, name, data, lastModified)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      name = excluded.name,
      data = excluded.data,
      lastModified = excluded.lastModified
  `);

    stmt.run(projectId, name, data, lastModified || Date.now());
    res.json({ id: projectId, status: 'saved' });
});

// Delete project
router.delete('/:id', (req, res) => {
    db.prepare('DELETE FROM projects WHERE id = ?').run(req.params.id);
    res.json({ status: 'deleted' });
});

// Settings routes
router.get('/settings', (req, res) => {
    const row = db.prepare('SELECT value FROM settings WHERE key = ?').get('user_settings');
    if (row) {
        res.json(JSON.parse(row.value));
    } else {
        res.status(404).json({ error: 'Settings not found' });
    }
});

router.post('/settings', (req, res) => {
    const settings = JSON.stringify(req.body);
    const stmt = db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)');
    stmt.run('user_settings', settings);
    res.json({ status: 'saved' });
});

module.exports = router;
