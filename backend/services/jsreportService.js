const fs = require('fs').promises;
const path = require('path');

class JSReportService {
  constructor() {
    this.jsreport = null;
    this.initialized = false;
  }

  async getJSReportInstance() {
    if (global.jsreportInstance) {
      return global.jsreportInstance;
    }

    if (!this.initialized || !this.jsreport) {
      await this.initialize();
    }
    
    return this.jsreport;
  }

  async initialize() {
    try {
      console.log('🔄Initializing JSReport service...');
      
      if (global.jsreportInstance) {
        this.jsreport = global.jsreportInstance;
        this.initialized = true;
        console.log('✅Using existing JSReport instance');
        return this.jsreport;
      }

      const jsreportModule = require('jsreport');
      this.jsreport = jsreportModule();
      await this.jsreport.init();
      
      console.log('✅JSReport initialized successfully');
      
      global.jsreportInstance = this.jsreport;
      this.initialized = true;
      
      return this.jsreport;
      
    } catch (error) {
      console.error('❌ Failed to initialize JSReport:', error.message);
      throw new Error(`JSReport initialization failed: ${error.message}`);
    }
  }

  async renderHtml(htmlTemplate, data) {
    try {
      const jsreportInstance = await this.getJSReportInstance();

      console.log('📄 Rendering HTML with JSReport...');

      const template = {
        content: htmlTemplate,
        engine: 'handlebars',
        recipe: 'html'
      };

      const reportData = { 
        data: data,
        rowCount: data.length,
        generatedAt: new Date().toISOString()
      };

      console.log(`🔄 Rendering HTML with ${data.length} rows...`);

      const result = await jsreportInstance.render({
        template: template,
        data: reportData
      });

      const renderedHtml = result.content.toString('utf-8');      
      console.log(`✅ HTML rendered successfully (${renderedHtml.length} characters)`);
      return renderedHtml;

    } catch (error) {
      console.error('❌ Error rendering HTML with JSReport:', error);
      console.warn('⚠️ JSReport rendering failed, falling back to direct HTML...');
      return this.fallbackRender(htmlTemplate, data);
    }
  }

  fallbackRender(htmlTemplate, data) {
    console.log('🔄 Using fallback HTML renderer...');
    
    let html = htmlTemplate;
    const eachRegex = /\{\{#each data\}\}([\s\S]*?)\{\{\/each\}\}/g;
    html = html.replace(eachRegex, (match, content) => {
      let rows = '';
      for (const row of data) {
        let rowHtml = content;
        for (const [key, value] of Object.entries(row)) {
          const placeholder = `{{this.${key}}}`;
          rowHtml = rowHtml.replace(new RegExp(placeholder, 'g'), value || '');
        }
        rows += rowHtml;
      }
      return rows;
    });

    html = html.replace(/\{\{rowCount\}\}/g, data.length);
    html = html.replace(/\{\{generatedAt\}\}/g, new Date().toISOString());
    html = html.replace(/\{\{this\.[^}]*\}\}/g, '');
    
    console.log('✅ Fallback rendering complete');
    return html;
  }

  // async generatePDF(htmlTemplate, data, outputPath) {
  //   try {
  //     const jsreportInstance = await this.getJSReportInstance();

  //     console.log('📄 Generating PDF with Chrome PDF...');

  //     const template = {
  //       content: htmlTemplate,
  //       engine: 'handlebars',
  //       recipe: 'chrome-pdf',
  //       chrome: {
  //         format: 'A4',
  //         margin: {
  //           top: '20px',
  //           bottom: '20px',
  //           left: '20px',
  //           right: '20px'
  //         },
  //         printBackground: true,
  //         landscape: false,
  //         scale: 1,
  //         waitForJS: true,
  //         timeout: 60000
  //       }
  //     };

  //     const reportData = { 
  //       data: data,
  //       rowCount: data.length,
  //       generatedAt: new Date().toISOString()
  //     };

  //     console.log(`🔄 Generating PDF with ${data.length} rows...`);

  //     const result = await jsreportInstance.render({
  //       template: template,
  //       data: reportData
  //     });

  //     await fs.writeFile(outputPath, result.content);

  //     console.log(`✅ PDF generated successfully: ${outputPath}`);
  //     return outputPath;

  //   } catch (error) {
  //     console.error('❌ Error generating PDF:', error);
  //     throw new Error(`Failed to generate PDF: ${error.message}`);
  //   }
  // }

  //keeping the pdf generatinon on hold for now

  async healthCheck() {
    try {
      const instance = await this.getJSReportInstance();
      return !!instance;
    } catch (error) {
      console.error('JSReport health check failed:', error.message);
      return false;
    }
  }
}

module.exports = new JSReportService();