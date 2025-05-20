import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL;

export const fetchCategories = () => {
  return axios.get(`${API_URL}items/categories/`);
};

export const fetchItemById = (id) => {
  return axios.get(`${API_URL}items/${id}/`);
};

export const updateItem = (id, formData) => {
  return axios.put(`${API_URL}items/${id}/`, formData);
};
