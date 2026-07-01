import { evaluateRowHighlightStyles, evaluateMetricValue } from './evaluators';

/**
 * Build HTML preview from components and CSV data
 */
export const buildPreviewHtml = (components, csvData) => {
  let compiledHtml = `<div style="padding: 40px; width: 100%; max-width: 920px; margin: 0 auto; background: #ffffff; color: #1e293b; text-align: left; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; box-sizing: border-box;">`;
  
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
    `margin-top: 0`,
    `margin-bottom: 16px`,
    `white-space: pre-wrap`,
    `word-break: break-word`,
    `line-height: 1.5`
  ].join('; ');
  return `<p style="${styles}">${comp.props.value || ''}</p>`;
};

/**
 * Build table component HTML with robust conditional highlighting mapping rules
 */
const buildTableComponent = (comp, csvData) => {
  let html = `<div style="width: 100%; overflow-x: auto; margin-bottom: 24px; border-radius: 12px; border: 1px solid #e2e8f0; box-shadow: 0 1px 3px rgba(0,0,0,0.02);">`;
  html += `<table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 13px; table-layout: fixed; min-width: 650px;">`;
  html += `<thead><tr style="background: #f8fafc; border-bottom: 1px solid #e2e8f0;">`;
  
  comp.props.columns.forEach(col => {
    const meta = comp.props.columnMetadata?.[col] || { label: col, align: 'left', width: '' };
    const thWidth = meta.width ? `width: ${meta.width}%;` : '';
    html += `<th style="padding: 12px 14px; text-align: ${meta.align}; color: #475569; font-weight: 600; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; ${thWidth} overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${meta.label || col}</th>`;
  });
  
  html += `</tr></thead><tbody style="background: #ffffff;">`;

  const rowsToRender = csvData.slice(0, 5);
  rowsToRender.forEach((row, idx) => {
    const highlight = evaluateRowHighlightStyles(row, comp.props.highlightRule);
    const trBg = highlight.backgroundColor ? highlight.backgroundColor : '#ffffff';
    const trColor = highlight.color ? highlight.color : '#334155';
    const rowBorder = idx === rowsToRender.length - 1 ? '' : 'border-bottom: 1px solid #f1f5f9;';

    html += `<tr style="background-color: ${trBg}; color: ${trColor}; ${rowBorder} transition: background-color 0.2s;">`;
    comp.props.columns.forEach(col => {
      const meta = comp.props.columnMetadata?.[col] || { align: 'left' };
      html += `<td style="padding: 12px 14px; text-align: ${meta.align}; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; line-height: 1.4;">${row[col] !== undefined ? row[col] : '—'}</td>`;
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
    return `<div style="margin: ${parseInt(comp.props.height || 24) / 2}px 0; border-top: 1px solid #e2e8f0; width: 100%; opacity: 0.7;"></div>`;
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
 * Build combined modular metric card container block
 */
const buildGridRowComponent = (comp, csvData) => {
  const gap = 16;
  const columnsCount = comp.props.columnsCount || comp.props.gridItems.length || 2;
  
  let html = `<div style="display: table; table-layout: fixed; width: 100%; border-collapse: separate; border-spacing: ${gap}px 0px; margin-left: -${gap}px; margin-right: -${gap}px; margin-bottom: 24px;">`;
  html += `<div style="display: table-row;">`;
  
  comp.props.gridItems.forEach(item => {
    const val = evaluateMetricValue(csvData, item.column, item.operation);
    html += `
      <div style="display: table-cell; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 16px; padding: 18px; vertical-align: top; box-shadow: 0 1px 2px rgba(0,0,0,0.01);">
        <div style="font-size: 10px; text-transform: uppercase; color: #64748b; font-weight: 700; letter-spacing: 0.7px; font-family: sans-serif;">${item.title || 'Summary'}</div>
        <div style="font-size: 24px; font-weight: 800; color: #0f172a; margin-top: 6px; font-family: sans-serif; tracking: -0.5px;">${val}</div>
        <div style="font-size: 9px; color: #94a3b8; margin-top: 4px; font-family: monospace; font-weight: 500; background: #eee; padding: 2px 6px; border-radius: 4px; display: inline-block;">${item.operation}(${item.operation === 'COUNT' ? 'all' : item.column})</div>
      </div>`;
  });
  
  html += `</div></div>`;
  return html;
};