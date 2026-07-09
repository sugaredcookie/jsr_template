const express = require('express');
const router = express.Router();
const datasourceController = require('../controllers/datasourceController');
const multer = require('multer');

// Configure multer for memory storage
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 10 * 1024 * 1024
    },
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
            cb(null, true);
        } else {
            cb(new Error('Only CSV files are allowed'), false);
        }
    }
});

// Get datasource configuration
router.get('/:projectId/datasource', datasourceController.getDatasourceConfig);

// Get datasource status
router.get('/:projectId/datasource/status', datasourceController.getDatasourceStatus);

// Update datasource configuration
router.put('/:projectId/datasource', datasourceController.updateDatasourceConfig);

// Configure local device datasource
router.post('/:projectId/datasource/local', datasourceController.configureLocal);


// Test database connection
router.post('/:projectId/datasource/database/test', datasourceController.testDatabaseConnection);

// Get database tables - uses query param for filePath
router.get('/:projectId/datasource/database/tables', datasourceController.getDatabaseTables);

// Configure database
router.post('/:projectId/datasource/database', datasourceController.configureDatabase);


// Upload CSV file
router.post('/:projectId/upload', upload.single('csv'), datasourceController.uploadCSV);

// Get project data
router.get('/:projectId/data', datasourceController.getProjectData);

module.exports = router;