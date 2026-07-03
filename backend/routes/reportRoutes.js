const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');

// These endpoints maintain backward compatibility with existing frontend
// but now support project-based architecture

// Generate report preview
router.post('/preview', reportController.previewReport);

// Generate HTML report
router.post('/html', reportController.generateHTML);

// Generate PDF report
router.post('/pdf', reportController.generatePDF);

// Get reports for a project
router.get('/:projectId/reports', reportController.getReports);

module.exports = router;