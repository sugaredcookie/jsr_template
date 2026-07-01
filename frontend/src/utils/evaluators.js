export const evaluateRowHighlightStyles = (row, rule) => {
  if (!rule || !rule.column || !rule.operator || !rule.value) return {};
  
  const rawValue = row[rule.column];
  const cellValue = parseFloat(String(rawValue).replace(/[^0-9.-]/g, ''));
  const targetLimit = parseFloat(rule.value);

  if (!isNaN(cellValue) && !isNaN(targetLimit)) {
    switch (rule.operator) {
      case '>': if (cellValue > targetLimit) return { backgroundColor: rule.bgWash, color: rule.textColor }; break;
      case '<': if (cellValue < targetLimit) return { backgroundColor: rule.bgWash, color: rule.textColor }; break;
      case '==': if (cellValue === targetLimit) return { backgroundColor: rule.bgWash, color: rule.textColor }; break;
      case '!=': if (cellValue !== targetLimit) return { backgroundColor: rule.bgWash, color: rule.textColor }; break;
      default: return {};
    }
  }
  
  const stringCell = String(rawValue).toLowerCase().trim();
  const stringTarget = String(rule.value).toLowerCase().trim();
  
  switch (rule.operator) {
    case '==': if (stringCell === stringTarget) return { backgroundColor: rule.bgWash, color: rule.textColor }; break;
    case '!=': if (stringCell !== stringTarget) return { backgroundColor: rule.bgWash, color: rule.textColor }; break;
    default: return {};
  }
  return {};
};

/**
 * Evaluate metric value for grid items
 */
export const evaluateMetricValue = (csvData, column, operation) => {
  if (!csvData.length || !column) return '—';

  if (operation === 'COUNT') return csvData.length.toLocaleString();

  const values = csvData
    .map(row => parseFloat(String(row[column] || '').replace(/[^0-9.-]/g, '')))
    .filter(v => !isNaN(v));

  if (values.length === 0) return '0';

  const total = values.reduce((sum, val) => sum + val, 0);
  if (operation === 'SUM') {
    return total.toLocaleString(undefined, { maximumFractionDigits: 2 });
  }
  if (operation === 'AVG') {
    return (total / values.length).toLocaleString(undefined, { maximumFractionDigits: 2 });
  }
  return 0;
};

/**
 * Get component icon based on type
 */
export const getComponentIcon = (type) => {
  const icons = {
    text: 'fa-solid fa-font',
    table: 'fa-solid fa-table-columns',
    'grid-row': 'fa-solid fa-chart-pie',
    spacer: 'fa-solid fa-arrows-left-right-to-line',
    'page-break': 'fa-solid fa-scissors'
  };
  return icons[type] || 'fa-solid fa-cube';
};

/**
 * Get component label for display
 */
export const getComponentLabel = (type) => {
  const labels = {
    text: 'Text',
    table: 'Table',
    'grid-row': 'Infographic Grid',
    spacer: 'Spacer',
    'page-break': 'Page Break'
  };
  return labels[type] || type;
};