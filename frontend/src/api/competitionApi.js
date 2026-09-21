import api from "../api";

export const getCompetitions = async (params = {}) => {
  const response = await api.get("/competitions", { params });
  return response.data.competitions;
};

export const getCompetitionById = async (id) => {
  const response = await api.get(`/competitions/${id}`);
  return response.data.competition;
};

export const registerForCompetition = async (id) => {
  const response = await api.post(`/competitions/${id}/register`);
  return response.data;
};

export const getMyRegistrations = async () => {
  const response = await api.get("/competitions/my/registrations");
  return response.data.competitions;
};

export const createCompetition = async (competitionData) => {
  const response = await api.post("/competitions", competitionData);
  return response.data.competition;
};

export const updateCompetition = async (id, competitionData) => {
  const response = await api.put(`/competitions/${id}`, competitionData);
  return response.data.competition;
};

export const deleteCompetition = async (id) => {
  const response = await api.delete(`/competitions/${id}`);
  return response.data;
};

export const getCompetitionParticipants = async (id) => {
  const response = await api.get(`/competitions/${id}/participants`);
  return response.data;
};

