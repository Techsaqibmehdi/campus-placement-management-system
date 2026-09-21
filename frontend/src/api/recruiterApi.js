import api from "../api";

export const getMyCompany = async () => {
  const response = await api.get("/companies/my-company");
  return response.data.company;
};

export const updateMyCompany = async (companyData) => {
  const response = await api.put("/companies/my-company", companyData);
  return response.data.company;
};

export const getMyDrives = async () => {
  const response = await api.get("/drives/my-drives");
  return response.data.drives;
};

export const createDrive = async (driveData) => {
  const response = await api.post("/drives", driveData);
  return response.data.drive;
};

export const updateDrive = async (driveId, driveData) => {
  const response = await api.put(`/drives/${driveId}`, driveData);
  return response.data.drive;
};

export const updateDriveStatus = async (driveId, status) => {
  const response = await api.patch(`/drives/${driveId}/status`, { status });
  return response.data.drive;
};

export const getRecruiterApplications = async (params = {}) => {
  const response = await api.get("/applications/recruiter", { params });
  return response.data.applications;
};

export const getDriveApplications = async (driveId, params = {}) => {
  const response = await api.get(`/applications/drive/${driveId}`, { params });
  return response.data;
};

export const updateApplicationStatus = async (applicationId, status, comments = "") => {
  const response = await api.patch(`/applications/${applicationId}/status`, {
    status,
    comments,
  });
  return response.data.application;
};

export const getRecruiterInterviews = async () => {
  const response = await api.get("/interviews/recruiter");
  return response.data.interviews;
};

export const scheduleInterview = async (applicationId, interviewData) => {
  const response = await api.post(`/interviews/${applicationId}`, interviewData);
  return response.data.interview;
};

export const recordInterviewResult = async (interviewId, evaluationData) => {
  const response = await api.patch(`/interviews/${interviewId}/result`, evaluationData);
  return response.data.interview;
};

export const createOffer = async (applicationId, offerData) => {
  const response = await api.post(`/applications/${applicationId}/offer`, offerData);
  return response.data.offer;
};

export const getRecruiterOffers = async () => {
  const response = await api.get("/offers/recruiter");
  return response.data.offers;
};

export const bulkUpdateApplicationStatus = async (applicationIds, status, comments = "") => {
  const response = await api.patch("/applications/bulk/status", {
    applicationIds,
    status,
    comments,
  });
  return response.data;
};


