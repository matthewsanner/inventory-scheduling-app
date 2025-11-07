import axios from "../utils/axiosConfig";

export const getItem = (id) => {
  return axios.get(`items/${id}/`);
};

export const deleteItem = (id) => {
  return axios.delete(`items/${id}/`);
};
