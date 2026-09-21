import { useState, useEffect } from "react";
import {
  getPlacementAnalytics,
  getAllCompanies,
  createCompany,
  updateCompany,
  deleteCompany,
  getRecruitersList,
  assignRecruiterToCompany,
  getPendingApprovalDrives,
  approveDrive,
  rejectDrive,
  getPendingRecruiters,
  approveRecruiter,
  rejectRecruiter,
  getAllStudents,
  toggleStudentStatus,
  getAllDrivesForAdmin,
  createDriveByAdmin,
  updateDriveStatus,
  updateStudentByAdmin,
  getAllScoreUpdateRequests,
  approveScoreUpdateRequest,
  rejectScoreUpdateRequest,
} from "../api/adminApi";
import {
  getCompetitions,
  createCompetition,
  deleteCompetition,
  getCompetitionParticipants,
} from "../api/competitionApi";
import {
  getWorkshops as getAdminWorkshops,
  createWorkshop,
  updateWorkshopStatus,
  getWorkshopParticipants,
} from "../api/workshopApi";
import {
  getAllTicketsAdmin,
  resolveTicketAdmin,
} from "../api/ticketApi";

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("analytics"); // analytics | students | drives | approvals | companies | competitions
  const [approvalsSubTab, setApprovalsSubTab] = useState("recruiters"); // recruiters | drives
  
  const [analytics, setAnalytics] = useState(null);
  const [companies, setCompanies] = useState([]);
  const [drives, setDrives] = useState([]);
  const [pendingDrives, setPendingDrives] = useState([]);
  const [pendingRecruiters, setPendingRecruiters] = useState([]);
  const [competitions, setCompetitions] = useState([]);
  const [students, setStudents] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Student Directory Filters
  const [studentSearch, setStudentSearch] = useState("");
  const [studentCourseFilter, setStudentCourseFilter] = useState("all");
  const [studentBranchFilter, setStudentBranchFilter] = useState("all");
  const [studentPlacedFilter, setStudentPlacedFilter] = useState("all");
  const [studentStatusFilter, setStudentStatusFilter] = useState("all");
  
  // Selected Student Profile Modal (Read-Only)
  const [selectedStudent, setSelectedStudent] = useState(null);

  // Admin Student Edit Override Modal
  const [editingStudent, setEditingStudent] = useState(null);
  const [editStudentModalError, setEditStudentModalError] = useState("");
  const [submittingEditStudent, setSubmittingEditStudent] = useState(false);
  const [editStudentForm, setEditStudentForm] = useState({
    name: "",
    email: "",
    rollNumber: "",
    course: "MCA",
    branch: "",
    college: "XYZ Group of Institutions",
    status: "active",
    cgpa: "",
    tenthPercentage: "",
    twelfthPercentage: "",
    backlogs: 0,
  });

  // Direct TPO Drive Posting Modal
  const [showPostDriveModal, setShowPostDriveModal] = useState(false);
  const [submittingDrive, setSubmittingDrive] = useState(false);
  const [newDriveForm, setNewDriveForm] = useState({
    companyMode: "existing", // "existing" | "new"
    company: "",
    companyName: "",
    companyWebsite: "",
    companyLocation: "",
    industry: "",
    companyDescription: "",
    jobTitle: "",
    opportunityType: "placement_drive",
    isOpenToAll: true,
    package: "",
    stipend: "",
    duration: "",
    employmentType: "Full Time",
    workMode: "On-site",
    location: "",
    applicationDeadline: "",
    minimumCgpa: "",
    maximumBacklogs: "",
    allowedCourses: [],
    eligibleBranches: [],
    passingYears: [],
    requiredSkills: "",
    selectionRounds: "",
    description: "",
  });

  // Create Company Modal
  const [showCreateCompany, setShowCreateCompany] = useState(false);
  const [newCompany, setNewCompany] = useState({
    name: "",
    website: "",
    industry: "",
    location: "",
    description: "",
    recruiterId: "none",
  });

  // Corporate Partners State
  const [recruitersList, setRecruitersList] = useState([]);
  const [companySearch, setCompanySearch] = useState("");
  const [selectedCompanyForEdit, setSelectedCompanyForEdit] = useState(null);
  const [editCompanyForm, setEditCompanyForm] = useState({
    name: "",
    website: "",
    industry: "",
    location: "",
    description: "",
    recruiterId: "none",
  });

  // Create Competition Modal
  const [showCreateCompModal, setShowCreateCompModal] = useState(false);
  const [newCompetition, setNewCompetition] = useState({
    title: "",
    description: "",
    type: "Coding Contest",
    isOpenToAll: true,
    organizer: "",
    registrationDeadline: "",
    startDate: "",
    endDate: "",
    prizes: "",
    externalLink: "",
    maxTeamSize: "",
  });

  // View Participants Modal
  const [selectedCompForParticipants, setSelectedCompForParticipants] = useState(null);
  const [participantsList, setParticipantsList] = useState([]);
  const [loadingParticipants, setLoadingParticipants] = useState(false);
  const [participantFilter, setParticipantFilter] = useState("");

  // Skill Workshops State
  const [adminWorkshops, setAdminWorkshops] = useState([]);
  const [showCreateWorkshopModal, setShowCreateWorkshopModal] = useState(false);
  const [submittingWorkshop, setSubmittingWorkshop] = useState(false);
  const [selectedWorkshopForParticipants, setSelectedWorkshopForParticipants] = useState(null);
  const [workshopParticipantsList, setWorkshopParticipantsList] = useState([]);
  const [loadingWorkshopParticipants, setLoadingWorkshopParticipants] = useState(false);
  const [workshopParticipantFilter, setWorkshopParticipantFilter] = useState("");
  const [workshopStatusFilter, setWorkshopStatusFilter] = useState("all");
  const [newWorkshopForm, setNewWorkshopForm] = useState({
    title: "",
    instructor: "Industry Expert",
    description: "",
    duration: "3 Days",
    startDate: "",
    endDate: "",
    registrationDeadline: "",
    mode: "Online",
    venue: "Google Meet / Virtual Arena",
    totalSeats: 50,
    isPaid: true,
    fee: 299,
    tags: "",
  });

  // Support & Helpdesk Tickets State
  const [tickets, setTickets] = useState([]);
  const [ticketStats, setTicketStats] = useState({ total: 0, open: 0, in_progress: 0, resolved: 0 });
  const [loadingTickets, setLoadingTickets] = useState(false);
  const [ticketFilterStatus, setTicketFilterStatus] = useState("all");
  const [ticketFilterCategory, setTicketFilterCategory] = useState("all");
  const [ticketSearch, setTicketSearch] = useState("");
  const [selectedTicketForResolve, setSelectedTicketForResolve] = useState(null);
  const [resolveForm, setResolveForm] = useState({
    status: "resolved",
    adminResponse: "",
  });
  const [resolvingTicketLoading, setResolvingTicketLoading] = useState(false);

  // Academic Score Update Requests State
  const [scoreRequests, setScoreRequests] = useState([]);
  const [scoreRequestStats, setScoreRequestStats] = useState({ total: 0, pending: 0, approved: 0, rejected: 0 });
  const [scoreRequestFilter, setScoreRequestFilter] = useState("pending");
  const [loadingScoreRequests, setLoadingScoreRequests] = useState(false);
  const [selectedScoreRequestForReject, setSelectedScoreRequestForReject] = useState(null);
  const [rejectionRemarks, setRejectionRemarks] = useState("");
  const [processingScoreAction, setProcessingScoreAction] = useState(false);

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      setError("");

      const [
        analyticsData,
        companiesData,
        drivesData,
        pendingDrivesData,
        competitionsData,
        pendingRecruitersData,
        studentsData,
        recruitersListData,
        workshopsData,
        ticketsData,
        scoreRequestsData,
      ] = await Promise.all([
        getPlacementAnalytics().catch((err) => {
          console.warn("Analytics fetch:", err);
          return null;
        }),
        getAllCompanies().catch((err) => {
          console.warn("Companies fetch:", err);
          return [];
        }),
        getAllDrivesForAdmin().catch((err) => {
          console.warn("Drives fetch:", err);
          return [];
        }),
        getPendingApprovalDrives().catch((err) => {
          console.warn("Pending drives fetch:", err);
          return [];
        }),
        getCompetitions().catch((err) => {
          console.warn("Competitions fetch:", err);
          return [];
        }),
        getPendingRecruiters().catch((err) => {
          console.warn("Pending recruiters fetch:", err);
          return [];
        }),
        getAllStudents().catch((err) => {
          console.warn("Students fetch:", err);
          return { count: 0, students: [] };
        }),
        getRecruitersList().catch((err) => {
          console.warn("Recruiters list fetch:", err);
          return [];
        }),
        getAdminWorkshops().catch((err) => {
          console.warn("Workshops list fetch:", err);
          return [];
        }),
        getAllTicketsAdmin().catch((err) => {
          console.warn("Tickets list fetch:", err);
          return { tickets: [], stats: { total: 0, open: 0, in_progress: 0, resolved: 0 } };
        }),
        getAllScoreUpdateRequests().catch((err) => {
          console.warn("Score requests fetch:", err);
          return { requests: [], stats: { total: 0, pending: 0, approved: 0, rejected: 0 } };
        }),
      ]);

      setAnalytics(analyticsData);
      setCompanies(companiesData || []);
      setDrives(drivesData || []);
      setPendingDrives(pendingDrivesData || []);
      setCompetitions(competitionsData || []);
      setPendingRecruiters(pendingRecruitersData || []);
      setStudents(studentsData?.students || []);
      setRecruitersList(recruitersListData || []);
      setAdminWorkshops(workshopsData || []);
      setTickets(ticketsData?.tickets || []);
      setTicketStats(ticketsData?.stats || { total: 0, open: 0, in_progress: 0, resolved: 0 });
      setScoreRequests(scoreRequestsData?.requests || []);
      setScoreRequestStats(scoreRequestsData?.stats || { total: 0, pending: 0, approved: 0, rejected: 0 });
    } catch (err) {
      setError(err.message || "Failed to load admin data");
    } finally {
      setLoading(false);
    }
  };

  const loadAdminScoreRequests = async () => {
    try {
      setLoadingScoreRequests(true);
      const params = {};
      if (scoreRequestFilter !== "all") params.status = scoreRequestFilter;
      const data = await getAllScoreUpdateRequests(params);
      setScoreRequests(data?.requests || []);
      if (data?.stats) setScoreRequestStats(data.stats);
    } catch (err) {
      console.warn("Error loading score requests:", err);
    } finally {
      setLoadingScoreRequests(false);
    }
  };

  const handleApproveScoreRequest = async (request) => {
    if (!window.confirm(`Are you sure you want to APPROVE updated scores for ${request.student?.name} (${request.student?.rollNumber})?\n\nNew CGPA: ${request.requestedScores?.cgpa}\nNew Backlogs: ${request.requestedScores?.backlogs}\n\nThis will update their live academic profile.`)) {
      return;
    }
    try {
      setProcessingScoreAction(true);
      setError("");
      setSuccessMsg("");
      const res = await approveScoreUpdateRequest(request._id, {
        reviewRemarks: "Verified and approved against official records.",
      });
      setSuccessMsg(res.message || "Score update approved successfully.");
      await loadAdminScoreRequests();
      if (activeTab === "students") loadStudents();
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Failed to approve score request");
    } finally {
      setProcessingScoreAction(false);
    }
  };

  const handleRejectScoreRequestSubmit = async (e) => {
    e.preventDefault();
    if (!selectedScoreRequestForReject) return;
    try {
      setProcessingScoreAction(true);
      setError("");
      setSuccessMsg("");
      const res = await rejectScoreUpdateRequest(selectedScoreRequestForReject._id, {
        reviewRemarks: rejectionRemarks.trim() || "Verification failed or discrepancy in marksheet.",
      });
      setSuccessMsg(res.message || "Score update request rejected.");
      setSelectedScoreRequestForReject(null);
      setRejectionRemarks("");
      await loadAdminScoreRequests();
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Failed to reject score request");
    } finally {
      setProcessingScoreAction(false);
    }
  };

  const loadAdminTickets = async () => {
    try {
      setLoadingTickets(true);
      const params = {};
      if (ticketFilterStatus !== "all") params.status = ticketFilterStatus;
      if (ticketFilterCategory !== "all") params.category = ticketFilterCategory;
      if (ticketSearch.trim()) params.search = ticketSearch.trim();

      const data = await getAllTicketsAdmin(params);
      setTickets(data?.tickets || []);
      if (data?.stats) setTicketStats(data.stats);
    } catch (err) {
      console.warn("Failed to reload tickets:", err);
    } finally {
      setLoadingTickets(false);
    }
  };

  const handleResolveTicketSubmit = async (e) => {
    e.preventDefault();
    if (!selectedTicketForResolve) return;
    if (!resolveForm.adminResponse.trim()) {
      setError("Please provide an official resolution or update message for the student.");
      return;
    }
    try {
      setResolvingTicketLoading(true);
      setError("");
      setSuccessMsg("");
      await resolveTicketAdmin(selectedTicketForResolve._id, {
        status: resolveForm.status,
        adminResponse: resolveForm.adminResponse.trim(),
      });
      setSuccessMsg(`Ticket #${selectedTicketForResolve._id.slice(-6).toUpperCase()} updated successfully to "${resolveForm.status.replace("_", " ")}".`);
      setSelectedTicketForResolve(null);
      setResolveForm({ status: "resolved", adminResponse: "" });
      await loadAdminTickets();
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Failed to update ticket");
    } finally {
      setResolvingTicketLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  useEffect(() => {
    if (activeTab === "tickets") {
      loadAdminTickets();
    }
  }, [ticketFilterStatus, ticketFilterCategory, ticketSearch, activeTab]);

  useEffect(() => {
    if (activeTab === "approvals" && approvalsSubTab === "scores") {
      loadAdminScoreRequests();
    }
  }, [scoreRequestFilter, activeTab, approvalsSubTab]);

  const loadStudents = async () => {
    try {
      setLoadingStudents(true);
      const params = {};
      if (studentSearch.trim()) params.search = studentSearch.trim();
      if (studentCourseFilter !== "all") params.course = studentCourseFilter;
      if (studentBranchFilter !== "all") params.branch = studentBranchFilter;
      if (studentPlacedFilter !== "all") params.placementStatus = studentPlacedFilter;
      if (studentStatusFilter !== "all") params.status = studentStatusFilter;

      const data = await getAllStudents(params);
      setStudents(data?.students || []);
    } catch (err) {
      console.warn("Error fetching students:", err);
    } finally {
      setLoadingStudents(false);
    }
  };

  useEffect(() => {
    if (activeTab === "students") {
      loadStudents();
    }
  }, [studentSearch, studentCourseFilter, studentBranchFilter, studentPlacedFilter, studentStatusFilter, activeTab]);

  const loadPendingDrives = async () => {
    try {
      const data = await getPendingApprovalDrives();
      setPendingDrives(data || []);
    } catch (err) {
      console.warn("Error refreshing pending drives", err);
    }
  };

  const loadPendingRecruiters = async () => {
    try {
      const data = await getPendingRecruiters();
      setPendingRecruiters(data || []);
    } catch (err) {
      console.warn("Error refreshing pending recruiters", err);
    }
  };

  const loadCompetitions = async () => {
    try {
      const data = await getCompetitions();
      setCompetitions(data || []);
    } catch (err) {
      console.warn("Error refreshing competitions", err);
    }
  };

  const loadDrives = async () => {
    try {
      const data = await getAllDrivesForAdmin();
      setDrives(data || []);
    } catch (err) {
      console.warn("Error refreshing drives", err);
    }
  };

  const handleApproveRecruiter = async (id) => {
    try {
      setError("");
      setSuccessMsg("");
      await approveRecruiter(id);
      setSuccessMsg("Recruiter account approved and activated successfully!");
      await loadPendingRecruiters();
      const updatedAnalytics = await getPlacementAnalytics();
      setAnalytics(updatedAnalytics);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to approve recruiter");
    }
  };

  const handleRejectRecruiter = async (id) => {
    if (!window.confirm("Are you sure you want to reject / suspend this recruiter account?")) return;
    try {
      setError("");
      setSuccessMsg("");
      await rejectRecruiter(id);
      setSuccessMsg("Recruiter account rejected / suspended.");
      await loadPendingRecruiters();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to reject recruiter");
    }
  };

  const handleCreateCompany = async (e) => {
    e.preventDefault();
    try {
      setError("");
      setSuccessMsg("");
      await createCompany(newCompany);
      setShowCreateCompany(false);
      setNewCompany({ name: "", website: "", industry: "", location: "", description: "", recruiterId: "none" });
      setSuccessMsg("New corporate partner onboarded successfully!");
      const updated = await getAllCompanies();
      setCompanies(updated);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create company");
    }
  };

  const handleOpenEditCompany = (c) => {
    setSelectedCompanyForEdit(c);
    setEditCompanyForm({
      name: c.name || "",
      website: c.website || "",
      industry: c.industry || "",
      location: c.location || "",
      description: c.description || "",
      recruiterId: c.recruiter?._id || "none",
    });
  };

  const handleUpdateCompany = async (e) => {
    e.preventDefault();
    if (!selectedCompanyForEdit) return;
    try {
      setError("");
      setSuccessMsg("");
      await updateCompany(selectedCompanyForEdit._id, editCompanyForm);
      setSelectedCompanyForEdit(null);
      setSuccessMsg(`Corporate partner "${editCompanyForm.name}" updated successfully!`);
      const updated = await getAllCompanies();
      setCompanies(updated);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update company");
    }
  };

  const handleDeleteCompany = async (companyId, companyName) => {
    if (!window.confirm(`Are you sure you want to remove "${companyName}" from corporate partners?`)) {
      return;
    }
    try {
      setError("");
      setSuccessMsg("");
      await deleteCompany(companyId);
      setSuccessMsg(`Corporate partner "${companyName}" removed.`);
      const updated = await getAllCompanies();
      setCompanies(updated);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete company");
    }
  };

  const handleApproveDrive = async (driveId) => {
    try {
      setError("");
      setSuccessMsg("");
      await approveDrive(driveId);
      setSuccessMsg("Drive successfully approved & published live to students!");
      await loadPendingDrives();
      await loadDrives();
      const updatedAnalytics = await getPlacementAnalytics();
      setAnalytics(updatedAnalytics);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to approve drive");
    }
  };

  const handleRejectDrive = async (driveId) => {
    if (!window.confirm("Are you sure you want to reject this recruiter's drive proposal?")) return;
    try {
      setError("");
      setSuccessMsg("");
      await rejectDrive(driveId);
      setSuccessMsg("Drive proposal has been rejected.");
      await loadPendingDrives();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to reject drive");
    }
  };

  const handleToggleDriveStatus = async (drive) => {
    const nextStatus = drive.status === "open" ? "closed" : "open";
    const actionLabel = nextStatus === "open" ? "reopen" : "close";
    if (!window.confirm(`Are you sure you want to ${actionLabel} "${drive.jobTitle}"?`)) return;
    try {
      setError("");
      setSuccessMsg("");
      await updateDriveStatus(drive._id, nextStatus);
      setSuccessMsg(`Drive status updated to ${nextStatus.toUpperCase()}`);
      await loadDrives();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update drive status");
    }
  };

  const handleToggleStudentStatus = async (student) => {
    const newStatus = student.status === "active" ? "suspended" : "active";
    const actionText = newStatus === "suspended" ? "suspend" : "activate";
    if (!window.confirm(`Are you sure you want to ${actionText} ${student.name} (${student.rollNumber})?`)) return;
    try {
      setError("");
      setSuccessMsg("");
      await toggleStudentStatus(student._id, newStatus);
      setSuccessMsg(`Student account ${actionText}d successfully!`);
      loadStudents();
    } catch (err) {
      setError(err.response?.data?.message || `Failed to ${actionText} student`);
    }
  };

  const handleOpenEditStudent = (student) => {
    setEditingStudent(student);
    setEditStudentModalError("");
    const rawCourse = student.course && student.course !== "N/A" ? student.course : "B.Tech";
    const rawBranch = student.branch && student.branch !== "N/A" ? student.branch : "";
    const rawRoll = student.rollNumber && student.rollNumber !== "N/A" ? student.rollNumber : "";
    setEditStudentForm({
      name: student.name || "",
      email: student.email || "",
      rollNumber: rawRoll,
      course: rawCourse,
      branch: rawBranch,
      college: student.college || "XYZ Group of Institutions",
      status: student.status || "active",
      cgpa: (student.cgpa !== null && student.cgpa !== undefined) ? student.cgpa : "",
      tenthPercentage: (student.tenthPercentage !== null && student.tenthPercentage !== undefined) ? student.tenthPercentage : "",
      twelfthPercentage: (student.twelfthPercentage !== null && student.twelfthPercentage !== undefined) ? student.twelfthPercentage : "",
      backlogs: student.backlogs ?? 0,
    });
  };

  const handleSaveEditStudent = async (e) => {
    e.preventDefault();
    try {
      setSubmittingEditStudent(true);
      setError("");
      setEditStudentModalError("");
      setSuccessMsg("");
      await updateStudentByAdmin(editingStudent._id, editStudentForm);
      setSuccessMsg(`Student profile for ${editStudentForm.name} (${editStudentForm.rollNumber || "ID"}) updated successfully by Admin!`);
      setEditingStudent(null);
      try {
        await loadStudents();
        const updatedAnalytics = await getPlacementAnalytics();
        setAnalytics(updatedAnalytics);
      } catch (refreshErr) {
        console.warn("Failed to refresh student analytics:", refreshErr);
      }
    } catch (err) {
      const msg = err.response?.data?.error || err.response?.data?.message || "Failed to update student profile";
      setEditStudentModalError(msg);
      setError(msg);
    } finally {
      setSubmittingEditStudent(false);
    }
  };

  const handlePostDirectDrive = async (e) => {
    e.preventDefault();
    try {
      setSubmittingDrive(true);
      setError("");
      setSuccessMsg("");

      const isAll = Boolean(newDriveForm.isOpenToAll);
      const chosenLocation = (newDriveForm.location || "").trim() || "Delhi-NCR / XYZ Campus";
      const payload = {
        jobTitle: (newDriveForm.jobTitle || "").trim(),
        opportunityType: newDriveForm.opportunityType || "placement_drive",
        isOpenToAll: isAll,
        noEligibilityCriteria: isAll,
        employmentType: newDriveForm.employmentType || "Full Time",
        workMode: newDriveForm.workMode || "On-site",
        location: chosenLocation,
        package: parseFloat(newDriveForm.package) || 0,
        applicationDeadline: newDriveForm.applicationDeadline,
        minimumCgpa: isAll ? 0 : (parseFloat(newDriveForm.minimumCgpa) || 0),
        maximumBacklogs: isAll ? 99 : (parseInt(newDriveForm.maximumBacklogs, 10) || 0),
        allowedCourses: isAll ? [] : newDriveForm.allowedCourses,
        eligibleBranches: isAll ? [] : newDriveForm.eligibleBranches,
        passingYears: isAll ? [] : newDriveForm.passingYears.map((y) => parseInt(y, 10)).filter((y) => !isNaN(y)),
        requiredSkills: isAll ? [] : (newDriveForm.requiredSkills
          ? newDriveForm.requiredSkills.split(",").map((s) => s.trim()).filter(Boolean)
          : []),
        selectionRounds: newDriveForm.selectionRounds
          ? newDriveForm.selectionRounds.split(",").map((s) => s.trim()).filter(Boolean)
          : ["Resume Screening", "Technical Interview", "HR Interview"],
        description: newDriveForm.description || `${newDriveForm.jobTitle} recruitment drive hosted by XYZ CRPC.`,
        status: "open", // Immediate publication to students
      };

      if (newDriveForm.opportunityType === "internship") {
        payload.duration = newDriveForm.duration || "6 Months";
        payload.stipend = newDriveForm.stipend || "₹25,000/month";
      }

      if (newDriveForm.companyMode === "existing") {
        if (!newDriveForm.company) {
          setError("Please select an onboarded company or choose 'Add New Visiting Company'");
          setSubmittingDrive(false);
          return;
        }
        payload.company = newDriveForm.company;
      } else {
        if (!newDriveForm.companyName.trim()) {
          setError("Please enter the company name");
          setSubmittingDrive(false);
          return;
        }
        payload.companyName = newDriveForm.companyName.trim();
        payload.companyWebsite = newDriveForm.companyWebsite;
        payload.companyLocation = newDriveForm.companyLocation || chosenLocation;
        payload.industry = newDriveForm.industry;
        payload.companyDescription = newDriveForm.companyDescription;
      }

      await createDriveByAdmin(payload);
      setShowPostDriveModal(false);
      setSuccessMsg("Placement drive posted & published successfully! It is now live in students' Campus Placement section.");
      
      // Reset form
      setNewDriveForm({
        companyMode: "existing",
        company: "",
        companyName: "",
        companyWebsite: "",
        companyLocation: "",
        industry: "",
        companyDescription: "",
        jobTitle: "",
        opportunityType: "placement_drive",
        isOpenToAll: true,
        package: "",
        stipend: "",
        duration: "",
        employmentType: "Full Time",
        workMode: "On-site",
        location: "",
        applicationDeadline: "",
        minimumCgpa: "",
        maximumBacklogs: "",
        allowedCourses: [],
        eligibleBranches: [],
        passingYears: [],
        requiredSkills: "",
        selectionRounds: "",
        description: "",
      });

      await loadDrives();
      const updatedCompanies = await getAllCompanies();
      setCompanies(updatedCompanies || []);
      const updatedAnalytics = await getPlacementAnalytics();
      setAnalytics(updatedAnalytics);
    } catch (err) {
      console.error("Direct drive posting error:", err);
      setError(
        err.response?.data?.error ||
        err.response?.data?.message ||
        err.message ||
        "Failed to post placement drive"
      );
    } finally {
      setSubmittingDrive(false);
    }
  };

  const handleCreateCompetition = async (e) => {
    e.preventDefault();
    try {
      setError("");
      setSuccessMsg("");

      if (!newCompetition.title.trim()) {
        setError("Event title is required.");
        return;
      }

      if (!newCompetition.registrationDeadline) {
        setError("Registration deadline is required.");
        return;
      }

      const teamNum = newCompetition.maxTeamSize ? parseInt(newCompetition.maxTeamSize, 10) : 1;

      const payload = {
        title: (newCompetition.title || "").trim(),
        description: (newCompetition.description || "").trim(),
        type: newCompetition.type || "Coding Contest",
        organizer: (newCompetition.organizer || "").trim() || "XYZ CRPC & Department Club",
        registrationDeadline: newCompetition.registrationDeadline,
        startDate: newCompetition.startDate || undefined,
        endDate: newCompetition.endDate || undefined,
        prizes: (newCompetition.prizes || "").trim() || "Cash Prizes & Certificates of Excellence",
        contestUrl: (newCompetition.externalLink || "").trim(),
        maxTeamSize: teamNum || 1,
        isOpenToAll: newCompetition.isOpenToAll !== undefined ? newCompetition.isOpenToAll : true,
      };

      await createCompetition(payload);
      setShowCreateCompModal(false);
      setNewCompetition({
        title: "",
        description: "",
        type: "Coding Contest",
        isOpenToAll: true,
        organizer: "",
        registrationDeadline: "",
        startDate: "",
        endDate: "",
        prizes: "",
        externalLink: "",
        maxTeamSize: "",
      });
      setSuccessMsg("Contest / Hackathon published successfully!");
      await loadCompetitions();
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.message || err.message || "Failed to host competition");
    }
  };

  const handleDeleteCompetition = async (id) => {
    if (!window.confirm("Are you sure you want to delete this competition?")) return;
    try {
      setError("");
      setSuccessMsg("");
      await deleteCompetition(id);
      setSuccessMsg("Competition deleted.");
      await loadCompetitions();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete competition");
    }
  };

  const handleViewParticipants = async (comp) => {
    setSelectedCompForParticipants(comp);
    setParticipantFilter("");
    try {
      setLoadingParticipants(true);
      const data = await getCompetitionParticipants(comp._id);
      setParticipantsList(data.participants || []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch participants");
    } finally {
      setLoadingParticipants(false);
    }
  };

  // Skill Workshop Handlers
  const loadAdminWorkshops = async () => {
    try {
      const data = await getAdminWorkshops();
      setAdminWorkshops(data || []);
    } catch (err) {
      console.warn("Failed to load admin workshops:", err);
    }
  };

  const handleCreateWorkshop = async (e) => {
    e.preventDefault();
    try {
      setSubmittingWorkshop(true);
      setError("");
      setSuccessMsg("");

      if (!newWorkshopForm.title.trim()) {
        setError("Workshop Title is required.");
        return;
      }

      await createWorkshop({
        ...newWorkshopForm,
        totalSeats: parseInt(newWorkshopForm.totalSeats, 10) || 50,
        fee: newWorkshopForm.isPaid ? parseFloat(newWorkshopForm.fee) || 0 : 0,
      });

      setSuccessMsg(`Skill Workshop "${newWorkshopForm.title}" created and published successfully!`);
      setShowCreateWorkshopModal(false);
      setNewWorkshopForm({
        title: "",
        instructor: "Industry Expert",
        description: "",
        duration: "3 Days",
        startDate: "",
        endDate: "",
        registrationDeadline: "",
        mode: "Online",
        venue: "Google Meet / Virtual Arena",
        totalSeats: 50,
        isPaid: true,
        fee: 299,
        tags: "",
      });
      await loadAdminWorkshops();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create workshop");
    } finally {
      setSubmittingWorkshop(false);
    }
  };

  const handleToggleWorkshopStatus = async (ws, newStatus) => {
    try {
      setError("");
      await updateWorkshopStatus(ws._id, newStatus);
      setSuccessMsg(`Workshop "${ws.title}" status updated to ${newStatus}.`);
      await loadAdminWorkshops();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update workshop status");
    }
  };

  const handleViewWorkshopParticipants = async (ws) => {
    setSelectedWorkshopForParticipants(ws);
    setWorkshopParticipantFilter("");
    try {
      setLoadingWorkshopParticipants(true);
      const data = await getWorkshopParticipants(ws._id);
      setWorkshopParticipantsList(data.participants || []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load workshop participants");
    } finally {
      setLoadingWorkshopParticipants(false);
    }
  };

  // 1-Click CSV Exports
  const exportStudentsCSV = () => {
    if (!students || students.length === 0) {
      alert("No student data available to export");
      return;
    }
    const headers = [
      "Roll No",
      "Name",
      "Email",
      "Course",
      "Branch",
      "CGPA",
      "Backlogs",
      "Placement Status",
      "Placed Company",
      "Package (LPA)",
      "Account Status",
    ];

    const rows = students.map((s) => [
      `"${s.rollNumber || ""}"`,
      `"${s.name || ""}"`,
      `"${s.email || ""}"`,
      `"${s.course || ""}"`,
      `"${s.branch || ""}"`,
      s.cgpa !== null ? s.cgpa : "N/A",
      s.backlogs ?? 0,
      `"${s.placementStatus || "unplaced"}"`,
      `"${s.placedOffer?.companyName || ""}"`,
      s.placedOffer?.package ? s.placedOffer.package : "",
      `"${s.status || "active"}"`,
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `XYZ_Students_Placement_Registry_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportPlacementsCSV = () => {
    const placed = students.filter((s) => s.placementStatus === "placed");
    if (placed.length === 0) {
      alert("No placed student records to export yet");
      return;
    }
    const headers = [
      "Roll No",
      "Student Name",
      "Email",
      "Course",
      "Branch",
      "CGPA",
      "Hired Company",
      "Role / Designation",
      "Package (LPA)",
    ];
    const rows = placed.map((s) => [
      `"${s.rollNumber || ""}"`,
      `"${s.name || ""}"`,
      `"${s.email || ""}"`,
      `"${s.course || ""}"`,
      `"${s.branch || ""}"`,
      s.cgpa !== null ? s.cgpa : "N/A",
      `"${s.placedOffer?.companyName || ""}"`,
      `"${s.placedOffer?.jobTitle || ""}"`,
      s.placedOffer?.package || "",
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `XYZ_Official_Placed_Students_Report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="dashboard" style={{ textAlign: "center", padding: "80px 20px" }}>
        <div style={{ fontSize: "36px", marginBottom: "12px" }}>🏛️</div>
        <h2 style={{ color: "#0f172a", margin: 0 }}>XYZ CRPC Master Placement Portal</h2>
        <p style={{ color: "#64748b" }}>Loading institutional analytics & control centre...</p>
      </div>
    );
  }

  const pendingApprovalsCount =
    pendingDrives.length +
    pendingRecruiters.length +
    (scoreRequestStats?.pending ?? scoreRequests.filter((r) => r.status === "pending").length);

  return (
    <div className="dashboard" style={{ maxWidth: "1380px", margin: "0 auto", padding: "24px 20px" }}>
      {/* Top Brand Banner */}
      <div style={{
        background: "linear-gradient(135deg, #0f172a 0%, #1e293b 60%, #0369a1 100%)",
        color: "#ffffff",
        borderRadius: "16px",
        padding: "24px 28px",
        marginBottom: "24px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexWrap: "wrap",
        gap: "16px",
        boxShadow: "0 10px 25px -5px rgba(15, 23, 42, 0.2)",
      }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "4px" }}>
            <span style={{ fontSize: "24px" }}>🏛️</span>
            <h1 style={{ margin: 0, fontSize: "22px", fontWeight: 800, color: "#fff" }}>
              XYZ Group of Institutions • CRPC Control Center
            </h1>
            <span style={{
              background: "rgba(56, 189, 248, 0.2)",
              color: "#38bdf8",
              padding: "2px 8px",
              borderRadius: "6px",
              fontSize: "11px",
              fontWeight: 700,
            }}>
              Master Authority
            </span>
          </div>
          <p style={{ margin: 0, color: "#94a3b8", fontSize: "14px" }}>
            Centralized Placement & Recruitment Management
          </p>
        </div>

        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          <button
            onClick={() => setShowPostDriveModal(true)}
            style={{
              padding: "10px 18px",
              background: "#0284c7",
              color: "#fff",
              border: "none",
              borderRadius: "8px",
              fontSize: "13px",
              fontWeight: 700,
              cursor: "pointer",
              boxShadow: "0 4px 12px rgba(2, 132, 199, 0.3)",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <span>➕</span> Post Direct Drive (TPO)
          </button>
          <button
            onClick={() => setShowCreateCompModal(true)}
            style={{
              padding: "10px 18px",
              background: "#d97706",
              color: "#fff",
              border: "none",
              borderRadius: "8px",
              fontSize: "13px",
              fontWeight: 700,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <span>🏆</span> Host Hackathon / Contest
          </button>
          <button
            onClick={() => {
              localStorage.clear();
              window.location.replace("/login");
            }}
            style={{
              padding: "10px 16px",
              background: "#fff1f2",
              color: "#e11d48",
              border: "1px solid #fecdd3",
              borderRadius: "8px",
              fontSize: "13px",
              fontWeight: 700,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <span>🚪</span> Sign Out
          </button>
        </div>
      </div>

      {/* Global Alerts */}
      {error && (
        <div style={{ padding: "12px 16px", background: "#fef2f2", color: "#b91c1c", borderRadius: "10px", marginBottom: "16px", border: "1px solid #fecaca", fontSize: "14px" }}>
          {error}
        </div>
      )}

      {successMsg && (
        <div style={{ padding: "12px 16px", background: "#f0fdf4", color: "#15803d", borderRadius: "10px", marginBottom: "16px", border: "1px solid #bbf7d0", fontSize: "14px" }}>
          {successMsg}
        </div>
      )}

      {/* Navigation Tabs Bar */}
      <div style={{
        display: "flex",
        gap: "8px",
        overflowX: "auto",
        paddingBottom: "8px",
        marginBottom: "24px",
        borderBottom: "1px solid #e2e8f0",
      }}>
        {[
          { id: "analytics", label: "📊 Placement Analytics & Reports", count: null },
          { id: "students", label: "🎓 Students Directory", count: students.length },
          { id: "drives", label: "💼 Campus Drives", count: drives.length },
          { id: "approvals", label: "🛡️ Approvals Hub", count: pendingApprovalsCount, isBadgeAlert: pendingApprovalsCount > 0 },
          { id: "companies", label: "🏢 Corporate Partners", count: companies.length },
          { id: "competitions", label: "🏆 Competitions Hub", count: competitions.length },
          { id: "workshops", label: "💡 Skill Workshops", count: adminWorkshops.length },
          {
            id: "tickets",
            label: "🎧 Support & Helpdesk",
            count: ticketStats?.open ?? tickets.filter((t) => t.status === "open").length,
            isBadgeAlert: (ticketStats?.open ?? tickets.filter((t) => t.status === "open").length) > 0,
          },
        ].map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: "10px 18px",
                borderRadius: "10px",
                border: "none",
                background: isActive ? "#0f172a" : "#ffffff",
                color: isActive ? "#ffffff" : "#475569",
                fontSize: "13px",
                fontWeight: isActive ? 700 : 600,
                cursor: "pointer",
                whiteSpace: "nowrap",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                boxShadow: isActive ? "0 4px 10px rgba(15, 23, 42, 0.15)" : "none",
                transition: "all 0.15s ease",
              }}
            >
              <span>{tab.label}</span>
              {tab.count !== null && (
                <span style={{
                  padding: "2px 7px",
                  borderRadius: "12px",
                  fontSize: "11px",
                  fontWeight: 700,
                  background: tab.isBadgeAlert ? "#ef4444" : isActive ? "rgba(255,255,255,0.2)" : "#f1f5f9",
                  color: tab.isBadgeAlert ? "#fff" : isActive ? "#fff" : "#64748b",
                }}>
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ========================================================
          TAB 1: MASTER PLACEMENT ANALYTICS & CSV EXPORT
         ======================================================== */}
      {activeTab === "analytics" && (
        <div>
          {analytics ? (
            <>
              {/* Executive Summary Bar */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "10px" }}>
                <div>
                  <h2 style={{ margin: 0, fontSize: "18px", color: "#0f172a" }}>Placement Performance & Cohort Intelligence</h2>
                  <span style={{ fontSize: "13px", color: "#64748b" }}>Live metrics synchronized across students, company drives, and verified offers</span>
                </div>
                <div style={{ display: "flex", gap: "8px" }}>
                  <button
                    onClick={exportStudentsCSV}
                    style={{
                      padding: "8px 14px",
                      background: "#fff",
                      border: "1px solid #cbd5e1",
                      borderRadius: "8px",
                      fontSize: "12px",
                      fontWeight: 600,
                      color: "#334155",
                      cursor: "pointer",
                    }}
                  >
                    📥 Export Student Registry (CSV)
                  </button>
                  <button
                    onClick={exportPlacementsCSV}
                    style={{
                      padding: "8px 14px",
                      background: "#0f172a",
                      border: "none",
                      borderRadius: "8px",
                      fontSize: "12px",
                      fontWeight: 600,
                      color: "#fff",
                      cursor: "pointer",
                    }}
                  >
                    📥 Export Placements Report (CSV)
                  </button>
                </div>
              </div>

              {/* KPI Cards Grid */}
              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                gap: "16px",
                marginBottom: "24px",
              }}>
                <div style={{ background: "#ffffff", padding: "18px", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
                  <span style={{ fontSize: "12px", color: "#64748b", fontWeight: 600 }}>Total Registered Students</span>
                  <div style={{ fontSize: "28px", fontWeight: 800, color: "#0f172a", margin: "4px 0" }}>
                    {analytics.totalStudents}
                  </div>
                  <span style={{ fontSize: "11px", color: "#16a34a", fontWeight: 600 }}>
                    Placed: {analytics.placedStudents} ({analytics.placementRate})
                  </span>
                </div>

                <div style={{ background: "#ffffff", padding: "18px", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
                  <span style={{ fontSize: "12px", color: "#64748b", fontWeight: 600 }}>Highest Package Secured</span>
                  <div style={{ fontSize: "28px", fontWeight: 800, color: "#0284c7", margin: "4px 0" }}>
                    ₹{analytics.highestPackage} LPA
                  </div>
                  <span style={{ fontSize: "11px", color: "#64748b" }}>Verified top corporate offer</span>
                </div>

                <div style={{ background: "#ffffff", padding: "18px", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
                  <span style={{ fontSize: "12px", color: "#64748b", fontWeight: 600 }}>Average Package CTC</span>
                  <div style={{ fontSize: "28px", fontWeight: 800, color: "#0f172a", margin: "4px 0" }}>
                    ₹{analytics.averagePackage} LPA
                  </div>
                  <span style={{ fontSize: "11px", color: "#64748b" }}>
                    Median CTC: ₹{analytics.medianPackage || analytics.averagePackage} LPA
                  </span>
                </div>

                <div style={{ background: "#ffffff", padding: "18px", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
                  <span style={{ fontSize: "12px", color: "#64748b", fontWeight: 600 }}>Active Campus Drives</span>
                  <div style={{ fontSize: "28px", fontWeight: 800, color: "#10b981", margin: "4px 0" }}>
                    {analytics.activeDrives ?? drives.filter((d) => d.status === "open").length}
                  </div>
                  <span style={{ fontSize: "11px", color: "#d97706", fontWeight: 600 }}>
                    Pending Review: {pendingDrives.length}
                  </span>
                </div>

                <div style={{ background: "#ffffff", padding: "18px", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
                  <span style={{ fontSize: "12px", color: "#64748b", fontWeight: 600 }}>Partner Companies</span>
                  <div style={{ fontSize: "28px", fontWeight: 800, color: "#6366f1", margin: "4px 0" }}>
                    {analytics.totalCompanies}
                  </div>
                  <span style={{ fontSize: "11px", color: "#64748b" }}>
                    Active Recruiters: {analytics.activeRecruiters ?? "Verified"}
                  </span>
                </div>
              </div>

              {/* Salary Tiers & Funnel Breakdown */}
              <div style={{
                background: "#ffffff",
                padding: "20px",
                borderRadius: "14px",
                border: "1px solid #e2e8f0",
                marginBottom: "24px",
              }}>
                <h3 style={{ margin: "0 0 16px", fontSize: "15px", color: "#0f172a" }}>
                  Package CTC Distribution Tiers (Offers Breakdown)
                </h3>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "14px" }}>
                  {(analytics.packageDistribution || [
                    { range: "< 4 LPA", count: 0, percentage: 0 },
                    { range: "4 - 7 LPA", count: 0, percentage: 0 },
                    { range: "7 - 12 LPA", count: 0, percentage: 0 },
                    { range: "12+ LPA", count: 0, percentage: 0 },
                  ]).map((tier) => (
                    <div key={tier.range} style={{ padding: "14px", background: "#f8fafc", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                        <span style={{ fontSize: "13px", fontWeight: 700, color: "#334155" }}>{tier.range}</span>
                        <span style={{ fontSize: "12px", color: "#0284c7", fontWeight: 700 }}>{tier.count} Offers</span>
                      </div>
                      <div style={{ width: "100%", height: "8px", background: "#e2e8f0", borderRadius: "4px", overflow: "hidden" }}>
                        <div style={{ width: `${tier.percentage || 0}%`, height: "100%", background: "#0284c7", borderRadius: "4px" }} />
                      </div>
                      <span style={{ fontSize: "11px", color: "#64748b", marginTop: "4px", display: "block" }}>
                        {tier.percentage}% of issued offers
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Branch Stats Table */}
              <div style={{
                background: "#ffffff",
                padding: "20px",
                borderRadius: "14px",
                border: "1px solid #e2e8f0",
                marginBottom: "24px",
              }}>
                <h3 style={{ margin: "0 0 16px", fontSize: "15px", color: "#0f172a" }}>Department / Branch Wise Placement Breakdown</h3>
                {analytics.branchStats?.length > 0 ? (
                  <div style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "13px" }}>
                      <thead>
                        <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                          <th style={{ padding: "12px 16px" }}>Branch / Department</th>
                          <th style={{ padding: "12px 16px" }}>Placed Students</th>
                          <th style={{ padding: "12px 16px" }}>Average CTC</th>
                          <th style={{ padding: "12px 16px" }}>Highest Package</th>
                        </tr>
                      </thead>
                      <tbody>
                        {analytics.branchStats.map((b, idx) => (
                          <tr key={idx} style={{ borderBottom: "1px solid #f1f5f9" }}>
                            <td style={{ padding: "12px 16px", fontWeight: 600, color: "#0f172a" }}>{b.branch || "General / Common"}</td>
                            <td style={{ padding: "12px 16px", color: "#16a34a", fontWeight: 700 }}>{b.placedStudents}</td>
                            <td style={{ padding: "12px 16px", fontWeight: 600 }}>₹{b.averagePackage} LPA</td>
                            <td style={{ padding: "12px 16px", fontWeight: 700, color: "#0284c7" }}>₹{b.highestPackage} LPA</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p style={{ color: "#94a3b8", fontSize: "13px", margin: 0 }}>No branch offers recorded yet for this session.</p>
                )}
              </div>

              {/* Top Recruiting Companies */}
              <div style={{
                background: "#ffffff",
                padding: "20px",
                borderRadius: "14px",
                border: "1px solid #e2e8f0",
              }}>
                <h3 style={{ margin: "0 0 16px", fontSize: "15px", color: "#0f172a" }}>Top Hiring Corporate Partners</h3>
                {analytics.companyStats?.length > 0 ? (
                  <div style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "13px" }}>
                      <thead>
                        <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                          <th style={{ padding: "12px 16px" }}>Company</th>
                          <th style={{ padding: "12px 16px" }}>Total Hires</th>
                          <th style={{ padding: "12px 16px" }}>Average Package</th>
                          <th style={{ padding: "12px 16px" }}>Top Package Offered</th>
                        </tr>
                      </thead>
                      <tbody>
                        {analytics.companyStats.map((c, idx) => (
                          <tr key={idx} style={{ borderBottom: "1px solid #f1f5f9" }}>
                            <td style={{ padding: "12px 16px", fontWeight: 700, color: "#0f172a" }}>{c.company}</td>
                            <td style={{ padding: "12px 16px", color: "#16a34a", fontWeight: 700 }}>{c.placedStudents} Students</td>
                            <td style={{ padding: "12px 16px", fontWeight: 600 }}>₹{c.averagePackage} LPA</td>
                            <td style={{ padding: "12px 16px", fontWeight: 700, color: "#0284c7" }}>₹{c.highestPackage} LPA</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p style={{ color: "#94a3b8", fontSize: "13px", margin: 0 }}>No hiring records logged yet.</p>
                )}
              </div>
            </>
          ) : (
            <div style={{ padding: "40px 20px", textAlign: "center", background: "#ffffff", borderRadius: "14px", border: "1px solid #e2e8f0" }}>
              <span style={{ fontSize: "32px", display: "block", marginBottom: "8px" }}>📊</span>
              <h3 style={{ margin: "0 0 6px", color: "#0f172a" }}>Placement Analytics Unavailable</h3>
              <p style={{ color: "#64748b", fontSize: "13px", margin: "0 0 16px" }}>
                Unable to load placement analytics. Click below to fetch the latest institutional metrics.
              </p>
              <button
                onClick={async () => {
                  try {
                    setError("");
                    const data = await getPlacementAnalytics();
                    setAnalytics(data);
                    setSuccessMsg("Placement analytics refreshed successfully!");
                  } catch (err) {
                    setError("Failed to fetch analytics: " + (err.message || "Network Error"));
                  }
                }}
                style={{
                  padding: "9px 20px",
                  background: "#0284c7",
                  color: "#fff",
                  border: "none",
                  borderRadius: "8px",
                  fontSize: "13px",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                🔄 Refresh Placement Analytics
              </button>
            </div>
          )}
        </div>
      )}

      {/* ========================================================
          TAB 2: STUDENTS DIRECTORY & GOVERNANCE
         ======================================================== */}
      {activeTab === "students" && (
        <div>
          {/* Header & Filter Bar */}
          <div style={{
            background: "#ffffff",
            padding: "20px",
            borderRadius: "14px",
            border: "1px solid #e2e8f0",
            marginBottom: "20px",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "10px" }}>
              <div>
                <h2 style={{ margin: 0, fontSize: "18px", color: "#0f172a" }}>XYZ Students Cohort & Placement Registry</h2>
                <span style={{ fontSize: "13px", color: "#64748b" }}>Manage student status, monitor placement progress, and inspect complete student profiles</span>
              </div>
              <button
                onClick={exportStudentsCSV}
                style={{
                  padding: "8px 14px",
                  background: "#0284c7",
                  border: "none",
                  borderRadius: "8px",
                  fontSize: "12px",
                  fontWeight: 600,
                  color: "#fff",
                  cursor: "pointer",
                }}
              >
                📥 Download Filtered Registry (CSV)
              </button>
            </div>

            {/* Filter Controls */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "12px" }}>
              {/* Search */}
              <div>
                <label style={{ display: "block", fontSize: "11px", fontWeight: 600, color: "#64748b", marginBottom: "4px" }}>
                  Search Student
                </label>
                <input
                  type="text"
                  placeholder="Roll No, Name, or Email..."
                  value={studentSearch}
                  onChange={(e) => setStudentSearch(e.target.value)}
                  style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px" }}
                />
              </div>

              {/* Course */}
              <div>
                <label style={{ display: "block", fontSize: "11px", fontWeight: 600, color: "#64748b", marginBottom: "4px" }}>
                  Course
                </label>
                <select
                  value={studentCourseFilter}
                  onChange={(e) => setStudentCourseFilter(e.target.value)}
                  style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px" }}
                >
                  <option value="all">All Courses</option>
                  <option value="B.Tech">B.Tech</option>
                  <option value="MCA">MCA</option>
                  <option value="BCA">BCA</option>
                  <option value="M.Tech">M.Tech</option>
                  <option value="MBA">MBA</option>
                </select>
              </div>

              {/* Branch */}
              <div>
                <label style={{ display: "block", fontSize: "11px", fontWeight: 600, color: "#64748b", marginBottom: "4px" }}>
                  Branch
                </label>
                <select
                  value={studentBranchFilter}
                  onChange={(e) => setStudentBranchFilter(e.target.value)}
                  style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px" }}
                >
                  <option value="all">All Branches</option>
                  <option value="CSE">CSE</option>
                  <option value="IT">IT</option>
                  <option value="ECE">ECE</option>
                  <option value="ME">ME</option>
                  <option value="EN">EN</option>
                  <option value="CS">CS</option>
                  <option value="AI/ML">AI/ML</option>
                  <option value="Civil">Civil</option>
                </select>
              </div>

              {/* Placement Status */}
              <div>
                <label style={{ display: "block", fontSize: "11px", fontWeight: 600, color: "#64748b", marginBottom: "4px" }}>
                  Placement Status
                </label>
                <select
                  value={studentPlacedFilter}
                  onChange={(e) => setStudentPlacedFilter(e.target.value)}
                  style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px" }}
                >
                  <option value="all">All (Placed & Unplaced)</option>
                  <option value="placed">Placed Only</option>
                  <option value="unplaced">Unplaced Only</option>
                </select>
              </div>

              {/* Account Status */}
              <div>
                <label style={{ display: "block", fontSize: "11px", fontWeight: 600, color: "#64748b", marginBottom: "4px" }}>
                  Account Status
                </label>
                <select
                  value={studentStatusFilter}
                  onChange={(e) => setStudentStatusFilter(e.target.value)}
                  style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px" }}
                >
                  <option value="all">All Accounts</option>
                  <option value="active">Active Accounts</option>
                  <option value="suspended">Suspended Accounts</option>
                </select>
              </div>
            </div>
          </div>

          {/* Students Table */}
          <div style={{
            background: "#ffffff",
            borderRadius: "14px",
            border: "1px solid #e2e8f0",
            overflow: "hidden",
          }}>
            {loadingStudents ? (
              <div style={{ padding: "40px", textAlign: "center", color: "#64748b" }}>
                Loading students registry...
              </div>
            ) : students.length === 0 ? (
              <div style={{ padding: "40px", textAlign: "center", color: "#64748b" }}>
                No students found matching current filter criteria.
              </div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "13px" }}>
                  <thead>
                    <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                      <th style={{ padding: "12px 16px" }}>Roll No</th>
                      <th style={{ padding: "12px 16px" }}>Student Name</th>
                      <th style={{ padding: "12px 16px" }}>Course & Branch</th>
                      <th style={{ padding: "12px 16px" }}>CGPA / Backlogs</th>
                      <th style={{ padding: "12px 16px" }}>Placement Status</th>
                      <th style={{ padding: "12px 16px" }}>Account</th>
                      <th style={{ padding: "12px 16px", textAlign: "right" }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.map((student) => {
                      const isPlaced = student.placementStatus === "placed";
                      const isSuspended = student.status === "suspended";
                      return (
                        <tr key={student._id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                          <td style={{ padding: "12px 16px", fontWeight: 700, color: "#0f172a" }}>
                            {student.rollNumber || "N/A"}
                          </td>
                          <td style={{ padding: "12px 16px" }}>
                            <div style={{ fontWeight: 600, color: "#0f172a" }}>{student.name}</div>
                            <div style={{ fontSize: "11px", color: "#64748b" }}>{student.email}</div>
                          </td>
                          <td style={{ padding: "12px 16px" }}>
                            <span style={{ fontWeight: 600 }}>{student.course || "N/A"}</span>
                            {student.branch && <span style={{ color: "#64748b" }}> • {student.branch}</span>}
                          </td>
                          <td style={{ padding: "12px 16px" }}>
                            <div>
                              <strong style={{ color: student.cgpa ? "#0f172a" : "#94a3b8" }}>
                                {student.cgpa !== null ? `${student.cgpa} CGPA` : "Not set"}
                              </strong>
                            </div>
                            <span style={{
                              fontSize: "11px",
                              color: (student.backlogs || 0) === 0 ? "#16a34a" : "#dc2626",
                              fontWeight: 600,
                            }}>
                              {student.backlogs ?? 0} backlogs
                            </span>
                          </td>
                          <td style={{ padding: "12px 16px" }}>
                            {isPlaced ? (
                              <div style={{ display: "inline-flex", flexDirection: "column", gap: "2px" }}>
                                <span style={{
                                  padding: "3px 8px",
                                  background: "#ecfdf5",
                                  color: "#047857",
                                  border: "1px solid #a7f3d0",
                                  borderRadius: "6px",
                                  fontSize: "11px",
                                  fontWeight: 700,
                                  width: "fit-content",
                                }}>
                                  ✓ PLACED
                                </span>
                                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                  <span style={{ fontSize: "12px", fontWeight: 700, color: "#0f172a" }}>
                                    {student.placedOffer?.companyName} • ₹{student.placedOffer?.package} LPA
                                  </span>
                                  <a
                                    href={
                                      student.placedOffer?.offerLetterUrl
                                        ? (student.placedOffer.offerLetterUrl.startsWith("http")
                                            ? student.placedOffer.offerLetterUrl
                                            : `http://localhost:5000${student.placedOffer.offerLetterUrl}`)
                                        : `http://localhost:5000/api/offers/${student.placedOffer?.id}/pdf`
                                    }
                                    target="_blank"
                                    rel="noreferrer"
                                    title="View Official Offer Letter PDF"
                                    style={{
                                      fontSize: "10px",
                                      fontWeight: 700,
                                      padding: "1px 6px",
                                      background: "#f0f9ff",
                                      border: "1px solid #bae6fd",
                                      color: "#0284c7",
                                      borderRadius: "4px",
                                      textDecoration: "none",
                                    }}
                                  >
                                    📄 PDF
                                  </a>
                                </div>
                              </div>
                            ) : (
                              <span style={{
                                padding: "3px 8px",
                                background: "#f1f5f9",
                                color: "#64748b",
                                borderRadius: "6px",
                                fontSize: "11px",
                                fontWeight: 600,
                              }}>
                                Unplaced
                              </span>
                            )}
                          </td>
                          <td style={{ padding: "12px 16px" }}>
                            <span style={{
                              padding: "3px 8px",
                              borderRadius: "6px",
                              fontSize: "11px",
                              fontWeight: 700,
                              background: isSuspended ? "#fee2e2" : "#dcfce7",
                              color: isSuspended ? "#dc2626" : "#15803d",
                            }}>
                              {student.status?.toUpperCase() || "ACTIVE"}
                            </span>
                          </td>
                          <td style={{ padding: "12px 16px", textAlign: "right" }}>
                            <div style={{ display: "inline-flex", gap: "6px" }}>
                              <button
                                onClick={() => setSelectedStudent(student)}
                                style={{
                                  padding: "6px 10px",
                                  background: "#f1f5f9",
                                  border: "1px solid #cbd5e1",
                                  borderRadius: "6px",
                                  fontSize: "11px",
                                  fontWeight: 600,
                                  color: "#334155",
                                  cursor: "pointer",
                                }}
                              >
                                View Profile
                              </button>
                              <button
                                onClick={() => handleOpenEditStudent(student)}
                                style={{
                                  padding: "6px 10px",
                                  background: "#0284c7",
                                  border: "none",
                                  borderRadius: "6px",
                                  fontSize: "11px",
                                  fontWeight: 600,
                                  color: "#fff",
                                  cursor: "pointer",
                                }}
                              >
                                ✏️ Edit
                              </button>
                              <button
                                onClick={() => handleToggleStudentStatus(student)}
                                style={{
                                  padding: "6px 10px",
                                  background: isSuspended ? "#22c55e" : "#ef4444",
                                  border: "none",
                                  borderRadius: "6px",
                                  fontSize: "11px",
                                  fontWeight: 600,
                                  color: "#fff",
                                  cursor: "pointer",
                                }}
                              >
                                {isSuspended ? "Activate" : "Suspend"}
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================
          TAB 3: PLACEMENT DRIVES & OPPORTUNITIES (TPO DIRECT POST)
         ======================================================== */}
      {activeTab === "drives" && (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "10px" }}>
            <div>
              <h2 style={{ margin: 0, fontSize: "18px", color: "#0f172a" }}>Campus Placement Drives & Direct TPO Postings</h2>
              <span style={{ fontSize: "13px", color: "#64748b" }}>
                Drives directly published here by TPO immediately appear in students' Campus Placement section
              </span>
            </div>
            <button
              onClick={() => setShowPostDriveModal(true)}
              style={{
                padding: "9px 16px",
                background: "#0284c7",
                color: "#fff",
                border: "none",
                borderRadius: "8px",
                fontSize: "13px",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              ➕ Post Direct Drive (TPO)
            </button>
          </div>

          <div style={{
            background: "#ffffff",
            borderRadius: "14px",
            border: "1px solid #e2e8f0",
            overflow: "hidden",
          }}>
            {drives.length === 0 ? (
              <div style={{ padding: "40px", textAlign: "center", color: "#64748b" }}>
                No active placement drives found. Click <strong>Post Direct Drive</strong> to publish one!
              </div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "13px" }}>
                  <thead>
                    <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                      <th style={{ padding: "12px 16px" }}>Job Role / Drive Title</th>
                      <th style={{ padding: "12px 16px" }}>Company Partner</th>
                      <th style={{ padding: "12px 16px" }}>Type / Package</th>
                      <th style={{ padding: "12px 16px" }}>Eligibility Criteria</th>
                      <th style={{ padding: "12px 16px" }}>Deadline</th>
                      <th style={{ padding: "12px 16px" }}>Applicants</th>
                      <th style={{ padding: "12px 16px" }}>Status</th>
                      <th style={{ padding: "12px 16px", textAlign: "right" }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {drives.map((d) => (
                      <tr key={d._id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                        <td style={{ padding: "12px 16px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
                            <strong style={{ color: "#0f172a" }}>{d.jobTitle}</strong>
                            {d.isOpenToAll && (
                              <span style={{ fontSize: "10px", fontWeight: 700, background: "#dcfce7", color: "#15803d", padding: "1px 6px", borderRadius: "4px", border: "1px solid #86efac" }}>
                                ✨ Open for All
                              </span>
                            )}
                          </div>
                          <div style={{ fontSize: "11px", color: "#64748b" }}>{d.workMode || "On-site"} • {d.location}</div>
                        </td>
                        <td style={{ padding: "12px 16px", fontWeight: 600 }}>
                          {d.company?.name || "Corporate Partner"}
                        </td>
                        <td style={{ padding: "12px 16px" }}>
                          {d.opportunityType === "internship" ? (
                            <span style={{ color: "#d97706", fontWeight: 700 }}>
                              Internship • {d.stipend || "Stipend"}
                            </span>
                          ) : (
                            <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
                              <span style={{ color: "#0284c7", fontWeight: 700 }}>
                                ₹{d.package} LPA
                              </span>
                              {(d.category || (d.package >= 10 ? "Super Dream" : d.package >= 6 ? "Dream" : "Regular")) && (
                                <span style={{
                                  fontSize: "10px",
                                  fontWeight: 700,
                                  padding: "2px 6px",
                                  borderRadius: "4px",
                                  background: (d.category === "Super Dream" || (!d.category && d.package >= 10))
                                    ? "#ede9fe"
                                    : (d.category === "Dream" || (!d.category && d.package >= 6))
                                    ? "#fef3c7"
                                    : "#f1f5f9",
                                  color: (d.category === "Super Dream" || (!d.category && d.package >= 10))
                                    ? "#7c3aed"
                                    : (d.category === "Dream" || (!d.category && d.package >= 6))
                                    ? "#b45309"
                                    : "#475569",
                                  border: "1px solid",
                                  borderColor: (d.category === "Super Dream" || (!d.category && d.package >= 10))
                                    ? "#ddd6fe"
                                    : (d.category === "Dream" || (!d.category && d.package >= 6))
                                    ? "#fde68a"
                                    : "#cbd5e1",
                                }}>
                                  {(d.category === "Super Dream" || (!d.category && d.package >= 10))
                                    ? "🔥 Super Dream"
                                    : (d.category === "Dream" || (!d.category && d.package >= 6))
                                    ? "⭐ Dream"
                                    : "Regular"}
                                </span>
                              )}
                            </div>
                          )}
                        </td>
                        <td style={{ padding: "12px 16px", fontSize: "12px" }}>
                          {d.isOpenToAll ? (
                            <span style={{ display: "inline-block", background: "#f0fdf4", color: "#166534", border: "1px solid #bbf7d0", padding: "2px 6px", borderRadius: "4px", fontWeight: 700 }}>
                              ✨ Open for All
                            </span>
                          ) : (
                            <>
                              <div>Min CGPA: <strong>{d.minimumCgpa || "None"}</strong></div>
                              <div style={{ color: "#64748b" }}>Max Backlogs: {d.maximumBacklogs ?? 0}</div>
                            </>
                          )}
                        </td>
                        <td style={{ padding: "12px 16px", fontSize: "12px" }}>
                          {new Date(d.applicationDeadline).toLocaleDateString()}
                        </td>
                        <td style={{ padding: "12px 16px", fontWeight: 700, color: "#0f172a" }}>
                          {d.applicationCount ?? "—"}
                        </td>
                        <td style={{ padding: "12px 16px" }}>
                          <span style={{
                            padding: "3px 8px",
                            borderRadius: "6px",
                            fontSize: "11px",
                            fontWeight: 700,
                            background: d.status === "open" ? "#dcfce7" : "#fee2e2",
                            color: d.status === "open" ? "#15803d" : "#dc2626",
                          }}>
                            {d.status?.toUpperCase()}
                          </span>
                        </td>
                        <td style={{ padding: "12px 16px", textAlign: "right" }}>
                          <button
                            onClick={() => handleToggleDriveStatus(d)}
                            style={{
                              padding: "6px 10px",
                              background: d.status === "open" ? "#ef4444" : "#22c55e",
                              border: "none",
                              borderRadius: "6px",
                              fontSize: "11px",
                              fontWeight: 600,
                              color: "#fff",
                              cursor: "pointer",
                            }}
                          >
                            {d.status === "open" ? "Close Drive" : "Reopen Drive"}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================
          TAB 4: APPROVALS HUB (RECRUITERS & DRIVES VETTING)
         ======================================================== */}
      {activeTab === "approvals" && (
        <div>
          {/* Sub Tab Switcher */}
          <div style={{ display: "flex", gap: "8px", marginBottom: "20px" }}>
            <button
              onClick={() => setApprovalsSubTab("recruiters")}
              style={{
                padding: "8px 16px",
                borderRadius: "8px",
                border: "1px solid #cbd5e1",
                background: approvalsSubTab === "recruiters" ? "#0f172a" : "#ffffff",
                color: approvalsSubTab === "recruiters" ? "#ffffff" : "#475569",
                fontSize: "13px",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Pending Recruiter Signups ({pendingRecruiters.length})
            </button>
            <button
              onClick={() => setApprovalsSubTab("drives")}
              style={{
                padding: "8px 16px",
                borderRadius: "8px",
                border: "1px solid #cbd5e1",
                background: approvalsSubTab === "drives" ? "#0f172a" : "#ffffff",
                color: approvalsSubTab === "drives" ? "#ffffff" : "#475569",
                fontSize: "13px",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Pending Drive Proposals ({pendingDrives.length})
            </button>
            <button
              onClick={() => setApprovalsSubTab("scores")}
              style={{
                padding: "8px 16px",
                borderRadius: "8px",
                border: "1px solid #cbd5e1",
                background: approvalsSubTab === "scores" ? "#0f172a" : "#ffffff",
                color: approvalsSubTab === "scores" ? "#ffffff" : "#475569",
                fontSize: "13px",
                fontWeight: 600,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <span>🎓 Academic Score Requests</span>
              {(scoreRequestStats?.pending ?? scoreRequests.filter((r) => r.status === "pending").length) > 0 && (
                <span style={{
                  background: "#e11d48",
                  color: "#fff",
                  padding: "1px 6px",
                  borderRadius: "10px",
                  fontSize: "11px",
                  fontWeight: 800,
                }}>
                  {scoreRequestStats?.pending ?? scoreRequests.filter((r) => r.status === "pending").length}
                </span>
              )}
            </button>
          </div>

          {/* Sub Tab 1: Pending Recruiters */}
          {approvalsSubTab === "recruiters" && (
            <div>
              {pendingRecruiters.length === 0 ? (
                <div style={{ padding: "40px", background: "#fff", borderRadius: "12px", textAlign: "center", border: "1px solid #e2e8f0" }}>
                  <span style={{ fontSize: "28px" }}>✓</span>
                  <h3 style={{ margin: "8px 0 4px", color: "#0f172a" }}>No Pending Recruiter Signups</h3>
                  <p style={{ margin: 0, color: "#64748b", fontSize: "13px" }}>All recruiter registrations have been reviewed.</p>
                </div>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "16px" }}>
                  {pendingRecruiters.map((rec) => (
                    <div key={rec._id} style={{ background: "#ffffff", borderRadius: "12px", border: "1px solid #e2e8f0", padding: "18px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                        <span style={{ fontSize: "11px", fontWeight: 700, color: "#d97706", background: "#fef3c7", padding: "2px 8px", borderRadius: "4px" }}>
                          PENDING APPROVAL
                        </span>
                        <span style={{ fontSize: "11px", color: "#94a3b8" }}>
                          {new Date(rec.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <h3 style={{ margin: "0 0 4px", fontSize: "16px", color: "#0f172a" }}>{rec.name}</h3>
                      <div style={{ fontSize: "13px", color: "#0284c7", fontWeight: 600, marginBottom: "8px" }}>
                        {rec.designation || "Recruiter"} @ {rec.companyName || "Organization"}
                      </div>
                      <div style={{ fontSize: "12px", color: "#64748b", marginBottom: "4px" }}>
                        📧 {rec.email}
                      </div>
                      {rec.contactNumber && (
                        <div style={{ fontSize: "12px", color: "#64748b", marginBottom: "4px" }}>
                          📞 {rec.contactNumber}
                        </div>
                      )}
                      {rec.companyWebsite && (
                        <div style={{ fontSize: "12px", color: "#0284c7", marginBottom: "12px" }}>
                          🌐 <a href={rec.companyWebsite} target="_blank" rel="noreferrer">{rec.companyWebsite}</a>
                        </div>
                      )}

                      <div style={{ display: "flex", gap: "8px", marginTop: "14px" }}>
                        <button
                          onClick={() => handleApproveRecruiter(rec._id)}
                          style={{
                            flex: 1,
                            padding: "8px",
                            background: "#16a34a",
                            color: "#fff",
                            border: "none",
                            borderRadius: "6px",
                            fontSize: "12px",
                            fontWeight: 700,
                            cursor: "pointer",
                          }}
                        >
                          ✓ Approve Recruiter
                        </button>
                        <button
                          onClick={() => handleRejectRecruiter(rec._id)}
                          style={{
                            padding: "8px 12px",
                            background: "#fee2e2",
                            color: "#dc2626",
                            border: "none",
                            borderRadius: "6px",
                            fontSize: "12px",
                            fontWeight: 700,
                            cursor: "pointer",
                          }}
                        >
                          ✕ Reject
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Sub Tab 2: Pending Drives */}
          {approvalsSubTab === "drives" && (
            <div>
              {pendingDrives.length === 0 ? (
                <div style={{ padding: "40px", background: "#fff", borderRadius: "12px", textAlign: "center", border: "1px solid #e2e8f0" }}>
                  <span style={{ fontSize: "28px" }}>✓</span>
                  <h3 style={{ margin: "8px 0 4px", color: "#0f172a" }}>No Pending Drive Proposals</h3>
                  <p style={{ margin: 0, color: "#64748b", fontSize: "13px" }}>All recruiter drive submissions are up to date.</p>
                </div>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "16px" }}>
                  {pendingDrives.map((d) => (
                    <div key={d._id} style={{ background: "#ffffff", borderRadius: "12px", border: "1px solid #e2e8f0", padding: "18px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                        <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                          <span style={{ fontSize: "11px", fontWeight: 700, color: "#0284c7", background: "#e0f2fe", padding: "2px 8px", borderRadius: "4px" }}>
                            {d.opportunityType?.toUpperCase() || "DRIVE"}
                          </span>
                          {d.isOpenToAll && (
                            <span style={{ fontSize: "11px", fontWeight: 700, color: "#15803d", background: "#dcfce7", padding: "2px 8px", borderRadius: "4px", border: "1px solid #86efac" }}>
                              ✨ Open for All
                            </span>
                          )}
                        </div>
                        <span style={{ fontSize: "12px", fontWeight: 700, color: "#16a34a" }}>
                          {d.package ? `₹${d.package} LPA` : d.stipend || "Stipend"}
                        </span>
                      </div>
                      <h3 style={{ margin: "0 0 4px", fontSize: "16px", color: "#0f172a" }}>{d.jobTitle}</h3>
                      <div style={{ fontSize: "13px", color: "#475569", fontWeight: 600, marginBottom: "8px" }}>
                        Company: {d.company?.name || "Corporate Partner"}
                      </div>
                      <p style={{ fontSize: "12px", color: "#64748b", margin: "0 0 10px", lineHeight: "1.4" }}>
                        {d.description?.slice(0, 120)}...
                      </p>
                      <div style={{ fontSize: "11px", color: "#64748b", marginBottom: "4px" }}>
                        {d.isOpenToAll ? (
                          <span style={{ display: "inline-block", background: "#f0fdf4", color: "#166534", border: "1px solid #bbf7d0", padding: "2px 6px", borderRadius: "4px", fontWeight: 700 }}>
                            ✨ Open for All Students (No Cutoffs)
                          </span>
                        ) : (
                          <>Min CGPA: <strong>{d.minimumCgpa || "None"}</strong> • Backlogs: <strong>{d.maximumBacklogs ?? 0}</strong></>
                        )}
                      </div>
                      <div style={{ fontSize: "11px", color: "#64748b", marginBottom: "14px" }}>
                        Deadline: {new Date(d.applicationDeadline).toLocaleDateString()}
                      </div>

                      <div style={{ display: "flex", gap: "8px" }}>
                        <button
                          onClick={() => handleApproveDrive(d._id)}
                          style={{
                            flex: 1,
                            padding: "8px",
                            background: "#16a34a",
                            color: "#fff",
                            border: "none",
                            borderRadius: "6px",
                            fontSize: "12px",
                            fontWeight: 700,
                            cursor: "pointer",
                          }}
                        >
                          ✓ Approve & Publish to Students
                        </button>
                        <button
                          onClick={() => handleRejectDrive(d._id)}
                          style={{
                            padding: "8px 12px",
                            background: "#fee2e2",
                            color: "#dc2626",
                            border: "none",
                            borderRadius: "6px",
                            fontSize: "12px",
                            fontWeight: 700,
                            cursor: "pointer",
                          }}
                        >
                          ✕ Reject
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Sub Tab 3: Academic Score Update Requests */}
          {approvalsSubTab === "scores" && (
            <div>
              {/* Header & Filter Controls */}
              <div style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "18px",
                flexWrap: "wrap",
                gap: "12px",
              }}>
                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                  {[
                    { id: "pending", label: `Pending Verification (${scoreRequestStats?.pending || 0})` },
                    { id: "approved", label: `Approved (${scoreRequestStats?.approved || 0})` },
                    { id: "rejected", label: `Rejected (${scoreRequestStats?.rejected || 0})` },
                    { id: "all", label: `All Requests (${scoreRequestStats?.total || 0})` },
                  ].map((f) => (
                    <button
                      key={f.id}
                      onClick={() => setScoreRequestFilter(f.id)}
                      style={{
                        padding: "6px 14px",
                        borderRadius: "20px",
                        border: `1px solid ${scoreRequestFilter === f.id ? "#0f172a" : "#cbd5e1"}`,
                        background: scoreRequestFilter === f.id ? "#0f172a" : "#ffffff",
                        color: scoreRequestFilter === f.id ? "#ffffff" : "#475569",
                        fontSize: "12px",
                        fontWeight: 600,
                        cursor: "pointer",
                      }}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>

                <button
                  onClick={loadAdminScoreRequests}
                  disabled={loadingScoreRequests}
                  style={{
                    padding: "7px 14px",
                    background: "#f1f5f9",
                    border: "1px solid #cbd5e1",
                    borderRadius: "8px",
                    fontSize: "12px",
                    fontWeight: 600,
                    color: "#334155",
                    cursor: "pointer",
                  }}
                >
                  🔄 Refresh Score Queue
                </button>
              </div>

              {loadingScoreRequests ? (
                <div style={{ padding: "40px", textAlign: "center", color: "#64748b" }}>
                  <span style={{ fontSize: "24px" }}>⏳</span>
                  <p style={{ margin: "8px 0 0", fontSize: "13px" }}>Loading academic score requests...</p>
                </div>
              ) : scoreRequests.length === 0 ? (
                <div style={{ padding: "40px", background: "#fff", borderRadius: "12px", textAlign: "center", border: "1px solid #e2e8f0" }}>
                  <span style={{ fontSize: "28px" }}>🎓</span>
                  <h3 style={{ margin: "8px 0 4px", color: "#0f172a" }}>No Score Change Requests</h3>
                  <p style={{ margin: 0, color: "#64748b", fontSize: "13px" }}>
                    {scoreRequestFilter === "pending"
                      ? "All student academic score requests have been reviewed."
                      : "No records found matching this status filter."}
                  </p>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  {scoreRequests.map((req) => {
                    const isPending = req.status === "pending";
                    const isApproved = req.status === "approved";

                    const cgpaDiff = (req.requestedScores?.cgpa ?? 0) - (req.currentScores?.cgpa ?? 0);
                    const backlogDiff = (req.requestedScores?.backlogs ?? 0) - (req.currentScores?.backlogs ?? 0);

                    return (
                      <div
                        key={req._id}
                        style={{
                          background: "#ffffff",
                          borderRadius: "14px",
                          border: `1px solid ${isPending ? "#fed7aa" : "#e2e8f0"}`,
                          boxShadow: isPending ? "0 4px 14px rgba(234, 88, 12, 0.08)" : "0 2px 6px rgba(0,0,0,0.03)",
                          padding: "20px 24px",
                          display: "flex",
                          flexDirection: "column",
                          gap: "14px",
                        }}
                      >
                        {/* Header Row */}
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "10px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                            <span style={{
                              fontFamily: "monospace",
                              fontSize: "12px",
                              fontWeight: 700,
                              background: "#0f172a",
                              color: "#fff",
                              padding: "3px 8px",
                              borderRadius: "6px",
                            }}>
                              #REQ-{req._id.slice(-6).toUpperCase()}
                            </span>

                            <span style={{
                              fontSize: "12px",
                              fontWeight: 700,
                              padding: "3px 10px",
                              borderRadius: "20px",
                              background: isPending ? "#fffbeb" : isApproved ? "#f0fdf4" : "#fef2f2",
                              color: isPending ? "#d97706" : isApproved ? "#15803d" : "#dc2626",
                              border: `1px solid ${isPending ? "#fde68a" : isApproved ? "#bbf7d0" : "#fecaca"}`,
                            }}>
                              {isPending ? "🟡 Pending Verification" : isApproved ? "🟢 Approved & Applied" : "🔴 Rejected"}
                            </span>
                          </div>

                          <div style={{ fontSize: "12px", color: "#94a3b8" }}>
                            Submitted {new Date(req.createdAt).toLocaleString()}
                          </div>
                        </div>

                        {/* Student Details Strip */}
                        <div style={{
                          display: "flex",
                          flexWrap: "wrap",
                          gap: "14px",
                          background: "#f8fafc",
                          padding: "10px 14px",
                          borderRadius: "8px",
                          border: "1px solid #f1f5f9",
                          fontSize: "13px",
                          color: "#334155",
                          alignItems: "center",
                        }}>
                          <div>
                            🎓 Student: <strong>{req.student?.name || "Student"}</strong>
                          </div>
                          <div>
                            🆔 Roll No: <code style={{ background: "#e2e8f0", padding: "1px 6px", borderRadius: "4px" }}>{req.student?.rollNumber || "N/A"}</code>
                          </div>
                          <div>
                            📚 Course: <strong>{req.student?.course || "B.Tech"} ({req.student?.branch || "N/A"})</strong>
                          </div>
                          <div>
                            ✉️ {req.student?.email || "N/A"}
                          </div>
                        </div>

                        {/* Comparison Matrix */}
                        <div style={{
                          overflowX: "auto",
                          border: "1px solid #e2e8f0",
                          borderRadius: "10px",
                        }}>
                          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                            <thead>
                              <tr style={{ background: "#f1f5f9", color: "#475569", textAlign: "left" }}>
                                <th style={{ padding: "8px 14px", fontWeight: 700 }}>Academic Metric</th>
                                <th style={{ padding: "8px 14px", fontWeight: 700 }}>Current Registered Score</th>
                                <th style={{ padding: "8px 14px", fontWeight: 700 }}>Requested New Score</th>
                                <th style={{ padding: "8px 14px", fontWeight: 700 }}>Difference / Impact</th>
                              </tr>
                            </thead>
                            <tbody>
                              <tr style={{ borderTop: "1px solid #f1f5f9" }}>
                                <td style={{ padding: "8px 14px", fontWeight: 600, color: "#0f172a" }}>CGPA</td>
                                <td style={{ padding: "8px 14px", color: "#64748b" }}>{req.currentScores?.cgpa ?? "Not Set"}</td>
                                <td style={{ padding: "8px 14px", fontWeight: 700, color: "#0284c7" }}>{req.requestedScores?.cgpa}</td>
                                <td style={{ padding: "8px 14px", fontWeight: 700, color: cgpaDiff > 0 ? "#16a34a" : cgpaDiff < 0 ? "#dc2626" : "#64748b" }}>
                                  {cgpaDiff > 0 ? `+${cgpaDiff.toFixed(2)}` : cgpaDiff < 0 ? cgpaDiff.toFixed(2) : "No change"}
                                </td>
                              </tr>
                              <tr style={{ borderTop: "1px solid #f1f5f9" }}>
                                <td style={{ padding: "8px 14px", fontWeight: 600, color: "#0f172a" }}>Active Backlogs</td>
                                <td style={{ padding: "8px 14px", color: "#64748b" }}>{req.currentScores?.backlogs ?? 0}</td>
                                <td style={{ padding: "8px 14px", fontWeight: 700, color: req.requestedScores?.backlogs === 0 ? "#16a34a" : "#dc2626" }}>
                                  {req.requestedScores?.backlogs}
                                </td>
                                <td style={{ padding: "8px 14px", fontWeight: 700, color: backlogDiff < 0 ? "#16a34a" : backlogDiff > 0 ? "#dc2626" : "#64748b" }}>
                                  {backlogDiff < 0 ? `Cleared ${Math.abs(backlogDiff)} backlogs` : backlogDiff > 0 ? `+${backlogDiff} backlogs` : "No change"}
                                </td>
                              </tr>
                              <tr style={{ borderTop: "1px solid #f1f5f9" }}>
                                <td style={{ padding: "8px 14px", fontWeight: 600, color: "#0f172a" }}>10th Board %</td>
                                <td style={{ padding: "8px 14px", color: "#64748b" }}>{req.currentScores?.tenthPercentage ? `${req.currentScores.tenthPercentage}%` : "Not Set"}</td>
                                <td style={{ padding: "8px 14px", fontWeight: 700, color: "#0284c7" }}>{req.requestedScores?.tenthPercentage}%</td>
                                <td style={{ padding: "8px 14px", color: "#64748b" }}>-</td>
                              </tr>
                              <tr style={{ borderTop: "1px solid #f1f5f9" }}>
                                <td style={{ padding: "8px 14px", fontWeight: 600, color: "#0f172a" }}>12th / Diploma %</td>
                                <td style={{ padding: "8px 14px", color: "#64748b" }}>{req.currentScores?.twelfthPercentage ? `${req.currentScores.twelfthPercentage}%` : "Not Set"}</td>
                                <td style={{ padding: "8px 14px", fontWeight: 700, color: "#0284c7" }}>{req.requestedScores?.twelfthPercentage}%</td>
                                <td style={{ padding: "8px 14px", color: "#64748b" }}>-</td>
                              </tr>
                            </tbody>
                          </table>
                        </div>

                        {/* Student Reason */}
                        <div style={{
                          background: "#f8fafc",
                          borderRadius: "8px",
                          padding: "10px 14px",
                          border: "1px solid #f1f5f9",
                          fontSize: "13px",
                        }}>
                          <span style={{ fontWeight: 700, color: "#334155", display: "block", marginBottom: "4px" }}>
                            📝 Student Justification:
                          </span>
                          <p style={{ margin: 0, color: "#475569", lineHeight: "1.5" }}>
                            "{req.reason}"
                          </p>
                          {req.proofDocumentUrl && (
                            <div style={{ marginTop: "6px" }}>
                              <a
                                href={req.proofDocumentUrl}
                                target="_blank"
                                rel="noreferrer"
                                style={{ color: "#0284c7", fontWeight: 600, textDecoration: "none", fontSize: "12px" }}
                              >
                                📎 View Attached Marksheet / Proof Document ↗
                              </a>
                            </div>
                          )}
                        </div>

                        {/* Audit Trail if already reviewed */}
                        {!isPending && req.reviewedAt && (
                          <div style={{
                            background: isApproved ? "#f0fdf4" : "#fef2f2",
                            borderRadius: "8px",
                            padding: "10px 14px",
                            border: `1px solid ${isApproved ? "#bbf7d0" : "#fecaca"}`,
                            fontSize: "12px",
                            color: isApproved ? "#15803d" : "#991b1b",
                          }}>
                            <strong>Decision by {req.reviewedBy?.name || "TPO Administrator"} on {new Date(req.reviewedAt).toLocaleString()}:</strong>
                            <div style={{ marginTop: "2px", fontStyle: "italic" }}>
                              "{req.reviewRemarks || (isApproved ? "Approved" : "Rejected")}"
                            </div>
                          </div>
                        )}

                        {/* Actions for Pending Requests */}
                        {isPending && (
                          <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", borderTop: "1px solid #f1f5f9", paddingTop: "12px" }}>
                            <button
                              onClick={() => {
                                setSelectedScoreRequestForReject(req);
                                setRejectionRemarks("");
                              }}
                              disabled={processingScoreAction}
                              style={{
                                padding: "8px 18px",
                                background: "#fee2e2",
                                color: "#dc2626",
                                border: "none",
                                borderRadius: "8px",
                                fontSize: "13px",
                                fontWeight: 700,
                                cursor: processingScoreAction ? "not-allowed" : "pointer",
                              }}
                            >
                              ✕ Reject Request
                            </button>
                            <button
                              onClick={() => handleApproveScoreRequest(req)}
                              disabled={processingScoreAction}
                              style={{
                                padding: "8px 22px",
                                background: "#16a34a",
                                color: "#ffffff",
                                border: "none",
                                borderRadius: "8px",
                                fontSize: "13px",
                                fontWeight: 700,
                                cursor: processingScoreAction ? "not-allowed" : "pointer",
                                boxShadow: "0 2px 8px rgba(22, 163, 74, 0.25)",
                              }}
                            >
                              {processingScoreAction ? "Processing..." : "✓ Approve & Apply to Profile"}
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* MODAL: REJECT SCORE REQUEST */}
          {selectedScoreRequestForReject && (
            <div style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: "rgba(15, 23, 42, 0.65)",
              backdropFilter: "blur(4px)",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              zIndex: 1100,
              padding: "20px",
            }}>
              <div style={{
                background: "#ffffff",
                borderRadius: "16px",
                width: "100%",
                maxWidth: "500px",
                padding: "26px",
                boxShadow: "0 20px 40px rgba(0,0,0,0.25)",
                border: "1px solid #e2e8f0",
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ fontSize: "22px" }}>⚠️</span>
                    <h3 style={{ margin: 0, fontSize: "17px", color: "#0f172a", fontWeight: 700 }}>
                      Reject Score Update Request
                    </h3>
                  </div>
                  <button
                    onClick={() => setSelectedScoreRequestForReject(null)}
                    style={{ background: "none", border: "none", fontSize: "18px", color: "#64748b", cursor: "pointer" }}
                  >
                    ✕
                  </button>
                </div>

                <p style={{ fontSize: "13px", color: "#475569", margin: "0 0 14px", lineHeight: "1.5" }}>
                  You are about to reject the score update request for <strong>{selectedScoreRequestForReject.student?.name}</strong> ({selectedScoreRequestForReject.student?.rollNumber}). Their existing profile scores will remain unchanged.
                </p>

                <form onSubmit={handleRejectScoreRequestSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#334155", marginBottom: "4px" }}>
                      Rejection Remarks / Explanation for Student *
                    </label>
                    <textarea
                      rows={3}
                      required
                      placeholder="e.g., Grade card verification failed; discrepancy in 5th semester mark sheet. Please visit CRPC office room 104 with original documents."
                      value={rejectionRemarks}
                      onChange={(e) => setRejectionRemarks(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "9px 12px",
                        borderRadius: "8px",
                        border: "1px solid #cbd5e1",
                        fontSize: "13px",
                        color: "#0f172a",
                        boxSizing: "border-box",
                        outline: "none",
                        fontFamily: "inherit",
                        resize: "vertical",
                      }}
                    />
                  </div>

                  <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", marginTop: "6px" }}>
                    <button
                      type="button"
                      onClick={() => setSelectedScoreRequestForReject(null)}
                      disabled={processingScoreAction}
                      style={{
                        padding: "8px 16px",
                        background: "#f1f5f9",
                        border: "1px solid #cbd5e1",
                        borderRadius: "8px",
                        fontSize: "13px",
                        fontWeight: 600,
                        color: "#475569",
                        cursor: "pointer",
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={processingScoreAction}
                      style={{
                        padding: "8px 20px",
                        background: "#dc2626",
                        color: "#ffffff",
                        border: "none",
                        borderRadius: "8px",
                        fontSize: "13px",
                        fontWeight: 700,
                        cursor: processingScoreAction ? "not-allowed" : "pointer",
                        boxShadow: "0 2px 8px rgba(220, 38, 38, 0.25)",
                      }}
                    >
                      {processingScoreAction ? "Rejecting..." : "Confirm Rejection"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================
          TAB 5: CORPORATE PARTNERS DIRECTORY
         ======================================================== */}
      {activeTab === "companies" && (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "12px" }}>
            <div>
              <h2 style={{ margin: 0, fontSize: "18px", color: "#0f172a" }}>Corporate Partners & Industry Collaborators</h2>
              <span style={{ fontSize: "13px", color: "#64748b" }}>Verified hiring partners and assigned corporate recruiters ({companies.length})</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
              <input
                type="text"
                placeholder="🔍 Search partners, industry, recruiter..."
                value={companySearch}
                onChange={(e) => setCompanySearch(e.target.value)}
                style={{
                  padding: "8px 14px",
                  borderRadius: "8px",
                  border: "1px solid #cbd5e1",
                  fontSize: "13px",
                  minWidth: "250px",
                  background: "#ffffff",
                }}
              />
              <button
                onClick={() => setShowCreateCompany(true)}
                style={{
                  padding: "9px 16px",
                  background: "#0f172a",
                  color: "#fff",
                  border: "none",
                  borderRadius: "8px",
                  fontSize: "13px",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                + Onboard New Partner
              </button>
            </div>
          </div>

          {companies.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px 20px", background: "#ffffff", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
              <div style={{ fontSize: "36px", marginBottom: "8px" }}>🏢</div>
              <h3 style={{ margin: "0 0 6px", color: "#0f172a" }}>No Corporate Partners Onboarded Yet</h3>
              <p style={{ margin: "0 0 16px", color: "#64748b", fontSize: "13px" }}>Start adding hiring organizations and linking their talent acquisition teams.</p>
              <button
                onClick={() => setShowCreateCompany(true)}
                style={{ padding: "8px 16px", background: "#0284c7", color: "#fff", border: "none", borderRadius: "8px", fontSize: "13px", fontWeight: 600, cursor: "pointer" }}
              >
                + Onboard First Company
              </button>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(330px, 1fr))", gap: "16px" }}>
              {companies
                .filter((c) => {
                  if (!companySearch.trim()) return true;
                  const term = companySearch.toLowerCase();
                  return (
                    c.name?.toLowerCase().includes(term) ||
                    c.industry?.toLowerCase().includes(term) ||
                    c.location?.toLowerCase().includes(term) ||
                    c.recruiter?.name?.toLowerCase().includes(term) ||
                    c.recruiter?.email?.toLowerCase().includes(term)
                  );
                })
                .map((c) => (
                  <div
                    key={c._id}
                    style={{
                      background: "#ffffff",
                      borderRadius: "14px",
                      border: "1px solid #e2e8f0",
                      padding: "20px",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                      boxShadow: "0 2px 4px rgba(0,0,0,0.03)",
                    }}
                  >
                    <div>
                      {/* Header: Avatar + Title & Badges */}
                      <div style={{ display: "flex", alignItems: "flex-start", gap: "12px", marginBottom: "12px" }}>
                        <div
                          style={{
                            width: "44px",
                            height: "44px",
                            borderRadius: "10px",
                            background: "linear-gradient(135deg, #0284c7, #0f172a)",
                            color: "#ffffff",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "18px",
                            fontWeight: 700,
                            flexShrink: 0,
                          }}
                        >
                          {c.name ? c.name.charAt(0).toUpperCase() : "C"}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <h3 style={{ margin: "0 0 4px", fontSize: "16px", color: "#0f172a", fontWeight: 700, wordBreak: "break-word" }}>
                            {c.name}
                          </h3>
                          <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                            <span style={{ fontSize: "11px", padding: "2px 8px", background: "#f1f5f9", borderRadius: "4px", color: "#475569", fontWeight: 600 }}>
                              {c.industry || "Technology"}
                            </span>
                            <span style={{ fontSize: "11px", padding: "2px 8px", background: "#eff6ff", borderRadius: "4px", color: "#1e40af" }}>
                              📍 {c.location || "Delhi-NCR"}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Description / Summary */}
                      {c.description && (
                        <p style={{ margin: "0 0 10px", fontSize: "12px", color: "#64748b", lineHeight: "1.4" }}>
                          {c.description}
                        </p>
                      )}

                      {/* Website */}
                      {c.website && (
                        <div style={{ fontSize: "12px", marginBottom: "12px" }}>
                          <a
                            href={c.website.startsWith("http") ? c.website : `https://${c.website}`}
                            target="_blank"
                            rel="noreferrer"
                            style={{ color: "#0284c7", textDecoration: "none", fontWeight: 600, display: "inline-flex", alignItems: "center", gap: "4px" }}
                          >
                            🌐 {c.website.replace(/^https?:\/\//, "")} ↗
                          </a>
                        </div>
                      )}

                      {/* Point of Contact / Recruiter Section */}
                      {c.recruiter ? (
                        <div
                          style={{
                            background: "#f0fdf4",
                            border: "1px solid #bbf7d0",
                            borderRadius: "10px",
                            padding: "10px 12px",
                            marginBottom: "14px",
                          }}
                        >
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                            <span style={{ fontSize: "10px", fontWeight: 700, color: "#166534", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                              Point of Contact (Recruiter)
                            </span>
                            <span style={{ fontSize: "10px", background: "#dcfce7", color: "#15803d", padding: "1px 6px", borderRadius: "10px", fontWeight: 600 }}>
                              Assigned
                            </span>
                          </div>
                          <div style={{ fontSize: "13px", fontWeight: 700, color: "#14532d" }}>
                            👤 {c.recruiter.name} {c.recruiter.designation ? `(${c.recruiter.designation})` : ""}
                          </div>
                          <div style={{ fontSize: "12px", color: "#166534", marginTop: "2px" }}>
                            ✉️ {c.recruiter.email}
                          </div>
                          {c.recruiter.contactNumber && (
                            <div style={{ fontSize: "12px", color: "#166534", marginTop: "2px" }}>
                              📞 {c.recruiter.contactNumber}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div
                          style={{
                            background: "#f8fafc",
                            border: "1px dashed #cbd5e1",
                            borderRadius: "10px",
                            padding: "10px 12px",
                            marginBottom: "14px",
                          }}
                        >
                          <div style={{ fontSize: "10px", fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "2px" }}>
                            Hiring Engagement
                          </div>
                          <div style={{ fontSize: "12px", fontWeight: 600, color: "#334155" }}>
                            🏛️ Direct Campus Partner (Managed by XYZ CRPC)
                          </div>
                          <div style={{ fontSize: "11px", color: "#64748b", marginTop: "2px" }}>
                            Placement drives & opportunities managed by college placement cell.
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: "8px", marginTop: "8px", borderTop: "1px solid #f1f5f9", paddingTop: "12px" }}>
                      <button
                        onClick={() => handleOpenEditCompany(c)}
                        style={{
                          padding: "8px 12px",
                          background: "#f8fafc",
                          border: "1px solid #cbd5e1",
                          borderRadius: "8px",
                          fontSize: "12px",
                          fontWeight: 600,
                          color: "#1e293b",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "6px",
                        }}
                      >
                        ✏️ Edit Partner & Recruiter
                      </button>
                      <button
                        onClick={() => handleDeleteCompany(c._id, c.name)}
                        title="Remove corporate partner"
                        style={{
                          padding: "8px 12px",
                          background: "#fff1f2",
                          border: "1px solid #fecdd3",
                          borderRadius: "8px",
                          fontSize: "12px",
                          fontWeight: 600,
                          color: "#e11d48",
                          cursor: "pointer",
                        }}
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      )}

      {/* ========================================================
          TAB 6: COMPETITIONS & HACKATHONS
         ======================================================== */}
      {activeTab === "competitions" && (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "10px" }}>
            <div>
              <h2 style={{ margin: 0, fontSize: "18px", color: "#0f172a" }}>TPO Hackathons & Coding Contests</h2>
              <span style={{ fontSize: "13px", color: "#64748b" }}>Host official institutional challenges visible to all XYZ students</span>
            </div>
            <button
              onClick={() => setShowCreateCompModal(true)}
              style={{
                padding: "9px 16px",
                background: "#d97706",
                color: "#fff",
                border: "none",
                borderRadius: "8px",
                fontSize: "13px",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              + Host Contest / Hackathon 🏆
            </button>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "16px" }}>
            {competitions.map((comp) => (
              <div key={comp._id} style={{ background: "#ffffff", borderRadius: "12px", border: "1px solid #e2e8f0", padding: "18px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                  <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                    <span style={{ fontSize: "11px", fontWeight: 700, color: "#d97706", background: "#fef3c7", padding: "2px 8px", borderRadius: "4px" }}>
                      {comp.type}
                    </span>
                    {comp.isOpenToAll !== false && (
                      <span style={{ fontSize: "11px", fontWeight: 700, color: "#15803d", background: "#dcfce7", padding: "2px 8px", borderRadius: "4px", border: "1px solid #86efac" }}>
                        ✨ Open for All
                      </span>
                    )}
                  </div>
                  <span style={{ fontSize: "12px", color: "#64748b" }}>
                    Deadline: {new Date(comp.registrationDeadline).toLocaleDateString()}
                  </span>
                </div>
                <h3 style={{ margin: "0 0 6px", fontSize: "16px", color: "#0f172a" }}>{comp.title}</h3>
                <p style={{ fontSize: "12px", color: "#64748b", margin: "0 0 10px", lineHeight: "1.4" }}>
                  {comp.description}
                </p>
                {comp.prizes && (
                  <div style={{ fontSize: "12px", fontWeight: 700, color: "#16a34a", marginBottom: "8px" }}>
                    🎁 {comp.prizes}
                  </div>
                )}
                <div style={{ fontSize: "12px", color: "#475569", marginBottom: "14px" }}>
                  Team Size: Up to {comp.maxTeamSize} member(s) • Organizer: {comp.organizer}
                </div>

                <div style={{ display: "flex", gap: "8px" }}>
                  <button
                    onClick={() => handleViewParticipants(comp)}
                    style={{
                      flex: 1,
                      padding: "8px",
                      background: "#0284c7",
                      color: "#fff",
                      border: "none",
                      borderRadius: "6px",
                      fontSize: "12px",
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    👥 View Participants ({comp.participants?.length || 0})
                  </button>
                  <button
                    onClick={() => handleDeleteCompetition(comp._id)}
                    style={{
                      padding: "8px 12px",
                      background: "#fee2e2",
                      color: "#dc2626",
                      border: "none",
                      borderRadius: "6px",
                      fontSize: "12px",
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================
          TAB 7: TPO SKILL WORKSHOPS & MASTERCLASSES (RAZORPAY INTEGRATED)
         ======================================================== */}
      {activeTab === "workshops" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          {/* Top Header Card */}
          <div style={{
            background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
            borderRadius: "16px",
            padding: "24px 28px",
            color: "#ffffff",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "16px",
            boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
          }}>
            <div>
              <div style={{ display: "inline-block", background: "rgba(56, 189, 248, 0.15)", color: "#38bdf8", padding: "4px 12px", borderRadius: "20px", fontSize: "12px", fontWeight: 700, letterSpacing: "0.5px", marginBottom: "8px" }}>
                💡 INSTITUTIONAL UPSKILLING & RAZORPAY GATEWAY
              </div>
              <h2 style={{ margin: "0 0 6px", fontSize: "22px", fontWeight: 800 }}>
                Skill Workshops & Masterclasses
              </h2>
              {/* <p style={{ margin: 0, fontSize: "13px", color: "#94a3b8", maxWidth: "620px" }}>
                Publish industry-led workshops with automated seat caps, automated Razorpay payment checkout for paid cohorts, and instant registration confirmation.
              </p> */}
            </div>

            <button
              onClick={() => setShowCreateWorkshopModal(true)}
              style={{
                padding: "12px 22px",
                background: "#0284c7",
                color: "#ffffff",
                border: "none",
                borderRadius: "10px",
                fontSize: "13px",
                fontWeight: 700,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                boxShadow: "0 4px 14px rgba(2, 132, 199, 0.35)",
              }}
            >
              <span>+</span> Create New Workshop
            </button>
          </div>

          {/* Metrics Overview */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px" }}>
            <div style={{ background: "#ffffff", padding: "18px 20px", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
              <span style={{ fontSize: "12px", fontWeight: 600, color: "#64748b" }}>Total Workshops</span>
              <div style={{ fontSize: "24px", fontWeight: 800, color: "#0f172a", marginTop: "4px" }}>
                {adminWorkshops.length}
              </div>
            </div>
            <div style={{ background: "#ffffff", padding: "18px 20px", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
              <span style={{ fontSize: "12px", fontWeight: 600, color: "#64748b" }}>Paid Cohorts</span>
              <div style={{ fontSize: "24px", fontWeight: 800, color: "#0284c7", marginTop: "4px" }}>
                {adminWorkshops.filter((w) => w.isPaid && w.fee > 0).length}
              </div>
            </div>
            <div style={{ background: "#ffffff", padding: "18px 20px", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
              <span style={{ fontSize: "12px", fontWeight: 600, color: "#64748b" }}>Free / Sponsored</span>
              <div style={{ fontSize: "24px", fontWeight: 800, color: "#16a34a", marginTop: "4px" }}>
                {adminWorkshops.filter((w) => !w.isPaid || w.fee === 0).length}
              </div>
            </div>
            <div style={{ background: "#ffffff", padding: "18px 20px", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
              <span style={{ fontSize: "12px", fontWeight: 600, color: "#64748b" }}>Total Enrolments</span>
              <div style={{ fontSize: "24px", fontWeight: 800, color: "#d97706", marginTop: "4px" }}>
                {adminWorkshops.reduce((acc, w) => acc + (w.seatsBooked || 0), 0)}
              </div>
            </div>
          </div>

          {/* Filter Bar */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#ffffff", padding: "14px 18px", borderRadius: "12px", border: "1px solid #e2e8f0", flexWrap: "wrap", gap: "10px" }}>
            <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
              {[
                { id: "all", label: "All Workshops" },
                { id: "open", label: "Active / Open" },
                { id: "paid", label: "Paid" },
                { id: "free", label: "Free" },
                { id: "closed", label: "Closed / Completed" },
              ].map((btn) => (
                <button
                  key={btn.id}
                  onClick={() => setWorkshopStatusFilter(btn.id)}
                  style={{
                    padding: "6px 14px",
                    borderRadius: "6px",
                    border: "none",
                    fontSize: "12px",
                    fontWeight: 600,
                    cursor: "pointer",
                    background: workshopStatusFilter === btn.id ? "#0f172a" : "#f1f5f9",
                    color: workshopStatusFilter === btn.id ? "#ffffff" : "#475569",
                  }}
                >
                  {btn.label}
                </button>
              ))}
            </div>
            <span style={{ fontSize: "12px", color: "#64748b" }}>
              Showing {adminWorkshops.filter((w) => {
                if (workshopStatusFilter === "open") return w.status === "open";
                if (workshopStatusFilter === "closed") return w.status === "closed" || w.status === "completed";
                if (workshopStatusFilter === "paid") return w.isPaid && w.fee > 0;
                if (workshopStatusFilter === "free") return !w.isPaid || w.fee === 0;
                return true;
              }).length} workshops
            </span>
          </div>

          {/* Workshops Cards Grid */}
          {adminWorkshops.length === 0 ? (
            <div style={{ background: "#ffffff", padding: "48px 24px", borderRadius: "14px", border: "1px dashed #cbd5e1", textAlign: "center" }}>
              <div style={{ fontSize: "36px", marginBottom: "10px" }}>💡</div>
              <h3 style={{ margin: "0 0 6px", fontSize: "16px", color: "#0f172a" }}>No Skill Workshops Created Yet</h3>
              <p style={{ margin: "0 0 16px", fontSize: "13px", color: "#64748b" }}>
                Create your first workshop (Free or Paid with Razorpay) to start upskilling campus students.
              </p>
              <button
                onClick={() => setShowCreateWorkshopModal(true)}
                style={{ padding: "9px 18px", background: "#0284c7", color: "#fff", border: "none", borderRadius: "8px", fontSize: "13px", fontWeight: 700, cursor: "pointer" }}
              >
                + Create Workshop
              </button>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(350px, 1fr))", gap: "20px" }}>
              {adminWorkshops
                .filter((w) => {
                  if (workshopStatusFilter === "open") return w.status === "open";
                  if (workshopStatusFilter === "closed") return w.status === "closed" || w.status === "completed";
                  if (workshopStatusFilter === "paid") return w.isPaid && w.fee > 0;
                  if (workshopStatusFilter === "free") return !w.isPaid || w.fee === 0;
                  return true;
                })
                .map((ws) => {
                  const percentBooked = Math.min(100, Math.round(((ws.seatsBooked || 0) / (ws.totalSeats || 1)) * 100));
                  const isFull = ws.seatsBooked >= ws.totalSeats;
                  const isPaid = ws.isPaid && ws.fee > 0;

                  return (
                    <div
                      key={ws._id}
                      style={{
                        background: "#ffffff",
                        borderRadius: "14px",
                        border: "1px solid #e2e8f0",
                        padding: "20px",
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "space-between",
                        boxShadow: "0 4px 12px rgba(0,0,0,0.03)",
                      }}
                    >
                      <div>
                        {/* Header Badges */}
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                          <span style={{
                            padding: "3px 8px",
                            borderRadius: "6px",
                            fontSize: "11px",
                            fontWeight: 700,
                            background: ws.status === "open" ? "#dcfce7" : "#fee2e2",
                            color: ws.status === "open" ? "#15803d" : "#dc2626",
                            textTransform: "uppercase",
                          }}>
                            ● {ws.status}
                          </span>

                          <span style={{
                            padding: "4px 10px",
                            borderRadius: "8px",
                            fontSize: "12px",
                            fontWeight: 800,
                            background: isPaid ? "#eff6ff" : "#f0fdf4",
                            color: isPaid ? "#1d4ed8" : "#15803d",
                            border: `1px solid ${isPaid ? "#bfdbfe" : "#bbf7d0"}`,
                          }}>
                            {isPaid ? `₹${ws.fee} (Paid)` : "FREE"}
                          </span>
                        </div>

                        {/* Title & Instructor */}
                        <h3 style={{ margin: "0 0 6px", fontSize: "17px", fontWeight: 700, color: "#0f172a", lineHeight: 1.3 }}>
                          {ws.title}
                        </h3>
                        <div style={{ fontSize: "13px", color: "#64748b", marginBottom: "12px" }}>
                          Instructor: <strong>{ws.instructor}</strong> • {ws.duration}
                        </div>

                        {/* Schedule & Venue */}
                        <div style={{ background: "#f8fafc", padding: "10px 12px", borderRadius: "8px", border: "1px solid #f1f5f9", fontSize: "12px", color: "#475569", display: "flex", flexDirection: "column", gap: "3px", marginBottom: "14px" }}>
                          <div>📅 {new Date(ws.startDate).toLocaleDateString()} – {new Date(ws.endDate).toLocaleDateString()}</div>
                          <div>📍 {ws.venue || "Virtual Link"} ({ws.mode})</div>
                        </div>

                        {/* Seats Progress Bar */}
                        <div style={{ marginBottom: "16px" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", fontWeight: 600, color: "#475569", marginBottom: "4px" }}>
                            <span>Seats: <strong>{ws.seatsBooked} / {ws.totalSeats} Enrolled</strong></span>
                            <span style={{ color: isFull ? "#dc2626" : "#0284c7" }}>
                              {isFull ? "Housefull" : `${ws.totalSeats - ws.seatsBooked} Left`}
                            </span>
                          </div>
                          <div style={{ width: "100%", height: "6px", background: "#e2e8f0", borderRadius: "10px", overflow: "hidden" }}>
                            <div style={{ width: `${percentBooked}%`, height: "100%", background: isFull ? "#dc2626" : "#0284c7", borderRadius: "10px" }} />
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div style={{ display: "flex", gap: "8px", borderTop: "1px solid #f1f5f9", paddingTop: "14px" }}>
                        <button
                          onClick={() => handleViewWorkshopParticipants(ws)}
                          style={{
                            flex: 1.2,
                            padding: "8px 12px",
                            background: "#0284c7",
                            color: "#ffffff",
                            border: "none",
                            borderRadius: "6px",
                            fontSize: "12px",
                            fontWeight: 700,
                            cursor: "pointer",
                          }}
                        >
                          👥 Participants ({ws.seatsBooked || 0})
                        </button>
                        <button
                          onClick={() => handleToggleWorkshopStatus(ws, ws.status === "open" ? "closed" : "open")}
                          style={{
                            flex: 1,
                            padding: "8px 10px",
                            background: ws.status === "open" ? "#fee2e2" : "#dcfce7",
                            color: ws.status === "open" ? "#dc2626" : "#15803d",
                            border: "none",
                            borderRadius: "6px",
                            fontSize: "12px",
                            fontWeight: 700,
                            cursor: "pointer",
                          }}
                        >
                          {ws.status === "open" ? "Close" : "Reopen"}
                        </button>
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================
          TAB: SUPPORT & HELPDESK TICKETS MANAGEMENT
         ======================================================== */}
      {activeTab === "tickets" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          {/* Top Header Card */}
          <div style={{
            background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
            borderRadius: "16px",
            padding: "24px 28px",
            color: "#ffffff",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "16px",
            boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
          }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
                <span style={{ fontSize: "28px" }}>🎧</span>
                <h2 style={{ margin: 0, fontSize: "22px", fontWeight: 800, color: "#ffffff" }}>
                  CRPC Helpdesk & Student Grievance Resolution Desk
                </h2>
              </div>
              <p style={{ margin: 0, color: "#94a3b8", fontSize: "14px", maxWidth: "780px", lineHeight: "1.5" }}>
                Review and resolve student placement queries regarding CGPA eligibility discrepancies, interview schedule clashes, offer validations, and drive access.
              </p>
            </div>

            <div style={{ display: "flex", gap: "10px" }}>
              <button
                onClick={loadAdminTickets}
                disabled={loadingTickets}
                style={{
                  padding: "10px 18px",
                  background: "rgba(255, 255, 255, 0.12)",
                  color: "#ffffff",
                  border: "1px solid rgba(255, 255, 255, 0.2)",
                  borderRadius: "8px",
                  fontSize: "13px",
                  fontWeight: 600,
                  cursor: loadingTickets ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  transition: "background 0.2s",
                }}
              >
                <span>🔄</span> {loadingTickets ? "Refreshing..." : "Refresh Queue"}
              </button>
            </div>
          </div>

          {/* KPI Metrics */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px" }}>
            <div style={{
              background: "#ffffff",
              padding: "20px",
              borderRadius: "12px",
              border: "1px solid #e2e8f0",
              boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
            }}>
              <div style={{ fontSize: "12px", fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                Total Grievances Filed
              </div>
              <div style={{ fontSize: "32px", fontWeight: 800, color: "#0f172a", marginTop: "8px" }}>
                {ticketStats?.total || 0}
              </div>
              <div style={{ fontSize: "12px", color: "#94a3b8", marginTop: "4px" }}>
                All student support requests
              </div>
            </div>

            <div style={{
              background: "#fff1f2",
              padding: "20px",
              borderRadius: "12px",
              border: "1px solid #fecdd3",
              boxShadow: "0 1px 3px rgba(225,29,72,0.05)",
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "12px", fontWeight: 700, color: "#be123c", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  🔴 Open / Unresolved
                </span>
                {(ticketStats?.open || 0) > 0 && (
                  <span style={{ background: "#e11d48", color: "#fff", fontSize: "10px", fontWeight: 800, padding: "2px 6px", borderRadius: "10px" }}>
                    Action Required
                  </span>
                )}
              </div>
              <div style={{ fontSize: "32px", fontWeight: 800, color: "#e11d48", marginTop: "8px" }}>
                {ticketStats?.open || 0}
              </div>
              <div style={{ fontSize: "12px", color: "#9f1239", marginTop: "4px" }}>
                Pending CRPC review & action
              </div>
            </div>

            <div style={{
              background: "#fffbeb",
              padding: "20px",
              borderRadius: "12px",
              border: "1px solid #fde68a",
              boxShadow: "0 1px 3px rgba(217,119,6,0.05)",
            }}>
              <div style={{ fontSize: "12px", fontWeight: 700, color: "#b45309", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                🟡 In Progress / Under Review
              </div>
              <div style={{ fontSize: "32px", fontWeight: 800, color: "#d97706", marginTop: "8px" }}>
                {ticketStats?.in_progress || 0}
              </div>
              <div style={{ fontSize: "12px", color: "#92400e", marginTop: "4px" }}>
                Coordinating with departments/companies
              </div>
            </div>

            <div style={{
              background: "#f0fdf4",
              padding: "20px",
              borderRadius: "12px",
              border: "1px solid #bbf7d0",
              boxShadow: "0 1px 3px rgba(22,163,74,0.05)",
            }}>
              <div style={{ fontSize: "12px", fontWeight: 700, color: "#15803d", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                🟢 Resolved & Answered
              </div>
              <div style={{ fontSize: "32px", fontWeight: 800, color: "#16a34a", marginTop: "8px" }}>
                {ticketStats?.resolved || 0}
              </div>
              <div style={{ fontSize: "12px", color: "#166534", marginTop: "4px" }}>
                Official response provided to student
              </div>
            </div>
          </div>

          {/* Search and Filters Bar */}
          <div style={{
            background: "#ffffff",
            padding: "16px 20px",
            borderRadius: "12px",
            border: "1px solid #e2e8f0",
            display: "flex",
            flexWrap: "wrap",
            gap: "14px",
            alignItems: "center",
            justifyContent: "space-between",
          }}>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "12px", flex: 1, minWidth: "300px" }}>
              <input
                type="text"
                placeholder="🔍 Search student name, roll number, subject..."
                value={ticketSearch}
                onChange={(e) => setTicketSearch(e.target.value)}
                style={{
                  padding: "9px 14px",
                  borderRadius: "8px",
                  border: "1px solid #cbd5e1",
                  fontSize: "13px",
                  flex: 1,
                  minWidth: "220px",
                  outline: "none",
                }}
              />

              <select
                value={ticketFilterStatus}
                onChange={(e) => setTicketFilterStatus(e.target.value)}
                style={{
                  padding: "9px 12px",
                  borderRadius: "8px",
                  border: "1px solid #cbd5e1",
                  fontSize: "13px",
                  background: "#ffffff",
                  color: "#0f172a",
                  outline: "none",
                }}
              >
                <option value="all">Status: All Queues</option>
                <option value="open">Status: Open (Pending)</option>
                <option value="in_progress">Status: In Progress</option>
                <option value="resolved">Status: Resolved</option>
              </select>

              <select
                value={ticketFilterCategory}
                onChange={(e) => setTicketFilterCategory(e.target.value)}
                style={{
                  padding: "9px 12px",
                  borderRadius: "8px",
                  border: "1px solid #cbd5e1",
                  fontSize: "13px",
                  background: "#ffffff",
                  color: "#0f172a",
                  outline: "none",
                }}
              >
                <option value="all">Category: All Inquiries</option>
                <option value="academic_discrepancy">Academic / CGPA Discrepancy</option>
                <option value="drive_eligibility">Placement Drive Eligibility</option>
                <option value="interview_clash">Interview Clash / Slot Reschedule</option>
                <option value="offer_query">Offer Letter & Package Verification</option>
                <option value="technical_issue">Portal / Resume Bug</option>
                <option value="other">Other Grievance</option>
              </select>
            </div>

            {(ticketSearch || ticketFilterStatus !== "all" || ticketFilterCategory !== "all") && (
              <button
                onClick={() => {
                  setTicketSearch("");
                  setTicketFilterStatus("all");
                  setTicketFilterCategory("all");
                }}
                style={{
                  padding: "8px 14px",
                  background: "#f1f5f9",
                  border: "1px solid #cbd5e1",
                  borderRadius: "8px",
                  fontSize: "12px",
                  fontWeight: 600,
                  color: "#475569",
                  cursor: "pointer",
                }}
              >
                ✕ Reset Filters
              </button>
            )}
          </div>

          {/* Tickets List */}
          {loadingTickets ? (
            <div style={{ textAlign: "center", padding: "60px 20px", color: "#64748b" }}>
              <div style={{ fontSize: "28px", marginBottom: "8px" }}>⏳</div>
              <p style={{ margin: 0, fontWeight: 600 }}>Loading support tickets...</p>
            </div>
          ) : tickets.length === 0 ? (
            <div style={{
              background: "#ffffff",
              padding: "60px 20px",
              textAlign: "center",
              borderRadius: "16px",
              border: "1px solid #e2e8f0",
            }}>
              <div style={{ fontSize: "40px", marginBottom: "12px" }}>🎉</div>
              <h3 style={{ margin: "0 0 6px", fontSize: "17px", color: "#0f172a" }}>
                No Support Tickets Found
              </h3>
              <p style={{ margin: 0, fontSize: "13px", color: "#64748b" }}>
                {ticketSearch || ticketFilterStatus !== "all" || ticketFilterCategory !== "all"
                  ? "Try changing your search keywords or queue filters."
                  : "All student grievances and inquiries have been cleared. Zero pending queue!"}
              </p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {tickets.map((t) => {
                const categoryLabels = {
                  academic_discrepancy: "Academic / CGPA Discrepancy",
                  drive_eligibility: "Drive Eligibility",
                  interview_clash: "Interview Clash",
                  offer_query: "Offer Letter Verification",
                  technical_issue: "Portal / Tech Bug",
                  other: "General Grievance",
                };

                const priorityStyles = {
                  urgent: { bg: "#fee2e2", text: "#991b1b", border: "#fca5a5", label: "🔥 URGENT" },
                  high: { bg: "#ffedd5", text: "#9a3412", border: "#fdba74", label: "⚠️ HIGH" },
                  medium: { bg: "#eff6ff", text: "#1d4ed8", border: "#bfdbfe", label: "⚡ MEDIUM" },
                  low: { bg: "#f1f5f9", text: "#475569", border: "#cbd5e1", label: "ℹ️ LOW" },
                };

                const pStyle = priorityStyles[t.priority] || priorityStyles.medium;

                const statusStyles = {
                  open: { bg: "#fef2f2", text: "#dc2626", border: "#fecaca", label: "🔴 Open (Pending Action)" },
                  in_progress: { bg: "#fffbeb", text: "#d97706", border: "#fde68a", label: "🟡 Under Review" },
                  resolved: { bg: "#f0fdf4", text: "#15803d", border: "#bbf7d0", label: "🟢 Resolved" },
                };

                const sStyle = statusStyles[t.status] || statusStyles.open;

                return (
                  <div
                    key={t._id}
                    style={{
                      background: "#ffffff",
                      borderRadius: "14px",
                      border: `1px solid ${t.status === "open" ? "#fca5a5" : "#e2e8f0"}`,
                      boxShadow: t.status === "open" ? "0 4px 12px rgba(239, 68, 68, 0.08)" : "0 2px 6px rgba(0,0,0,0.03)",
                      padding: "20px 24px",
                      display: "flex",
                      flexDirection: "column",
                      gap: "14px",
                    }}
                  >
                    {/* Header Row */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "10px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                        <span style={{
                          fontFamily: "monospace",
                          fontSize: "13px",
                          fontWeight: 700,
                          background: "#0f172a",
                          color: "#ffffff",
                          padding: "3px 8px",
                          borderRadius: "6px",
                        }}>
                          #TKT-{t._id.slice(-6).toUpperCase()}
                        </span>

                        <span style={{
                          fontSize: "12px",
                          fontWeight: 700,
                          padding: "3px 10px",
                          borderRadius: "20px",
                          background: sStyle.bg,
                          color: sStyle.text,
                          border: `1px solid ${sStyle.border}`,
                        }}>
                          {sStyle.label}
                        </span>

                        <span style={{
                          fontSize: "11px",
                          fontWeight: 800,
                          padding: "3px 8px",
                          borderRadius: "6px",
                          background: pStyle.bg,
                          color: pStyle.text,
                          border: `1px solid ${pStyle.border}`,
                        }}>
                          {pStyle.label}
                        </span>

                        <span style={{
                          fontSize: "12px",
                          color: "#475569",
                          background: "#f1f5f9",
                          padding: "3px 8px",
                          borderRadius: "6px",
                          fontWeight: 500,
                        }}>
                          🏷️ {categoryLabels[t.category] || t.category}
                        </span>
                      </div>

                      <div style={{ fontSize: "12px", color: "#94a3b8" }}>
                        Submitted {new Date(t.createdAt).toLocaleString()}
                      </div>
                    </div>

                    {/* Student Details Strip */}
                    <div style={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: "16px",
                      background: "#f8fafc",
                      padding: "10px 14px",
                      borderRadius: "8px",
                      border: "1px solid #f1f5f9",
                      fontSize: "13px",
                      color: "#334155",
                      alignItems: "center",
                    }}>
                      <div>
                        🎓 Student: <strong>{t.student?.name || "Student"}</strong>
                      </div>
                      <div>
                        🆔 Roll No: <code style={{ background: "#e2e8f0", padding: "1px 6px", borderRadius: "4px" }}>{t.student?.rollNumber || "N/A"}</code>
                      </div>
                      <div>
                        📚 Course: <strong>{t.student?.course || "B.Tech"} - {t.student?.branch || "N/A"}</strong>
                      </div>
                      <div>
                        ✉️ {t.student?.email || "N/A"}
                      </div>
                      {t.drive && (
                        <div style={{ color: "#0369a1", fontWeight: 600 }}>
                          🏢 Drive: {t.drive?.company?.name || "Company"} ({t.drive?.jobTitle})
                        </div>
                      )}
                    </div>

                    {/* Subject & Description */}
                    <div>
                      <h4 style={{ margin: "0 0 6px", fontSize: "16px", fontWeight: 700, color: "#0f172a" }}>
                        {t.subject}
                      </h4>
                      <p style={{
                        margin: 0,
                        fontSize: "14px",
                        color: "#475569",
                        lineHeight: "1.6",
                        background: "#fafafa",
                        padding: "12px 14px",
                        borderRadius: "8px",
                        border: "1px solid #f1f5f9",
                        whiteSpace: "pre-line",
                      }}>
                        {t.description}
                      </p>
                    </div>

                    {/* Admin Response Box (if any) */}
                    {t.adminResponse && (
                      <div style={{
                        background: "#f0fdf4",
                        border: "1px solid #bbf7d0",
                        borderRadius: "10px",
                        padding: "12px 16px",
                      }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                          <span style={{ fontSize: "12px", fontWeight: 700, color: "#166534" }}>
                            ✓ Official TPO Resolution / Response:
                          </span>
                          {t.resolvedAt && (
                            <span style={{ fontSize: "11px", color: "#15803d" }}>
                              Updated {new Date(t.resolvedAt).toLocaleString()}
                              {t.resolvedBy?.name ? ` by ${t.resolvedBy.name}` : ""}
                            </span>
                          )}
                        </div>
                        <p style={{ margin: 0, fontSize: "13px", color: "#14532d", lineHeight: "1.5", whiteSpace: "pre-line" }}>
                          {t.adminResponse}
                        </p>
                      </div>
                    )}

                    {/* Actions Bar */}
                    <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", borderTop: "1px solid #f1f5f9", paddingTop: "12px" }}>
                      <button
                        onClick={() => {
                          setSelectedTicketForResolve(t);
                          setResolveForm({
                            status: t.status === "open" ? "resolved" : t.status,
                            adminResponse: t.adminResponse || "",
                          });
                        }}
                        style={{
                          padding: "8px 18px",
                          background: t.status === "open" ? "#2563eb" : "#f1f5f9",
                          color: t.status === "open" ? "#ffffff" : "#334155",
                          border: t.status === "open" ? "none" : "1px solid #cbd5e1",
                          borderRadius: "8px",
                          fontSize: "13px",
                          fontWeight: 700,
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: "6px",
                          boxShadow: t.status === "open" ? "0 2px 8px rgba(37,99,235,0.25)" : "none",
                        }}
                      >
                        <span>{t.status === "resolved" ? "✏️ Update Official Response / Status" : "✍️ Respond & Resolve Ticket"}</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================
          MODAL: RESOLVE / RESPOND TO SUPPORT TICKET
         ======================================================== */}
      {selectedTicketForResolve && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(15, 23, 42, 0.65)",
          backdropFilter: "blur(4px)",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          zIndex: 1050,
          padding: "20px",
        }}>
          <div style={{
            background: "#ffffff",
            borderRadius: "16px",
            width: "100%",
            maxWidth: "640px",
            maxHeight: "90vh",
            overflowY: "auto",
            padding: "26px",
            boxShadow: "0 20px 50px rgba(0,0,0,0.3)",
            border: "1px solid #e2e8f0",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <span style={{ fontSize: "24px" }}>🎧</span>
                <div>
                  <h3 style={{ margin: 0, fontSize: "17px", color: "#0f172a", fontWeight: 700 }}>
                    Resolve Ticket #TKT-{selectedTicketForResolve._id.slice(-6).toUpperCase()}
                  </h3>
                  <span style={{ fontSize: "12px", color: "#64748b" }}>
                    Student: {selectedTicketForResolve.student?.name} ({selectedTicketForResolve.student?.rollNumber})
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSelectedTicketForResolve(null)}
                style={{ background: "none", border: "none", fontSize: "18px", color: "#64748b", cursor: "pointer" }}
              >
                ✕
              </button>
            </div>

            {/* Student Inquiry Summary */}
            <div style={{
              background: "#f8fafc",
              border: "1px solid #e2e8f0",
              borderRadius: "10px",
              padding: "14px 16px",
              marginBottom: "18px",
            }}>
              <div style={{ fontSize: "12px", fontWeight: 700, color: "#64748b", textTransform: "uppercase", marginBottom: "4px" }}>
                Student Inquiry / Issue:
              </div>
              <div style={{ fontSize: "14px", fontWeight: 700, color: "#0f172a", marginBottom: "6px" }}>
                {selectedTicketForResolve.subject}
              </div>
              <div style={{ fontSize: "13px", color: "#475569", lineHeight: "1.5", whiteSpace: "pre-line" }}>
                {selectedTicketForResolve.description}
              </div>
            </div>

            <form onSubmit={handleResolveTicketSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#334155", marginBottom: "6px" }}>
                  Resolution Status <span style={{ color: "#ef4444" }}>*</span>
                </label>
                <select
                  value={resolveForm.status}
                  onChange={(e) => setResolveForm({ ...resolveForm, status: e.target.value })}
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    borderRadius: "8px",
                    border: "1px solid #cbd5e1",
                    fontSize: "14px",
                    background: "#ffffff",
                    color: "#0f172a",
                    outline: "none",
                  }}
                >
                  <option value="resolved">🟢 Resolved</option>
                  <option value="in_progress">🟡 In Progress</option>
                  <option value="open">🔴 Open</option>
                </select>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#334155", marginBottom: "6px" }}>
                  Official Response / Resolution Remarks <span style={{ color: "#ef4444" }}>*</span>
                </label>
                <textarea
                  rows={5}
                  placeholder="Enter clear instructions or the outcome for the student (e.g. 'We checked with the exam department, your 6th sem CGPA is now updated. You may apply for the drive.' or 'Interview slot rescheduled to 4:30 PM with recruiter approval.')..."
                  value={resolveForm.adminResponse}
                  onChange={(e) => setResolveForm({ ...resolveForm, adminResponse: e.target.value })}
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    borderRadius: "8px",
                    border: "1px solid #cbd5e1",
                    fontSize: "14px",
                    color: "#0f172a",
                    boxSizing: "border-box",
                    outline: "none",
                    fontFamily: "inherit",
                    resize: "vertical",
                  }}
                  required
                />
                {/* <span style={{ fontSize: "12px", color: "#64748b", display: "block", marginTop: "4px" }}>
                  📢 This response will immediately appear in the student's Help & Support Desk tracker.
                </span> */}
              </div>

              <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", marginTop: "8px" }}>
                <button
                  type="button"
                  onClick={() => setSelectedTicketForResolve(null)}
                  disabled={resolvingTicketLoading}
                  style={{
                    padding: "9px 18px",
                    background: "#f1f5f9",
                    border: "1px solid #cbd5e1",
                    borderRadius: "8px",
                    color: "#475569",
                    fontWeight: 600,
                    fontSize: "13px",
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={resolvingTicketLoading}
                  style={{
                    padding: "9px 24px",
                    background: resolvingTicketLoading ? "#94a3b8" : "#2563eb",
                    color: "#ffffff",
                    border: "none",
                    borderRadius: "8px",
                    fontWeight: 700,
                    fontSize: "13px",
                    cursor: resolvingTicketLoading ? "not-allowed" : "pointer",
                    boxShadow: "0 2px 8px rgba(37,99,235,0.25)",
                  }}
                >
                  {resolvingTicketLoading ? "Saving Resolution..." : "Submit Official Resolution"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL 1: POST DIRECT DRIVE (TPO MASTER DISPATCH)
         ======================================================== */}
      {showPostDriveModal && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(0,0,0,0.6)",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          zIndex: 1000,
          padding: "20px",
        }}>
          <div style={{
            background: "#ffffff",
            borderRadius: "16px",
            width: "100%",
            maxWidth: "750px",
            maxHeight: "90vh",
            overflowY: "auto",
            padding: "24px",
            boxShadow: "0 20px 50px rgba(0,0,0,0.3)",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <div>
                <h3 style={{ margin: 0, fontSize: "18px", color: "#0f172a" }}>
                  Post Direct Placement Drive (TPO Master Dispatch)
                </h3>
                <span style={{ fontSize: "12px", color: "#64748b" }}>
                  This drive will be published with status: OPEN and immediately reach students.
                </span>
              </div>
              <button
                onClick={() => setShowPostDriveModal(false)}
                style={{ background: "none", border: "none", fontSize: "20px", cursor: "pointer" }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handlePostDirectDrive} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {/* Company Picker Mode */}
              <div style={{ padding: "12px", background: "#f8fafc", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
                <span style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#334155", marginBottom: "8px" }}>
                  Company Identification:
                </span>
                <div style={{ display: "flex", gap: "16px" }}>
                  <label style={{ fontSize: "13px", display: "flex", alignItems: "center", gap: "6px", cursor: "pointer" }}>
                    <input
                      type="radio"
                      name="companyMode"
                      checked={newDriveForm.companyMode === "existing"}
                      onChange={() => setNewDriveForm({ ...newDriveForm, companyMode: "existing" })}
                    />
                    Select Onboarded Company
                  </label>
                  <label style={{ fontSize: "13px", display: "flex", alignItems: "center", gap: "6px", cursor: "pointer" }}>
                    <input
                      type="radio"
                      name="companyMode"
                      checked={newDriveForm.companyMode === "new"}
                      onChange={() => setNewDriveForm({ ...newDriveForm, companyMode: "new" })}
                    />
                    Add New Visiting Company Directly
                  </label>
                </div>

                {newDriveForm.companyMode === "existing" ? (
                  <div style={{ marginTop: "10px" }}>
                    <select
                      required
                      value={newDriveForm.company}
                      onChange={(e) => {
                        const compId = e.target.value;
                        const c = companies.find((x) => x._id === compId);
                        setNewDriveForm({
                          ...newDriveForm,
                          company: compId,
                          location: newDriveForm.location || c?.location || "Delhi-NCR / XYZ Campus",
                        });
                      }}
                      style={{ width: "100%", padding: "9px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px" }}
                    >
                      <option value="">-- Choose Onboarded Company --</option>
                      {companies.map((c) => (
                        <option key={c._id} value={c._id}>
                          {c.name} ({c.industry || "Tech"})
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginTop: "10px" }}>
                    <div>
                      <input
                        type="text"
                        required
                        placeholder="Company Name (e.g. Microsoft)"
                        value={newDriveForm.companyName}
                        onChange={(e) => setNewDriveForm({ ...newDriveForm, companyName: e.target.value })}
                        style={{ width: "100%", padding: "8px 10px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px" }}
                      />
                    </div>
                    <div>
                      <input
                        type="text"
                        placeholder="Website (e.g. https://microsoft.com)"
                        value={newDriveForm.companyWebsite}
                        onChange={(e) => setNewDriveForm({ ...newDriveForm, companyWebsite: e.target.value })}
                        style={{ width: "100%", padding: "8px 10px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px" }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Role & Opportunity Type */}
              <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#475569", marginBottom: "4px" }}>
                    Job Role / Title *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Graduate Engineer Trainee (GET)"
                    value={newDriveForm.jobTitle}
                    onChange={(e) => setNewDriveForm({ ...newDriveForm, jobTitle: e.target.value })}
                    style={{ width: "100%", padding: "9px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#475569", marginBottom: "4px" }}>
                    Opportunity Type
                  </label>
                  <select
                    value={newDriveForm.opportunityType}
                    onChange={(e) => setNewDriveForm({ ...newDriveForm, opportunityType: e.target.value })}
                    style={{ width: "100%", padding: "9px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px" }}
                  >
                    <option value="placement_drive">Placement Drive (Full-Time)</option>
                    <option value="internship">Internship Opportunity</option>
                    <option value="hackathon">Company Hackathon</option>
                    <option value="event">Corporate Hiring Event</option>
                  </select>
                </div>
              </div>

              {/* Package, Location, Work Mode & Deadline */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "12px" }}>
                {newDriveForm.opportunityType === "internship" ? (
                  <>
                    <div>
                      <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#475569", marginBottom: "4px" }}>
                        Stipend Amount *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. ₹30,000 / month"
                        value={newDriveForm.stipend}
                        onChange={(e) => setNewDriveForm({ ...newDriveForm, stipend: e.target.value })}
                        style={{ width: "100%", padding: "9px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px" }}
                      />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#475569", marginBottom: "4px" }}>
                        Internship Duration
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. 6 Months"
                        value={newDriveForm.duration}
                        onChange={(e) => setNewDriveForm({ ...newDriveForm, duration: e.target.value })}
                        style={{ width: "100%", padding: "9px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px" }}
                      />
                    </div>
                  </>
                ) : (
                  <div>
                    <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#475569", marginBottom: "4px" }}>
                      CTC Package (in LPA) *
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      required
                      placeholder="e.g. 12.5"
                      value={newDriveForm.package}
                      onChange={(e) => setNewDriveForm({ ...newDriveForm, package: e.target.value })}
                      style={{ width: "100%", padding: "9px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px" }}
                    />
                    {newDriveForm.package && (
                      <div style={{ marginTop: "4px", fontSize: "11px", fontWeight: 600 }}>
                        {Number(newDriveForm.package) >= 10 ? (
                          <span style={{ color: "#7c3aed" }}>🔥 Super Dream (≥ 10 LPA) — 1-Offer waived</span>
                        ) : Number(newDriveForm.package) >= 6 ? (
                          <span style={{ color: "#b45309" }}>⭐ Dream (6-10 LPA) — 1-Offer waived</span>
                        ) : (
                          <span style={{ color: "#475569" }}>Regular Drive (&lt; 6 LPA) — 1-Offer strictly applies</span>
                        )}
                      </div>
                    )}
                  </div>
                )}

                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#475569", marginBottom: "4px" }}>
                    Job Location / Venue
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Delhi-NCR / Noida"
                    value={newDriveForm.location}
                    onChange={(e) => setNewDriveForm({ ...newDriveForm, location: e.target.value })}
                    style={{ width: "100%", padding: "9px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px" }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#475569", marginBottom: "4px" }}>
                    Work Mode
                  </label>
                  <select
                    value={newDriveForm.workMode}
                    onChange={(e) => setNewDriveForm({ ...newDriveForm, workMode: e.target.value })}
                    style={{ width: "100%", padding: "9px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px" }}
                  >
                    <option value="On-site">On-site</option>
                    <option value="Hybrid">Hybrid</option>
                    <option value="Remote">Remote</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#475569", marginBottom: "4px" }}>
                    Application Deadline *
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={newDriveForm.applicationDeadline}
                    onChange={(e) => setNewDriveForm({ ...newDriveForm, applicationDeadline: e.target.value })}
                    style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px" }}
                  />
                </div>
              </div>

              {/* Eligibility Policy Toggle */}
              <div style={{ padding: "12px", background: "#f8fafc", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
                <span style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#334155", marginBottom: "8px" }}>
                  Eligibility Policy:
                </span>
                <div style={{ display: "flex", gap: "10px" }}>
                  <button
                    type="button"
                    onClick={() => setNewDriveForm({ ...newDriveForm, isOpenToAll: true })}
                    style={{
                      flex: 1,
                      padding: "8px 12px",
                      borderRadius: "8px",
                      border: "1px solid",
                      borderColor: newDriveForm.isOpenToAll ? "#16a34a" : "#cbd5e1",
                      background: newDriveForm.isOpenToAll ? "#f0fdf4" : "#ffffff",
                      color: newDriveForm.isOpenToAll ? "#15803d" : "#475569",
                      fontWeight: 700,
                      fontSize: "12px",
                      cursor: "pointer",
                    }}
                  >
                    ✨ Open for All (No Eligibility Criteria)
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewDriveForm({ ...newDriveForm, isOpenToAll: false })}
                    style={{
                      flex: 1,
                      padding: "8px 12px",
                      borderRadius: "8px",
                      border: "1px solid",
                      borderColor: !newDriveForm.isOpenToAll ? "#0284c7" : "#cbd5e1",
                      background: !newDriveForm.isOpenToAll ? "#f0f9ff" : "#ffffff",
                      color: !newDriveForm.isOpenToAll ? "#0284c7" : "#475569",
                      fontWeight: 700,
                      fontSize: "12px",
                      cursor: "pointer",
                    }}
                  >
                    🎯 Specific Eligibility Criteria
                  </button>
                </div>
              </div>

              {newDriveForm.isOpenToAll ? (
                <div style={{ padding: "12px 14px", background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "8px", color: "#166534", fontSize: "13px", display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ fontSize: "16px" }}>✨</span>
                  <div>
                    <strong>Open to All Students:</strong> No CGPA, course, backlog or branch cutoffs will be enforced. Every registered student can directly apply!
                  </div>
                </div>
              ) : (
                <>
                  {/* Eligibility Cutoffs */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                    <div>
                      <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#475569", marginBottom: "4px" }}>
                        Minimum CGPA Cutoff
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        placeholder="e.g. 6.5"
                        value={newDriveForm.minimumCgpa}
                        onChange={(e) => setNewDriveForm({ ...newDriveForm, minimumCgpa: e.target.value })}
                        style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px" }}
                      />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#475569", marginBottom: "4px" }}>
                        Maximum Backlogs Allowed
                      </label>
                      <input
                        type="number"
                        placeholder="e.g. 0"
                        value={newDriveForm.maximumBacklogs}
                        onChange={(e) => setNewDriveForm({ ...newDriveForm, maximumBacklogs: e.target.value })}
                        style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px" }}
                      />
                    </div>
                  </div>

                  {/* Allowed Courses Checkboxes */}
                  <div>
                    <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#475569", marginBottom: "6px" }}>
                      Eligible Courses (Select all that apply)
                    </label>
                    <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                      {["B.Tech", "MCA", "BCA", "M.Tech", "MBA"].map((course) => (
                        <label key={course} style={{ fontSize: "13px", display: "flex", alignItems: "center", gap: "4px", cursor: "pointer" }}>
                          <input
                            type="checkbox"
                            checked={newDriveForm.allowedCourses.includes(course)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setNewDriveForm({ ...newDriveForm, allowedCourses: [...newDriveForm.allowedCourses, course] });
                              } else {
                                setNewDriveForm({ ...newDriveForm, allowedCourses: newDriveForm.allowedCourses.filter((c) => c !== course) });
                              }
                            }}
                          />
                          {course}
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Eligible Branches */}
                  <div>
                    <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#475569", marginBottom: "6px" }}>
                      Eligible Branches
                    </label>
                    <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                      {["CSE", "IT", "ECE", "ME", "EN", "CS", "AI/ML", "Civil"].map((branch) => (
                        <label key={branch} style={{ fontSize: "13px", display: "flex", alignItems: "center", gap: "4px", cursor: "pointer" }}>
                          <input
                            type="checkbox"
                            checked={newDriveForm.eligibleBranches.includes(branch)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setNewDriveForm({ ...newDriveForm, eligibleBranches: [...newDriveForm.eligibleBranches, branch] });
                              } else {
                                setNewDriveForm({ ...newDriveForm, eligibleBranches: newDriveForm.eligibleBranches.filter((b) => b !== branch) });
                              }
                            }}
                          />
                          {branch}
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Skills */}
                  <div>
                    <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#475569", marginBottom: "4px" }}>
                      Required Skills (comma separated)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Java, React, SQL, DSA"
                      value={newDriveForm.requiredSkills}
                      onChange={(e) => setNewDriveForm({ ...newDriveForm, requiredSkills: e.target.value })}
                      style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px" }}
                    />
                  </div>
                </>
              )}

              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#475569", marginBottom: "4px" }}>
                  Job Description & Highlights
                </label>
                <textarea
                  rows="3"
                  placeholder="Detailed role description, responsibilities, eligibility notes..."
                  value={newDriveForm.description}
                  onChange={(e) => setNewDriveForm({ ...newDriveForm, description: e.target.value })}
                  style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px" }}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "10px" }}>
                <button
                  type="button"
                  onClick={() => setShowPostDriveModal(false)}
                  style={{ padding: "9px 18px", background: "#f1f5f9", border: "none", borderRadius: "8px", fontSize: "13px", fontWeight: 600, cursor: "pointer" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingDrive}
                  style={{
                    padding: "9px 22px",
                    background: "#0284c7",
                    color: "#fff",
                    border: "none",
                    borderRadius: "8px",
                    fontSize: "13px",
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  {submittingDrive ? "Publishing Drive..." : "🚀 Publish Live Drive to Students"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL 2: CANDIDATE READ-ONLY PROFILE (ADMIN INSPECTION)
         ======================================================== */}
      {selectedStudent && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(0,0,0,0.6)",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          zIndex: 1000,
          padding: "20px",
        }}>
          <div style={{
            background: "#ffffff",
            borderRadius: "16px",
            width: "100%",
            maxWidth: "650px",
            maxHeight: "90vh",
            overflowY: "auto",
            padding: "24px",
            boxShadow: "0 20px 40px rgba(0,0,0,0.2)",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
              <div>
                <h3 style={{ margin: "0 0 2px", fontSize: "20px", color: "#0f172a" }}>
                  {selectedStudent.name}
                </h3>
                <span style={{ fontSize: "13px", color: "#64748b" }}>
                  Roll No: <strong>{selectedStudent.rollNumber || "N/A"}</strong> • {selectedStudent.course} ({selectedStudent.branch || "General"})
                </span>
              </div>
              <button
                onClick={() => setSelectedStudent(null)}
                style={{ background: "none", border: "none", fontSize: "20px", cursor: "pointer" }}
              >
                ✕
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {/* Placement Status Banner */}
              <div style={{
                padding: "12px 16px",
                borderRadius: "10px",
                background: selectedStudent.placementStatus === "placed" ? "#ecfdf5" : "#f8fafc",
                border: `1px solid ${selectedStudent.placementStatus === "placed" ? "#a7f3d0" : "#e2e8f0"}`,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}>
                <div>
                  <span style={{ fontSize: "11px", fontWeight: 700, color: selectedStudent.placementStatus === "placed" ? "#047857" : "#64748b" }}>
                    PLACEMENT STATUS:
                  </span>
                  <div style={{ fontSize: "14px", fontWeight: 700, color: "#0f172a" }}>
                    {selectedStudent.placementStatus === "placed"
                      ? `Placed with ${selectedStudent.placedOffer?.companyName} (₹${selectedStudent.placedOffer?.package} LPA)`
                      : "Unplaced / Available for placement drives"}
                  </div>
                  {selectedStudent.placementStatus === "placed" && (
                    <div style={{ marginTop: "6px" }}>
                      <a
                        href={
                          selectedStudent.placedOffer?.offerLetterUrl
                            ? (selectedStudent.placedOffer.offerLetterUrl.startsWith("http")
                                ? selectedStudent.placedOffer.offerLetterUrl
                                : `http://localhost:5000${selectedStudent.placedOffer.offerLetterUrl}`)
                            : `http://localhost:5000/api/offers/${selectedStudent.placedOffer?.id}/pdf`
                        }
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "4px",
                          background: "#0284c7",
                          color: "#ffffff",
                          padding: "4px 10px",
                          borderRadius: "6px",
                          fontSize: "11px",
                          fontWeight: 700,
                          textDecoration: "none",
                        }}
                      >
                        📄 View Official Offer Letter PDF ↗
                      </a>
                    </div>
                  )}
                </div>
                <span style={{
                  padding: "4px 10px",
                  borderRadius: "6px",
                  fontSize: "11px",
                  fontWeight: 700,
                  background: selectedStudent.status === "active" ? "#dcfce7" : "#fee2e2",
                  color: selectedStudent.status === "active" ? "#15803d" : "#dc2626",
                }}>
                  ACCOUNT: {selectedStudent.status?.toUpperCase()}
                </span>
              </div>

              {/* Academic Performance Snapshot */}
              <div>
                <span style={{ fontSize: "12px", fontWeight: 700, color: "#334155", display: "block", marginBottom: "8px" }}>
                  Academic Credentials:
                </span>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "10px" }}>
                  <div style={{ padding: "10px", background: "#f8fafc", borderRadius: "8px", textAlign: "center", border: "1px solid #e2e8f0" }}>
                    <span style={{ fontSize: "11px", color: "#64748b" }}>Grad CGPA</span>
                    <div style={{ fontSize: "16px", fontWeight: 800, color: "#0f172a" }}>
                      {selectedStudent.cgpa ?? "N/A"}
                    </div>
                  </div>
                  <div style={{ padding: "10px", background: "#f8fafc", borderRadius: "8px", textAlign: "center", border: "1px solid #e2e8f0" }}>
                    <span style={{ fontSize: "11px", color: "#64748b" }}>10th Marks</span>
                    <div style={{ fontSize: "16px", fontWeight: 700, color: "#0f172a" }}>
                      {selectedStudent.tenthPercentage ? `${selectedStudent.tenthPercentage}%` : "N/A"}
                    </div>
                  </div>
                  <div style={{ padding: "10px", background: "#f8fafc", borderRadius: "8px", textAlign: "center", border: "1px solid #e2e8f0" }}>
                    <span style={{ fontSize: "11px", color: "#64748b" }}>12th Marks</span>
                    <div style={{ fontSize: "16px", fontWeight: 700, color: "#0f172a" }}>
                      {selectedStudent.twelfthPercentage ? `${selectedStudent.twelfthPercentage}%` : "N/A"}
                    </div>
                  </div>
                  <div style={{ padding: "10px", background: "#f8fafc", borderRadius: "8px", textAlign: "center", border: "1px solid #e2e8f0" }}>
                    <span style={{ fontSize: "11px", color: "#64748b" }}>Active Backlogs</span>
                    <div style={{ fontSize: "16px", fontWeight: 700, color: (selectedStudent.backlogs || 0) === 0 ? "#16a34a" : "#dc2626" }}>
                      {selectedStudent.backlogs ?? 0}
                    </div>
                  </div>
                </div>
              </div>

              {/* Skills */}
              <div>
                <span style={{ fontSize: "12px", fontWeight: 700, color: "#334155", display: "block", marginBottom: "6px" }}>
                  Verified Skills & Technologies:
                </span>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                  {(selectedStudent.skills || []).length > 0 ? (
                    selectedStudent.skills.map((s, idx) => (
                      <span key={idx} style={{ padding: "4px 9px", background: "#f1f5f9", borderRadius: "6px", fontSize: "12px", color: "#334155" }}>
                        {s}
                      </span>
                    ))
                  ) : (
                    <span style={{ fontSize: "12px", color: "#94a3b8" }}>No specific skills registered</span>
                  )}
                </div>
              </div>

              {/* Resumes */}
              <div>
                <span style={{ fontSize: "12px", fontWeight: 700, color: "#334155", display: "block", marginBottom: "6px" }}>
                  Uploaded Resumes:
                </span>
                {(selectedStudent.resumes || []).length > 0 ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    {selectedStudent.resumes.map((r, idx) => (
                      <div key={idx} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 12px", background: "#f8fafc", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                        <span style={{ fontSize: "12px", fontWeight: 600, color: "#0f172a" }}>
                          📄 {r.name} {r.isPrimary && <span style={{ color: "#0284c7" }}>(Primary)</span>}
                        </span>
                        <a
                          href={r.url}
                          target="_blank"
                          rel="noreferrer"
                          style={{
                            padding: "4px 10px",
                            background: "#0284c7",
                            color: "#fff",
                            borderRadius: "6px",
                            fontSize: "11px",
                            textDecoration: "none",
                            fontWeight: 600,
                          }}
                        >
                          View PDF 🔗
                        </a>
                      </div>
                    ))}
                  </div>
                ) : (
                  <span style={{ fontSize: "12px", color: "#94a3b8" }}>No resume documents uploaded</span>
                )}
              </div>

              {/* Projects & Internships Summary */}
              {((selectedStudent.projects || []).length > 0 || (selectedStudent.internships || []).length > 0) && (
                <div>
                  <span style={{ fontSize: "12px", fontWeight: 700, color: "#334155", display: "block", marginBottom: "6px" }}>
                    Experience & Projects:
                  </span>
                  <div style={{ fontSize: "12px", color: "#475569" }}>
                    Projects: <strong>{selectedStudent.projects?.length || 0}</strong> • Internships: <strong>{selectedStudent.internships?.length || 0}</strong>
                  </div>
                </div>
              )}

              {/* Admin Edit Trigger */}
              <div style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                background: "#f0fdf4",
                border: "1px solid #bbf7d0",
                borderRadius: "10px",
                padding: "12px 16px",
                flexWrap: "wrap",
                gap: "10px",
              }}>
                <div>
                  <strong style={{ fontSize: "13px", color: "#166534", display: "block" }}>
                    Need to modify locked institutional credentials?
                  </strong>
                  <span style={{ fontSize: "11px", color: "#15803d" }}>
                    Name, Email, Roll No, Course, Branch & College can only be updated by Admin.
                  </span>
                </div>
                <button
                  onClick={() => {
                    const studentToEdit = selectedStudent;
                    setSelectedStudent(null);
                    handleOpenEditStudent(studentToEdit);
                  }}
                  style={{
                    padding: "8px 14px",
                    background: "#0284c7",
                    color: "#fff",
                    border: "none",
                    borderRadius: "6px",
                    fontSize: "12px",
                    fontWeight: 700,
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                  }}
                >
                  ✏️ Edit Student (Admin)
                </button>
              </div>

              {/* Read Only Admin Notice */}
              <div style={{
                fontSize: "11px",
                color: "#64748b",
                textAlign: "center",
                borderTop: "1px solid #f1f5f9",
                paddingTop: "12px",
              }}>
                🔒 TPO Administrative Inspection. Profile records are submitted and maintained by the student.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL 3: ONBOARD COMPANY
         ======================================================== */}
      {showCreateCompany && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(0,0,0,0.6)",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          zIndex: 1000,
          padding: "20px",
        }}>
          <div style={{
            background: "#fff",
            borderRadius: "16px",
            width: "100%",
            maxWidth: "520px",
            padding: "24px",
            boxShadow: "0 20px 40px rgba(0,0,0,0.2)",
            maxHeight: "90vh",
            overflowY: "auto",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h3 style={{ margin: 0, fontSize: "18px", color: "#0f172a" }}>Onboard Corporate Partner</h3>
              <button
                onClick={() => setShowCreateCompany(false)}
                style={{ background: "none", border: "none", fontSize: "20px", cursor: "pointer" }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateCompany} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#475569", marginBottom: "4px" }}>
                  Company Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Cisco Systems / Amazon / Google"
                  value={newCompany.name}
                  onChange={(e) => setNewCompany({ ...newCompany, name: e.target.value })}
                  style={{ width: "100%", padding: "9px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px" }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#475569", marginBottom: "4px" }}>
                    Industry / Sector
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. IT & Cloud Infrastructure"
                    value={newCompany.industry}
                    onChange={(e) => setNewCompany({ ...newCompany, industry: e.target.value })}
                    style={{ width: "100%", padding: "9px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#475569", marginBottom: "4px" }}>
                    Location / Office HQ
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Bangalore / Noida"
                    value={newCompany.location}
                    onChange={(e) => setNewCompany({ ...newCompany, location: e.target.value })}
                    style={{ width: "100%", padding: "9px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px" }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#475569", marginBottom: "4px" }}>
                  Official Website
                </label>
                <input
                  type="text"
                  placeholder="e.g. https://cisco.com"
                  value={newCompany.website}
                  onChange={(e) => setNewCompany({ ...newCompany, website: e.target.value })}
                  style={{ width: "100%", padding: "9px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px" }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#475569", marginBottom: "4px" }}>
                  Assign Point of Contact / Recruiter (Optional)
                </label>
                <select
                  value={newCompany.recruiterId}
                  onChange={(e) => setNewCompany({ ...newCompany, recruiterId: e.target.value })}
                  style={{ width: "100%", padding: "9px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px", background: "#fff" }}
                >
                  <option value="none">-- None (Direct TPO Partner / Institute Managed) --</option>
                  {recruitersList.map((r) => (
                    <option key={r._id} value={r._id}>
                      {r.name} {r.designation ? `(${r.designation})` : ""} — {r.email}
                    </option>
                  ))}
                </select>
                <span style={{ fontSize: "11px", color: "#64748b", marginTop: "3px", display: "block" }}>
                  Leave as None if this company's campus drives are directly organized by TPO Cell.
                </span>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#475569", marginBottom: "4px" }}>
                  About Organization / Notes
                </label>
                <textarea
                  rows="3"
                  placeholder="Briefly describe what this partner does, recruitment history or domains..."
                  value={newCompany.description}
                  onChange={(e) => setNewCompany({ ...newCompany, description: e.target.value })}
                  style={{ width: "100%", padding: "9px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px", resize: "vertical" }}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "10px" }}>
                <button
                  type="button"
                  onClick={() => setShowCreateCompany(false)}
                  style={{ padding: "8px 16px", background: "#f1f5f9", border: "none", borderRadius: "8px", fontSize: "13px", fontWeight: 600, cursor: "pointer" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ padding: "8px 18px", background: "#0f172a", color: "#fff", border: "none", borderRadius: "8px", fontSize: "13px", fontWeight: 700, cursor: "pointer" }}
                >
                  Onboard Company
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL 4: EDIT CORPORATE PARTNER & ASSIGNED RECRUITER
         ======================================================== */}
      {selectedCompanyForEdit && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(0,0,0,0.6)",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          zIndex: 1000,
          padding: "20px",
        }}>
          <div style={{
            background: "#fff",
            borderRadius: "16px",
            width: "100%",
            maxWidth: "520px",
            padding: "24px",
            boxShadow: "0 20px 40px rgba(0,0,0,0.2)",
            maxHeight: "90vh",
            overflowY: "auto",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <div>
                <h3 style={{ margin: 0, fontSize: "18px", color: "#0f172a" }}>
                  Edit Partner Details
                </h3>
                <span style={{ fontSize: "12px", color: "#64748b" }}>
                  {selectedCompanyForEdit.name}
                </span>
              </div>
              <button
                onClick={() => setSelectedCompanyForEdit(null)}
                style={{ background: "none", border: "none", fontSize: "20px", cursor: "pointer" }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUpdateCompany} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#475569", marginBottom: "4px" }}>
                  Company Name *
                </label>
                <input
                  type="text"
                  required
                  value={editCompanyForm.name}
                  onChange={(e) => setEditCompanyForm({ ...editCompanyForm, name: e.target.value })}
                  style={{ width: "100%", padding: "9px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px" }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#475569", marginBottom: "4px" }}>
                    Industry / Domain
                  </label>
                  <input
                    type="text"
                    value={editCompanyForm.industry}
                    onChange={(e) => setEditCompanyForm({ ...editCompanyForm, industry: e.target.value })}
                    style={{ width: "100%", padding: "9px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#475569", marginBottom: "4px" }}>
                    Location / Office HQ
                  </label>
                  <input
                    type="text"
                    value={editCompanyForm.location}
                    onChange={(e) => setEditCompanyForm({ ...editCompanyForm, location: e.target.value })}
                    style={{ width: "100%", padding: "9px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px" }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#475569", marginBottom: "4px" }}>
                  Official Website
                </label>
                <input
                  type="text"
                  placeholder="https://company.com"
                  value={editCompanyForm.website}
                  onChange={(e) => setEditCompanyForm({ ...editCompanyForm, website: e.target.value })}
                  style={{ width: "100%", padding: "9px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px" }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#475569", marginBottom: "4px" }}>
                  Assigned Recruiter / HR Contact
                </label>
                <select
                  value={editCompanyForm.recruiterId}
                  onChange={(e) => setEditCompanyForm({ ...editCompanyForm, recruiterId: e.target.value })}
                  style={{ width: "100%", padding: "9px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px", background: "#fff" }}
                >
                  <option value="none">-- None (Direct TPO Partner / Self-Managed) --</option>
                  {recruitersList.map((r) => (
                    <option key={r._id} value={r._id}>
                      {r.name} {r.designation ? `(${r.designation})` : ""} — {r.email}
                    </option>
                  ))}
                </select>
                <span style={{ fontSize: "11px", color: "#64748b", marginTop: "3px", display: "block" }}>
                  Select from registered recruiters or choose 'None' for direct institute collaboration.
                </span>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#475569", marginBottom: "4px" }}>
                  Description / Overview
                </label>
                <textarea
                  rows="3"
                  value={editCompanyForm.description}
                  onChange={(e) => setEditCompanyForm({ ...editCompanyForm, description: e.target.value })}
                  style={{ width: "100%", padding: "9px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px", resize: "vertical" }}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "10px" }}>
                <button
                  type="button"
                  onClick={() => setSelectedCompanyForEdit(null)}
                  style={{ padding: "8px 16px", background: "#f1f5f9", border: "none", borderRadius: "8px", fontSize: "13px", fontWeight: 600, cursor: "pointer" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ padding: "8px 18px", background: "#0284c7", color: "#fff", border: "none", borderRadius: "8px", fontSize: "13px", fontWeight: 700, cursor: "pointer" }}
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL 5: HOST COMPETITION / HACKATHON
         ======================================================== */}
      {showCreateCompModal && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(0,0,0,0.6)",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          zIndex: 1000,
          padding: "20px",
        }}>
          <div style={{
            background: "#fff",
            borderRadius: "16px",
            width: "100%",
            maxWidth: "580px",
            padding: "24px",
            boxShadow: "0 20px 40px rgba(0,0,0,0.2)",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h3 style={{ margin: 0, fontSize: "18px", color: "#0f172a" }}>Host Official Contest / Hackathon</h3>
              <button
                onClick={() => setShowCreateCompModal(false)}
                style={{ background: "none", border: "none", fontSize: "20px", cursor: "pointer" }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateCompetition} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#475569", marginBottom: "4px" }}>
                  Event / Contest Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. InnoHacks 2026 / Algorithmic CodeQuest"
                  value={newCompetition.title}
                  onChange={(e) => setNewCompetition({ ...newCompetition, title: e.target.value })}
                  style={{ width: "100%", padding: "9px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px" }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#475569", marginBottom: "4px" }}>
                    Category / Type
                  </label>
                  <select
                    value={newCompetition.type}
                    onChange={(e) => setNewCompetition({ ...newCompetition, type: e.target.value })}
                    style={{ width: "100%", padding: "9px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px" }}
                  >
                    <option value="Coding Contest">Coding Contest</option>
                    <option value="Hackathon">Hackathon</option>
                    <option value="Ideathon">Ideathon</option>
                    <option value="Web Development">Web Development Challenge</option>
                    <option value="AI / ML Sprint">AI / ML Sprint</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#475569", marginBottom: "4px" }}>
                    Max Team Size (1 for Solo)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    placeholder="e.g. 1, 2, 4"
                    value={newCompetition.maxTeamSize}
                    onChange={(e) => setNewCompetition({ ...newCompetition, maxTeamSize: e.target.value })}
                    style={{ width: "100%", padding: "9px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px" }}
                  />
                </div>
              </div>

              {/* Eligibility Criteria Policy */}
              <div style={{ padding: "10px 12px", background: "#f8fafc", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                <span style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#334155", marginBottom: "6px" }}>
                  Eligibility Policy:
                </span>
                <div style={{ display: "flex", gap: "8px" }}>
                  <button
                    type="button"
                    onClick={() => setNewCompetition({ ...newCompetition, isOpenToAll: true })}
                    style={{
                      flex: 1,
                      padding: "7px 10px",
                      borderRadius: "6px",
                      border: "1px solid",
                      borderColor: newCompetition.isOpenToAll !== false ? "#16a34a" : "#cbd5e1",
                      background: newCompetition.isOpenToAll !== false ? "#f0fdf4" : "#ffffff",
                      color: newCompetition.isOpenToAll !== false ? "#15803d" : "#475569",
                      fontWeight: 700,
                      fontSize: "12px",
                      cursor: "pointer",
                    }}
                  >
                    ✨ Open for All Students
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewCompetition({ ...newCompetition, isOpenToAll: false })}
                    style={{
                      flex: 1,
                      padding: "7px 10px",
                      borderRadius: "6px",
                      border: "1px solid",
                      borderColor: newCompetition.isOpenToAll === false ? "#0284c7" : "#cbd5e1",
                      background: newCompetition.isOpenToAll === false ? "#f0f9ff" : "#ffffff",
                      color: newCompetition.isOpenToAll === false ? "#0284c7" : "#475569",
                      fontWeight: 700,
                      fontSize: "12px",
                      cursor: "pointer",
                    }}
                  >
                    🎯 Department / Course Specific
                  </button>
                </div>
              </div>

              {/* Dates Row */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#475569", marginBottom: "4px" }}>
                    Registration Deadline *
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={newCompetition.registrationDeadline}
                    onChange={(e) => setNewCompetition({ ...newCompetition, registrationDeadline: e.target.value })}
                    style={{ width: "100%", padding: "9px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#475569", marginBottom: "4px" }}>
                    Contest Start Date (Optional)
                  </label>
                  <input
                    type="datetime-local"
                    value={newCompetition.startDate}
                    onChange={(e) => setNewCompetition({ ...newCompetition, startDate: e.target.value })}
                    style={{ width: "100%", padding: "9px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px" }}
                  />
                </div>
              </div>

              {/* Organizer & End Date */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#475569", marginBottom: "4px" }}>
                    Organizer / Department Club
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Coding Club / TPO Cell"
                    value={newCompetition.organizer}
                    onChange={(e) => setNewCompetition({ ...newCompetition, organizer: e.target.value })}
                    style={{ width: "100%", padding: "9px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#475569", marginBottom: "4px" }}>
                    Contest End Date (Optional)
                  </label>
                  <input
                    type="datetime-local"
                    value={newCompetition.endDate}
                    onChange={(e) => setNewCompetition({ ...newCompetition, endDate: e.target.value })}
                    style={{ width: "100%", padding: "9px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px" }}
                  />
                </div>
              </div>

              {/* Prizes & External Link */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#475569", marginBottom: "4px" }}>
                    Prizes / Incentives
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 1st: ₹20,000 | 2nd: ₹10,000"
                    value={newCompetition.prizes}
                    onChange={(e) => setNewCompetition({ ...newCompetition, prizes: e.target.value })}
                    style={{ width: "100%", padding: "9px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#475569", marginBottom: "4px" }}>
                    External Platform Link (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. https://unstop.com/... or https://hackerrank.com/..."
                    value={newCompetition.externalLink}
                    onChange={(e) => setNewCompetition({ ...newCompetition, externalLink: e.target.value })}
                    style={{ width: "100%", padding: "9px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px" }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#475569", marginBottom: "4px" }}>
                  Description & Guidelines
                </label>
                <textarea
                  rows="3"
                  placeholder="Event schedule, problem statement themes, guidelines..."
                  value={newCompetition.description}
                  onChange={(e) => setNewCompetition({ ...newCompetition, description: e.target.value })}
                  style={{ width: "100%", padding: "9px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px" }}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "10px" }}>
                <button
                  type="button"
                  onClick={() => setShowCreateCompModal(false)}
                  style={{ padding: "8px 16px", background: "#f1f5f9", border: "none", borderRadius: "8px", fontSize: "13px", fontWeight: 600, cursor: "pointer" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ padding: "8px 18px", background: "#d97706", color: "#fff", border: "none", borderRadius: "8px", fontSize: "13px", fontWeight: 700, cursor: "pointer" }}
                >
                  Publish Contest
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL 6: VIEW REGISTERED PARTICIPANTS
         ======================================================== */}
      {selectedCompForParticipants && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(0,0,0,0.6)",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          zIndex: 1000,
          padding: "20px",
        }}>
          <div style={{
            background: "#fff",
            borderRadius: "16px",
            width: "100%",
            maxWidth: "740px",
            maxHeight: "85vh",
            overflowY: "auto",
            padding: "24px",
            boxShadow: "0 20px 40px rgba(0,0,0,0.2)",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
              <div>
                <h3 style={{ margin: 0, fontSize: "18px", color: "#0f172a" }}>
                  Registered Participants
                </h3>
                <span style={{ fontSize: "13px", color: "#0284c7", fontWeight: 600 }}>
                  {selectedCompForParticipants.title}
                </span>
                <div style={{ fontSize: "12px", color: "#64748b", marginTop: "2px" }}>
                  Total enrolled candidates: <strong>{participantsList.length}</strong>
                </div>
              </div>
              <button
                onClick={() => setSelectedCompForParticipants(null)}
                style={{ background: "none", border: "none", fontSize: "20px", cursor: "pointer", color: "#64748b" }}
              >
                ✕
              </button>
            </div>

            {/* Filter Input */}
            {participantsList.length > 0 && (
              <div style={{ marginBottom: "14px" }}>
                <input
                  type="text"
                  placeholder="🔍 Filter by student name, roll number, email, course..."
                  value={participantFilter}
                  onChange={(e) => setParticipantFilter(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    borderRadius: "8px",
                    border: "1px solid #cbd5e1",
                    fontSize: "13px",
                    background: "#f8fafc",
                  }}
                />
              </div>
            )}

            {loadingParticipants ? (
              <p style={{ textAlign: "center", color: "#64748b", padding: "20px" }}>Loading participants...</p>
            ) : participantsList.length === 0 ? (
              <div style={{ textAlign: "center", padding: "30px 20px", background: "#f8fafc", borderRadius: "10px", border: "1px dashed #cbd5e1" }}>
                <div style={{ fontSize: "32px", marginBottom: "6px" }}>👥</div>
                <h4 style={{ margin: "0 0 4px", color: "#0f172a" }}>No Students Registered Yet</h4>
                <p style={{ margin: 0, color: "#64748b", fontSize: "12px" }}>Students will appear here as soon as they enroll in this challenge.</p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {participantsList
                  .filter((p) => {
                    if (!participantFilter.trim()) return true;
                    const q = participantFilter.toLowerCase();
                    const name = (p.name || p.user?.name || "").toLowerCase();
                    const roll = (p.rollNumber || p.user?.rollNumber || p.student?.rollNumber || "").toLowerCase();
                    const email = (p.email || p.user?.email || "").toLowerCase();
                    const course = (p.course || p.user?.course || "").toLowerCase();
                    return name.includes(q) || roll.includes(q) || email.includes(q) || course.includes(q);
                  })
                  .map((p, idx) => {
                    const studentName = p.name || p.user?.name || "Student";
                    const studentRoll = p.rollNumber || p.user?.rollNumber || p.student?.rollNumber || "N/A";
                    const studentEmail = p.email || p.user?.email || "N/A";
                    const studentCourse = p.course || p.user?.course || "MCA";
                    const studentBranch = p.branch || p.user?.branch || "CSE";
                    const studentCollege = p.college || p.user?.college || "XYZ Group of Institutions";

                    return (
                      <div
                        key={idx}
                        style={{
                          padding: "12px 16px",
                          background: "#ffffff",
                          borderRadius: "10px",
                          border: "1px solid #e2e8f0",
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
                          gap: "12px",
                          flexWrap: "wrap",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                          <div
                            style={{
                              width: "40px",
                              height: "40px",
                              borderRadius: "50%",
                              background: "linear-gradient(135deg, #0284c7, #0f172a)",
                              color: "#fff",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontWeight: 700,
                              fontSize: "15px",
                              flexShrink: 0,
                            }}
                          >
                            {studentName.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div style={{ fontWeight: 700, color: "#0f172a", fontSize: "14px" }}>
                              {studentName}
                            </div>
                            <div style={{ fontSize: "12px", color: "#64748b", display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
                              <span>✉️ {studentEmail}</span>
                              <span>•</span>
                              <span>🏛️ {studentCollege}</span>
                            </div>
                          </div>
                        </div>

                        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                          <span
                            style={{
                              fontSize: "12px",
                              fontWeight: 700,
                              padding: "4px 10px",
                              background: "#eff6ff",
                              color: "#1d4ed8",
                              borderRadius: "6px",
                              border: "1px solid #bfdbfe",
                              letterSpacing: "0.3px",
                            }}
                          >
                            🎯 Roll: {studentRoll}
                          </span>
                          <span
                            style={{
                              fontSize: "11px",
                              fontWeight: 600,
                              padding: "4px 8px",
                              background: "#f1f5f9",
                              color: "#475569",
                              borderRadius: "6px",
                            }}
                          >
                            🎓 {studentCourse} ({studentBranch})
                          </span>
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL 7: EDIT STUDENT PROFILE (ADMIN OVERRIDE)
         ======================================================== */}
      {editingStudent && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(0,0,0,0.6)",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          zIndex: 1000,
          padding: "20px",
        }}>
          <div style={{
            background: "#ffffff",
            borderRadius: "16px",
            width: "100%",
            maxWidth: "700px",
            maxHeight: "90vh",
            overflowY: "auto",
            padding: "24px",
            boxShadow: "0 20px 50px rgba(0,0,0,0.3)",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
              <div>
                <h3 style={{ margin: 0, fontSize: "18px", color: "#0f172a" }}>
                  Edit Student Profile (Admin Institutional Override)
                </h3>
                <span style={{ fontSize: "12px", color: "#64748b" }}>
                  Modify student records that are locked and non-editable for students.
                </span>
              </div>
              <button
                onClick={() => setEditingStudent(null)}
                style={{ background: "none", border: "none", fontSize: "20px", cursor: "pointer" }}
              >
                ✕
              </button>
            </div>

            {/* Warning Callout */}
            <div style={{
              background: "#eff6ff",
              border: "1px solid #bfdbfe",
              borderRadius: "8px",
              padding: "10px 14px",
              marginBottom: "16px",
              fontSize: "12px",
              color: "#1e40af",
              display: "flex",
              gap: "8px",
              alignItems: "center",
            }}>
              <span>ℹ️</span>
              <span>
                <strong>TPO Authority Note:</strong> Students cannot edit their Name, Email, Roll Number, Degree Course, Department Branch, or College. Only Admin can modify these official credentials.
              </span>
            </div>

            {/* Modal Error Banner */}
            {editStudentModalError && (
              <div style={{
                background: "#fef2f2",
                border: "1px solid #fecaca",
                borderRadius: "8px",
                padding: "10px 14px",
                marginBottom: "16px",
                fontSize: "13px",
                color: "#b91c1c",
                display: "flex",
                gap: "8px",
                alignItems: "center",
              }}>
                <span>⚠️</span>
                <span><strong>Error:</strong> {editStudentModalError}</span>
              </div>
            )}

            <form onSubmit={handleSaveEditStudent} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              {/* Name & Email */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#475569", marginBottom: "4px" }}>
                    Student Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={editStudentForm.name}
                    onChange={(e) => setEditStudentForm({ ...editStudentForm, name: e.target.value })}
                    style={{ width: "100%", padding: "9px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#475569", marginBottom: "4px" }}>
                    Official Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    value={editStudentForm.email}
                    onChange={(e) => setEditStudentForm({ ...editStudentForm, email: e.target.value })}
                    style={{ width: "100%", padding: "9px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px" }}
                  />
                </div>
              </div>

              {/* Roll Number & College */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#475569", marginBottom: "4px" }}>
                    Institutional Roll Number *
                  </label>
                  <input
                    type="text"
                    required
                    value={editStudentForm.rollNumber}
                    onChange={(e) => setEditStudentForm({ ...editStudentForm, rollNumber: e.target.value })}
                    style={{ width: "100%", padding: "9px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#475569", marginBottom: "4px" }}>
                    College / Institution
                  </label>
                  <input
                    type="text"
                    required
                    value={editStudentForm.college}
                    onChange={(e) => setEditStudentForm({ ...editStudentForm, college: e.target.value })}
                    style={{ width: "100%", padding: "9px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px" }}
                  />
                </div>
              </div>

              {/* Course & Branch */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#475569", marginBottom: "4px" }}>
                    Program / Degree Course *
                  </label>
                  <select
                    value={editStudentForm.course}
                    onChange={(e) => setEditStudentForm({ ...editStudentForm, course: e.target.value })}
                    style={{ width: "100%", padding: "9px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px" }}
                  >
                    <option value="B.Tech">B.Tech</option>
                    <option value="MCA">MCA</option>
                    <option value="BCA">BCA</option>
                    <option value="M.Tech">M.Tech</option>
                    <option value="MBA">MBA</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#475569", marginBottom: "4px" }}>
                    Department / Branch {editStudentForm.course === "M.Tech" ? "(Optional)" : "*"}
                  </label>
                  <input
                    type="text"
                    required={editStudentForm.course !== "M.Tech"}
                    list="admin-branch-list"
                    placeholder={editStudentForm.course === "M.Tech" ? "Optional for M.Tech" : "e.g. Computer Science and Engineering"}
                    value={editStudentForm.branch}
                    onChange={(e) => setEditStudentForm({ ...editStudentForm, branch: e.target.value })}
                    style={{ width: "100%", padding: "9px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px" }}
                  />
                  <datalist id="admin-branch-list">
                    <option value="Computer Science and Engineering" />
                    <option value="Information Technology" />
                    <option value="Electronics and Communication Engineering" />
                    <option value="Electrical and Electronics Engineering" />
                    <option value="Mechanical Engineering" />
                    <option value="Civil Engineering" />
                    <option value="Computer Applications" />
                    <option value="Finance" />
                    <option value="Marketing" />
                    <option value="Human Resources" />
                  </datalist>
                </div>
              </div>

              {/* Academics: CGPA, 10th, 12th, Backlogs */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "10px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#475569", marginBottom: "4px" }}>
                    CGPA (0 - 10)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="10"
                    value={editStudentForm.cgpa}
                    onChange={(e) => setEditStudentForm({ ...editStudentForm, cgpa: e.target.value })}
                    style={{ width: "100%", padding: "9px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#475569", marginBottom: "4px" }}>
                    10th Marks %
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    value={editStudentForm.tenthPercentage}
                    onChange={(e) => setEditStudentForm({ ...editStudentForm, tenthPercentage: e.target.value })}
                    style={{ width: "100%", padding: "9px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#475569", marginBottom: "4px" }}>
                    12th Marks %
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    value={editStudentForm.twelfthPercentage}
                    onChange={(e) => setEditStudentForm({ ...editStudentForm, twelfthPercentage: e.target.value })}
                    style={{ width: "100%", padding: "9px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#475569", marginBottom: "4px" }}>
                    Active Backlogs
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={editStudentForm.backlogs}
                    onChange={(e) => setEditStudentForm({ ...editStudentForm, backlogs: parseInt(e.target.value, 10) || 0 })}
                    style={{ width: "100%", padding: "9px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px" }}
                  />
                </div>
              </div>

              {/* Account Status */}
              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#475569", marginBottom: "4px" }}>
                  Account Status
                </label>
                <select
                  value={editStudentForm.status}
                  onChange={(e) => setEditStudentForm({ ...editStudentForm, status: e.target.value })}
                  style={{ width: "100%", padding: "9px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px" }}
                >
                  <option value="active">Active (Full Access to Placement Drives)</option>
                  <option value="suspended">Suspended (Access Restricted by TPO)</option>
                </select>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "12px" }}>
                <button
                  type="button"
                  onClick={() => setEditingStudent(null)}
                  style={{ padding: "9px 18px", background: "#f1f5f9", border: "none", borderRadius: "8px", fontSize: "13px", fontWeight: 600, cursor: "pointer" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingEditStudent}
                  style={{
                    padding: "9px 22px",
                    background: "#0284c7",
                    color: "#fff",
                    border: "none",
                    borderRadius: "8px",
                    fontSize: "13px",
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  {submittingEditStudent ? "Saving Changes..." : "✓ Save Changes (Admin Override)"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* ========================================================
          MODAL 8: CREATE SKILL WORKSHOP (TPO ADMIN)
         ======================================================== */}
      {showCreateWorkshopModal && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(0,0,0,0.6)",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          zIndex: 1000,
          padding: "20px",
        }}>
          <div style={{
            background: "#ffffff",
            borderRadius: "16px",
            width: "100%",
            maxWidth: "700px",
            maxHeight: "90vh",
            overflowY: "auto",
            padding: "24px",
            boxShadow: "0 20px 50px rgba(0,0,0,0.3)",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
              <div>
                <h3 style={{ margin: 0, fontSize: "19px", color: "#0f172a" }}>
                  Create New Skill Workshop & Masterclass
                </h3>
                <span style={{ fontSize: "12px", color: "#64748b" }}>
                  Configure instructor, dates, seat quota, and free or Razorpay-paid enrolment.
                </span>
              </div>
              <button
                onClick={() => setShowCreateWorkshopModal(false)}
                style={{ background: "none", border: "none", fontSize: "20px", cursor: "pointer" }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateWorkshop} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              {/* Workshop Title */}
              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#475569", marginBottom: "4px" }}>
                  Workshop Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Full Stack Development Workshop"
                  value={newWorkshopForm.title}
                  onChange={(e) => setNewWorkshopForm({ ...newWorkshopForm, title: e.target.value })}
                  style={{ width: "100%", padding: "9px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px" }}
                />
              </div>

              {/* Instructor & Duration */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#475569", marginBottom: "4px" }}>
                    Instructor / Speaker *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Industry Expert (ex-Google)"
                    value={newWorkshopForm.instructor}
                    onChange={(e) => setNewWorkshopForm({ ...newWorkshopForm, instructor: e.target.value })}
                    style={{ width: "100%", padding: "9px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#475569", marginBottom: "4px" }}>
                    Duration *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 3 Days, 15 Hours"
                    value={newWorkshopForm.duration}
                    onChange={(e) => setNewWorkshopForm({ ...newWorkshopForm, duration: e.target.value })}
                    style={{ width: "100%", padding: "9px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px" }}
                  />
                </div>
              </div>

              {/* Dates: Start, End, Deadline */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "10px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#475569", marginBottom: "4px" }}>
                    Start Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={newWorkshopForm.startDate}
                    onChange={(e) => setNewWorkshopForm({ ...newWorkshopForm, startDate: e.target.value })}
                    style={{ width: "100%", padding: "8px 10px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#475569", marginBottom: "4px" }}>
                    End Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={newWorkshopForm.endDate}
                    onChange={(e) => setNewWorkshopForm({ ...newWorkshopForm, endDate: e.target.value })}
                    style={{ width: "100%", padding: "8px 10px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#475569", marginBottom: "4px" }}>
                    Registration Deadline *
                  </label>
                  <input
                    type="date"
                    required
                    value={newWorkshopForm.registrationDeadline}
                    onChange={(e) => setNewWorkshopForm({ ...newWorkshopForm, registrationDeadline: e.target.value })}
                    style={{ width: "100%", padding: "8px 10px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px" }}
                  />
                </div>
              </div>

              {/* Mode, Venue & Seats */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1.5fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#475569", marginBottom: "4px" }}>
                    Delivery Mode
                  </label>
                  <select
                    value={newWorkshopForm.mode}
                    onChange={(e) => setNewWorkshopForm({ ...newWorkshopForm, mode: e.target.value })}
                    style={{ width: "100%", padding: "9px 10px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px" }}
                  >
                    <option value="Online">Online (Zoom/Meet)</option>
                    <option value="Offline">Offline (Campus)</option>
                    <option value="Hybrid">Hybrid</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#475569", marginBottom: "4px" }}>
                    Venue / Meeting Platform
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Google Meet / Lab 3"
                    value={newWorkshopForm.venue}
                    onChange={(e) => setNewWorkshopForm({ ...newWorkshopForm, venue: e.target.value })}
                    style={{ width: "100%", padding: "9px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#475569", marginBottom: "4px" }}>
                    Total Seats *
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    placeholder="50"
                    value={newWorkshopForm.totalSeats}
                    onChange={(e) => setNewWorkshopForm({ ...newWorkshopForm, totalSeats: e.target.value })}
                    style={{ width: "100%", padding: "9px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px" }}
                  />
                </div>
              </div>

              {/* Pricing Options: Free vs Paid (Razorpay) */}
              <div style={{ background: "#f8fafc", padding: "14px 16px", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#0f172a", marginBottom: "8px" }}>
                  Workshop Enrolment Model & Pricing *
                </label>
                <div style={{ display: "flex", gap: "20px", marginBottom: "10px", alignItems: "center" }}>
                  <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", fontWeight: 600, cursor: "pointer", color: newWorkshopForm.isPaid ? "#0284c7" : "#475569" }}>
                    <input
                      type="radio"
                      name="pricing"
                      checked={newWorkshopForm.isPaid === true}
                      onChange={() => setNewWorkshopForm({ ...newWorkshopForm, isPaid: true, fee: newWorkshopForm.fee || 299 })}
                    />
                    💳 Paid Workshop (Razorpay Payment Gateway)
                  </label>
                  <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", fontWeight: 600, cursor: "pointer", color: !newWorkshopForm.isPaid ? "#16a34a" : "#475569" }}>
                    <input
                      type="radio"
                      name="pricing"
                      checked={newWorkshopForm.isPaid === false}
                      onChange={() => setNewWorkshopForm({ ...newWorkshopForm, isPaid: false, fee: 0 })}
                    />
                    🎁 Free / Institutional Sponsored
                  </label>
                </div>

                {newWorkshopForm.isPaid && (
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "8px" }}>
                    <label style={{ fontSize: "12px", fontWeight: 600, color: "#334155" }}>
                      Registration Fee (₹ INR):
                    </label>
                    <input
                      type="number"
                      min="1"
                      required
                      placeholder="299"
                      value={newWorkshopForm.fee}
                      onChange={(e) => setNewWorkshopForm({ ...newWorkshopForm, fee: e.target.value })}
                      style={{ width: "120px", padding: "8px 12px", borderRadius: "8px", border: "1px solid #0284c7", fontSize: "13px", fontWeight: 700 }}
                    />
                    <span style={{ fontSize: "12px", color: "#64748b" }}>
                      Students will pay via UPI, Card, NetBanking through Razorpay Checkout.
                    </span>
                  </div>
                )}
              </div>

              {/* Technologies / Tags */}
              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#475569", marginBottom: "4px" }}>
                  Skills & Technologies (Comma-separated)
                </label>
                <input
                  type="text"
                  placeholder="e.g. React, Node.js, Express, MongoDB, REST APIs"
                  value={newWorkshopForm.tags}
                  onChange={(e) => setNewWorkshopForm({ ...newWorkshopForm, tags: e.target.value })}
                  style={{ width: "100%", padding: "9px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px" }}
                />
              </div>

              {/* Description / Curriculum */}
              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#475569", marginBottom: "4px" }}>
                  Curriculum & Session Breakdown
                </label>
                <textarea
                  rows={3}
                  placeholder="Provide details on modules covered, prerequisites, hands-on lab exercises, and certification criteria..."
                  value={newWorkshopForm.description}
                  onChange={(e) => setNewWorkshopForm({ ...newWorkshopForm, description: e.target.value })}
                  style={{ width: "100%", padding: "9px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px", resize: "vertical" }}
                />
              </div>

              {/* Actions */}
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "6px" }}>
                <button
                  type="button"
                  onClick={() => setShowCreateWorkshopModal(false)}
                  style={{ padding: "9px 18px", background: "#f1f5f9", border: "none", borderRadius: "8px", fontSize: "13px", fontWeight: 600, cursor: "pointer" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingWorkshop}
                  style={{
                    padding: "9px 24px",
                    background: "#0284c7",
                    color: "#ffffff",
                    border: "none",
                    borderRadius: "8px",
                    fontSize: "13px",
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  {submittingWorkshop ? "Publishing..." : "+ Publish Workshop"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL 9: VIEW WORKSHOP REGISTERED PARTICIPANTS (TPO ADMIN)
         ======================================================== */}
      {selectedWorkshopForParticipants && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(0,0,0,0.65)",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          zIndex: 1000,
          padding: "20px",
        }}>
          <div style={{
            background: "#ffffff",
            borderRadius: "16px",
            width: "100%",
            maxWidth: "900px",
            maxHeight: "90vh",
            overflowY: "auto",
            padding: "24px",
            boxShadow: "0 20px 50px rgba(0,0,0,0.3)",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
              <div>
                <span style={{ fontSize: "11px", fontWeight: 700, padding: "3px 8px", background: selectedWorkshopForParticipants.isPaid ? "#ecfdf5" : "#f0fdf4", color: selectedWorkshopForParticipants.isPaid ? "#047857" : "#16a34a", borderRadius: "6px", display: "inline-block", marginBottom: "6px" }}>
                  {selectedWorkshopForParticipants.isPaid ? `PAID COHORT • ₹${selectedWorkshopForParticipants.fee}` : "FREE COHORT"}
                </span>
                <h3 style={{ margin: "0 0 2px", fontSize: "19px", color: "#0f172a" }}>
                  Enrolled Students: {selectedWorkshopForParticipants.title}
                </h3>
                <span style={{ fontSize: "12px", color: "#64748b" }}>
                  Total Capacity: <strong>{selectedWorkshopForParticipants.totalSeats} Seats</strong> • Enrolled: <strong>{workshopParticipantsList.length} Students</strong>
                </span>
              </div>
              <button
                onClick={() => setSelectedWorkshopForParticipants(null)}
                style={{ background: "none", border: "none", fontSize: "20px", cursor: "pointer" }}
              >
                ✕
              </button>
            </div>

            {/* Filter / Search Bar */}
            <div style={{ marginBottom: "16px" }}>
              <input
                type="text"
                placeholder="Search registered students by roll number, name, or email..."
                value={workshopParticipantFilter}
                onChange={(e) => setWorkshopParticipantFilter(e.target.value)}
                style={{ width: "100%", padding: "9px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px" }}
              />
            </div>

            {/* Table */}
            {loadingWorkshopParticipants ? (
              <div style={{ textAlign: "center", padding: "40px", color: "#64748b" }}>
                Loading participants...
              </div>
            ) : workshopParticipantsList.length === 0 ? (
              <div style={{ textAlign: "center", padding: "40px", background: "#f8fafc", borderRadius: "10px", color: "#64748b", fontSize: "13px" }}>
                No students have enrolled in this workshop yet.
              </div>
            ) : (
              <div style={{ overflowX: "auto", border: "1px solid #e2e8f0", borderRadius: "10px" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px", textAlign: "left" }}>
                  <thead>
                    <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0", color: "#475569" }}>
                      <th style={{ padding: "10px 14px" }}>#</th>
                      <th style={{ padding: "10px 14px" }}>Student</th>
                      <th style={{ padding: "10px 14px" }}>Roll Number</th>
                      <th style={{ padding: "10px 14px" }}>Course & Branch</th>
                      <th style={{ padding: "10px 14px" }}>Enrolled On</th>
                      <th style={{ padding: "10px 14px" }}>Payment Status</th>
                      <th style={{ padding: "10px 14px" }}>Transaction Ref</th>
                    </tr>
                  </thead>
                  <tbody>
                    {workshopParticipantsList
                      .filter((p) => {
                        if (!workshopParticipantFilter.trim()) return true;
                        const q = workshopParticipantFilter.toLowerCase();
                        return (
                          p.name?.toLowerCase().includes(q) ||
                          p.email?.toLowerCase().includes(q) ||
                          p.rollNumber?.toLowerCase().includes(q) ||
                          p.paymentId?.toLowerCase().includes(q)
                        );
                      })
                      .map((p, idx) => (
                        <tr key={idx} style={{ borderBottom: "1px solid #f1f5f9" }}>
                          <td style={{ padding: "10px 14px", color: "#64748b" }}>{idx + 1}</td>
                          <td style={{ padding: "10px 14px" }}>
                            <strong style={{ color: "#0f172a" }}>{p.name}</strong>
                            <div style={{ fontSize: "11px", color: "#64748b" }}>{p.email}</div>
                          </td>
                          <td style={{ padding: "10px 14px", fontWeight: 600 }}>{p.rollNumber || "N/A"}</td>
                          <td style={{ padding: "10px 14px" }}>{p.course} ({p.branch || "General"})</td>
                          <td style={{ padding: "10px 14px", fontSize: "12px", color: "#64748b" }}>
                            {p.registeredAt ? new Date(p.registeredAt).toLocaleDateString() : "N/A"}
                          </td>
                          <td style={{ padding: "10px 14px" }}>
                            <span style={{
                              padding: "3px 8px",
                              borderRadius: "6px",
                              fontSize: "11px",
                              fontWeight: 700,
                              background: p.paymentStatus === "completed" ? "#ecfdf5" : "#f1f5f9",
                              color: p.paymentStatus === "completed" ? "#047857" : "#475569",
                              textTransform: "uppercase",
                            }}>
                              {p.paymentStatus === "completed" ? `✓ Paid (₹${p.amountPaid})` : "Free"}
                            </span>
                          </td>
                          <td style={{ padding: "10px 14px", fontSize: "11px" }}>
                            <code style={{ background: "#f1f5f9", padding: "2px 6px", borderRadius: "4px", color: "#0369a1" }}>
                              {p.paymentId || "N/A"}
                            </code>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            )}

            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "16px" }}>
              <button
                onClick={() => setSelectedWorkshopForParticipants(null)}
                style={{ padding: "9px 18px", background: "#0f172a", color: "#fff", border: "none", borderRadius: "8px", fontSize: "13px", fontWeight: 600, cursor: "pointer" }}
              >
                Close Window
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
