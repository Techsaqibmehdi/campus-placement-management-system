import api from "../api";

export const getStudentProfile = async () => {
  const response = await api.get("/students/profile");
  const profile = response.data.profile;
  if (profile && response.data.latestScoreRequest !== undefined) {
    profile.latestScoreRequest = response.data.latestScoreRequest;
  }
  return profile;
};

export const getPlacementDrives = async (params = {}) => {
  const response = await api.get("/drives", { params });
  return response.data.drives;
};

export const getDriveEligibility = async (driveId) => {
  const response = await api.get(`/drives/${driveId}/eligibility`);
  return response.data;
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

export const applyToDrive = async (driveId, resumeId = null) => {
  const payload = resumeId ? { resumeId } : {};
  const response = await api.post(`/applications/${driveId}`, payload);
  return response.data;
};

export const updateStudentProfile = async (profileData) => {
  const response = await api.put("/students/profile", profileData);
  return response.data.profile;
};

export const uploadStudentResume = async (file) => {
  const formData = new FormData();
  formData.append("resume", file);
  const response = await api.post("/students/resume", formData);
  return response.data;
};

export const deleteStudentResume = async (resumeId) => {
  const response = await api.delete(`/students/resume/${resumeId}`);
  return response.data;
};

export const setPrimaryStudentResume = async (resumeId) => {
  const response = await api.patch(`/students/resume/${resumeId}/primary`);
  return response.data;
};

export const submitScoreUpdateRequest = async (requestData) => {
  const response = await api.post("/students/score-update-request", requestData);
  return response.data;
};

export const getMyScoreUpdateRequests = async () => {
  const response = await api.get("/students/score-update-requests");
  return response.data.requests;
};

export const updateOfferStatus = async (offerId, status) => {
  const response = await api.patch(`/offers/${offerId}/status`, { status });
  return response.data;
};