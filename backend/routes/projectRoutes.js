const express = require('express');
const router = express.Router();
const projectController = require('../controllers/projectController');
const fs = require('fs').promises;
const path = require('path');
const { v4: uuidv4 } = require('uuid');

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

// Get all templates for a project
router.get('/:projectId/templates', projectController.getAllTemplates);

// Create a new template
router.post('/:projectId/templates', projectController.createNewTemplate);

// Get a specific template
router.get('/:projectId/templates/:templateId', projectController.getTemplate);

// Update a template
router.put('/:projectId/templates/:templateId', projectController.updateTemplate);

// Delete a template
router.delete('/:projectId/templates/:templateId', projectController.deleteTemplate);

module.exports = router;