import axios from "../utils/axiosConfig";

export const createEvent = (formData) => {
  return axios.post(`events/`, formData);
};
