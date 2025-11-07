import axios from "../utils/axiosConfig";

export const getCategories = () => {
  return axios.get(`items/categories/`);
};

export const createItem = (formData) => {
  return axios.post(`items/`, formData);
};
