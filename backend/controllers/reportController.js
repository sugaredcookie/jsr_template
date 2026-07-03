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
            
            // Get project data using datasource service
            const data = await datasourceService.getParsedData(projectId);
            
            // Build HTML using template builder
            const html = templateBuilder.buildTemplate(template, data);
            
            res.json({
                success: true,
                html
            });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    /**
     * Generate HTML report
     */
    async generateHTML(req, res) {
        try {
            const { projectId, template } = req.body;
            
            if (!projectId) {
                return res.status(400).json({ error: 'Project ID is required' });
            }
            
            if (!template) {
                return res.status(400).json({ error: 'Template is required' });
            }
            
            // Get project data using datasource service
            const data = await datasourceService.getParsedData(projectId);
            
            // Build HTML
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
                reportPath: `/storage/projects/${projectId}/reports/${reportName}`
            });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    /**
     * Generate PDF report using JSReport
     */
    async generatePDF(req, res) {
        try {
            const { projectId, template, options = {} } = req.body;
            
            if (!projectId) {
                return res.status(400).json({ error: 'Project ID is required' });
            }
            
            if (!template) {
                return res.status(400).json({ error: 'Template is required' });
            }
            
            // Get project data using datasource service
            const data = await datasourceService.getParsedData(projectId);
            
            // Build HTML
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
            
            // Return PDF as base64 or buffer
            res.json({
                success: true,
                pdf: pdfBuffer.toString('base64'),
                reportPath: `/storage/projects/${projectId}/reports/${reportName}`
            });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    /**
     * Get all reports for a project
     */
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
            res.status(500).json({ error: error.message });
        }
    }
}

module.exports = new ReportController();