/**
 * Format number with thousand separators (dots for Indonesian format)
 * @param {string|number} value - The value to format
 * @returns {string} - Formatted string with dots as thousand separators
 */
export const formatNumberWithDots = (value) => {
  if (!value && value !== 0) return '';
  
  // Remove any non-digit characters
  const numericValue = String(value).replace(/\D/g, '');
  
  if (!numericValue) return '';
  
  // Add dots as thousand separators
  return numericValue.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
};

/**
 * Parse formatted number string back to plain number string
 * @param {string} value - The formatted value with dots
 * @returns {string} - Plain number string without dots
 */
export const parseFormattedNumber = (value) => {
  if (!value && value !== 0) return '';
  return String(value).replace(/\./g, '');
};

/**
 * Parse formatted number string to integer
 * @param {string} value - The formatted value with dots
 * @returns {number} - Integer value
 */
export const parseFormattedNumberToInt = (value) => {
  if (!value && value !== 0) return 0;
  const parsed = parseInt(String(value).replace(/\./g, ''), 10);
  return isNaN(parsed) ? 0 : parsed;
};

/**
 * Parse formatted number string to float
 * @param {string} value - The formatted value with dots
 * @returns {number} - Float value
 */
export const parseFormattedNumberToFloat = (value) => {
  if (!value && value !== 0) return 0;
  const parsed = parseFloat(String(value).replace(/\./g, ''));
  return isNaN(parsed) ? 0 : parsed;
};
