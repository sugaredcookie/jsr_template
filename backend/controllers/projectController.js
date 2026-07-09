const fs = require('fs').promises;
const path = require('path');
const { v4: uuidv4 } = require('uuid');

class ProjectController {
    constructor() { 
        this.storagePath = path.join(__dirname, '..', 'storage', 'projects'); 
        
        // Bind all methods
        this.createProject = this.createProject.bind(this); 
        this.getAllProjects = this.getAllProjects.bind(this); 
        this.getProject = this.getProject.bind(this); 
        this.updateProject = this.updateProject.bind(this); 
        this.deleteProject = this.deleteProject.bind(this); 
        this.getAllTemplates = this.getAllTemplates.bind(this);
        this.createNewTemplate = this.createNewTemplate.bind(this);
        this.getTemplate = this.getTemplate.bind(this);
        this.updateTemplate = this.updateTemplate.bind(this);
        this.deleteTemplate = this.deleteTemplate.bind(this);
        this.getProjectData = this.getProjectData.bind(this);

        this.ensureStorageDirectory();
    }

    async ensureStorageDirectory() {
        try {
            await fs.mkdir(this.storagePath, { recursive: true });
            console.log(`✅ Storage directory ready: ${this.storagePath}`);
        } catch (error) {
            console.error('❌ Failed to create storage directory:', error);
        }
    }
    
    async createProject(req, res) {
        try {
            const { name, description = '' } = req.body;
            
            if (!name) {
                return res.status(400).json({ error: 'Project name is required' });
            }

            // Generate project ID from name (slug)
            const projectId = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
            const projectPath = path.join(this.storagePath, projectId);
            
            // Check if project already exists
            try {
                await fs.access(projectPath);
                return res.status(409).json({ error: 'Project already exists' });
            } catch (error) {
                // Project doesn't exist, proceed
            }

            // Create project structure
            await fs.mkdir(projectPath, { recursive: true });
            await fs.mkdir(path.join(projectPath, 'templates'), { recursive: true });
            await fs.mkdir(path.join(projectPath, 'reports'), { recursive: true });

            // Create project.json
            const projectData = {
                id: projectId,
                name,
                description,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
            await fs.writeFile(
                path.join(projectPath, 'project.json'),
                JSON.stringify(projectData, null, 2)
            );

            // Create empty datasource.json (no datasource configured)
            const emptyDatasource = {
                configured: false,
                type: null,
                config: {}
            };
            await fs.writeFile(
                path.join(projectPath, 'datasource.json'),
                JSON.stringify(emptyDatasource, null, 2)
            );

            res.status(201).json(projectData);
        } catch (error) {
            console.error('❌ Create project error:', error);
            res.status(500).json({ 
                error: 'Failed to create project',
                message: error.message 
            });
        }
    }

    async getAllProjects(req, res) {
        try {
            const projects = [];
            
            try {
                await fs.access(this.storagePath);
            } catch (error) {
                await fs.mkdir(this.storagePath, { recursive: true });
                return res.json([]);
            }
            
            const projectDirs = await fs.readdir(this.storagePath);
            
            for (const projectId of projectDirs) {
                try {
                    const projectPath = path.join(this.storagePath, projectId);
                    const stat = await fs.stat(projectPath);
                    
                    if (stat.isDirectory()) {
                        const projectFile = path.join(projectPath, 'project.json');
                        try {
                            const content = await fs.readFile(projectFile, 'utf8');
                            const project = JSON.parse(content);
                            projects.push(project);
                        } catch (error) {
                            // Skip projects without valid project.json
                        }
                    }
                } catch (error) {
                    console.warn(`Error reading project ${projectId}:`, error);
                }
            }
            
            res.json(projects);
        } catch (error) {
            console.error('❌ Get all projects error:', error);
            res.status(500).json({ 
                error: 'Failed to get projects',
                message: error.message 
            });
        }
    }

    async getProject(req, res) {
        try {
            const { projectId } = req.params;
            const project = await this.getProjectData(projectId);
            
            if (!project) {
                return res.status(404).json({ error: 'Project not found' });
            }
            
            res.json(project);
        } catch (error) {
            console.error('❌ Get project error:', error);
            res.status(500).json({ 
                error: 'Failed to get project',
                message: error.message 
            });
        }
    }

    async updateProject(req, res) {
        try {
            const { projectId } = req.params;
            const { name, description } = req.body;
            
            const projectPath = path.join(this.storagePath, projectId);
            const projectFile = path.join(projectPath, 'project.json');
            
            try {
                await fs.access(projectPath);
            } catch (error) {
                return res.status(404).json({ error: 'Project not found' });
            }
            
            const content = await fs.readFile(projectFile, 'utf8');
            const project = JSON.parse(content);
            
            if (name) project.name = name;
            if (description !== undefined) project.description = description;
            project.updatedAt = new Date().toISOString();
            
            await fs.writeFile(projectFile, JSON.stringify(project, null, 2));
            
            res.json(project);
        } catch (error) {
            console.error('❌ Update project error:', error);
            res.status(500).json({ 
                error: 'Failed to update project',
                message: error.message 
            });
        }
    }

    async deleteProject(req, res) {
        try {
            const { projectId } = req.params;
            const projectPath = path.join(this.storagePath, projectId);
            
            try {
                await fs.access(projectPath);
            } catch (error) {
                return res.status(404).json({ error: 'Project not found' });
            }
            
            await fs.rm(projectPath, { recursive: true, force: true });
            
            res.json({ success: true, message: 'Project deleted successfully' });
        } catch (error) {
            console.error('❌ Delete project error:', error);
            res.status(500).json({ 
                error: 'Failed to delete project',
                message: error.message 
            });
        }
    }

    /**
     * Helper: Get project data
     * @param {string} projectId 
     * @returns {Promise<object|null>}
     */
    async getProjectData(projectId) {
        try {
            const projectPath = path.join(this.storagePath, projectId);
            const projectFile = path.join(projectPath, 'project.json');
            
            await fs.access(projectFile);
            const content = await fs.readFile(projectFile, 'utf8');
            return JSON.parse(content);
        } catch (error) {
            return null;
        }
    }

    // === TEMPLATE METHODS ===

    /**
     * Get all templates for a project
     */
    async getAllTemplates(req, res) {
        try {
            const { projectId } = req.params;
            
            // Verify project exists - use this.getProjectData instead of projectController
            const projectExists = await this.getProjectData(projectId);
            if (!projectExists) {
                return res.status(404).json({ error: 'Project not found' });
            }
            
            const templatesPath = path.join(
                __dirname,
                '..',
                'storage',
                'projects',
                projectId,
                'templates'
            );
            
            const templates = [];
            
            try {
                // Check if templates directory exists
                await fs.access(templatesPath);
                const files = await fs.readdir(templatesPath);
                
                for (const file of files) {
                    if (file.endsWith('.json')) {
                        try {
                            const content = await fs.readFile(
                                path.join(templatesPath, file),
                                'utf8'
                            );
                            const template = JSON.parse(content);
                            templates.push(template);
                        } catch (err) {
                            console.warn(`Failed to parse template ${file}:`, err);
                        }
                    }
                }
            } catch (error) {
                // Templates directory doesn't exist - return empty array
                console.log(`No templates directory for project ${projectId}`);
            }
            
            res.json(templates);
        } catch (error) {
            console.error('Get templates error:', error);
            res.status(500).json({ 
                error: 'Failed to get templates',
                message: error.message 
            });
        }
    }

    /**
     * Create a new template
     */
    async createNewTemplate(req, res) {
        try {
            const { projectId } = req.params;
            const { name, components, theme } = req.body;
            
            if (!name) {
                return res.status(400).json({ error: 'Template name is required' });
            }
            
            // Verify project exists - use this.getProjectData instead of projectController
            const projectExists = await this.getProjectData(projectId);
            if (!projectExists) {
                return res.status(404).json({ error: 'Project not found' });
            }
            
            const templatesPath = path.join(
                __dirname,
                '..',
                'storage',
                'projects',
                projectId,
                'templates'
            );
            
            // Ensure templates directory exists
            await fs.mkdir(templatesPath, { recursive: true });
            
            // Generate unique ID using uuid
            const templateId = uuidv4();
            
            // Create template object
            const templateData = {
                id: templateId,
                projectId: projectId,
                name: name,
                components: components || [],
                theme: theme || 'silicon',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
            
            // Save template file
            const filePath = path.join(templatesPath, `${templateId}.json`);
            await fs.writeFile(filePath, JSON.stringify(templateData, null, 2));
            
            res.status(201).json({
                success: true,
                message: 'Template created successfully',
                template: templateData
            });
        } catch (error) {
            console.error('Create template error:', error);
            res.status(500).json({ 
                error: 'Failed to create template',
                message: error.message 
            });
        }
    }

    /**
     * Get a specific template
     */
    async getTemplate(req, res) {
        try {
            const { projectId, templateId } = req.params;
            
            // Verify project exists - use this.getProjectData instead of projectController
            const projectExists = await this.getProjectData(projectId);
            if (!projectExists) {
                return res.status(404).json({ error: 'Project not found' });
            }
            
            const filePath = path.join(
                __dirname,
                '..',
                'storage',
                'projects',
                projectId,
                'templates',
                `${templateId}.json`
            );
            
            try {
                const content = await fs.readFile(filePath, 'utf8');
                const template = JSON.parse(content);
                res.json(template);
            } catch (error) {
                return res.status(404).json({ error: 'Template not found' });
            }
        } catch (error) {
            console.error('Get template error:', error);
            res.status(500).json({ 
                error: 'Failed to get template',
                message: error.message 
            });
        }
    }

    /**
     * Update a template
     */
    async updateTemplate(req, res) {
        try {
            const { projectId, templateId } = req.params;
            const { name, components, theme } = req.body;
            
            // Verify project exists - use this.getProjectData instead of projectController
            const projectExists = await this.getProjectData(projectId);
            if (!projectExists) {
                return res.status(404).json({ error: 'Project not found' });
            }
            
            const filePath = path.join(
                __dirname,
                '..',
                'storage',
                'projects',
                projectId,
                'templates',
                `${templateId}.json`
            );
            
            // Read existing template
            let existingContent;
            try {
                existingContent = await fs.readFile(filePath, 'utf8');
            } catch (error) {
                return res.status(404).json({ error: 'Template not found' });
            }
            
            const template = JSON.parse(existingContent);
            
            // Update fields
            if (name) template.name = name;
            if (components) template.components = components;
            if (theme) template.theme = theme;
            template.updatedAt = new Date().toISOString();
            
            // Save updated template
            await fs.writeFile(filePath, JSON.stringify(template, null, 2));
            
            res.json({
                success: true,
                message: 'Template updated successfully',
                template
            });
        } catch (error) {
            console.error('Update template error:', error);
            res.status(500).json({ 
                error: 'Failed to update template',
                message: error.message 
            });
        }
    }

    /**
     * Delete a template
     */
    async deleteTemplate(req, res) {
        try {
            const { projectId, templateId } = req.params;
            
            // Verify project exists - use this.getProjectData instead of projectController
            const projectExists = await this.getProjectData(projectId);
            if (!projectExists) {
                return res.status(404).json({ error: 'Project not found' });
            }
            
            const filePath = path.join(
                __dirname,
                '..',
                'storage',
                'projects',
                projectId,
                'templates',
                `${templateId}.json`
            );
            
            try {
                await fs.access(filePath);
            } catch (error) {
                return res.status(404).json({ error: 'Template not found' });
            }
            
            // Delete the file
            await fs.unlink(filePath);
            
            res.json({
                success: true,
                message: 'Template deleted successfully'
            });
        } catch (error) {
            console.error('Delete template error:', error);
            res.status(500).json({ 
                error: 'Failed to delete template',
                message: error.message 
            });
        }
    }
}

module.exports = new ProjectController();