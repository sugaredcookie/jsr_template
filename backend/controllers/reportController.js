const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const csvService = require('../services/csvService');
const templateBuilder = require('../services/templateBuilder');
const jsreportService = require('../services/jsreportService');

const generateReport = async (req, res) => {
  try {
    console.log('📥 Received report generation request');
    
    // Validate request
    if (!req.file) {
      return res.status(400).json({ error: 'CSV file is required' });
    }

    if (!req.body.templateJson) {
      return res.status(400).json({ error: 'Template JSON is required' });
    }

    console.log(`📄 Processing CSV file: ${req.file.originalname}`);
    console.log(`📐 Template JSON length: ${req.body.templateJson.length} characters`);

    // Parse template JSON
    let template;
    try {
      template = typeof req.body.templateJson === 'string' 
        ? JSON.parse(req.body.templateJson) 
        : req.body.templateJson;
      
      // Validate template structure
      if (!template.components || !Array.isArray(template.components)) {
        throw new Error('Template must have a components array');
      }
      
      console.log(`✅ Template parsed successfully with ${template.components.length} components`);
    } catch (error) {
      console.error('❌ Template parsing error:', error.message);
      return res.status(400).json({ 
        error: 'Invalid template JSON format',
        details: error.message 
      });
    }

    // Parse CSV file
    const csvFilePath = req.file.path;
    console.log('🔄 Parsing CSV file...');
    
    const csvData = await csvService.parseCSV(csvFilePath);
    
    if (!csvData || csvData.length === 0) {
      return res.status(400).json({ 
        error: 'CSV file is empty or invalid',
        details: 'The uploaded CSV file contains no data rows'
      });
    }

    console.log(`✅ CSV parsed successfully with ${csvData.length} rows`);

    // Build HTML template from JSON
    console.log('🏗️ Building HTML template from JSON...');
    const htmlTemplate = templateBuilder.buildTemplate(template, csvData);
    console.log(`✅ HTML template built (${htmlTemplate.length} characters)`);

    // Generate HTML preview using JSReport
    console.log('📄 Generating HTML preview with JSReport...');
    const renderedHtml = await jsreportService.renderHtml(htmlTemplate, csvData);
    console.log('✅ HTML preview generated successfully');

    // Clean up uploaded CSV file
    fs.unlink(csvFilePath, (err) => {
      if (err) console.error('Error deleting CSV file:', err);
    });

    // Return HTML preview
    res.status(200).json({
      success: true,
      message: 'Preview generated successfully',
      html: renderedHtml,
      rowCount: csvData.length,
      componentsCount: template.components.length,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error generating report preview:', error);
    
    // Clean up uploaded file if it exists
    if (req.file && req.file.path) {
      fs.unlink(req.file.path, (err) => {
        if (err) console.error('Error deleting CSV file:', err);
      });
    }

    // Determine appropriate status code
    let statusCode = 500;
    let errorMessage = 'Failed to generate preview';
    
    if (error.message.includes('CSV')) {
      statusCode = 400;
      errorMessage = 'CSV processing error';
    } else if (error.message.includes('template')) {
      statusCode = 400;
      errorMessage = 'Template processing error';
    }

    res.status(statusCode).json({
      error: errorMessage,
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

module.exports = {
  generateReport
};