import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL;

export const getCategories = () => {
  return axios.get(`${API_URL}items/categories/`);
};

export const createItem = (formData) => {
  return axios.post(`${API_URL}items/`, formData);
};
