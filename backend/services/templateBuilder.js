class TemplateBuilder {
  buildTemplate(templateJson, csvData) {
    if (!templateJson || !templateJson.components) {
      throw new Error('Invalid template: missing components array');
    }

    let htmlContent = '';
    
    for (const component of templateJson.components) {
      htmlContent += this.buildComponent(component, csvData);
    }

    return this.wrapInHtmlDocument(htmlContent);
  }

  buildComponent(component, csvData) {
    switch (component.type) {
      case 'text':
        return this.buildTextComponent(component);
      case 'table':
        return this.buildTableComponent(component, csvData);
      default:
        console.warn(`Unknown component type: ${component.type}`);
        return '';
    }
  }

  buildTextComponent(component) {
    const { value, fontSize = 16, bold = false } = component.props || {};
    const style = `
      font-size: ${fontSize}px;
      font-weight: ${bold ? 'bold' : 'normal'};
      margin: 10px 0;
      line-height: 1.5;
      color: #333;
    `;
    
    return `<div style="${style}">${this.escapeHtml(String(value || ''))}</div>`;
  }

  buildTableComponent(component, csvData) {
    const columns = component.props?.columns || [];
    
    if (!columns || columns.length === 0) {
      return '<p style="color: #999; margin: 10px 0;">No columns selected for table</p>';
    }

    let tableHtml = `
      <table style="width: 100%; border-collapse: collapse; margin: 10px 0; font-size: 14px;">
        <thead>
          <tr style="background-color: #f5f5f5;">
    `;

    for (const col of columns) {
      tableHtml += `
        <th style="padding: 10px 12px; text-align: left; border-bottom: 2px solid #ddd; font-weight: 600; color: #333;">
          ${this.escapeHtml(String(col))}
        </th>
      `;
    }

    tableHtml += `
          </tr>
        </thead>
        <tbody>
    `;

    tableHtml += `
          {{#each data}}
          <tr style="border-bottom: 1px solid #eee;">
    `;

    for (const col of columns) {
      tableHtml += `
            <td style="padding: 8px 12px; color: #555;">
              {{this.${this.escapeHtml(String(col))}}}
            </td>
      `;
    }

    tableHtml += `
          </tr>
          {{/each}}
        </tbody>
      </table>
    `;

    if (csvData && csvData.length > 0) {
      tableHtml += `
        <p style="margin: 5px 0; color: #999; font-size: 12px; text-align: right;">
          Showing ${csvData.length} rows
        </p>
      `;
    }

    return tableHtml;
  }

  wrapInHtmlDocument(content) {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Report</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;
              padding: 40px;
              max-width: 1000px;
              margin: 0 auto;
              color: #333;
              line-height: 1.6;
            }
            h1, h2, h3, h4, h5, h6 {
              margin: 20px 0 10px 0;
            }
            table {
              width: 100%;
              border-collapse: collapse;
            }
            th {
              background-color: #f5f5f5;
              font-weight: 600;
            }
            th, td {
              padding: 10px 12px;
              text-align: left;
            }
            tr:nth-child(even) {
              background-color: #fafafa;
            }
            @media print {
              body {
                padding: 20px;
              }
              .no-print {
                display: none;
              }
            }
          </style>
        </head>
        <body>
          ${content}
        </body>
      </html>
    `;
  }

  escapeHtml(text) {
    if (!text) return '';
    
    const str = String(text);
    const htmlEscapes = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
      '/': '&#47;',
      '`': '&#96;',
      '=': '&#61;'
    };
    
    return str.replace(/[&<>"'`=/]/g, (match) => {
      return htmlEscapes[match] || match;
    });
  }
}

module.exports = new TemplateBuilder();