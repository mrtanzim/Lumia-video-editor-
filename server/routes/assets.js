const express = require('express');
const multer = require('multer');
const path = require('path');
const db = require('../db');
const { v4: uuidv4 } = require('uuid');

const fs = require('fs');

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
        const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
        cb(null, uniqueName);
    }
});

const upload = multer({
    storage,
    limits: {
        fileSize: 1024 * 1024 * 1024 // 1GB limit for videos
    }
});
const router = express.Router();

// List assets
router.get('/', (req, res) => {
    try {
        // Prevent caching of the asset list
        res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
        const rows = db.prepare('SELECT * FROM assets ORDER BY createdAt DESC').all();
        res.json(rows);
    } catch (error) {
        console.error('Failed to list assets:', error);
        res.status(500).json({ error: 'Failed to fetch assets' });
    }
});

// Upload asset
router.post('/upload', (req, res) => {
    console.log('--- Start Upload Processing ---');
    const expectedSize = parseInt(req.get('X-Original-Size') || '0');
    let isAborted = false;

    req.on('aborted', () => {
        isAborted = true;
        console.warn('!!! Request was aborted by client');
    });

    upload.single('file')(req, res, (err) => {
        if (isAborted) {
            console.warn('!!! Ignoring upload processing because request was aborted');
            return; // Connection is already closed
        }

        if (err instanceof multer.MulterError) {
            console.error('!!! Multer Error during upload:', err);
            return res.status(400).json({ error: `Upload error: ${err.message}` });
        } else if (err) {
            console.error('!!! Unknown error during upload:', err);
            return res.status(500).json({ error: 'Internal server error during upload', details: err.message });
        }

        if (!req.file) {
            console.warn('!!! No file received in request');
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const { originalname, size, mimetype, filename, path: filePath } = req.file;

        // Verify file size if expectedSize was provided (with a small delay for disk flush)
        setTimeout(() => {
            try {
                const finalStats = fs.statSync(filePath);
                const finalSize = finalStats.size;

                if (expectedSize > 0 && finalSize < expectedSize) {
                    console.error(`!!! TRUNCATED UPLOAD: Final size ${finalSize} bytes, expected ${expectedSize}`);
                    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
                    return res.status(400).json({
                        error: 'Upload truncated',
                        message: 'The file was only partially uploaded. Please check your connection and try again.'
                    });
                }

                console.log(`File received & verified: ${originalname} -> ${filename} (${finalSize} bytes)`);

                const id = uuidv4();
                console.log('Saving to database...');
                const stmt = db.prepare(`
                    INSERT INTO assets (id, filename, path, type, size, createdAt)
                    VALUES (?, ?, ?, ?, ?, ?)
                `);

                stmt.run(id, originalname, `/uploads/${filename}`, mimetype, finalSize, Date.now());
                console.log('Database save successful');

                res.json({
                    id,
                    name: originalname,
                    src: `/uploads/${filename}`,
                    type: mimetype.startsWith('video') ? 'video' : (mimetype.startsWith('image') ? 'image' : 'audio'),
                    size: finalSize
                });
            } catch (dbError) {
                console.error('!!! Error during final asset processing:', dbError);
                if (!res.headersSent) {
                    res.status(500).json({ error: 'Failed to process asset', details: dbError.message });
                }
            }
        }, 500); // 500ms delay to ensure file is fully written on disk
    });
});

// Export history routes
router.get('/exports', (req, res) => {
    const rows = db.prepare('SELECT * FROM exports ORDER BY date DESC').all();
    res.json(rows);
});

router.post('/exports', (req, res) => {
    const { id, filename, format, resolution, size, duration, status, date } = req.body;
    const stmt = db.prepare(`
        INSERT INTO exports (id, filename, format, resolution, size, duration, status, date)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(id, filename, format, resolution, size, duration, status, date || Date.now());
    res.json({ status: 'saved' });
});

router.delete('/exports', (req, res) => {
    db.prepare('DELETE FROM exports').run();
    res.json({ status: 'cleared' });
});

module.exports = router;
