const express = require('express');
const router = express.Router();
const projectController = require('../controllers/projectController');

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

module.exports = router;