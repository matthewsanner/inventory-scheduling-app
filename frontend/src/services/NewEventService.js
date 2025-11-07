import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL;

export const createEvent = (formData) => {
  return axios.post(`${API_URL}events/`, formData);
};

