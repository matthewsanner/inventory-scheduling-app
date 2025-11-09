import axios from "../utils/axiosConfig";
import { ErrorKeys } from "../constants/errorMessages";

const handleApiError = (error, fallbackKey = ErrorKeys.GENERIC_ERROR) => {
  console.error(error);
  return { errorKey: fallbackKey, error };
};

export const getItemBookingsByItem = async (itemId) => {
  try {
    const response = await axios.get(`itembookings/?item=${itemId}`);
    // Handle paginated response (results array) or direct array
    const bookings = response.data.results || response.data || [];
    return { data: bookings };
  } catch (error) {
    return handleApiError(error, ErrorKeys.LOAD_ITEM_BOOKINGS_FAILED);
  }
};

export const getItemBookingsByEvent = async (eventId) => {
  try {
    const response = await axios.get(`itembookings/?event=${eventId}`);
    // Handle paginated response (results array) or direct array
    const bookings = response.data.results || response.data || [];
    return { data: bookings };
  } catch (error) {
    return handleApiError(error, ErrorKeys.LOAD_ITEM_BOOKINGS_FAILED);
  }
};

