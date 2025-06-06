import axios from "axios";
import { ErrorKeys } from "../constants/errorMessages";

const API_URL = import.meta.env.VITE_API_URL;

// Generic error handler (optional)
const handleApiError = (error, fallbackKey = ErrorKeys.GENERIC_ERROR) => {
  console.error(error);
  return { errorKey: fallbackKey, error };
};

export const getCategories = async () => {
  try {
    const response = await axios.get(`${API_URL}items/categories/`);
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

    const response = await axios.get(`${API_URL}items/?${params}`);
    const pageCount = Math.ceil(response.data.count / pageSize);

    return { data: response.data.results, pageCount };
  } catch (error) {
    return handleApiError(error, ErrorKeys.LOAD_ITEMS_FAILED);
  }
};
