import api from "../api";

export const getStudentProfile = async () => {
  const response = await api.get("/students/profile");
  return response.data.profile;
};

export const getPlacementDrives = async () => {
  const response = await api.get("/drives");
  return response.data.drives;
};

export const getMyApplications = async () => {
  const response = await api.get("/applications");
  return response.data.applications;
};

export const getMyInterviews = async () => {
  const response = await api.get("/interviews");
  return response.data.interviews;
};