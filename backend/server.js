// PhotoShare Backend Server for Azure App Service
const express = require('express');
const cors = require('cors');
const path = require('path');
const multer = require('multer');
require('dotenv').config();

// Configure multer for memory storage (files stored in buffer)
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed'), false);
        }
    }
});

// Import API routes
const authLoginHandler = require('./functions/auth-login');
const authRegisterHandler = require('./functions/auth-register');
const photosListHandler = require('./functions/photos-list');
const photoGetHandler = require('./functions/photo-get');
const photoCreateHandler = require('./functions/photo-create');
const photoUpdateHandler = require('./functions/photo-update');
const photoDeleteHandler = require('./functions/photo-delete');
const photoLikeHandler = require('./functions/photo-like');
const commentAddHandler = require('./functions/comment-add');
const commentDeleteHandler = require('./functions/comment-delete');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
    origin: [
        'https://scalablemediastorage.z28.web.core.windows.net',
        'https://scalable-photo-app.azurewebsites.net',
        'http://localhost:3000',
        'http://localhost:5173'
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: false
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'healthy', timestamp: new Date() });
});

// API Routes - Wrap Azure Functions for Express
// Auth endpoints
app.post('/api/auth/login', createExpressHandler(authLoginHandler.handler));
app.post('/api/auth/register', createExpressHandler(authRegisterHandler.handler));

// Photo endpoints
app.get('/api/photos', createExpressHandler(photosListHandler.handler));
app.get('/api/photos/:id', createExpressHandler(photoGetHandler.handler));
app.post('/api/photos', upload.single('photo'), createExpressHandler(photoCreateHandler.handler));
app.put('/api/photos/:id', createExpressHandler(photoUpdateHandler.handler));
app.delete('/api/photos/:id', createExpressHandler(photoDeleteHandler.handler));

// Interaction endpoints
app.post('/api/photos/:id/like', createExpressHandler(photoLikeHandler.handler));
app.post('/api/photos/:id/comment', createExpressHandler(commentAddHandler.handler));
app.delete('/api/comments/:id', createExpressHandler(commentDeleteHandler.handler));

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Not Found' });
});

// Error handler
app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).json({ error: 'Internal Server Error' });
});

// Wrapper to convert Azure Function handlers to Express middleware
function createExpressHandler(handler) {
    return async (req, res, next) => {
        if (typeof handler !== 'function') {
            console.error('Handler is not a function for path', req.path);
            return res.status(500).json({ error: 'Internal Server Error' });
        }
        try {
            const context = {
                log: console.log,
                error: console.error,
                warn: console.warn,
                debug: console.debug,
            };

            // Build absolute URL so handlers using new URL() do not throw
            const fullUrl = (() => {
                const proto = req.get('x-forwarded-proto') || req.protocol || 'http';
                const host = req.get('host');
                const path = req.originalUrl || req.url;
                return host ? `${proto}://${host}${path}` : path;
            })();

            // Normalize request to mimic Azure Functions request
            const request = {
                method: req.method,
                url: fullUrl,
                headers: {
                    get: (name) => req.get(name)
                },
                query: req.query,
                params: req.params,
                body: req.body,
                json: async () => req.body,
                text: async () => (typeof req.body === 'string' ? req.body : JSON.stringify(req.body || {})),
                // Provide file data from multer if available
                file: req.file || null
            };

            const result = await handler(request, context);

            if (result) {
                res.status(result.status || 200).json(result.jsonBody || result);
            } else {
                res.status(200).end();
            }
        } catch (error) {
            console.error('Handler error:', error);
            next(error);
        }
    };
}

// Start server
app.listen(PORT, () => {
    console.log(`PhotoShare Backend running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`Health check: http://localhost:${PORT}/health`);
});

module.exports = app;
