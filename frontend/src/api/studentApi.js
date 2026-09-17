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

export const getMyOffers = async () => {
  const response = await api.get("/offers");
  return response.data.offers;
};

export const applyToDrive = async (driveId) => {
  const response = await api.post(`/applications/${driveId}`);

  return response.data;
};