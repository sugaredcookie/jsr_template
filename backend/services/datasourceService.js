const fs = require('fs').promises;
const path = require('path');
const csvService = require('./csvService');

class DatasourceService {
    constructor() {
        this.storagePath = path.join(__dirname, '..', 'storage', 'projects');
    }

    /**
     * @param {string} projectId - Project identifier
     * @param {object} options - Additional options for data fetching
     * @returns {Promise<Array>} - Parsed data
     */
    async getData(projectId, options = {}) {
        try {
            const datasourceConfig = await this.getDatasourceConfig(projectId);
            switch (datasourceConfig.type) {
                case 'csv':
                    return await this.fetchFromCSV(projectId, datasourceConfig, options);
                case 'aws-s3':
                    return await this.fetchFromS3(projectId, datasourceConfig, options);
                case 'database':
                    return await this.fetchFromDatabase(projectId, datasourceConfig, options);
                case 'api':
                    return await this.fetchFromAPI(projectId, datasourceConfig, options);
                default:
                    throw new Error(`Unsupported datasource type: ${datasourceConfig.type}`);
            }
        } catch (error) {
            throw new Error(`Failed to fetch data for project ${projectId}: ${error.message}`);
        }
    }

    /**
     * Get datasource configuration for a project
     * @param {string} projectId 
     * @returns {Promise<object>}
     */
    async getDatasourceConfig(projectId) {
        const configPath = path.join(this.storagePath, projectId, 'datasource.json');
        try {
            const configContent = await fs.readFile(configPath, 'utf8');
            return JSON.parse(configContent);
        } catch (error) {
            // If datasource.json doesn't exist, create default
            const defaultConfig = {
                type: 'csv',
                path: 'employees.csv'
            };
            await this.saveDatasourceConfig(projectId, defaultConfig);
            return defaultConfig;
        }
    }

    /**
     * Save datasource configuration for a project
     * @param {string} projectId 
     * @param {object} config 
     */
    async saveDatasourceConfig(projectId, config) {
        const projectPath = path.join(this.storagePath, projectId);
        await fs.mkdir(projectPath, { recursive: true });
        const configPath = path.join(projectPath, 'datasource.json');
        await fs.writeFile(configPath, JSON.stringify(config, null, 2));
    }

    /**
     * Fetch data from CSV source
     * @private
     */
    async fetchFromCSV(projectId, config, options) {
        const filePath = path.join(this.storagePath, projectId, config.path);
        try {
            const csvData = await fs.readFile(filePath, 'utf8');
            return csvService.parseCSV(csvData);
        } catch (error) {
            // Fallback to old uploads folder for backward compatibility
            const legacyPath = path.join(__dirname, '..', 'uploads', config.path);
            try {
                const csvData = await fs.readFile(legacyPath, 'utf8');
                return csvService.parseCSV(csvData);
            } catch (legacyError) {
                throw new Error(`CSV file not found: ${config.path}`);
            }
        }
    }

    /**
     * Fetch data from AWS S3
     * @private
     */
    async fetchFromS3(projectId, config, options) {
        // Placeholder for AWS S3 integration
        // Will be implemented when AWS SDK is added
        throw new Error('AWS S3 datasource is not yet implemented');
    }

    /**
     * Fetch data from Database
     * @private
     */
    async fetchFromDatabase(projectId, config, options) {
        // Placeholder for Database integration
        // Will be implemented when database ORM is added
        throw new Error('Database datasource is not yet implemented');
    }

    /**
     * Fetch data from REST API
     * @private
     */
    async fetchFromAPI(projectId, config, options) {
        // Placeholder for API integration
        // Will be implemented when axios is added
        throw new Error('API datasource is not yet implemented');
    }

    /**
     * Upload CSV file for a project
     * @param {string} projectId 
     * @param {string} filename - Original filename
     * @param {Buffer} fileBuffer - File data
     */
    async uploadCSV(projectId, filename, fileBuffer) {
        const projectPath = path.join(this.storagePath, projectId);
        await fs.mkdir(projectPath, { recursive: true });
        
        const filePath = path.join(projectPath, filename);
        await fs.writeFile(filePath, fileBuffer);
        
        // Update datasource.json
        const config = await this.getDatasourceConfig(projectId);
        config.type = 'csv';
        config.path = filename;
        await this.saveDatasourceConfig(projectId, config);
        
        return { success: true, filename, path: filePath };
    }

    /**
     * Get parsed data with caching support
     * @param {string} projectId 
     * @param {boolean} forceFresh - Force refresh cache
     * @returns {Promise<Array>}
     */
    async getParsedData(projectId, forceFresh = false) {
        // Simple cache implementation
        if (!this._cache) this._cache = new Map();
        
        const cacheKey = `data_${projectId}`;
        if (!forceFresh && this._cache.has(cacheKey)) {
            return this._cache.get(cacheKey);
        }
        
        const data = await this.getData(projectId);
        this._cache.set(cacheKey, data);
        return data;
    }

    /**
     * Clear cache for a project
     * @param {string} projectId 
     */
    clearCache(projectId) {
        if (this._cache) {
            const cacheKey = `data_${projectId}`;
            this._cache.delete(cacheKey);
        }
    }
}

module.exports = new DatasourceService();