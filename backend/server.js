require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const reportRoutes = require('./routes/reportRoutes');
const projectRoutes = require('./routes/projectRoutes');
const datasourceRoutes = require('./routes/datasourceRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
    origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:3000'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/storage', express.static(path.join(__dirname, 'storage')));

// Ensure required directories exist
const createDirectories = () => {
    const dirs = [
        'storage/projects',
        'uploads',
        'logs',
        'data'
    ];
    
    dirs.forEach(dir => {
        const dirPath = path.join(__dirname, dir);
        if (!fs.existsSync(dirPath)) {
            console.log(`📁 Creating directory: ${dirPath}`);
            fs.mkdirSync(dirPath, { recursive: true });
        }
    });
};

createDirectories();

// Routes - ORDER MATTERS! Put more specific routes first
app.use('/api/projects', projectRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api', datasourceRoutes);

// Root endpoint
app.get('/', (req, res) => {
    res.json({
        name: 'Report Management API',
        version: '2.0.0',
        endpoints: {
            projects: '/api/projects',
            reports: '/api/reports',
            datasource: '/api/:projectId/datasource',
            upload: '/api/:projectId/upload',
            data: '/api/:projectId/data',
            templates: '/api/projects/:projectId/templates'
        }
    });
});

// 404 handler - Must be after all routes
app.use((req, res) => {
    console.log(`❌ Route not found: ${req.method} ${req.url}`);
    res.status(404).json({
        error: 'Route not found',
        method: req.method,
        path: req.url,
        message: `The endpoint ${req.method} ${req.url} does not exist`
    });
});

// Error handling middleware - Must be last
app.use((err, req, res, next) => {
    console.error('❌ Error:', err.stack);
    res.status(500).json({
        error: 'Internal Server Error',
        message: err.message,
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`\n🚀 Server running on port ${PORT}`);
    console.log(`📍 http://localhost:${PORT}`);
    console.log(`📁 Storage path: ${path.join(__dirname, 'storage', 'projects')}`);
    console.log('\n📋 Available routes:');
    console.log(`  GET  /api/projects`);
    console.log(`  POST /api/projects`);
    console.log(`  GET  /api/projects/:id`);
    console.log(`  PUT  /api/projects/:id`);
    console.log(`  DELETE /api/projects/:id`);
    console.log(`  GET  /api/projects/:id/templates`);
    console.log(`  POST /api/projects/:id/templates`);
    console.log(`  GET  /api/projects/:id/templates/:tid`);
    console.log(`  PUT  /api/projects/:id/templates/:tid`);
    console.log(`  DELETE /api/projects/:id/templates/:tid`);
    console.log(`  GET  /api/reports/:id/reports`);
    console.log(`  POST /api/reports/html`);
    console.log(`  POST /api/reports/pdf`);
    console.log(`  POST /api/reports/preview`);
    console.log(`  GET  /api/:id/datasource`);
    console.log(`  PUT  /api/:id/datasource`);
    console.log(`  POST /api/:id/upload`);
    console.log(`  GET  /api/:id/data\n`);
});