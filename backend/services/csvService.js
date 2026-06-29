const fs = require('fs');
const csv = require('csv-parser');

class CSVService {
  async parseCSV(filePath) {
    return new Promise((resolve, reject) => {
      const results = [];
      
      fs.createReadStream(filePath)
        .pipe(csv({
          skipEmptyLines: true,
          trim: true
        }))
        .on('data', (data) => {
          results.push(data);
        })
        .on('end', () => {
          resolve(results);
        })
        .on('error', (error) => {
          reject(error);
        });
    });
  }

  async getHeaders(filePath) {
    return new Promise((resolve, reject) => {
      const headers = [];
      
      fs.createReadStream(filePath)
        .pipe(csv())
        .on('headers', (headerList) => {
          headers.push(...headerList);
        })
        .on('end', () => {
          resolve(headers);
        })
        .on('error', (error) => {
          reject(error);
        });
    });
  }
}

module.exports = new CSVService();