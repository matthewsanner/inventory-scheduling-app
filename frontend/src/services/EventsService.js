import axios from "axios";
import { ErrorKeys } from "../constants/errorMessages";

const API_URL = import.meta.env.VITE_API_URL;

// Generic error handler
const handleApiError = (error, fallbackKey = ErrorKeys.GENERIC_ERROR) => {
  console.error(error);
  return { errorKey: fallbackKey, error };
};

export const getEvents = async (page, filters, pageSize = 10) => {
  try {
    // Convert date format to ISO datetime format for API
    const processedFilters = { ...filters };
    const dateFields = {
      'start_datetime_after': 'start', // Start of day (00:00:00)
      'start_datetime_before': 'end', // End of day (23:59:59)
    };

    Object.keys(dateFields).forEach((field) => {
      if (processedFilters[field]) {
        // Convert date (YYYY-MM-DD) to ISO datetime format
        const dateValue = processedFilters[field];
        if (dateValue && !dateValue.includes('T')) {
          // It's a date-only value, convert to ISO datetime
          const date = new Date(dateValue);
          if (!isNaN(date.getTime())) {
            if (dateFields[field] === 'start') {
              // Set to start of day (00:00:00) in local timezone, then convert to ISO
              date.setHours(0, 0, 0, 0);
            } else {
              // Set to end of day (23:59:59) in local timezone, then convert to ISO
              date.setHours(23, 59, 59, 999);
            }
            processedFilters[field] = date.toISOString();
          }
        }
      } else {
        // Remove empty date fields
        delete processedFilters[field];
      }
    });

    // Remove empty string filters
    Object.keys(processedFilters).forEach((key) => {
      if (processedFilters[key] === '') {
        delete processedFilters[key];
      }
    });

    const params = new URLSearchParams({
      page,
      ...processedFilters,
    });

    const response = await axios.get(`${API_URL}events/?${params}`);
    const pageCount = Math.ceil(response.data.count / pageSize);

    return { data: response.data.results, pageCount };
  } catch (error) {
    return handleApiError(error, ErrorKeys.LOAD_EVENTS_FAILED);
  }
};

