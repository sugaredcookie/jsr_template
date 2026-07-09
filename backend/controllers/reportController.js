const datasourceService = require('../services/datasourceService');
const templateBuilder = require('../services/templateBuilder');
const jsreportService = require('../services/jsreportService');
const path = require('path');
const fs = require('fs').promises;
const { v4: uuidv4 } = require('uuid');

class ReportController {
    async previewReport(req, res) {
        try {
            const { projectId, template } = req.body;
            
            if (!projectId) {
                return res.status(400).json({ error: 'Project ID is required' });
            }
            
            if (!template) {
                return res.status(400).json({ error: 'Template is required' });
            }
            
            const hasDatasource = await datasourceService.hasDatasource(projectId);
            let data = [];
            
            if (hasDatasource) {
                data = await datasourceService.getParsedData(projectId);
            }
            
            const html = templateBuilder.buildTemplate(template, data);
            
            res.json({
                success: true,
                html,
                hasData: data.length > 0,
                dataCount: data.length
            });
        } catch (error) {
            console.error('Preview report error:', error);
            res.status(500).json({ 
                error: 'Failed to preview report',
                message: error.message 
            });
        }
    }

    async generateHTML(req, res) {
        try {
            const { projectId, template, templateId, reportName } = req.body;
            
            if (!projectId) {
                return res.status(400).json({ error: 'Project ID is required' });
            }
            
            if (!template) {
                return res.status(400).json({ error: 'Template is required' });
            }
            
            const hasDatasource = await datasourceService.hasDatasource(projectId);
            let data = [];
            
            if (hasDatasource) {
                data = await datasourceService.getParsedData(projectId);
            }
            
            const html = templateBuilder.buildTemplate(template, data);
            
            // Generate unique ID for the report
            const reportId = uuidv4();
            const reportsPath = path.join(
                __dirname,
                '..',
                'storage',
                'projects',
                projectId,
                'reports'
            );
            
            // Ensure reports directory exists
            await fs.mkdir(reportsPath, { recursive: true });
            
            // Save HTML report
            const htmlFileName = `${reportId}.html`;
            const htmlFilePath = path.join(reportsPath, htmlFileName);
            await fs.writeFile(htmlFilePath, html);
            
            // Save report metadata
            const metadata = {
                id: reportId,
                projectId: projectId,
                templateId: templateId || null,
                name: reportName || `Report ${new Date().toISOString()}`,
                format: 'html',
                fileName: htmlFileName,
                createdAt: new Date().toISOString()
            };
            
            const metadataFilePath = path.join(reportsPath, `${reportId}.json`);
            await fs.writeFile(metadataFilePath, JSON.stringify(metadata, null, 2));
            
            res.json({
                success: true,
                html,
                reportId: reportId,
                reportPath: `/storage/projects/${projectId}/reports/${htmlFileName}`,
                metadata: metadata,
                hasData: data.length > 0,
                dataCount: data.length
            });
        } catch (error) {
            console.error('Generate HTML error:', error);
            res.status(500).json({ 
                error: 'Failed to generate HTML',
                message: error.message 
            });
        }
    }

    async generatePDF(req, res) {
        try {
            const { projectId, template, templateId, reportName, options = {} } = req.body;
            
            if (!projectId) {
                return res.status(400).json({ error: 'Project ID is required' });
            }
            
            if (!template) {
                return res.status(400).json({ error: 'Template is required' });
            }
            
            const hasDatasource = await datasourceService.hasDatasource(projectId);
            let data = [];
            
            if (hasDatasource) {
                data = await datasourceService.getParsedData(projectId);
            }
            
            const html = templateBuilder.buildTemplate(template, data);
            
            // Generate PDF using JSReport
            const pdfBuffer = await jsreportService.generatePDF(html, options);
            
            // Generate unique ID for the report
            const reportId = uuidv4();
            const reportsPath = path.join(
                __dirname,
                '..',
                'storage',
                'projects',
                projectId,
                'reports'
            );
            
            // Ensure reports directory exists
            await fs.mkdir(reportsPath, { recursive: true });
            
            // Save PDF report
            const pdfFileName = `${reportId}.pdf`;
            const pdfFilePath = path.join(reportsPath, pdfFileName);
            await fs.writeFile(pdfFilePath, pdfBuffer);
            
            // Save report metadata
            const metadata = {
                id: reportId,
                projectId: projectId,
                templateId: templateId || null,
                name: reportName || `Report ${new Date().toISOString()}`,
                format: 'pdf',
                fileName: pdfFileName,
                createdAt: new Date().toISOString()
            };
            
            const metadataFilePath = path.join(reportsPath, `${reportId}.json`);
            await fs.writeFile(metadataFilePath, JSON.stringify(metadata, null, 2));
            
            res.json({
                success: true,
                pdf: pdfBuffer.toString('base64'),
                reportId: reportId,
                reportPath: `/storage/projects/${projectId}/reports/${pdfFileName}`,
                metadata: metadata,
                hasData: data.length > 0,
                dataCount: data.length
            });
        } catch (error) {
            console.error('Generate PDF error:', error);
            res.status(500).json({ 
                error: 'Failed to generate PDF',
                message: error.message 
            });
        }
    }

    async getReports(req, res) {
        try {
            const { projectId } = req.params;
            const reportsPath = path.join(
                __dirname,
                '..',
                'storage',
                'projects',
                projectId,
                'reports'
            );
            
            const reports = [];
            
            try {
                await fs.access(reportsPath);
                const files = await fs.readdir(reportsPath);
                
                for (const file of files) {
                    if (file.endsWith('.json')) {
                        try {
                            const content = await fs.readFile(
                                path.join(reportsPath, file),
                                'utf8'
                            );
                            const metadata = JSON.parse(content);
                            reports.push(metadata);
                        } catch (err) {
                            console.warn(`Failed to parse report metadata ${file}:`, err);
                        }
                    }
                }
            } catch (error) {
                // Reports directory doesn't exist
                console.log(`No reports directory for project ${projectId}`);
            }
            
            // Sort by creation date (newest first)
            reports.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            
            res.json(reports);
        } catch (error) {
            console.error('Get reports error:', error);
            res.status(500).json({ 
                error: 'Failed to get reports',
                message: error.message 
            });
        }
    }

    async getReport(req, res) {
        try {
            const { projectId, reportId } = req.params;
            const reportPath = path.join(
                __dirname,
                '..',
                'storage',
                'projects',
                projectId,
                'reports',
                `${reportId}.json`
            );
            
            try {
                const content = await fs.readFile(reportPath, 'utf8');
                const metadata = JSON.parse(content);
                
                // Also get the actual file content
                const filePath = path.join(
                    __dirname,
                    '..',
                    'storage',
                    'projects',
                    projectId,
                    'reports',
                    metadata.fileName
                );
                
                const fileContent = await fs.readFile(filePath, 'utf8');
                
                res.json({
                    metadata: metadata,
                    content: fileContent
                });
            } catch (error) {
                return res.status(404).json({ error: 'Report not found' });
            }
        } catch (error) {
            console.error('Get report error:', error);
            res.status(500).json({ 
                error: 'Failed to get report',
                message: error.message 
            });
        }
    }

    async deleteReport(req, res) {
        try {
            const { projectId, reportId } = req.params;
            
            const metadataPath = path.join(
                __dirname,
                '..',
                'storage',
                'projects',
                projectId,
                'reports',
                `${reportId}.json`
            );
            
            try {
                const content = await fs.readFile(metadataPath, 'utf8');
                const metadata = JSON.parse(content);
                
                // Delete the actual file
                const filePath = path.join(
                    __dirname,
                    '..',
                    'storage',
                    'projects',
                    projectId,
                    'reports',
                    metadata.fileName
                );
                
                await fs.unlink(filePath);
                
                // Delete metadata
                await fs.unlink(metadataPath);
            } catch (error) {
                return res.status(404).json({ error: 'Report not found' });
            }
            
            res.json({
                success: true,
                message: 'Report deleted successfully'
            });
        } catch (error) {
            console.error('Delete report error:', error);
            res.status(500).json({ 
                error: 'Failed to delete report',
                message: error.message 
            });
        }
    }
    // Add this method to reportController.js

    async generatePDFFromHTML(req, res) {
      try {
        const { projectId, html } = req.body;
        
        if (!projectId) {
          return res.status(400).json({ error: 'Project ID is required' });
        }
        
        if (!html) {
          return res.status(400).json({ error: 'HTML content is required' });
        }
        
        // Generate PDF using JSReport
        const pdfBuffer = await jsreportService.generatePDF(html, {});
        
        // Generate unique ID for the report
        const reportId = uuidv4();
        const reportsPath = path.join(
          __dirname,
          '..',
          'storage',
          'projects',
          projectId,
          'reports'
        );
        
        // Ensure reports directory exists
        await fs.mkdir(reportsPath, { recursive: true });
        
        // Save PDF report
        const pdfFileName = `${reportId}.pdf`;
        const pdfFilePath = path.join(reportsPath, pdfFileName);
        await fs.writeFile(pdfFilePath, pdfBuffer);
        
        // Save report metadata
        const metadata = {
          id: reportId,
          projectId: projectId,
          name: `Report ${new Date().toISOString()}`,
          format: 'pdf',
          fileName: pdfFileName,
          createdAt: new Date().toISOString()
        };
        
        const metadataFilePath = path.join(reportsPath, `${reportId}.json`);
        await fs.writeFile(metadataFilePath, JSON.stringify(metadata, null, 2));
        
        res.json({
          success: true,
          pdf: pdfBuffer.toString('base64'),
          reportId: reportId,
          reportPath: `/storage/projects/${projectId}/reports/${pdfFileName}`,
          metadata: metadata
        });
      } catch (error) {
        console.error('Generate PDF from HTML error:', error);
        res.status(500).json({ 
          error: 'Failed to generate PDF',
          message: error.message 
        });
      }
    }
}

module.exports = new ReportController();