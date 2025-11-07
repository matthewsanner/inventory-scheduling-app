import axios from "../utils/axiosConfig";

export const getEvent = (id) => {
  return axios.get(`events/${id}/`);
};

export const deleteEvent = (id) => {
  return axios.delete(`events/${id}/`);
};
