import axios from "../utils/axiosConfig";

export const getCurrentFutureEvents = () => {
  return axios.get(`events/current-future/`);
};

export const createItemBooking = (formData) => {
  return axios.post(`itembookings/`, formData);
};

