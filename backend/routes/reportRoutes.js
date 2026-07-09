const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');

// Generate report preview
router.post('/preview', reportController.previewReport);

// Generate HTML report
router.post('/html', reportController.generateHTML);

// Generate PDF report
router.post('/pdf', reportController.generatePDF);

// Get all reports for a project
router.get('/:projectId/reports', reportController.getReports);

// Get a specific report
router.get('/:projectId/reports/:reportId', reportController.getReport);

// Delete a report
router.delete('/:projectId/reports/:reportId', reportController.deleteReport);

//pdf from html route
router.post('/pdf-from-html', reportController.generatePDFFromHTML);

module.exports = router;