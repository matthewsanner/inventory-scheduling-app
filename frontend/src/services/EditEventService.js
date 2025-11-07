import axios from "../utils/axiosConfig";

export const fetchEventById = (id) => {
  return axios.get(`events/${id}/`);
};

export const updateEvent = (id, formData) => {
  return axios.put(`events/${id}/`, formData);
};
