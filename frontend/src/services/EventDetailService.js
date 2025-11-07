import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL;

export const getEvent = (id) => {
  return axios.get(`${API_URL}events/${id}/`);
};

export const deleteEvent = (id) => {
  return axios.delete(`${API_URL}events/${id}/`);
};

