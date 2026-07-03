const fs = require('fs').promises;
const path = require('path');

class ProjectController {
    constructor() { this.storagePath = path.join(__dirname, '..', 'storage', 'projects'); 
        this.createProject = this.createProject.bind(this); 
        this.getAllProjects = this.getAllProjects.bind(this); 
        this.getProject = this.getProject.bind(this); this.updateProject = this.updateProject.bind(this); 
        this.deleteProject = this.deleteProject.bind(this); 

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
}

module.exports = new ProjectController();