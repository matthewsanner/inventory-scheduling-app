/**
 * URL and text sanitization utilities for security
 */

/**
 * Validates and sanitizes a URL, ensuring it uses a safe protocol
 * @param {string} url - The URL to validate
 * @returns {string|null} - The sanitized URL if valid, null otherwise
 */
export const sanitizeUrl = (url) => {
  if (!url || typeof url !== "string") {
    return null;
  }

  const trimmedUrl = url.trim();
  if (!trimmedUrl) {
    return null;
  }

  // Allow relative URLs (starting with /) for local images
  if (trimmedUrl.startsWith("/")) {
    // Reject dangerous patterns like parent directory traversal
    // Use regex to only reject .. when it appears as a complete path segment
    if (/(^|\/)\.\.($|\/)/.test(trimmedUrl)) {
      return null;
    }
    // Reject any protocol-like patterns in relative URLs
    if (trimmedUrl.includes(":")) {
      return null;
    }
    return trimmedUrl;
  }

  // For absolute URLs, only allow http:// and https:// protocols
  if (!trimmedUrl.startsWith("http://") && !trimmedUrl.startsWith("https://")) {
    return null;
  }

  // Basic URL format validation for absolute URLs
  try {
    const urlObj = new URL(trimmedUrl);
    // Ensure it's http or https
    if (urlObj.protocol !== "http:" && urlObj.protocol !== "https:") {
      return null;
    }
    return trimmedUrl;
  } catch (e) {
    // Invalid URL format
    return null;
  }
};

/**
 * Validates an image URL specifically
 * @param {string} url - The image URL to validate
 * @returns {object} - Object with isValid boolean and sanitizedUrl string
 */
export const validateImageUrl = (url) => {
  const sanitized = sanitizeUrl(url);
  return {
    isValid: sanitized !== null,
    sanitizedUrl: sanitized,
  };
};

/**
 * Gets a safe image URL for rendering, with fallback to placeholder
 * @param {string} url - The image URL to sanitize
 * @param {string} fallbackUrl - Optional fallback URL if validation fails
 * @returns {string} - The safe URL to use, or fallback/empty string
 */
export const getSafeImageUrl = (url, fallbackUrl = "") => {
  if (!url) {
    return fallbackUrl || "";
  }

  const validated = validateImageUrl(url);
  if (validated.isValid) {
    return validated.sanitizedUrl;
  }

  // For relative URLs that might not pass strict validation, allow simple paths starting with / as a fallback
  // Use regex to only reject .. when it appears as a complete path segment
  if (
    typeof url === "string" &&
    url.trim().startsWith("/") &&
    !/(^|\/)\.\.($|\/)/.test(url.trim()) &&
    !url.includes(":")
  ) {
    return url.trim();
  }

  return fallbackUrl || "";
};
