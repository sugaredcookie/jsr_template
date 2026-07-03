const datasourceService = require('../services/datasourceService');
const templateBuilder = require('../services/templateBuilder');
const jsreportService = require('../services/jsreportService');
const path = require('path');
const fs = require('fs').promises;

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
            
            // Check if datasource is configured
            const hasDatasource = await datasourceService.hasDatasource(projectId);
            
            let data = [];
            if (hasDatasource) {
                data = await datasourceService.getParsedData(projectId);
            }
            
            // Build HTML using template builder
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
            
            // Save HTML report to project storage
            const reportName = `report-${Date.now()}.html`;
            const reportPath = path.join(
                __dirname,
                '..',
                'storage',
                'projects',
                projectId,
                'reports',
                reportName
            );
            
            await fs.mkdir(path.dirname(reportPath), { recursive: true });
            await fs.writeFile(reportPath, html);
            
            res.json({
                success: true,
                html,
                reportPath: `/storage/projects/${projectId}/reports/${reportName}`,
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
            const { projectId, template, options = {} } = req.body;
            
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
            
            // Save PDF report to project storage
            const reportName = `report-${Date.now()}.pdf`;
            const reportPath = path.join(
                __dirname,
                '..',
                'storage',
                'projects',
                projectId,
                'reports',
                reportName
            );
            
            await fs.mkdir(path.dirname(reportPath), { recursive: true });
            await fs.writeFile(reportPath, pdfBuffer);
            
            res.json({
                success: true,
                pdf: pdfBuffer.toString('base64'),
                reportPath: `/storage/projects/${projectId}/reports/${reportName}`,
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
                const files = await fs.readdir(reportsPath);
                for (const file of files) {
                    const stat = await fs.stat(path.join(reportsPath, file));
                    reports.push({
                        name: file,
                        size: stat.size,
                        created: stat.birthtime,
                        modified: stat.mtime
                    });
                }
            } catch (error) {
                // No reports directory yet
            }
            
            res.json(reports);
        } catch (error) {
            console.error('Get reports error:', error);
            res.status(500).json({ 
                error: 'Failed to get reports',
                message: error.message 
            });
        }
    }
}

module.exports = new ReportController();