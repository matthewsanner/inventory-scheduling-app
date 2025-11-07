import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL;

export const fetchEventById = (id) => {
  return axios.get(`${API_URL}events/${id}/`);
};

export const updateEvent = (id, formData) => {
  return axios.put(`${API_URL}events/${id}/`, formData);
};
