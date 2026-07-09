const datasourceService = require('../services/datasourceService');

class DatasourceController {
    async getDatasourceConfig(req, res) {
        try {
            const { projectId } = req.params;
            const config = await datasourceService.getDatasourceConfig(projectId);
            
            res.json({
                configured: config.configured,
                type: config.type || null,
                config: config.configured ? { 
                    type: config.type,
                    ...(config.type === 'csv' && { filename: config.config.path }),
                    ...(config.type === 'local' && { path: config.config.path }),
                    ...(config.type === 'database' && { 
                        databaseType: config.config.databaseType || config.config.type,
                        filePath: config.config.filePath,
                        table: config.config.table,
                        host: config.config.host,
                        port: config.config.port,
                        database: config.config.database
                    })
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

    async updateDatasourceConfig(req, res) {
        try {
            const { projectId } = req.params;
            const { type, config } = req.body;
            
            if (!type) {
                return res.status(400).json({ error: 'Datasource type is required' });
            }

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

    // === DATABASE ENDPOINTS ===

    async testDatabaseConnection(req, res) {
        try {
            const { projectId } = req.params;
            const config = req.body;
            
            // Validate required fields based on type
            const isSqlite = config.type === 'sqlite';
            
            if (isSqlite && !config.filePath) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'SQLite database file path is required' 
                });
            }
            
            if (!isSqlite) {
                if (!config.host) return res.status(400).json({ success: false, message: 'Host is required' });
                if (!config.database) return res.status(400).json({ success: false, message: 'Database name is required' });
                if (!config.user) return res.status(400).json({ success: false, message: 'Username is required' });
                if (!config.password) return res.status(400).json({ success: false, message: 'Password is required' });
            }
            
            if (!config.table) {
                return res.status(400).json({ success: false, message: 'Table name is required' });
            }
            
            const result = await datasourceService.testDatabaseConnection(projectId, config);
            res.json(result);
        } catch (error) {
            console.error('Test database connection error:', error);
            res.status(500).json({ 
                success: false,
                error: 'Failed to test database connection',
                message: error.message 
            });
        }
    }

    async getDatabaseTables(req, res) {
        try {
            const { projectId } = req.params;
            // Get filePath from query param or from saved config
            let filePath = req.query.filePath;
            
            // If no filePath in query, try to get from saved config
            if (!filePath) {
                const config = await datasourceService.getDatasourceConfig(projectId);
                if (config.configured && config.type === 'database') {
                    filePath = config.config.filePath;
                }
            }
            
            if (!filePath) {
                return res.status(400).json({ 
                    success: false, 
                    error: 'Database file path is required',
                    message: 'Please provide a SQLite database file path or configure the datasource first'
                });
            }
            
            const tables = await datasourceService.getDatabaseTables(projectId, { filePath });
            res.json({ 
                success: true, 
                tables 
            });
        } catch (error) {
            console.error('Get database tables error:', error);
            res.status(500).json({ 
                success: false,
                error: 'Failed to get database tables',
                message: error.message 
            });
        }
    }

    async configureDatabase(req, res) {
        try {
            const { projectId } = req.params;
            const dbConfig = req.body;
            
            // Validate required fields based on type
            const isSqlite = dbConfig.type === 'sqlite';
            
            if (isSqlite && !dbConfig.filePath) {
                return res.status(400).json({ 
                    success: false,
                    error: 'SQLite database file path is required',
                    message: 'Please provide the full path to your SQLite database file'
                });
            }
            
            if (!isSqlite) {
                if (!dbConfig.host) {
                    return res.status(400).json({ success: false, error: 'Host is required' });
                }
                if (!dbConfig.database) {
                    return res.status(400).json({ success: false, error: 'Database name is required' });
                }
                if (!dbConfig.user) {
                    return res.status(400).json({ success: false, error: 'Username is required' });
                }
                if (!dbConfig.password) {
                    return res.status(400).json({ success: false, error: 'Password is required' });
                }
            }
            
            if (!dbConfig.table) {
                return res.status(400).json({ 
                    success: false,
                    error: 'Table name is required',
                    message: 'Please specify which table to use'
                });
            }
            
            // Test connection first
            const testResult = await datasourceService.testDatabaseConnection(projectId, dbConfig);
            
            if (!testResult.success) {
                return res.status(400).json({ 
                    success: false,
                    error: 'Database connection failed',
                    message: testResult.message 
                });
            }
            
            // Save configuration with consistent schema
            const configToSave = {
                type: dbConfig.type, // 'sqlite', 'mysql', 'postgres', 'sqlserver'
                host: dbConfig.host || '',
                port: dbConfig.port || '',
                database: dbConfig.database || '',
                table: dbConfig.table,
                user: dbConfig.user || '',
                password: dbConfig.password || '',
                filePath: dbConfig.filePath || ''
            };
            
            const config = await datasourceService.configureDatabase(projectId, configToSave);
            
            // Clear cache
            datasourceService.clearCache(projectId);
            
            res.json({
                success: true,
                message: 'Database configured successfully',
                config: config
            });
        } catch (error) {
            console.error('Configure database error:', error);
            res.status(500).json({ 
                success: false,
                error: 'Failed to configure database',
                message: error.message 
            });
        }
    }

    // === Existing methods ===

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

    async getProjectData(req, res) {
        try {
            const { projectId } = req.params;
            const { fresh } = req.query;
            
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