/**
 * Range Parser Utility for Lab Test Reference Ranges
 * Handles formats: "7.94 - 20.07", "0.72-1.18", "<5", ">100", "70-100 mg/dL", etc.
 */

/**
 * Parse reference range string into min/max values
 * @param {string} rangeStr - Reference range string
 * @returns {Object|null} - { min, max, type, value, text } or null if invalid
 */
export const parseRange = (rangeStr, depth = 0) => {
  if (!rangeStr || typeof rangeStr !== 'string') return null;
  
  // Prevent infinite recursion - max depth of 3
  if (depth > 3) return null;
  
  const s = rangeStr.toString().trim();
  
  // Handle "less than" format: <5, < 5
  if (s.match(/^<\s*[\d.]+/)) {
    const value = parseFloat(s.replace(/^<\s*/, ''));
    return { type: 'lt', value, max: value, text: s };
  }
  
  // Handle "greater than" format: >100, > 100
  if (s.match(/^>\s*[\d.]+/)) {
    const value = parseFloat(s.replace(/^>\s*/, ''));
    return { type: 'gt', value, min: value, text: s };
  }
  
  // Handle "less than or equal" format: <=5
  if (s.match(/^<=\s*[\d.]+/)) {
    const value = parseFloat(s.replace(/^<=\s*/, ''));
    return { type: 'lte', value, max: value, text: s };
  }
  
  // Handle "greater than or equal" format: >=100
  if (s.match(/^>=\s*[\d.]+/)) {
    const value = parseFloat(s.replace(/^>=\s*/, ''));
    return { type: 'gte', value, min: value, text: s };
  }
  
  // Handle range format: "7.94 - 20.07", "0.72-1.18", "70 - 100 mg/dL"
  // Remove units first (mg/dL, g/dL, %, etc.)
  const cleanStr = s.replace(/\s*(mg\/dL|g\/dL|mmol\/L|µmol\/L|IU\/L|%|cells\/µL|K\/µL|M\/µL)\s*$/i, '').trim();
  
  // Split by dash, en-dash, or em-dash (-, –, —)
  const parts = cleanStr.split(/\s*[-–—]\s*/);
  
  if (parts.length === 2) {
    const min = parseFloat(parts[0]);
    const max = parseFloat(parts[1]);
    
    if (!isNaN(min) && !isNaN(max)) {
      return { type: 'range', min, max, text: s };
    }
  }
  
  // Handle multi-line bio references - extract first numeric range
  // Only process if depth allows to prevent infinite recursion
  if (depth < 2) {
    const lines = s.split(/[\r\n]+/);
    for (const line of lines) {
      if (line.trim() && line.trim() !== s) { // Avoid parsing the same string
        const parsed = parseRange(line, depth + 1);
        if (parsed && (parsed.type === 'range' || parsed.type === 'lt' || parsed.type === 'gt')) {
          return parsed;
        }
      }
    }
  }
  
  // Cannot parse - return null
  return null;
};

/**
 * Check if a numeric value is outside reference range
 * @param {number|string} value - Test result value
 * @param {Object} range - Parsed range object from parseRange()
 * @returns {string} - 'HIGH', 'LOW', 'BOUNDARY', or 'NORMAL'
 */
export const checkRangeStatus = (value, range) => {
  if (!range) return 'NORMAL';
  
  const numValue = parseFloat(value);
  if (isNaN(numValue)) return 'NORMAL';
  
  // Less than range (<5)
  if (range.type === 'lt' || range.type === 'lte') {
    if (numValue > range.value) return 'HIGH';
    if (numValue === range.value) return 'BOUNDARY';
    return 'NORMAL';
  }
  
  // Greater than range (>100)
  if (range.type === 'gt' || range.type === 'gte') {
    if (numValue < range.value) return 'LOW';
    if (numValue === range.value) return 'BOUNDARY';
    return 'NORMAL';
  }
  
  // Standard range (7.94 - 20.07)
  if (range.type === 'range') {
    if (numValue < range.min) return 'LOW';
    if (numValue > range.max) return 'HIGH';
    if (numValue === range.min || numValue === range.max) return 'BOUNDARY';
    return 'NORMAL';
  }
  
  return 'NORMAL';
};

/**
 * Get color for status (RGB array for jsPDF)
 * @param {string} status - 'HIGH', 'LOW', 'BOUNDARY', or 'NORMAL'
 * @returns {Array} - RGB array [r, g, b]
 */
export const getStatusColor = (status) => {
  switch (status) {
    case 'HIGH':
      return [176, 0, 32]; // Red #b00020
    case 'LOW':
      return [29, 78, 216]; // Blue #1d4ed8
    case 'BOUNDARY':
      return [234, 88, 12]; // Orange #ea580c
    default:
      return [17, 17, 17]; // Black #111
  }
};

/**
 * Get background color for status (RGB array for jsPDF)
 * @param {string} status - 'HIGH', 'LOW', 'BOUNDARY', or 'NORMAL'
 * @returns {Array} - RGB array [r, g, b] or null
 */
export const getStatusBgColor = (status) => {
  switch (status) {
    case 'HIGH':
      return [254, 242, 242]; // Light red #fef2f2
    case 'LOW':
      return [239, 246, 255]; // Light blue #eff6ff
    case 'BOUNDARY':
      return [255, 247, 237]; // Light orange #fff7ed
    default:
      return null;
  }
};

/**
 * Determine if value should be bold
 * @param {string} status - 'HIGH', 'LOW', 'BOUNDARY', or 'NORMAL'
 * @returns {boolean}
 */
export const shouldBeBold = (status) => {
  return status === 'HIGH' || status === 'LOW' || status === 'BOUNDARY';
};

/**
 * Extract reference min/max from test snapshot
 * @param {Object} test - Test snapshot object
 * @returns {Object} - { min, max, rangeStr }
 */
export const extractReferenceFromTest = (test) => {
  // Priority 1: Use numeric refLow/refHigh if available
  if (test.refLow_snapshot !== null && test.refHigh_snapshot !== null) {
    return {
      min: parseFloat(test.refLow_snapshot),
      max: parseFloat(test.refHigh_snapshot),
      rangeStr: `${test.refLow_snapshot} – ${test.refHigh_snapshot}`
    };
  }
  
  // Priority 2: Parse bioReference
  if (test.bioReference_snapshot || test.bioReference) {
    const rangeStr = test.bioReference_snapshot || test.bioReference;
    const parsed = parseRange(rangeStr);
    if (parsed) {
      return {
        min: parsed.min,
        max: parsed.max,
        rangeStr: rangeStr.trim()
      };
    }
  }
  
  // Priority 3: Parse refText
  if (test.refText_snapshot || test.refText) {
    const rangeStr = test.refText_snapshot || test.refText;
    const parsed = parseRange(rangeStr);
    if (parsed) {
      return {
        min: parsed.min,
        max: parsed.max,
        rangeStr: rangeStr.trim()
      };
    }
  }
  
  return { min: null, max: null, rangeStr: '—' };
};

export default {
  parseRange,
  checkRangeStatus,
  getStatusColor,
  getStatusBgColor,
  shouldBeBold,
  extractReferenceFromTest
};
