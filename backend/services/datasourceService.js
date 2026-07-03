const fs = require('fs').promises;
const path = require('path');
const csvService = require('./csvService');

class DatasourceService {
    constructor() {
        this.storagePath = path.join(__dirname, '..', 'storage', 'projects');
        this._cache = new Map();
    }

    async getDatasourceConfig(projectId) {
        const configPath = path.join(this.storagePath, projectId, 'datasource.json');
        try {
            const configContent = await fs.readFile(configPath, 'utf8');
            const config = JSON.parse(configContent);
            
            return {
                configured: config.configured || false,
                type: config.type || null,
                config: config.config || {},
                ...config
            };
        } catch (error) {
            const defaultConfig = {
                configured: false,
                type: null,
                config: {}
            };
            await this.saveDatasourceConfig(projectId, defaultConfig);
            return defaultConfig;
        }
    }

    async saveDatasourceConfig(projectId, config) {
        const projectPath = path.join(this.storagePath, projectId);
        await fs.mkdir(projectPath, { recursive: true });
        const configPath = path.join(projectPath, 'datasource.json');
        await fs.writeFile(configPath, JSON.stringify(config, null, 2));
        this.clearCache(projectId);
    }

    async getData(projectId, options = {}) {
        try {
            const config = await this.getDatasourceConfig(projectId);
            
            if (!config.configured) {
                return [];
            }

            switch (config.type) {
                case 'csv':
                    return await this.fetchFromCSV(projectId, config, options);
                case 'local':
                    return await this.fetchFromLocal(projectId, config, options);
                case 'aws-s3':
                    return await this.fetchFromS3(projectId, config, options);
                case 'database':
                    return await this.fetchFromDatabase(projectId, config, options);
                case 'api':
                    return await this.fetchFromAPI(projectId, config, options);
                default:
                    console.warn(`Unsupported datasource type: ${config.type}`);
                    return [];
            }
        } catch (error) {
            console.error(`Failed to fetch data for project ${projectId}:`, error);
            return [];
        }
    }

    async fetchFromCSV(projectId, config, options) {
        const filePath = path.join(this.storagePath, projectId, config.config.path);
        try {
            // Read the file content as a string
            const csvData = await fs.readFile(filePath, 'utf8');
            // Pass the string to csvService.parseCSV
            return csvService.parseCSV(csvData);
        } catch (error) {
            console.error(`CSV file not found: ${filePath}`, error);
            return [];
        }
    }

    async fetchFromLocal(projectId, config, options) {
        console.log(`Local datasource configured for project ${projectId}:`, config.config.path);
        // For local, we might want to read the file from the local path
        try {
            const localPath = config.config.path;
            if (localPath && localPath.endsWith('.csv')) {
                const csvData = await fs.readFile(localPath, 'utf8');
                return csvService.parseCSV(csvData);
            }
            return [];
        } catch (error) {
            console.error(`Failed to read local file: ${config.config.path}`, error);
            return [];
        }
    }

    async fetchFromS3(projectId, config, options) {
        console.log(`AWS S3 datasource configured for project ${projectId}`);
        throw new Error('AWS S3 datasource is not yet implemented');
    }

    async fetchFromDatabase(projectId, config, options) {
        console.log(`Database datasource configured for project ${projectId}`);
        throw new Error('Database datasource is not yet implemented');
    }

    async fetchFromAPI(projectId, config, options) {
        console.log(`API datasource configured for project ${projectId}`);
        throw new Error('API datasource is not yet implemented');
    }

    async uploadCSV(projectId, filename, fileBuffer) {
        const projectPath = path.join(this.storagePath, projectId);
        await fs.mkdir(projectPath, { recursive: true });
        
        // Ensure filename has .csv extension
        if (!filename.toLowerCase().endsWith('.csv')) {
            filename = filename + '.csv';
        }
        
        const filePath = path.join(projectPath, filename);
        await fs.writeFile(filePath, fileBuffer);
        
        const config = {
            configured: true,
            type: 'csv',
            config: {
                path: filename
            }
        };
        await this.saveDatasourceConfig(projectId, config);
        
        return { success: true, filename, path: filePath };
    }

    async configureLocal(projectId, localPath) {
        const config = {
            configured: true,
            type: 'local',
            config: {
                path: localPath
            }
        };
        await this.saveDatasourceConfig(projectId, config);
        return config;
    }

    async getParsedData(projectId, forceFresh = false) {
        const cacheKey = `data_${projectId}`;
        if (!forceFresh && this._cache.has(cacheKey)) {
            return this._cache.get(cacheKey);
        }
        
        const data = await this.getData(projectId);
        this._cache.set(cacheKey, data);
        return data;
    }

    clearCache(projectId) {
        const cacheKey = `data_${projectId}`;
        this._cache.delete(cacheKey);
    }

    async hasDatasource(projectId) {
        const config = await this.getDatasourceConfig(projectId);
        return config.configured === true;
    }

    async getDatasourceInfo(projectId) {
        const config = await this.getDatasourceConfig(projectId);
        return {
            configured: config.configured,
            type: config.type || null,
        };
    }
}

module.exports = new DatasourceService();