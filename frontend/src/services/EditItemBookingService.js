import axios from "../utils/axiosConfig";

export const fetchItemBookingById = (id) => {
  return axios.get(`itembookings/${id}/`);
};

export const updateItemBooking = (id, formData) => {
  return axios.patch(`itembookings/${id}/`, formData);
};

export const deleteItemBooking = (id) => {
  return axios.delete(`itembookings/${id}/`);
};

