/**
 * Validates quantity value
 * @param {string|number} quantity - The quantity value to validate
 * @returns {string|null} - Error message if invalid, null if valid
 */
export const validateQuantity = (quantity) => {
  const quantityNum = parseInt(quantity, 10);
  if (!quantity || isNaN(quantityNum) || quantityNum < 1) {
    return "Quantity must be at least 1.";
  }
  return null;
};
