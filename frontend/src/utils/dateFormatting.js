/**
 * Formats a date string to a localized date-time string
 * @param {string} dateString - The date string to format
 * @param {object} options - Optional formatting options (defaults to numeric month/day)
 * @returns {string} - Formatted date string, or empty string if input is invalid
 */
export const formatDateTime = (dateString, options = {}) => {
  if (!dateString) return "";
  
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "";
  
  const defaultOptions = {
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  };
  
  const formatOptions = { ...defaultOptions, ...options };
  
  return date.toLocaleString("en-US", formatOptions);
};

