class CSVService {
    /**
     * Parse CSV data from string
     * @param {string} csvData - Raw CSV string data
     * @returns {Array} - Array of objects
     */
    parseCSV(csvData) {
        if (!csvData || typeof csvData !== 'string') {
            console.warn('CSV data is empty or not a string');
            return [];
        }
        
        // Split into lines and filter out empty lines
        const lines = csvData.split('\n').filter(line => line.trim());
        if (lines.length === 0) {
            console.warn('No data lines found in CSV');
            return [];
        }
        
        try {
            // Parse headers from first line
            const headers = this.parseCSVLine(lines[0]);
            if (headers.length === 0) {
                console.warn('No headers found in CSV');
                return [];
            }
            
            // Parse data rows
            const result = [];
            for (let i = 1; i < lines.length; i++) {
                const values = this.parseCSVLine(lines[i]);
                if (values.length === headers.length) {
                    const row = {};
                    headers.forEach((header, index) => {
                        // Clean up header and value
                        const cleanHeader = header.trim().replace(/^"|"$/g, '');
                        let value = values[index] || '';
                        value = value.trim().replace(/^"|"$/g, '');
                        
                        // Try to convert numeric values
                        if (value && !isNaN(value) && value !== '') {
                            const num = Number(value);
                            if (!isNaN(num)) {
                                row[cleanHeader] = num;
                            } else {
                                row[cleanHeader] = value;
                            }
                        } else {
                            row[cleanHeader] = value;
                        }
                    });
                    result.push(row);
                } else {
                    console.warn(`Skipping row ${i}: column count mismatch (${values.length} vs ${headers.length})`);
                }
            }
            
            console.log(`✅ Parsed ${result.length} rows from CSV`);
            return result;
        } catch (error) {
            console.error('Error parsing CSV:', error);
            return [];
        }
    }

    /**
     * Parse a single CSV line handling quoted values
     * @param {string} line - CSV line
     * @returns {Array} - Array of values
     */
    parseCSVLine(line) {
        if (!line || typeof line !== 'string') {
            return [];
        }
        
        const result = [];
        let current = '';
        let inQuotes = false;
        
        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            
            if (char === '"') {
                if (inQuotes && line[i + 1] === '"') {
                    // Double quote inside quoted field
                    current += '"';
                    i++;
                } else {
                    inQuotes = !inQuotes;
                }
            } else if (char === ',' && !inQuotes) {
                result.push(current.trim());
                current = '';
            } else {
                current += char;
            }
        }
        
        result.push(current.trim());
        return result;
    }

    /**
     * Parse CSV from file path (for backward compatibility)
     * @param {string} filePath - Path to CSV file
     * @returns {Promise<Array>} - Array of objects
     */
    async parseCSVFile(filePath) {
        const fs = require('fs').promises;
        try {
            const data = await fs.readFile(filePath, 'utf8');
            return this.parseCSV(data);
        } catch (error) {
            console.error(`Error reading CSV file ${filePath}:`, error);
            return [];
        }
    }
}

module.exports = new CSVService();