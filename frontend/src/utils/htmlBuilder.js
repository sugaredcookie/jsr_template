import { evaluateRowHighlightStyles, evaluateMetricValue } from './evaluators';

/**
 * High-Fidelity Theming Configurations Stylesheet Presets Map
 */
const THEME_CONFIG = {
  silicon: {
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    monospaceFont: "SFMono-Regular, Consolas, 'Liberation Mono', Menlo, monospace",
    containerBg: '#ffffff',
    textColor: '#1e293b',
    headingColor: '#0f172a',
    subtextColor: '#64748b',
    borderStyle: '1px solid #e2e8f0',
    borderRadius: '16px',
    tableHeaderBg: '#f8fafc',
    cardBg: '#f8fafc',
    accentColor: '#6366f1',
    chartPieColors: `['rgba(99, 102, 241, 0.65)', 'rgba(168, 85, 247, 0.65)', 'rgba(234, 179, 8, 0.65)', 'rgba(16, 185, 129, 0.65)', 'rgba(244, 63, 94, 0.65)']`,
    chartBarBg: `'rgba(99, 102, 241, 0.15)'`,
    chartBorder: '#6366f1'
  },
  corporate: {
    fontFamily: "'Inter', 'Segoe UI', Helvetica, Arial, sans-serif",
    monospaceFont: "Consolas, Monaco, monospace",
    containerBg: '#f4f6f9',
    textColor: '#334155',
    headingColor: '#1e3a8a',
    subtextColor: '#475569',
    borderStyle: '1px solid #cbd5e1',
    borderRadius: '6px',
    tableHeaderBg: '#e2e8f0',
    cardBg: '#ffffff',
    accentColor: '#1d4ed8',
    chartPieColors: `['rgba(29, 78, 216, 0.7)', 'rgba(30, 41, 59, 0.7)', 'rgba(7, 89, 133, 0.7)', 'rgba(6, 95, 70, 0.7)', 'rgba(15, 23, 42, 0.7)']`,
    chartBarBg: `'rgba(29, 78, 216, 0.2)'`,
    chartBorder: '#1d4ed8'
  },
  editorial: {
    fontFamily: "Georgia, Cambria, 'Times New Roman', Times, serif",
    monospaceFont: "'Courier New', Courier, monospace",
    containerBg: '#fcfbf7',
    textColor: '#2d2d2d',
    headingColor: '#111111',
    subtextColor: '#555555',
    borderStyle: '1px solid #111111',
    borderRadius: '0px',
    tableHeaderBg: '#f1efe9',
    cardBg: '#fcfbf7',
    accentColor: '#111111',
    chartPieColors: `['rgba(17, 17, 17, 0.8)', 'rgba(85, 85, 85, 0.6)', 'rgba(150, 150, 150, 0.5)', 'rgba(200, 195, 185, 0.7)', 'rgba(110, 100, 90, 0.6)']`,
    chartBarBg: `'rgba(17, 17, 17, 0.08)'`,
    chartBorder: '#111111'
  }
};

/**
 * Build HTML preview from components and CSV data
 */
export const buildPreviewHtml = (components, csvData, theme = 'silicon') => {
  const cfg = THEME_CONFIG[theme] || THEME_CONFIG.silicon;

  let compiledHtml = `
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <div style="padding: 40px; width: 100%; max-width: 920px; margin: 0 auto; background: ${cfg.containerBg}; color: ${cfg.textColor}; text-align: left; font-family: ${cfg.fontFamily}; box-sizing: border-box; transition: all 0.3s ease;">`;
  
  components.forEach(comp => {
    if (comp.type === 'text') {
      compiledHtml += buildTextComponent(comp, cfg);
    } else if (comp.type === 'table') {
      compiledHtml += buildTableComponent(comp, csvData, cfg);
    } else if (comp.type === 'spacer') {
      compiledHtml += buildSpacerComponent(comp, cfg);
    } else if (comp.type === 'page-break') {
      compiledHtml += buildPageBreakComponent();
    } else if (comp.type === 'grid-row') {
      compiledHtml += buildGridRowComponent(comp, csvData, cfg);
    } else if (comp.type === 'chart') {
      compiledHtml += buildChartComponent(comp, csvData, cfg);
    }
  });
  
  compiledHtml += `</div>`;
  return compiledHtml;
};

/**
 * Build text component HTML
 */
const buildTextComponent = (comp, cfg) => {
  const styles = [
    `font-size: ${comp.props.fontSize || 16}px`,
    `font-weight: ${comp.props.bold ? 'bold' : 'normal'}`,
    `text-align: ${comp.props.align || 'left'}`,
    `color: ${comp.props.color || cfg.textColor}`,
    `font-family: ${comp.props.fontFamily || cfg.fontFamily}`,
    `margin-top: 0`,
    `margin-bottom: 16px`,
    `white-space: pre-wrap`,
    `word-break: break-word`,
    `line-height: 1.6`
  ].join('; ');
  return `<p style="${styles}">${comp.props.value || ''}</p>`;
};

/**
 * Build table component HTML with robust column toggling and pagination control rules
 */
const buildTableComponent = (comp, csvData, cfg) => {
  const { columns = [], columnMetadata = {}, repeatHeaderOnPageBreak = false } = comp.props;
  
  // Filter out columns explicitly flagged as hidden from the compilation stream
  const visibleColumns = columns.filter(col => !columnMetadata[col]?.hidden);

  // If repeat headers is flagged, inject layout rules to handle hard printing splits cleanly
  const tableStyles = repeatHeaderOnPageBreak 
    ? `width: 100%; border-collapse: collapse; text-align: left; font-size: 13px; table-layout: fixed; min-width: 650px; font-family: ${cfg.fontFamily};`
    : `width: 100%; border-collapse: collapse; text-align: left; font-size: 13px; table-layout: fixed; min-width: 650px; font-family: ${cfg.fontFamily};`;

  const theadStyles = repeatHeaderOnPageBreak ? `display: table-header-group; background: ${cfg.tableHeaderBg}; border-bottom: ${cfg.borderStyle};` : `background: ${cfg.tableHeaderBg}; border-bottom: ${cfg.borderStyle};`;
  const trPrintStyles = repeatHeaderOnPageBreak ? `page-break-inside: avoid; break-inside: avoid;` : '';

  let html = `<div style="width: 100%; overflow-x: auto; margin-bottom: 24px; border-radius: ${cfg.borderRadius}; border: ${cfg.borderStyle}; box-shadow: 0 1px 3px rgba(0,0,0,0.02); background: #ffffff;">`;
  html += `<table style="${tableStyles}">`;
  html += `<thead style="${theadStyles}"><tr style="${trPrintStyles}">`;
  
  visibleColumns.forEach(col => {
    const meta = columnMetadata[col] || { label: col, align: 'left', width: '' };
    const thWidth = meta.width ? `width: ${meta.width}%;` : '';
    html += `<th style="padding: 12px 14px; text-align: ${meta.align}; color: ${cfg.headingColor}; font-weight: 600; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; ${thWidth} overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${meta.label || col}</th>`;
  });
  
  html += `</tr></thead><tbody style="background: #ffffff;">`;

  const rowsToRender = csvData.slice(0, 5);
  rowsToRender.forEach((row, idx) => {
    const highlight = evaluateRowHighlightStyles(row, comp.props.highlightRule);
    const trBg = highlight.backgroundColor ? highlight.backgroundColor : '#ffffff';
    const trColor = highlight.color ? highlight.color : cfg.textColor;
    const rowBorder = idx === rowsToRender.length - 1 ? '' : `border-bottom: ${cfg.borderStyle};`;

    html += `<tr style="background-color: ${trBg}; color: ${trColor}; ${rowBorder} ${trPrintStyles}">`;
    visibleColumns.forEach(col => {
      const meta = columnMetadata[col] || { align: 'left' };
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
const buildSpacerComponent = (comp, cfg) => {
  if (comp.props.variant === 'line') {
    return `<div style="margin: ${parseInt(comp.props.height || 24) / 2}px 0; border-top: ${cfg.borderStyle}; width: 100%; opacity: 0.7;"></div>`;
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
const buildGridRowComponent = (comp, csvData, cfg) => {
  const gap = 16;
  
  let html = `<div style="display: table; table-layout: fixed; width: 100%; border-collapse: separate; border-spacing: ${gap}px 0px; margin-left: -${gap}px; margin-right: -${gap}px; margin-bottom: 24px;">`;
  html += `<div style="display: table-row;">`;
  
  comp.props.gridItems.forEach(item => {
    const val = evaluateMetricValue(csvData, item.column, item.operation);
    html += `
      <div style="display: table-cell; background: ${cfg.cardBg}; border: ${cfg.borderStyle}; border-radius: ${cfg.borderRadius}; padding: 18px; vertical-align: top; box-shadow: 0 1px 2px rgba(0,0,0,0.01);">
        <div style="font-size: 10px; text-transform: uppercase; color: ${cfg.subtextColor}; font-weight: 700; letter-spacing: 0.7px; font-family: ${cfg.fontFamily};">${item.title || 'Summary'}</div>
        <div style="font-size: 24px; font-weight: 800; color: ${cfg.headingColor}; margin-top: 6px; font-family: ${cfg.fontFamily}; tracking: -0.5px;">${val}</div>
        <div style="font-size: 9px; color: ${cfg.subtextColor}; margin-top: 4px; font-family: ${cfg.monospaceFont}; font-weight: 500; background: rgba(0,0,0,0.04); padding: 2px 6px; border-radius: 4px; display: inline-block;">${item.operation}(${item.operation === 'COUNT' ? 'all' : item.column})</div>
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
const buildChartComponent = (comp, csvData, cfg) => {
  const { 
    chartType = 'bar', 
    xAxisColumn = '', 
    yAxisColumn = '', 
    operation = 'COUNT', 
    title = 'Analytical Chart Layer' 
  } = comp.props;
  
  const canvasId = `render-canvas-target-${comp.id}`;
  const { labels, data } = transformDataForChart(csvData, xAxisColumn, yAxisColumn, operation);

  const chartColors = chartType === 'pie' ? cfg.chartPieColors : cfg.chartBarBg;

  return `
    <div style="width: 100%; margin-bottom: 28px; padding: 24px; background: #ffffff; border: ${cfg.borderStyle}; border-radius: ${cfg.borderRadius}; box-shadow: 0 1px 3px rgba(0,0,0,0.01); box-sizing: border-box;">
      <h4 style="margin: 0 0 20px 0; font-size: 11px; font-weight: 700; color: ${cfg.headingColor}; text-transform: uppercase; letter-spacing: 0.6px; font-family: ${cfg.fontFamily};">${title}</h4>
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
                borderColor: '${cfg.chartBorder}',
                borderWidth: 2,
                borderRadius: ${chartType === 'bar' ? 6 : 0},
                hoverBackgroundColor: '${cfg.accentColor}'
              }]
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: { display: ${chartType === 'pie'}, position: 'bottom', labels: { boxWidth: 12, font: { size: 11, family: "${cfg.fontFamily}" } } }
              },
              scales: ${chartType !== 'pie' ? `{
                y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.04)' }, ticks: { color: '${cfg.subtextColor}', font: { size: 10, family: "${cfg.fontFamily}" } } },
                x: { grid: { display: false }, ticks: { color: '${cfg.subtextColor}', font: { size: 10, family: "${cfg.fontFamily}" } } }
              }` : '{}'}
            }
          });
        })();
      </script>
    </div>
  `;
};