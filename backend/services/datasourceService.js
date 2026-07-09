const fs = require('fs').promises;
const path = require('path');
const csvService = require('./csvService');

// Database drivers
const mysql = require('mysql2/promise');
const { Client } = require('pg');
const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');

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
            const csvData = await fs.readFile(filePath, 'utf8');
            return csvService.parseCSV(csvData);
        } catch (error) {
            console.error(`CSV file not found: ${filePath}`, error);
            return [];
        }
    }

    async fetchFromLocal(projectId, config, options) {
        console.log(`Local datasource configured for project ${projectId}:`, config.config.path);
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

    // === DATABASE IMPLEMENTATION ===
    async fetchFromDatabase(projectId, config, options) {
        const dbConfig = config.config;
        const { type, host, port, database, table, user, password, filePath } = dbConfig;
        
        console.log(`Connecting to ${type} database for project ${projectId}`);

        let connection;
        let rows = [];

        try {
            switch (type) {
                case 'sqlite':
                    // SQLite - file-based
                    const dbPath = filePath || path.join(this.storagePath, projectId, 'database.db');
                    
                    // Check if file exists
                    try {
                        await fs.access(dbPath);
                    } catch (err) {
                        throw new Error(`SQLite database file not found: ${dbPath}`);
                    }

                    const sqliteDb = await open({
                        filename: dbPath,
                        driver: sqlite3.Database
                    });

                    // Validate table exists before querying
                    const tableCheck = await sqliteDb.get(
                        `SELECT name FROM sqlite_master WHERE type='table' AND name = ?`,
                        [table]
                    );
                    
                    if (!tableCheck) {
                        await sqliteDb.close();
                        throw new Error(`Table "${table}" does not exist in the database`);
                    }

                    rows = await sqliteDb.all(`SELECT * FROM "${table}" LIMIT 10000`);
                    await sqliteDb.close();
                    break;

                case 'mysql':
                case 'mariadb':
                    connection = await mysql.createConnection({
                        host: host || 'localhost',
                        port: port || 3306,
                        database: database,
                        user: user,
                        password: password
                    });
                    
                    const [mysqlResults] = await connection.execute(`SELECT * FROM ${table} LIMIT 10000`);
                    rows = mysqlResults;
                    await connection.end();
                    break;

                case 'postgres':
                    const pgClient = new Client({
                        host: host || 'localhost',
                        port: port || 5432,
                        database: database,
                        user: user,
                        password: password
                    });
                    
                    await pgClient.connect();
                    const pgResult = await pgClient.query(`SELECT * FROM ${table} LIMIT 10000`);
                    rows = pgResult.rows;
                    await pgClient.end();
                    break;

                case 'sqlserver':
                    const sql = require('mssql');
                    const sqlConfig = {
                        user: user,
                        password: password,
                        server: host || 'localhost',
                        port: port || 1433,
                        database: database,
                        options: {
                            encrypt: true,
                            trustServerCertificate: true
                        }
                    };
                    
                    await sql.connect(sqlConfig);
                    const sqlResult = await sql.query(`SELECT TOP 10000 * FROM ${table}`);
                    rows = sqlResult.recordset;
                    await sql.close();
                    break;

                default:
                    throw new Error(`Unsupported database type: ${type}`);
            }

            console.log(`✅ Fetched ${rows.length} rows from ${table}`);
            return rows;

        } catch (error) {
            console.error(`Database fetch error:`, error);
            throw new Error(`Failed to fetch data from database: ${error.message}`);
        } finally {
            if (connection && connection.end) {
                await connection.end().catch(() => {});
            }
        }
    }

    // === DATABASE HELPERS ===
    async testDatabaseConnection(projectId, config) {
        const { type, host, port, database, user, password, filePath, table } = config;
        
        try {
            switch (type) {
                case 'sqlite':
                    // Check if file exists and is readable
                    const dbPath = filePath || path.join(this.storagePath, projectId, 'database.db');
                    try {
                        await fs.access(dbPath, fs.constants.R_OK);
                    } catch (err) {
                        return { 
                            success: false, 
                            message: `SQLite database file not found or not readable: ${dbPath}` 
                        };
                    }

                    // Try to open the database
                    const sqliteDb = await open({
                        filename: dbPath,
                        driver: sqlite3.Database
                    });
                    
                    // Check if table exists
                    if (table) {
                        const tableCheck = await sqliteDb.get(
                            `SELECT name FROM sqlite_master WHERE type='table' AND name = ?`,
                            [table]
                        );
                        if (!tableCheck) {
                            await sqliteDb.close();
                            return { 
                                success: false, 
                                message: `Table "${table}" does not exist in the database` 
                            };
                        }
                    }
                    
                    await sqliteDb.get('SELECT 1');
                    await sqliteDb.close();
                    
                    return { 
                        success: true, 
                        message: `SQLite connection successful: ${dbPath}` 
                    };

                case 'mysql':
                case 'mariadb':
                    const connection = await mysql.createConnection({
                        host: host || 'localhost',
                        port: port || 3306,
                        database: database,
                        user: user,
                        password: password
                    });
                    await connection.ping();
                    await connection.end();
                    return { success: true, message: 'MySQL connection successful' };

                case 'postgres':
                    const pgClient = new Client({
                        host: host || 'localhost',
                        port: port || 5432,
                        database: database,
                        user: user,
                        password: password
                    });
                    await pgClient.connect();
                    await pgClient.end();
                    return { success: true, message: 'PostgreSQL connection successful' };

                case 'sqlserver':
                    const sql = require('mssql');
                    const sqlConfig = {
                        user: user,
                        password: password,
                        server: host || 'localhost',
                        port: port || 1433,
                        database: database,
                        options: {
                            encrypt: true,
                            trustServerCertificate: true
                        }
                    };
                    await sql.connect(sqlConfig);
                    await sql.close();
                    return { success: true, message: 'SQL Server connection successful' };

                default:
                    throw new Error(`Unsupported database type: ${type}`);
            }
        } catch (error) {
            console.error('Database test failed:', error);
            return { success: false, message: error.message };
        }
    }

    async getDatabaseTables(projectId, config) {
        const { filePath } = config;
        
        if (!filePath) {
            throw new Error('Database file path is required');
        }
        
        try {
            // Check if file exists
            await fs.access(filePath, fs.constants.R_OK);
            
            // Open the database
            const sqliteDb = await open({
                filename: filePath,
                driver: sqlite3.Database
            });

            const tableRows = await sqliteDb.all(
                `SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name`
            );
            const tables = tableRows.map(r => r.name);
            await sqliteDb.close();
            
            return tables;
        } catch (error) {
            console.error('Failed to get tables:', error);
            throw new Error(`Failed to get tables: ${error.message}`);
        }
    }

    // === CONFIGURATION HELPERS ===
    async configureDatabase(projectId, dbConfig) {
        const config = {
            configured: true,
            type: 'database',
            config: dbConfig
        };
        await this.saveDatasourceConfig(projectId, config);
        return config;
    }

    async fetchFromS3(projectId, config, options) {
        console.log(`AWS S3 datasource configured for project ${projectId}`);
        throw new Error('AWS S3 datasource is not yet implemented');
    }

    async fetchFromAPI(projectId, config, options) {
        console.log(`API datasource configured for project ${projectId}`);
        throw new Error('API datasource is not yet implemented');
    }

    async uploadCSV(projectId, filename, fileBuffer) {
        const projectPath = path.join(this.storagePath, projectId);
        await fs.mkdir(projectPath, { recursive: true });
        
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