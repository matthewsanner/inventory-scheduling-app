import axios from "../utils/axiosConfig";

export const fetchCategories = () => {
  return axios.get(`items/categories/`);
};

export const fetchItemById = (id) => {
  return axios.get(`items/${id}/`);
};

export const updateItem = (id, formData) => {
  return axios.put(`items/${id}/`, formData);
};
