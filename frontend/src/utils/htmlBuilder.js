import { evaluateRowHighlightStyles, evaluateMetricValue } from './evaluators';

/**
 * Build HTML preview from components and CSV data
 */
export const buildPreviewHtml = (components, csvData) => {
  let compiledHtml = `<div style="padding: 40px; width: 100%; margin: 0 auto; background: #ffffff; color: #1e293b; text-align: left;">`;
  
  components.forEach(comp => {
    if (comp.type === 'text') {
      compiledHtml += buildTextComponent(comp);
    } else if (comp.type === 'table') {
      compiledHtml += buildTableComponent(comp, csvData);
    } else if (comp.type === 'spacer') {
      compiledHtml += buildSpacerComponent(comp);
    } else if (comp.type === 'page-break') {
      compiledHtml += buildPageBreakComponent();
    } else if (comp.type === 'grid-row') {
      compiledHtml += buildGridRowComponent(comp, csvData);
    }
  });
  
  compiledHtml += `</div>`;
  return compiledHtml;
};

/**
 * Build text component HTML
 */
const buildTextComponent = (comp) => {
  const styles = [
    `font-size: ${comp.props.fontSize || 16}px`,
    `font-weight: ${comp.props.bold ? 'bold' : 'normal'}`,
    `text-align: ${comp.props.align || 'left'}`,
    `color: ${comp.props.color || '#1e293b'}`,
    `font-family: ${comp.props.fontFamily || 'Arial'}, sans-serif`,
    `margin-bottom: 15px`,
    `white-space: pre-wrap`,
    `word-break: break-word`
  ].join('; ');
  return `<p style="${styles}">${comp.props.value}</p>`;
};

/**
 * Build table component HTML
 */
const buildTableComponent = (comp, csvData) => {
  let html = `<div style="width: 100%; overflow-x: auto; margin-bottom: 20px; border-radius: 8px; border: 1px solid #e2e8f0;">`;
  html += `<table style="width:100%; border-collapse:collapse; font-family: sans-serif; font-size: 13px; table-layout: fixed;"><thead><tr style="background:#f8fafc; border-bottom: 2px solid #e2e8f0;">`;
  
  comp.props.columns.forEach(col => {
    const meta = comp.props.columnMetadata?.[col] || { label: col, align: 'left', width: '' };
    html += `<th style="border-right:1px solid #e2e8f0; padding:12px 10px; text-align:${meta.align}; color:#475569; font-weight:600; width:${meta.width}%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${meta.label || col}</th>`;
  });
  
  html += `</tr></thead><tbody>`;

  csvData.slice(0, 5).forEach(row => {
    const highlight = evaluateRowHighlightStyles(row, comp.props.highlightRule);
    const trInlineBg = highlight.backgroundColor ? `background-color: ${highlight.backgroundColor};` : 'background: #ffffff;';
    const trInlineColor = highlight.color ? `color: ${highlight.color};` : '';

    html += `<tr style="border-bottom: 1px solid #e2e8f0; ${trInlineBg} ${trInlineColor}">`;
    comp.props.columns.forEach(col => {
      const meta = comp.props.columnMetadata?.[col] || { align: 'left' };
      html += `<td style="border-right:1px solid #e2e8f0; padding:12px 10px; text-align:${meta.align}; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${row[col] || ''}</td>`;
    });
    html += `</tr>`;
  });
  html += `</tbody></table></div>`;
  return html;
};

/**
 * Build spacer component HTML
 */
const buildSpacerComponent = (comp) => {
  if (comp.props.variant === 'line') {
    return `<div style="margin: ${parseInt(comp.props.height || 24) / 2}px 0; border-top: 1px solid #e2e8f0; width: 100%;"></div>`;
  }
  return `<div style="height: ${comp.props.height || 24}px; width: 100%;"></div>`;
};

/**
 * Build page break component HTML
 */
const buildPageBreakComponent = () => {
  return `<div style="page-break-before: always; height: 0; margin: 0; border: none;"></div>`;
};

/**
 * Build grid row component HTML
 */
const buildGridRowComponent = (comp, csvData) => {
  let html = `<div style="display: flex; gap: 16px; width: 100%; margin-bottom: 20px;">`;
  comp.props.gridItems.forEach(item => {
    const val = evaluateMetricValue(csvData, item.column, item.operation);
    html += `
      <div style="flex: 1; padding: 16px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; font-family: sans-serif;">
        <div style="font-size: 10px; text-transform: uppercase; color: #64748b; font-weight: 700; letter-spacing: 0.5px;">${item.title}</div>
        <div style="font-size: 20px; font-weight: 700; color: #0f172a; margin-top: 4px;">${val}</div>
        <div style="font-size: 9px; color: #94a3b8; margin-top: 2px; font-family: monospace;">${item.operation}(${item.column || 'all'})</div>
      </div>`;
  });
  html += `</div>`;
  return html;
};