/**
 * Detects whether a column's data is predominantly numeric or categorical string
 * Samples up to 10 rows for optimal data type assertion.
 */
export const detectColumnType = (csvData, column) => {
  if (!csvData || !csvData.length || !column) return 'string';
  
  const sampleRows = csvData.slice(0, 10);
  let numericCount = 0;
  let validCount = 0;

  sampleRows.forEach(row => {
    const val = row[column];
    if (val !== undefined && val !== null && String(val).trim() !== '') {
      validCount++;
      // Strip common units/currency signs to check for actual numeric floats
      const cleaned = String(val).replace(/[^0-9.-]/g, '');
      if (cleaned !== '' && !isNaN(parseFloat(cleaned))) {
        numericCount++;
      }
    }
  });

  if (validCount === 0) return 'string';
  // Treat as a numeric column if more than 70% of populated rows parse as numbers
  return (numericCount / validCount) > 0.7 ? 'number' : 'string';
};

/**
 * Intelligent Row Highlighting Stylist
 * Safely routes numbers to mathematical filters and strings to alpha matching rules
 */
export const evaluateRowHighlightStyles = (row, rule) => {
  if (!rule || !rule.column || !rule.operator || !rule.value) return {};
  
  const rawValue = row[rule.column];
  if (rawValue === undefined || rawValue === null) return {};

  const cellValue = parseFloat(String(rawValue).replace(/[^0-9.-]/g, ''));
  const targetLimit = parseFloat(rule.value);

  // Numeric routing evaluation pipeline
  if (!isNaN(cellValue) && !isNaN(targetLimit)) {
    switch (rule.operator) {
      case '>': if (cellValue > targetLimit) return { backgroundColor: rule.bgWash, color: rule.textColor }; break;
      case '<': if (cellValue < targetLimit) return { backgroundColor: rule.bgWash, color: rule.textColor }; break;
      case '==': if (cellValue === targetLimit) return { backgroundColor: rule.bgWash, color: rule.textColor }; break;
      case '!=': if (cellValue !== targetLimit) return { backgroundColor: rule.bgWash, color: rule.textColor }; break;
      default: return {};
    }
  }
  
  // Categorical string evaluation fallback
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
 * Type-Safe Intelligent Aggregation Engine
 * Calculates metrics safely based on column data type constraints
 */
export const evaluateMetricValue = (csvData, column, operation) => {
  // Guard: Ensure csvData is a valid populated array, not a string or empty object
  if (!csvData || !Array.isArray(csvData) || csvData.length === 0 || !column) return '—';

  if (operation === 'COUNT') {
    const populatedRows = csvData.filter(row => {
      if (!row || typeof row !== 'object') return false;
      
      const val = row[column];
      // Exclude undefined, null, empty padding cells, and PapaParse blank-line fallbacks
      return val !== undefined && val !== null && String(val).trim() !== '' && String(val).trim() !== '—';
    });
    
    return populatedRows.length.toLocaleString();
  }

  // Identify column dataset layout attributes safely
  const colType = detectColumnType(csvData, column);

  // Safeguard text fields from attempting aggregation operations
  if (colType === 'string' && (operation === 'SUM' || operation === 'AVG')) {
    return 'NaN (Text Field)';
  }

  // Parse strings into clean arrays of numerical values
  const values = csvData
    .map(row => {
      if (!row || typeof row !== 'object') return NaN;
      const rawValue = row[column];
      if (rawValue === undefined || rawValue === null) return NaN;
      return parseFloat(String(rawValue).replace(/[^0-9.-]/g, ''));
    })
    .filter(v => !isNaN(v));

  if (values.length === 0) return '0';

  const total = values.reduce((sum, val) => sum + val, 0);
  
  if (operation === 'SUM') {
    return total.toLocaleString(undefined, { maximumFractionDigits: 2 });
  }
  if (operation === 'AVG') {
    return (total / values.length).toLocaleString(undefined, { maximumFractionDigits: 2 });
  }
  
  return '0';
};

/**
 * Get component icon based on type
 */
export const getComponentIcon = (type) => {
  const icons = {
    text: 'fa-solid fa-font',
    table: 'fa-solid fa-table-columns',
    'grid-row': 'fa-solid fa-chart-pie',
    chart: 'fa-solid fa-chart-simple',
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
    chart: 'Analytics Chart',
    spacer: 'Spacer',
    'page-break': 'Page Break'
  };
  return labels[type] || type;
};