// PhotoShare Backend Server for Azure App Service
const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

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
app.use(cors());
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
app.post('/api/photos', createExpressHandler(photoCreateHandler.handler));
app.put('/api/photos/:id', createExpressHandler(photoUpdateHandler.handler));
app.delete('/api/photos/:id', createExpressHandler(photoDeleteHandler.handler));

// Interaction endpoints
app.post('/api/photos/:id/like', createExpressHandler(photoLikeHandler.handler));
app.post('/api/photos/:id/comment', createExpressHandler(commentAddHandler.handler));
app.delete('/api/comments/:id', createExpressHandler(commentDeleteHandler.handler));

// Serve static frontend files
app.use(express.static(path.join(__dirname, '../frontend')));

// Fallback to index.html for SPA
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

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
        try {
            // Create a mock context object similar to Azure Functions
            const context = {
                log: console.log,
                error: console.error,
                warn: console.warn,
                debug: console.debug,
            };

            // Call the Azure Function handler
            const result = await handler(req, context);

            // Send the response
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
