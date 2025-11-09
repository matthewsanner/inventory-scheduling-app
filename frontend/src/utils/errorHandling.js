/**
 * Handles backend error responses and extracts validation errors
 * @param {Error} error - The error object from the API call
 * @param {string} defaultErrorKey - The default error key to use if no specific errors are found
 * @param {object} fieldMappings - Optional mappings for non-field errors (e.g., { non_field_errors: 'event' })
 * @returns {object} - Object containing formErrors and errorKey
 */
export const handleBackendError = (
  error,
  defaultErrorKey,
  fieldMappings = {}
) => {
  const result = {
    formErrors: {},
    errorKey: null,
  };

  // Log the error for debugging
  console.error("Backend error:", error);

  // Check if we have a response with data
  if (error.response?.data) {
    const backendErrors = error.response.data;
    let hasFieldErrors = false;

    // Handle specific field errors (e.g., quantity)
    Object.keys(backendErrors).forEach((key) => {
      if (key !== "non_field_errors" && backendErrors[key]) {
        hasFieldErrors = true;
        result.formErrors[key] = Array.isArray(backendErrors[key])
          ? backendErrors[key][0]
          : backendErrors[key];
      }
    });

    // Handle non_field_errors with optional field mapping
    if (backendErrors.non_field_errors) {
      hasFieldErrors = true;
      const targetField = fieldMappings.non_field_errors || "non_field_errors";
      result.formErrors[targetField] = Array.isArray(
        backendErrors.non_field_errors
      )
        ? backendErrors.non_field_errors[0]
        : backendErrors.non_field_errors;
    }

    // If no specific field errors were found, use the default error key
    if (!hasFieldErrors) {
      result.errorKey = defaultErrorKey;
    }
  } else {
    // No response data, use the default error key
    result.errorKey = defaultErrorKey;
  }

  return result;
};
