const express = require('express');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');

// Load env vars
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '1024mb' }));
app.use(express.urlencoded({ limit: '1024mb', extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
const projectRoutes = require('./routes/projects');
const assetRoutes = require('./routes/assets');
const aiRoutes = require('./routes/ai');

// Request Logger
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});

app.use('/api/projects', projectRoutes);
app.use('/api/assets', assetRoutes);
app.use('/api/ai', aiRoutes);

// Global Error Handler
app.use((err, req, res, next) => {
    console.error('!!! SERVER ERROR !!!');
    console.error('Stack:', err.stack);
    res.status(500).json({
        error: 'Internal Server Error',
        message: err.message,
        details: err.code || 'No code'
    });
});

app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
});

const server = app.listen(PORT, () => {
    console.log(`Lumina Backend running on http://localhost:${PORT}`);
});

// Increase timeout for large file uploads (10 minutes)
server.timeout = 600000;

// Termination Logging
process.on('SIGINT', () => {
    console.warn('!!! SIGINT RECEIVED - Server shutting down');
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.warn('!!! SIGTERM RECEIVED - Server shutting down');
    process.exit(0);
});

module.exports = app;
