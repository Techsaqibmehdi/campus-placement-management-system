import api from "../api";

export const getWorkshops = async (params = {}) => {
  const response = await api.get("/workshops", { params });
  return response.data.workshops;
};

export const getWorkshopById = async (id) => {
  const response = await api.get(`/workshops/${id}`);
  return response.data.workshop;
};

export const createWorkshop = async (workshopData) => {
  const response = await api.post("/workshops", workshopData);
  return response.data;
};

export const updateWorkshopStatus = async (id, status) => {
  const response = await api.patch(`/workshops/${id}/status`, { status });
  return response.data;
};

export const getWorkshopParticipants = async (id) => {
  const response = await api.get(`/workshops/${id}/participants`);
  return response.data;
};

export const registerFreeWorkshop = async (id) => {
  const response = await api.post(`/workshops/${id}/register-free`);
  return response.data;
};

export const createWorkshopOrder = async (id) => {
  const response = await api.post(`/workshops/${id}/create-order`);
  return response.data;
};

export const verifyWorkshopPayment = async (id, paymentData) => {
  const response = await api.post(`/workshops/${id}/verify-payment`, paymentData);
  return response.data;
};
