import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL;

export const getItem = (id) => {
  return axios.get(`${API_URL}items/${id}/`);
};

export const deleteItem = (id) => {
  return axios.delete(`${API_URL}items/${id}/`);
};
