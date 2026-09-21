import api from "../api";

export const getPlacementAnalytics = async () => {
  try {
    const response = await api.get("/analytics/placement");
    return response.data;
  } catch (err) {
    const fallbackResponse = await api.get("/analytics");
    return fallbackResponse.data;
  }
};

export const getAllCompanies = async () => {
  const response = await api.get("/companies");
  return response.data.companies;
};

export const createCompany = async (companyData) => {
  const response = await api.post("/companies", companyData);
  return response.data.company;
};

export const assignRecruiterToCompany = async (companyId, recruiterId) => {
  const response = await api.put(`/companies/${companyId}/recruiter`, { recruiterId });
  return response.data.company;
};

export const updateCompany = async (companyId, companyData) => {
  const response = await api.put(`/companies/${companyId}`, companyData);
  return response.data.company;
};

export const deleteCompany = async (companyId) => {
  const response = await api.delete(`/companies/${companyId}`);
  return response.data;
};

export const getRecruitersList = async () => {
  const response = await api.get("/companies/recruiters-list");
  return response.data.recruiters;
};

export const getPendingApprovalDrives = async () => {
  const response = await api.get("/drives/pending-approval");
  return response.data.drives;
};

export const approveDrive = async (driveId) => {
  const response = await api.patch(`/drives/${driveId}/approve`);
  return response.data.drive;
};

export const rejectDrive = async (driveId) => {
  const response = await api.patch(`/drives/${driveId}/reject`);
  return response.data.drive;
};

export const getPendingRecruiters = async () => {
  const response = await api.get("/auth/recruiters/pending");
  return response.data.recruiters;
};

export const approveRecruiter = async (recruiterId) => {
  const response = await api.patch(`/auth/recruiters/${recruiterId}/approve`);
  return response.data.recruiter;
};

export const rejectRecruiter = async (recruiterId) => {
  const response = await api.patch(`/auth/recruiters/${recruiterId}/reject`);
  return response.data.recruiter;
};

export const getAllStudents = async (params = {}) => {
  const response = await api.get("/students", { params });
  return response.data;
};

export const toggleStudentStatus = async (userId, status) => {
  const response = await api.patch(`/students/${userId}/status`, { status });
  return response.data;
};

export const getAllDrivesForAdmin = async () => {
  const response = await api.get("/drives/my-drives");
  return response.data.drives;
};

export const createDriveByAdmin = async (driveData) => {
  const response = await api.post("/drives", driveData);
  return response.data.drive;
};

export const updateDriveStatus = async (driveId, status) => {
  const response = await api.patch(`/drives/${driveId}/status`, { status });
  return response.data.drive;
};

export const updateStudentByAdmin = async (userId, updateData) => {
  const response = await api.put(`/students/${userId}/admin-update`, updateData);
  return response.data;
};

export const getAllScoreUpdateRequests = async (params = {}) => {
  const response = await api.get("/students/admin/score-update-requests", { params });
  return response.data;
};

export const approveScoreUpdateRequest = async (requestId, data = {}) => {
  const response = await api.put(`/students/admin/score-update-requests/${requestId}/approve`, data);
  return response.data;
};

export const rejectScoreUpdateRequest = async (requestId, data = {}) => {
  const response = await api.put(`/students/admin/score-update-requests/${requestId}/reject`, data);
  return response.data;
};

