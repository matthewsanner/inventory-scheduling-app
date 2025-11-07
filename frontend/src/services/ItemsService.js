import axios from "../utils/axiosConfig";
import { ErrorKeys } from "../constants/errorMessages";

// Generic error handler (optional)
const handleApiError = (error, fallbackKey = ErrorKeys.GENERIC_ERROR) => {
  console.error(error);
  return { errorKey: fallbackKey, error };
};

export const getCategories = async () => {
  try {
    const response = await axios.get(`items/categories/`);
    return { data: response.data };
  } catch (error) {
    return handleApiError(error, ErrorKeys.LOAD_CATEGORIES_FAILED);
  }
};

export const getItems = async (page, filters, pageSize = 10) => {
  try {
    const params = new URLSearchParams({
      page,
      ...filters,
    });

    const response = await axios.get(`items/?${params}`);
    const pageCount = Math.ceil(response.data.count / pageSize);

    return { data: response.data.results, pageCount };
  } catch (error) {
    return handleApiError(error, ErrorKeys.LOAD_ITEMS_FAILED);
  }
};
