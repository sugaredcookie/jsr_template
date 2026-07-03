const express = require('express');
const router = express.Router();
const projectController = require('../controllers/projectController');
const reportController = require('../controllers/reportController');
const datasourceService = require('../services/datasourceService');
const multer = require('multer');
const path = require('path');

// Configure multer for memory storage
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit
    },
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
            cb(null, true);
        } else {
            cb(new Error('Only CSV files are allowed'), false);
        }
    }
});

// === PROJECT ENDPOINTS ===

// Get all projects
router.get('/', projectController.getAllProjects);

// Create new project
router.post('/', projectController.createProject);

// Get specific project
router.get('/:projectId', projectController.getProject);

// Update project
router.put('/:projectId', projectController.updateProject);

// Delete project
router.delete('/:projectId', projectController.deleteProject);

// === DATASOURCE ENDPOINTS ===

// Upload CSV for a project
router.post('/:projectId/upload', upload.single('csv'), async (req, res) => {
    try {
        const { projectId } = req.params;
        
        if (!req.file) {
            return res.status(400).json({ error: 'No CSV file uploaded' });
        }
        
        const result = await datasourceService.uploadCSV(
            projectId,
            req.file.originalname,
            req.file.buffer
        );
        
        // Clear cache for this project
        datasourceService.clearCache(projectId);
        
        res.json({
            success: true,
            message: 'CSV uploaded successfully',
            ...result
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get parsed data for a project
router.get('/:projectId/data', async (req, res) => {
    try {
        const { projectId } = req.params;
        const { fresh } = req.query;
        
        const data = await datasourceService.getParsedData(
            projectId,
            fresh === 'true'
        );
        
        res.json({
            success: true,
            data,
            count: data.length
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update datasource configuration
router.put('/:projectId/datasource', async (req, res) => {
    try {
        const { projectId } = req.params;
        const config = req.body;
        
        await datasourceService.saveDatasourceConfig(projectId, config);
        datasourceService.clearCache(projectId);
        
        res.json({
            success: true,
            message: 'Datasource configuration updated',
            config
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get datasource configuration
router.get('/:projectId/datasource', async (req, res) => {
    try {
        const { projectId } = req.params;
        const config = await datasourceService.getDatasourceConfig(projectId);
        
        res.json(config);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// === TEMPLATE ENDPOINTS ===

// Create template for project
router.post('/:projectId/templates', async (req, res) => {
    try {
        const { projectId } = req.params;
        const { name, content } = req.body;
        
        if (!name) {
            return res.status(400).json({ error: 'Template name is required' });
        }
        
        const templatePath = path.join(
            __dirname,
            '..',
            'storage',
            'projects',
            projectId,
            'templates',
            `${name}.json`
        );
        
        const templateData = {
            name,
            content: content || {},
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        await require('fs').promises.writeFile(
            templatePath,
            JSON.stringify(templateData, null, 2)
        );
        
        res.status(201).json({
            success: true,
            message: 'Template created successfully',
            template: templateData
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get all templates for a project
router.get('/:projectId/templates', async (req, res) => {
    try {
        const { projectId } = req.params;
        const templatesPath = path.join(
            __dirname,
            '..',
            'storage',
            'projects',
            projectId,
            'templates'
        );
        
        const fs = require('fs').promises;
        const templates = [];
        
        try {
            const files = await fs.readdir(templatesPath);
            for (const file of files) {
                if (file.endsWith('.json')) {
                    const content = await fs.readFile(
                        path.join(templatesPath, file),
                        'utf8'
                    );
                    templates.push(JSON.parse(content));
                }
            }
        } catch (error) {
            // No templates directory yet
        }
        
        res.json(templates);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update template
router.put('/templates/:templateId', async (req, res) => {
    // Placeholder - will be implemented in template controller
    res.status(501).json({ error: 'Not implemented yet' });
});

// Delete template
router.delete('/templates/:templateId', async (req, res) => {
    // Placeholder - will be implemented in template controller
    res.status(501).json({ error: 'Not implemented yet' });
});

// === REPORT ENDPOINTS ===

// Generate report preview
router.post('/reports/preview', reportController.previewReport);

// Generate HTML report
router.post('/reports/html', reportController.generateHTML);

// Generate PDF report
router.post('/reports/pdf', reportController.generatePDF);

module.exports = router;