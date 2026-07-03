const datasourceService = require('../services/datasourceService');

class DatasourceController {
    async getDatasourceConfig(req, res) {
        try {
            const { projectId } = req.params;
            const config = await datasourceService.getDatasourceConfig(projectId);
            
            // Return only non-sensitive info
            res.json({
                configured: config.configured,
                type: config.type || null,
                // Return minimal config info
                config: config.configured ? { 
                    // Only return non-sensitive info
                    type: config.type,
                    // For CSV, return just the filename
                    ...(config.type === 'csv' && { filename: config.config.path }),
                    // For local, return just the path (maybe show last part)
                    ...(config.type === 'local' && { path: config.config.path })
                } : {}
            });
        } catch (error) {
            console.error('Get datasource config error:', error);
            res.status(500).json({ 
                error: 'Failed to get datasource configuration',
                message: error.message 
            });
        }
    }

    /**
     * Update datasource configuration
     */
    async updateDatasourceConfig(req, res) {
        try {
            const { projectId } = req.params;
            const { type, config } = req.body;
            
            if (!type) {
                return res.status(400).json({ error: 'Datasource type is required' });
            }

            // Validate type
            const validTypes = ['csv', 'local', 'aws-s3', 'database', 'api'];
            if (!validTypes.includes(type)) {
                return res.status(400).json({ 
                    error: `Invalid datasource type. Must be one of: ${validTypes.join(', ')}` 
                });
            }

            const datasourceConfig = {
                configured: true,
                type: type,
                config: config || {}
            };

            await datasourceService.saveDatasourceConfig(projectId, datasourceConfig);
            
            res.json({
                success: true,
                message: 'Datasource configured successfully',
                config: datasourceConfig
            });
        } catch (error) {
            console.error('Update datasource config error:', error);
            res.status(500).json({ 
                error: 'Failed to update datasource configuration',
                message: error.message 
            });
        }
    }

    /**
     * Configure local device datasource
     */
    async configureLocal(req, res) {
        try {
            const { projectId } = req.params;
            const { path: localPath } = req.body;
            
            if (!localPath) {
                return res.status(400).json({ error: 'Local file path is required' });
            }

            const config = await datasourceService.configureLocal(projectId, localPath);
            
            res.json({
                success: true,
                message: 'Local datasource configured successfully',
                config
            });
        } catch (error) {
            console.error('Configure local datasource error:', error);
            res.status(500).json({ 
                error: 'Failed to configure local datasource',
                message: error.message 
            });
        }
    }

    /**
     * Upload CSV file
     */
    async uploadCSV(req, res) {
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
            
            res.json({
                success: true,
                message: 'CSV uploaded and configured successfully',
                ...result
            });
        } catch (error) {
            console.error('Upload CSV error:', error);
            res.status(500).json({ 
                error: 'Failed to upload CSV',
                message: error.message 
            });
        }
    }

    /**
     * Get project data
     */
    async getProjectData(req, res) {
        try {
            const { projectId } = req.params;
            const { fresh } = req.query;
            
            // Check if datasource is configured
            const hasDatasource = await datasourceService.hasDatasource(projectId);
            
            if (!hasDatasource) {
                return res.json({
                    configured: false,
                    message: 'No datasource configured',
                    data: [],
                    count: 0
                });
            }

            const data = await datasourceService.getParsedData(
                projectId,
                fresh === 'true'
            );
            
            res.json({
                configured: true,
                data,
                count: data.length
            });
        } catch (error) {
            console.error('Get project data error:', error);
            res.status(500).json({ 
                error: 'Failed to get project data',
                message: error.message 
            });
        }
    }

    /**
     * Get datasource status (simple check)
     */
    async getDatasourceStatus(req, res) {
        try {
            const { projectId } = req.params;
            const hasDatasource = await datasourceService.hasDatasource(projectId);
            const config = await datasourceService.getDatasourceConfig(projectId);
            
            res.json({
                configured: hasDatasource,
                type: hasDatasource ? config.type : null,
                status: hasDatasource ? 'ready' : 'not-configured'
            });
        } catch (error) {
            console.error('Get datasource status error:', error);
            res.status(500).json({ 
                error: 'Failed to get datasource status',
                message: error.message 
            });
        }
    }
}

module.exports = new DatasourceController();