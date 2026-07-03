require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const reportRoutes = require('./routes/reportRoutes');
const projectRoutes = require('./routes/projectRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
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
        'reports',
        'logs',
        'data'
    ];
    
    dirs.forEach(dir => {
        const dirPath = path.join(__dirname, dir);
        if (!fs.existsSync(dirPath)) {
            fs.mkdirSync(dirPath, { recursive: true });
        }
    });
};

createDirectories();

// Routes
app.use('/api/projects', projectRoutes);
app.use('/api/reports', reportRoutes);

// Root endpoint
app.get('/', (req, res) => {
    res.json({
        name: 'Report Management API',
        version: '2.0.0',
        endpoints: {
            projects: '/api/projects',
            reports: '/api/reports',
            datasource: '/api/projects/:projectId/data',
            upload: '/api/projects/:projectId/upload'
        }
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err.stack);
    res.status(500).json({
        error: 'Something went wrong!',
        message: err.message
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📊 Report Management API Running`);
});