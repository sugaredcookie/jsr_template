import { evaluateRowHighlightStyles, evaluateMetricValue } from './evaluators';

/**
 * Build HTML preview from components and CSV data
 */
export const buildPreviewHtml = (components, csvData) => {
  // Inject Chart.js CDN context ahead of the core design pipeline body
  let compiledHtml = `
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <div style="padding: 40px; width: 100%; max-width: 920px; margin: 0 auto; background: #ffffff; color: #1e293b; text-align: left; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; box-sizing: border-box;">`;
  
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
    } else if (comp.type === 'chart') {
      compiledHtml += buildChartComponent(comp, csvData);
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

/**
 * Transform, clean, group, and aggregate unstructured CSV streams for Chart engines
 */
const transformDataForChart = (csvData, xAxisCol, yAxisCol, operation) => {
  if (!csvData.length || !xAxisCol) return { labels: [], data: [] };

  const groups = {};
  csvData.forEach(row => {
    const key = String(row[xAxisCol] || 'Unassigned').trim();
    if (!groups[key]) groups[key] = [];

    if (operation !== 'COUNT' && yAxisCol) {
      const parsedVal = parseFloat(String(row[yAxisCol] || '').replace(/[^0-9.-]/g, ''));
      if (!isNaN(parsedVal)) groups[key].push(parsedVal);
    } else {
      groups[key].push(1);
    }
  });

  const labels = Object.keys(groups);
  const data = labels.map(key => {
    const datasetList = groups[key];
    if (operation === 'COUNT') return datasetList.length;
    if (datasetList.length === 0) return 0;

    const aggregateSum = datasetList.reduce((sum, val) => sum + val, 0);
    return operation === 'SUM' ? aggregateSum : parseFloat((aggregateSum / datasetList.length).toFixed(2));
  });

  return { labels, data };
};

/**
 * Build dynamic chart visualization container item block using sandboxed JavaScript CDNs
 */
const buildChartComponent = (comp, csvData) => {
  const { 
    chartType = 'bar', 
    xAxisColumn = '', 
    yAxisColumn = '', 
    operation = 'COUNT', 
    title = 'Analytical Chart Layer' 
  } = comp.props;
  
  const canvasId = `render-canvas-target-${comp.id}`;
  const { labels, data } = transformDataForChart(csvData, xAxisColumn, yAxisColumn, operation);

  // High-fidelity background hues for categorical pie/donut parameters
  const chartColors = chartType === 'pie' 
    ? `['rgba(99, 102, 241, 0.65)', 'rgba(168, 85, 247, 0.65)', 'rgba(234, 179, 8, 0.65)', 'rgba(16, 185, 129, 0.65)', 'rgba(244, 63, 94, 0.65)']` 
    : `'rgba(99, 102, 241, 0.15)'`;

  return `
    <div style="width: 100%; margin-bottom: 28px; padding: 24px; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; box-shadow: 0 1px 3px rgba(0,0,0,0.01); box-sizing: border-box;">
      <h4 style="margin: 0 0 20px 0; font-size: 11px; font-weight: 700; color: #475569; text-transform: uppercase; letter-spacing: 0.6px; font-family: sans-serif;">${title}</h4>
      <div style="position: relative; width: 100%; height: 320px;">
        <canvas id="${canvasId}"></canvas>
      </div>
      <script>
        (function() {
          const canvasTarget = document.getElementById('${canvasId}');
          if (!canvasTarget) return;
          
          new Chart(canvasTarget.getContext('2d'), {
            type: '${chartType}',
            data: {
              labels: ${JSON.stringify(labels)},
              datasets: [{
                label: '${operation === 'COUNT' ? 'Total Records' : operation + ' of ' + yAxisColumn}',
                data: ${JSON.stringify(data)},
                backgroundColor: ${chartColors},
                borderColor: '#6366f1',
                borderWidth: 2,
                borderRadius: ${chartType === 'bar' ? 6 : 0},
                hoverBackgroundColor: '#4f46e5'
              }]
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: { display: ${chartType === 'pie'}, position: 'bottom', labels: { boxWidth: 12, font: { size: 11 } } }
              },
              scales: ${chartType !== 'pie' ? `{
                y: { beginAtZero: true, grid: { color: '#f1f5f9' }, ticks: { color: '#64748b', font: { size: 10 } } },
                x: { grid: { display: false }, ticks: { color: '#64748b', font: { size: 10 } } }
              }` : '{}'}
            }
          });
        })();
      </script>
    </div>
  `;
};