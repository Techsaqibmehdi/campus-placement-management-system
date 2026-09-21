import { useState, useEffect } from "react";
import {
  getMyCompany,
  updateMyCompany,
  getMyDrives,
  createDrive,
  updateDriveStatus,
  getRecruiterApplications,
  updateApplicationStatus,
  bulkUpdateApplicationStatus,
  getRecruiterInterviews,
  scheduleInterview,
  recordInterviewResult,
  createOffer,
  getRecruiterOffers,
} from "../api/recruiterApi";

export default function RecruiterDashboard() {
  // Navigation
  const [activeTab, setActiveTab] = useState("overview"); // "overview" | "company" | "opportunities" | "applications" | "interviews" | "offers" | "analytics"
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Core Data
  const [company, setCompany] = useState(null);
  const [drives, setDrives] = useState([]);
  const [applications, setApplications] = useState([]);
  const [interviews, setInterviews] = useState([]);
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Edit Company State
  const [editingCompany, setEditingCompany] = useState(false);
  const [companyForm, setCompanyForm] = useState({
    name: "",
    website: "",
    industry: "",
    location: "",
    description: "",
    logoUrl: "",
  });

  // Opportunities State & Modal
  const [showCreateOppModal, setShowCreateOppModal] = useState(false);
  const [oppCategoryFilter, setOppCategoryFilter] = useState("all"); // "all" | "placement_drive" | "internship" | "hackathon" | "event"
  const [oppForm, setOppForm] = useState({
    opportunityType: "placement_drive", // "placement_drive" | "internship" | "hackathon" | "event"
    isOpenToAll: true, // "Open for All (No Eligibility Criteria)"
    jobTitle: "",
    description: "",
    employmentType: "Full Time",
    workMode: "On-site",
    package: "",
    baseSalary: "",
    variableSalary: "",
    location: "Noida / Delhi-NCR",
    minimumCgpa: "",
    allowedCourses: "",
    eligibleBranches: "",
    requiredSkills: "",
    minimumTenthPercentage: "",
    minimumTwelfthPercentage: "",
    maximumBacklogs: "",
    selectionRounds: "Resume Screening, Technical Interview, HR Round",
    applicationDeadline: "",
    // Specific to Internship
    duration: "",
    stipend: "",
  });

  // Applications & Candidates Multi-Filter State
  const [selectedOppFilter, setSelectedOppFilter] = useState("all");
  const [appStatusFilter, setAppStatusFilter] = useState("all");
  const [branchFilter, setBranchFilter] = useState("all");
  const [cgpaFilter, setCgpaFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Bulk Selection State
  const [selectedAppIds, setSelectedAppIds] = useState([]);
  const [bulkLoading, setBulkLoading] = useState(false);

  // Candidate Profile Modal
  const [viewingCandidateApp, setViewingCandidateApp] = useState(null);

  // Interview Schedule Modal
  const [schedulingApp, setSchedulingApp] = useState(null);
  const [interviewScheduleForm, setInterviewScheduleForm] = useState({
    roundName: "Technical Interview - Round 1",
    interviewer: "",
    scheduledAt: "",
    mode: "online",
    meetingLink: "",
    location: "XYZ CRPC Interview Cabin 3",
  });

  // Record Interview Evaluation Modal
  const [evaluatingInterview, setEvaluatingInterview] = useState(null);
  const [evalForm, setEvalForm] = useState({
    score: "85",
    result: "passed", // "passed" | "failed" | "on_hold"
    feedback: "",
  });

  // Release Offer Modal
  const [offeringApp, setOfferingApp] = useState(null);
  const [offerCreateForm, setOfferCreateForm] = useState({
    joiningDate: "",
    baseSalary: "",
    variableSalary: "",
    offerLetterUrl: "",
    autoGeneratePdf: true,
  });

  // Fetch all recruiter records
  const fetchRecruiterData = async () => {
    try {
      setLoading(true);
      setError("");

      const [companyData, drivesData, appsData, interviewsData, offersData] =
        await Promise.all([
          getMyCompany().catch((err) => {
            console.warn("Company fetch:", err.response?.data?.message);
            return null;
          }),
          getMyDrives().catch((err) => {
            console.warn("Drives fetch:", err.response?.data?.message);
            return [];
          }),
          getRecruiterApplications().catch((err) => {
            console.warn("Apps fetch:", err.response?.data?.message);
            return [];
          }),
          getRecruiterInterviews().catch((err) => {
            console.warn("Interviews fetch:", err.response?.data?.message);
            return [];
          }),
          getRecruiterOffers().catch((err) => {
            console.warn("Offers fetch:", err.response?.data?.message);
            return [];
          }),
        ]);

      setCompany(companyData);
      if (companyData) {
        setCompanyForm({
          name: companyData.name || "",
          website: companyData.website || "",
          industry: companyData.industry || "",
          location: companyData.location || "",
          description: companyData.description || "",
          logoUrl: companyData.logoUrl || "",
        });
      }

      setDrives(drivesData || []);
      setApplications(appsData || []);
      setInterviews(interviewsData || []);
      setOffers(offersData || []);
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecruiterData();
  }, []);

  // Update Company
  const handleUpdateCompany = async (e) => {
    e.preventDefault();
    try {
      setError("");
      setSuccessMsg("");
      const updated = await updateMyCompany(companyForm);
      setCompany(updated);
      setEditingCompany(false);
      setSuccessMsg("Company profile updated successfully!");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update company");
    }
  };

  // Create Opportunity (Drive / Internship / Hackathon / Event)
  const handleCreateOpportunity = async (e) => {
    e.preventDefault();
    try {
      setError("");
      setSuccessMsg("");

      const isAll = Boolean(oppForm.isOpenToAll);
      const payload = {
        opportunityType: oppForm.opportunityType,
        isOpenToAll: isAll,
        jobTitle: oppForm.jobTitle,
        description: oppForm.description,
        employmentType:
          oppForm.opportunityType === "internship"
            ? "Internship"
            : oppForm.employmentType,
        workMode: oppForm.workMode,
        package: Number(oppForm.package) || 1,
        baseSalary: oppForm.baseSalary ? Number(oppForm.baseSalary) : null,
        variableSalary: oppForm.variableSalary ? Number(oppForm.variableSalary) : null,
        location: oppForm.location || "Delhi-NCR / Noida",
        minimumCgpa: isAll ? 0 : (Number(oppForm.minimumCgpa) || 0),
        allowedCourses: isAll
          ? []
          : (oppForm.allowedCourses
              ? oppForm.allowedCourses.split(",").map((s) => s.trim()).filter(Boolean)
              : []),
        eligibleBranches: isAll
          ? []
          : (oppForm.eligibleBranches
              ? oppForm.eligibleBranches.split(",").map((s) => s.trim()).filter(Boolean)
              : []),
        requiredSkills: isAll
          ? []
          : (oppForm.requiredSkills
              ? oppForm.requiredSkills.split(",").map((s) => s.trim()).filter(Boolean)
              : []),
        minimumTenthPercentage: isAll
          ? null
          : (oppForm.minimumTenthPercentage
              ? Number(oppForm.minimumTenthPercentage)
              : null),
        minimumTwelfthPercentage: isAll
          ? null
          : (oppForm.minimumTwelfthPercentage
              ? Number(oppForm.minimumTwelfthPercentage)
              : null),
        maximumBacklogs: isAll
          ? 99
          : (oppForm.maximumBacklogs
              ? Number(oppForm.maximumBacklogs)
              : 0),
        selectionRounds: oppForm.selectionRounds
          ? oppForm.selectionRounds.split(",").map((s) => s.trim()).filter(Boolean)
          : ["Technical Interview", "HR Round"],
        applicationDeadline: new Date(oppForm.applicationDeadline).toISOString(),
        duration: oppForm.opportunityType === "internship" ? oppForm.duration : null,
        stipend: oppForm.opportunityType === "internship" ? oppForm.stipend : null,
        status: "open",
      };

      await createDrive(payload);
      setShowCreateOppModal(false);
      setSuccessMsg("Opportunity submitted successfully! Awaiting TPO review.");
      const updatedDrives = await getMyDrives();
      setDrives(updatedDrives || []);
    } catch (err) {
      console.error("Opportunity creation error:", err);
      setError(
        err.response?.data?.error ||
        err.response?.data?.message ||
        err.message ||
        "Failed to create opportunity"
      );
    }
  };

  // Toggle Drive Status (Open/Close)
  const handleToggleDriveStatus = async (driveId, currentStatus) => {
    const nextStatus = currentStatus === "open" ? "closed" : "open";
    try {
      setError("");
      setSuccessMsg("");
      await updateDriveStatus(driveId, nextStatus);
      setSuccessMsg(`Opportunity status set to ${nextStatus}`);
      const updatedDrives = await getMyDrives();
      setDrives(updatedDrives || []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update status");
    }
  };

  // Single Status Update
  const handleStatusChange = async (appId, newStatus) => {
    try {
      setError("");
      setSuccessMsg("");
      await updateApplicationStatus(
        appId,
        newStatus,
        `Recruiter updated candidate status to ${newStatus}`
      );
      setSuccessMsg(`Candidate application updated to ${newStatus}`);
      const updated = await getRecruiterApplications();
      setApplications(updated || []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update status");
    }
  };

  // Bulk Status Update (Shortlist or Reject)
  const handleBulkStatusChange = async (status) => {
    if (selectedAppIds.length === 0) return;
    try {
      setBulkLoading(true);
      setError("");
      setSuccessMsg("");
      const res = await bulkUpdateApplicationStatus(
        selectedAppIds,
        status,
        `Bulk updated ${selectedAppIds.length} candidate(s) to ${status}`
      );
      setSuccessMsg(res.message || `Successfully updated ${selectedAppIds.length} candidates to ${status}!`);
      setSelectedAppIds([]);
      const updated = await getRecruiterApplications();
      setApplications(updated || []);
    } catch (err) {
      setError(err.response?.data?.message || "Bulk action failed");
    } finally {
      setBulkLoading(false);
    }
  };

  // Schedule Interview
  const handleScheduleInterview = async (e) => {
    e.preventDefault();
    if (!schedulingApp) return;
    try {
      setError("");
      setSuccessMsg("");
      await scheduleInterview(schedulingApp._id, {
        roundName: interviewScheduleForm.roundName,
        interviewer: interviewScheduleForm.interviewer,
        scheduledAt: new Date(interviewScheduleForm.scheduledAt).toISOString(),
        mode: interviewScheduleForm.mode,
        meetingLink:
          interviewScheduleForm.mode === "online"
            ? interviewScheduleForm.meetingLink
            : null,
        location:
          interviewScheduleForm.mode === "offline"
            ? interviewScheduleForm.location
            : null,
      });

      setSchedulingApp(null);
      setSuccessMsg("Interview scheduled successfully! Candidate notified.");
      const [updatedApps, updatedInterviews] = await Promise.all([
        getRecruiterApplications(),
        getRecruiterInterviews(),
      ]);
      setApplications(updatedApps || []);
      setInterviews(updatedInterviews || []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to schedule interview");
    }
  };

  // Record Interview Evaluation
  const handleRecordInterviewResult = async (e) => {
    e.preventDefault();
    if (!evaluatingInterview) return;
    try {
      setError("");
      setSuccessMsg("");
      await recordInterviewResult(evaluatingInterview._id, {
        score: Number(evalForm.score),
        result: evalForm.result,
        feedback: evalForm.feedback,
      });

      setEvaluatingInterview(null);
      setSuccessMsg("Interview evaluation and score recorded!");
      const [updatedApps, updatedInterviews] = await Promise.all([
        getRecruiterApplications(),
        getRecruiterInterviews(),
      ]);
      setApplications(updatedApps || []);
      setInterviews(updatedInterviews || []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to record evaluation");
    }
  };

  // Release Offer
  const handleReleaseOffer = async (e) => {
    e.preventDefault();
    if (!offeringApp) return;
    try {
      setError("");
      setSuccessMsg("");
      await createOffer(offeringApp._id, {
        joiningDate: offerCreateForm.joiningDate
          ? new Date(offerCreateForm.joiningDate).toISOString()
          : null,
        baseSalary: offerCreateForm.baseSalary ? Number(offerCreateForm.baseSalary) : null,
        variableSalary: offerCreateForm.variableSalary ? Number(offerCreateForm.variableSalary) : null,
        offerLetterUrl: offerCreateForm.autoGeneratePdf ? "" : (offerCreateForm.offerLetterUrl || ""),
        autoGeneratePdf: offerCreateForm.autoGeneratePdf,
      });

      setOfferingApp(null);
      setSuccessMsg("Official Job Offer released to candidate!");
      const [updatedApps, updatedOffers] = await Promise.all([
        getRecruiterApplications(),
        getRecruiterOffers(),
      ]);
      setApplications(updatedApps || []);
      setOffers(updatedOffers || []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to release offer");
    }
  };

  // Logout
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("status");
    localStorage.removeItem("userName");
    window.location.replace("/login");
  };

  // Filtered Applications Logic
  const filteredApplications = applications.filter((app) => {
    // Opportunity Filter
    if (selectedOppFilter !== "all" && app.drive?._id !== selectedOppFilter) {
      return false;
    }
    // Status Filter
    if (appStatusFilter !== "all" && app.status !== appStatusFilter) {
      return false;
    }
    // Branch Filter
    if (branchFilter !== "all" && app.student?.branch !== branchFilter) {
      return false;
    }
    // CGPA Filter
    if (cgpaFilter !== "all") {
      const cgpa = Number(app.student?.cgpa || 0);
      if (cgpaFilter === "8.5" && cgpa < 8.5) return false;
      if (cgpaFilter === "8.0" && cgpa < 8.0) return false;
      if (cgpaFilter === "7.0" && cgpa < 7.0) return false;
      if (cgpaFilter === "6.0" && cgpa < 6.0) return false;
    }
    // Search Query (Name, Email, Roll, Skills)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = app.student?.user?.name?.toLowerCase().includes(q);
      const matchRoll = app.student?.rollNumber?.toLowerCase().includes(q);
      const matchEmail = app.student?.user?.email?.toLowerCase().includes(q);
      const matchSkills = Array.isArray(app.student?.skills)
        ? app.student.skills.some((s) => s.toLowerCase().includes(q))
        : false;
      if (!matchName && !matchRoll && !matchEmail && !matchSkills) return false;
    }
    return true;
  });

  // Filtered Opportunities
  const filteredOpportunities = drives.filter((d) => {
    if (oppCategoryFilter === "all") return true;
    return (d.opportunityType || "placement_drive") === oppCategoryFilter;
  });

  // KPI Calculations
  const activeDrivesCount = drives.filter((d) => d.status === "open").length;
  const shortlistedCount = applications.filter((a) => a.status === "shortlisted").length;
  const scheduledInterviewsCount = interviews.filter((i) => i.status === "scheduled").length;
  const offersReleasedCount = offers.length;

  // Today's interviews
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  const todaysInterviews = interviews.filter((i) => {
    const d = new Date(i.scheduledAt);
    return d >= todayStart && d <= todayEnd;
  });

  // Checkbox Selection Toggle
  const toggleSelectAll = () => {
    if (selectedAppIds.length === filteredApplications.length) {
      setSelectedAppIds([]);
    } else {
      setSelectedAppIds(filteredApplications.map((a) => a._id));
    }
  };

  const toggleSelectOne = (id) => {
    if (selectedAppIds.includes(id)) {
      setSelectedAppIds(selectedAppIds.filter((item) => item !== id));
    } else {
      setSelectedAppIds([...selectedAppIds, id]);
    }
  };

  if (loading) {
    return (
      <div style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
        background: "#0f172a",
        color: "#fff",
        fontFamily: "'Inter', sans-serif",
      }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "36px", marginBottom: "14px", animation: "spin 1s infinite linear" }}>⚡</div>
          <h3 style={{ margin: "0 0 6px", fontSize: "18px", fontWeight: 700 }}>
            XYZ Corporate Relations & Placement Portal
          </h3>
          <p style={{ margin: 0, color: "#94a3b8", fontSize: "14px" }}>
            Synchronizing hiring pipeline, candidate portfolios & drive schedules...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#f8fafc", fontFamily: "'Inter', sans-serif" }}>
      {/* 1. RECRUITER COLLAPSIBLE LEFT SIDEBAR */}
      <aside
        className={`xyz-sidebar ${sidebarCollapsed ? "collapsed" : ""}`}
        style={{
          width: sidebarCollapsed ? "76px" : "260px",
          background: "#090d16", // Premium dark slate
          color: "#f8fafc",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          borderRight: "1px solid #1e293b",
          flexShrink: 0,
          position: "sticky",
          top: 0,
          height: "100vh",
          zIndex: 40,
        }}
      >
        <div>
          {/* Brand Header with Collapse Toggle */}
          <div style={{
            padding: sidebarCollapsed ? "20px 14px" : "20px 16px",
            borderBottom: "1px solid #1e293b",
            display: "flex",
            alignItems: "center",
            justifyContent: sidebarCollapsed ? "center" : "space-between",
            gap: "10px",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", overflow: "hidden" }}>
              <div style={{
                width: "38px",
                height: "38px",
                borderRadius: "10px",
                background: "linear-gradient(135deg, #1d4ed8, #0284c7)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#ffffff",
                fontWeight: 900,
                fontSize: "14px",
                flexShrink: 0,
                boxShadow: "0 2px 8px rgba(2, 132, 199, 0.4)",
              }}>
                🏢
              </div>
              {!sidebarCollapsed && (
                <div style={{ whiteSpace: "nowrap", overflow: "hidden" }}>
                  <h2 style={{ margin: 0, fontSize: "14px", fontWeight: 700, color: "#ffffff" }}>
                    {company?.name || "Recruiter Partner"}
                  </h2>
                  <span style={{ fontSize: "11px", color: "#38bdf8", display: "block" }}>
                    XYZ Placement Cell
                  </span>
                </div>
              )}
            </div>

            {!sidebarCollapsed && (
              <button
                className="xyz-toggle-btn"
                onClick={() => setSidebarCollapsed(true)}
                title="Collapse Sidebar"
              >
                ◀
              </button>
            )}
          </div>

          {sidebarCollapsed && (
            <div style={{ textAlign: "center", padding: "8px 0" }}>
              <button
                className="xyz-toggle-btn"
                onClick={() => setSidebarCollapsed(false)}
                title="Expand Sidebar"
                style={{ margin: "0 auto" }}
              >
                ▶
              </button>
            </div>
          )}

          {/* Navigation Items */}
          <nav style={{ padding: "14px 10px", display: "flex", flexDirection: "column", gap: "6px" }}>
            <button
              onClick={() => setActiveTab("overview")}
              className={`xyz-nav-btn ${activeTab === "overview" ? "active" : ""} ${sidebarCollapsed ? "collapsed" : ""}`}
              data-tooltip="Overview & Activity"
              title={sidebarCollapsed ? "Overview & Activity" : ""}
              style={{
                width: "100%",
                padding: "10px 14px",
                borderRadius: "8px",
                border: "none",
                background: "transparent",
                color: activeTab === "overview" ? "#fff" : "#94a3b8",
                fontSize: "14px",
                fontWeight: activeTab === "overview" ? 600 : 500,
                cursor: "pointer",
                textAlign: "left",
                gap: "12px",
              }}
            >
              <span style={{ fontSize: "18px", flexShrink: 0 }}>📊</span>
              {!sidebarCollapsed && <span>Hiring Overview</span>}
            </button>

            <button
              onClick={() => setActiveTab("company")}
              className={`xyz-nav-btn ${activeTab === "company" ? "active" : ""} ${sidebarCollapsed ? "collapsed" : ""}`}
              data-tooltip="Company Profile"
              title={sidebarCollapsed ? "Company Profile" : ""}
              style={{
                width: "100%",
                padding: "10px 14px",
                borderRadius: "8px",
                border: "none",
                background: "transparent",
                color: activeTab === "company" ? "#fff" : "#94a3b8",
                fontSize: "14px",
                fontWeight: activeTab === "company" ? 600 : 500,
                cursor: "pointer",
                textAlign: "left",
                gap: "12px",
              }}
            >
              <span style={{ fontSize: "18px", flexShrink: 0 }}>🏢</span>
              {!sidebarCollapsed && <span>Company Profile</span>}
            </button>

            <button
              onClick={() => setActiveTab("opportunities")}
              className={`xyz-nav-btn ${activeTab === "opportunities" ? "active" : ""} ${sidebarCollapsed ? "collapsed" : ""}`}
              data-tooltip={`Opportunities (${drives.length})`}
              title={sidebarCollapsed ? `Opportunities (${drives.length})` : ""}
              style={{
                justifyContent: sidebarCollapsed ? "center" : "space-between",
                width: "100%",
                padding: "10px 14px",
                borderRadius: "8px",
                border: "none",
                background: "transparent",
                color: activeTab === "opportunities" ? "#fff" : "#94a3b8",
                fontSize: "14px",
                fontWeight: activeTab === "opportunities" ? 600 : 500,
                cursor: "pointer",
                textAlign: "left",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <span style={{ fontSize: "18px", flexShrink: 0 }}>📢</span>
                {!sidebarCollapsed && <span>Opportunities Hub</span>}
              </div>
              {!sidebarCollapsed && (
                <span style={{
                  background: activeTab === "opportunities" ? "#0284c7" : "#1e293b",
                  color: "#e2e8f0",
                  fontSize: "11px",
                  fontWeight: 700,
                  padding: "2px 7px",
                  borderRadius: "10px",
                }}>
                  {drives.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab("applications")}
              className={`xyz-nav-btn ${activeTab === "applications" ? "active" : ""} ${sidebarCollapsed ? "collapsed" : ""}`}
              data-tooltip={`Applications (${applications.length})`}
              title={sidebarCollapsed ? `Applications (${applications.length})` : ""}
              style={{
                justifyContent: sidebarCollapsed ? "center" : "space-between",
                width: "100%",
                padding: "10px 14px",
                borderRadius: "8px",
                border: "none",
                background: "transparent",
                color: activeTab === "applications" ? "#fff" : "#94a3b8",
                fontSize: "14px",
                fontWeight: activeTab === "applications" ? 600 : 500,
                cursor: "pointer",
                textAlign: "left",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <span style={{ fontSize: "18px", flexShrink: 0 }}>👨‍🎓</span>
                {!sidebarCollapsed && <span>Candidates & Apps</span>}
              </div>
              {!sidebarCollapsed && (
                <span style={{
                  background: "#2563eb",
                  color: "#fff",
                  fontSize: "11px",
                  fontWeight: 700,
                  padding: "2px 7px",
                  borderRadius: "10px",
                }}>
                  {applications.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab("interviews")}
              className={`xyz-nav-btn ${activeTab === "interviews" ? "active" : ""} ${sidebarCollapsed ? "collapsed" : ""}`}
              data-tooltip={`Interviews (${interviews.length})`}
              title={sidebarCollapsed ? `Interviews (${interviews.length})` : ""}
              style={{
                justifyContent: sidebarCollapsed ? "center" : "space-between",
                width: "100%",
                padding: "10px 14px",
                borderRadius: "8px",
                border: "none",
                background: "transparent",
                color: activeTab === "interviews" ? "#fff" : "#94a3b8",
                fontSize: "14px",
                fontWeight: activeTab === "interviews" ? 600 : 500,
                cursor: "pointer",
                textAlign: "left",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <span style={{ fontSize: "18px", flexShrink: 0 }}>🎙️</span>
                {!sidebarCollapsed && <span>Interviews</span>}
              </div>
              {!sidebarCollapsed && scheduledInterviewsCount > 0 && (
                <span style={{
                  background: "#ef4444",
                  color: "#fff",
                  fontSize: "11px",
                  fontWeight: 700,
                  padding: "2px 7px",
                  borderRadius: "10px",
                }}>
                  {scheduledInterviewsCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab("offers")}
              className={`xyz-nav-btn ${activeTab === "offers" ? "active" : ""} ${sidebarCollapsed ? "collapsed" : ""}`}
              data-tooltip={`Offers (${offers.length})`}
              title={sidebarCollapsed ? `Offers (${offers.length})` : ""}
              style={{
                justifyContent: sidebarCollapsed ? "center" : "space-between",
                width: "100%",
                padding: "10px 14px",
                borderRadius: "8px",
                border: "none",
                background: "transparent",
                color: activeTab === "offers" ? "#fff" : "#94a3b8",
                fontSize: "14px",
                fontWeight: activeTab === "offers" ? 600 : 500,
                cursor: "pointer",
                textAlign: "left",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <span style={{ fontSize: "18px", flexShrink: 0 }}>📜</span>
                {!sidebarCollapsed && <span>Offers Released</span>}
              </div>
              {!sidebarCollapsed && offers.length > 0 && (
                <span style={{
                  background: "#16a34a",
                  color: "#fff",
                  fontSize: "11px",
                  fontWeight: 700,
                  padding: "2px 7px",
                  borderRadius: "10px",
                }}>
                  {offers.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab("analytics")}
              className={`xyz-nav-btn ${activeTab === "analytics" ? "active" : ""} ${sidebarCollapsed ? "collapsed" : ""}`}
              data-tooltip="Hiring Analytics"
              title={sidebarCollapsed ? "Hiring Analytics" : ""}
              style={{
                width: "100%",
                padding: "10px 14px",
                borderRadius: "8px",
                border: "none",
                background: "transparent",
                color: activeTab === "analytics" ? "#fff" : "#94a3b8",
                fontSize: "14px",
                fontWeight: activeTab === "analytics" ? 600 : 500,
                cursor: "pointer",
                textAlign: "left",
                gap: "12px",
              }}
            >
              <span style={{ fontSize: "18px", flexShrink: 0 }}>📈</span>
              {!sidebarCollapsed && <span>Hiring Analytics</span>}
            </button>
          </nav>
        </div>

        {/* Recruiter User Box & Logout */}
        <div style={{
          padding: sidebarCollapsed ? "16px 10px" : "16px 14px",
          borderTop: "1px solid #1e293b",
          background: "#05080e",
        }}>
          {!sidebarCollapsed ? (
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
                <div style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "50%",
                  background: "#0284c7",
                  color: "#fff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 700,
                  fontSize: "14px",
                  flexShrink: 0,
                }}>
                  {(company?.name || "R")[0].toUpperCase()}
                </div>
                <div style={{ overflow: "hidden" }}>
                  <div style={{ fontSize: "13px", fontWeight: 600, color: "#fff", whiteSpace: "nowrap", textOverflow: "ellipsis", overflow: "hidden" }}>
                    {company?.name || "Recruiter"}
                  </div>
                  <div style={{ fontSize: "11px", color: "#38bdf8" }}>
                    Verified Hiring Partner ✓
                  </div>
                </div>
              </div>

              <button
                onClick={handleLogout}
                style={{
                  width: "100%",
                  padding: "8px 10px",
                  background: "transparent",
                  border: "1px solid #334155",
                  borderRadius: "6px",
                  color: "#f87171",
                  fontSize: "12px",
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                }}
              >
                Sign Out 🚪
              </button>
            </div>
          ) : (
            <div style={{ textAlign: "center" }}>
              <div
                style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "50%",
                  background: "#0284c7",
                  color: "#fff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 700,
                  fontSize: "14px",
                  margin: "0 auto 8px",
                }}
                title={company?.name}
              >
                {(company?.name || "R")[0].toUpperCase()}
              </div>
              <button
                onClick={handleLogout}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "#f87171",
                  fontSize: "16px",
                  cursor: "pointer",
                }}
                title="Sign Out"
              >
                🚪
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* 2. MAIN CONTENT WRAPPER */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        {/* Top Header */}
        <header className="xyz-header">
          <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "8px",
                background: "#f1f5f9",
                border: "1px solid #e2e8f0",
                color: "#1e293b",
                fontSize: "16px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
              title="Toggle Sidebar"
            >
              ☰
            </button>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontSize: "13px", color: "#64748b", fontWeight: 500 }}>XYZ CRPC</span>
              <span style={{ color: "#cbd5e1" }}>/</span>
              <span style={{ fontSize: "14px", fontWeight: 700, color: "#0f172a" }}>
                {activeTab === "overview" && "Hiring Overview"}
                {activeTab === "company" && "Company Profile"}
                {activeTab === "opportunities" && "Opportunities Hub"}
                {activeTab === "applications" && "Applications & Candidates"}
                {activeTab === "interviews" && "Interview Management"}
                {activeTab === "offers" && "Offers Released"}
                {activeTab === "analytics" && "Hiring Funnel & Analytics"}
              </span>
            </div>
          <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
            {/* Post Opportunity Quick Action */}
            <button
              onClick={() => setShowCreateOppModal(true)}
              style={{
                padding: "8px 16px",
                background: "linear-gradient(135deg, #0284c7, #0369a1)",
                color: "#fff",
                border: "none",
                borderRadius: "8px",
                fontSize: "13px",
                fontWeight: 600,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "6px",
                boxShadow: "0 2px 8px rgba(2, 132, 199, 0.3)",
              }}
            >
              <span>➕</span>
              <span>Post Opportunity</span>
            </button>

            {/* Institution Badge */}
            <span style={{
              background: "#eff6ff",
              color: "#1d4ed8",
              border: "1px solid #bfdbfe",
              borderRadius: "20px",
              padding: "4px 12px",
              fontSize: "12px",
              fontWeight: 600,
            }}>
              XYZ Group of Institutions
            </span>
          </div>
        </header>
        

        {/* Global Messages */}
        {error && (
          <div style={{
            margin: "16px 24px 0",
            padding: "12px 16px",
            background: "#fef2f2",
            border: "1px solid #fecaca",
            color: "#dc2626",
            borderRadius: "8px",
            fontSize: "14px",
          }}>
            {error}
          </div>
        )}
        {successMsg && (
          <div style={{
            margin: "16px 24px 0",
            padding: "12px 16px",
            background: "#f0fdf4",
            border: "1px solid #bbf7d0",
            color: "#16a34a",
            borderRadius: "8px",
            fontSize: "14px",
          }}>
            {successMsg}
          </div>
        )}

        {/* MAIN BODY VIEW */}
        <main style={{ padding: "24px", flex: 1 }}>
          {/* ========================================================
              TAB 1: OVERVIEW & RECENT ACTIVITY
             ======================================================== */}
          {activeTab === "overview" && (
            <div>
              {/* Welcome Banner */}
              <div style={{
                background: "linear-gradient(135deg, #0f172a 0%, #1e293b 60%, #0369a1 100%)",
                color: "#ffffff",
                borderRadius: "16px",
                padding: "26px",
                marginBottom: "24px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: "20px",
                boxShadow: "0 10px 25px -5px rgba(15, 23, 42, 0.2)",
              }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
                    <h1 style={{ margin: 0, fontSize: "22px", fontWeight: 800 }}>
                      Welcome, {company?.name || "Corporate Recruiter"} 👋
                    </h1>
                    <span style={{
                      background: "rgba(56, 189, 248, 0.2)",
                      color: "#38bdf8",
                      padding: "2px 8px",
                      borderRadius: "6px",
                      fontSize: "11px",
                      fontWeight: 700,
                    }}>
                      Batch 2026 Hiring Drive
                    </span>
                  </div>
                  <p style={{ margin: 0, color: "#94a3b8", fontSize: "14px" }}>
                    XYZ Placement Portal • Industry: <strong>{company?.industry || "Technology"}</strong> • Location: <strong>{company?.location || "Delhi-NCR"}</strong>
                  </p>
                </div>

                <div style={{ display: "flex", gap: "10px" }}>
                  <button
                    onClick={() => setShowCreateOppModal(true)}
                    style={{
                      padding: "9px 18px",
                      background: "#0284c7",
                      color: "#fff",
                      border: "none",
                      borderRadius: "8px",
                      fontSize: "13px",
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    + Create Opportunity
                  </button>
                  <button
                    onClick={() => setActiveTab("applications")}
                    style={{
                      padding: "9px 18px",
                      background: "rgba(255,255,255,0.1)",
                      color: "#fff",
                      border: "1px solid rgba(255,255,255,0.2)",
                      borderRadius: "8px",
                      fontSize: "13px",
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    Review Applicants →
                  </button>
                </div>
              </div>

              {/* KPI Summary Cards */}
              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                gap: "16px",
                marginBottom: "24px",
              }}>
                <div
                  className="xyz-stat-card blue"
                  onClick={() => setActiveTab("opportunities")}
                  style={{ cursor: "pointer" }}
                >
                  <div style={{ fontSize: "12px", color: "#64748b", fontWeight: 600, textTransform: "uppercase" }}>
                    Active Opportunities
                  </div>
                  <div style={{ fontSize: "28px", fontWeight: 800, color: "#0284c7", margin: "6px 0 2px" }}>
                    {activeDrivesCount}
                  </div>
                  <span style={{ fontSize: "12px", color: "#0284c7" }}>
                    Of {drives.length} total posted
                  </span>
                </div>

                <div
                  className="xyz-stat-card green"
                  onClick={() => setActiveTab("applications")}
                  style={{ cursor: "pointer" }}
                >
                  <div style={{ fontSize: "12px", color: "#64748b", fontWeight: 600, textTransform: "uppercase" }}>
                    Total Applications
                  </div>
                  <div style={{ fontSize: "28px", fontWeight: 800, color: "#16a34a", margin: "6px 0 2px" }}>
                    {applications.length}
                  </div>
                  <span style={{ fontSize: "12px", color: "#16a34a" }}>
                    From XYZ Students
                  </span>
                </div>

                <div
                  className="xyz-stat-card amber"
                  onClick={() => {
                    setAppStatusFilter("shortlisted");
                    setActiveTab("applications");
                  }}
                  style={{ cursor: "pointer" }}
                >
                  <div style={{ fontSize: "12px", color: "#64748b", fontWeight: 600, textTransform: "uppercase" }}>
                    Shortlisted Candidates
                  </div>
                  <div style={{ fontSize: "28px", fontWeight: 800, color: "#d97706", margin: "6px 0 2px" }}>
                    {shortlistedCount}
                  </div>
                  <span style={{ fontSize: "12px", color: "#d97706" }}>
                    Ready for Interviews
                  </span>
                </div>

                <div
                  className="xyz-stat-card rose"
                  onClick={() => setActiveTab("interviews")}
                  style={{ cursor: "pointer" }}
                >
                  <div style={{ fontSize: "12px", color: "#64748b", fontWeight: 600, textTransform: "uppercase" }}>
                    Scheduled Interviews
                  </div>
                  <div style={{ fontSize: "28px", fontWeight: 800, color: "#e11d48", margin: "6px 0 2px" }}>
                    {scheduledInterviewsCount}
                  </div>
                  <span style={{ fontSize: "12px", color: "#e11d48" }}>
                    {todaysInterviews.length} Scheduled for Today
                  </span>
                </div>

                <div
                  className="xyz-stat-card emerald"
                  onClick={() => setActiveTab("offers")}
                  style={{ cursor: "pointer" }}
                >
                  <div style={{ fontSize: "12px", color: "#64748b", fontWeight: 600, textTransform: "uppercase" }}>
                    Offers Released
                  </div>
                  <div style={{ fontSize: "28px", fontWeight: 800, color: "#059669", margin: "6px 0 2px" }}>
                    {offersReleasedCount}
                  </div>
                  <span style={{ fontSize: "12px", color: "#059669" }}>
                    {offers.filter((o) => o.status === "accepted").length} Accepted ✓
                  </span>
                </div>
              </div>

              {/* Two Column Section: Today's Schedule & Recent Activity */}
              <div style={{ display: "grid", gridTemplateColumns: "1.1fr 0.9fr", gap: "20px" }}>
                {/* Left: Today's / Upcoming Interviews */}
                <div style={{
                  background: "#ffffff",
                  borderRadius: "14px",
                  border: "1px solid #e2e8f0",
                  padding: "20px",
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                    <div>
                      <h3 style={{ margin: 0, fontSize: "16px", color: "#0f172a" }}>Today's Interview Lineup</h3>
                      <span style={{ fontSize: "12px", color: "#64748b" }}>Live round schedule</span>
                    </div>
                    <button
                      onClick={() => setActiveTab("interviews")}
                      style={{ background: "none", border: "none", color: "#0284c7", fontWeight: 600, fontSize: "13px", cursor: "pointer" }}
                    >
                      View All →
                    </button>
                  </div>

                  {todaysInterviews.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "32px 16px", color: "#64748b", fontSize: "14px" }}>
                      <div style={{ fontSize: "32px", marginBottom: "8px" }}>☕</div>
                      No interviews scheduled for today. Check upcoming interviews or shortlist candidates to schedule!
                    </div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                      {todaysInterviews.map((item) => (
                        <div
                          key={item._id}
                          style={{
                            padding: "12px",
                            borderRadius: "10px",
                            border: "1px solid #e2e8f0",
                            background: "#f8fafc",
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                          }}
                        >
                          <div>
                            <div style={{ fontWeight: 700, fontSize: "13px", color: "#0f172a" }}>
                              {item.student?.user?.name || "Student"} ({item.roundName})
                            </div>
                            <div style={{ fontSize: "12px", color: "#64748b" }}>
                              {new Date(item.scheduledAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} &nbsp;•&nbsp;{" "}
                              {item.mode === "online" ? "🌐 Google Meet" : `📍 Venue: ${item.location || "Room"}`}
                            </div>
                          </div>

                          <div style={{ display: "flex", gap: "8px" }}>
                            {item.meetingLink && (
                              <a
                                href={item.meetingLink}
                                target="_blank"
                                rel="noreferrer"
                                style={{
                                  padding: "5px 10px",
                                  background: "#0284c7",
                                  color: "#fff",
                                  borderRadius: "6px",
                                  fontSize: "12px",
                                  textDecoration: "none",
                                  fontWeight: 600,
                                }}
                              >
                                Join Meet 🔗
                              </a>
                            )}
                            <button
                              onClick={() => {
                                setEvaluatingInterview(item);
                                setEvalForm({ score: "85", result: "passed", feedback: "" });
                              }}
                              style={{
                                padding: "5px 10px",
                                background: "#10b981",
                                color: "#fff",
                                border: "none",
                                borderRadius: "6px",
                                fontSize: "12px",
                                fontWeight: 600,
                                cursor: "pointer",
                              }}
                            >
                              Evaluate
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Right: Recent Applications Activity */}
                <div style={{
                  background: "#ffffff",
                  borderRadius: "14px",
                  border: "1px solid #e2e8f0",
                  padding: "20px",
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                    <div>
                      <h3 style={{ margin: 0, fontSize: "16px", color: "#0f172a" }}>Recent Applications</h3>
                      <span style={{ fontSize: "12px", color: "#64748b" }}>Candidate submissions</span>
                    </div>
                    <button
                      onClick={() => setActiveTab("applications")}
                      style={{ background: "none", border: "none", color: "#0284c7", fontWeight: 600, fontSize: "13px", cursor: "pointer" }}
                    >
                      All Applicants →
                    </button>
                  </div>

                  {applications.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "32px 16px", color: "#64748b", fontSize: "14px" }}>
                      <div style={{ fontSize: "32px", marginBottom: "8px" }}>📬</div>
                      No applications received yet. Once your opportunity is approved by TPO, students will apply here.
                    </div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                      {applications.slice(0, 5).map((app) => (
                        <div
                          key={app._id}
                          style={{
                            padding: "10px 12px",
                            borderRadius: "8px",
                            border: "1px solid #f1f5f9",
                            background: "#f8fafc",
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                          }}
                        >
                          <div>
                            <strong style={{ fontSize: "13px", color: "#0f172a" }}>
                              {app.student?.user?.name || "Student"}
                            </strong>
                            <div style={{ fontSize: "11px", color: "#64748b" }}>
                              Applied for <strong>{app.drive?.jobTitle || "Job"}</strong> &nbsp;•&nbsp; CGPA: {app.student?.cgpa || "N/A"}
                            </div>
                          </div>

                          <span style={{
                            fontSize: "11px",
                            fontWeight: 700,
                            padding: "3px 8px",
                            borderRadius: "6px",
                            textTransform: "capitalize",
                            background:
                              app.status === "shortlisted"
                                ? "#fef3c7"
                                : app.status === "interview"
                                ? "#e0e7ff"
                                : app.status === "selected"
                                ? "#ecfdf5"
                                : app.status === "rejected"
                                ? "#fee2e2"
                                : "#eff6ff",
                            color:
                              app.status === "shortlisted"
                                ? "#b45309"
                                : app.status === "interview"
                                ? "#3730a3"
                                : app.status === "selected"
                                ? "#047857"
                                : app.status === "rejected"
                                ? "#b91c1c"
                                : "#1d4ed8",
                          }}>
                            {app.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ========================================================
              TAB 2: COMPANY PROFILE (STRICT ACCESS GUARD)
             ======================================================== */}
          {activeTab === "company" && (
            <div style={{ maxWidth: "800px" }}>
              <div style={{
                background: "#ffffff",
                borderRadius: "14px",
                border: "1px solid #e2e8f0",
                padding: "24px",
                marginBottom: "20px",
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                  <div>
                    <h2 style={{ margin: "0 0 4px", fontSize: "18px", color: "#0f172a" }}>Company Profile & Verification</h2>
                    <span style={{ fontSize: "13px", color: "#64748b" }}>Manage organization branding and details shown to XYZ students</span>
                  </div>
                  <button
                    onClick={() => setEditingCompany(!editingCompany)}
                    style={{
                      padding: "8px 16px",
                      background: editingCompany ? "#f1f5f9" : "#0284c7",
                      color: editingCompany ? "#475569" : "#fff",
                      border: "none",
                      borderRadius: "8px",
                      fontWeight: 600,
                      fontSize: "13px",
                      cursor: "pointer",
                    }}
                  >
                    {editingCompany ? "Cancel" : "✏️ Edit Profile"}
                  </button>
                </div>

                {!editingCompany ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "16px", paddingBottom: "16px", borderBottom: "1px solid #f1f5f9" }}>
                      <div style={{
                        width: "64px",
                        height: "64px",
                        borderRadius: "12px",
                        background: "#0284c7",
                        color: "#fff",
                        fontSize: "24px",
                        fontWeight: 800,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}>
                        {(company?.name || "C")[0].toUpperCase()}
                      </div>
                      <div>
                        <h3 style={{ margin: "0 0 4px", fontSize: "18px", color: "#0f172a" }}>{company?.name}</h3>
                        <a
                          href={company?.website || "#"}
                          target="_blank"
                          rel="noreferrer"
                          style={{ fontSize: "13px", color: "#0284c7", textDecoration: "none" }}
                        >
                          {company?.website || "Website not set"} 🔗
                        </a>
                      </div>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                      <div style={{ padding: "12px", background: "#f8fafc", borderRadius: "8px" }}>
                        <div style={{ fontSize: "11px", color: "#64748b", textTransform: "uppercase", fontWeight: 600 }}>Industry</div>
                        <div style={{ fontSize: "14px", fontWeight: 600, color: "#0f172a", marginTop: "2px" }}>
                          {company?.industry || "Technology"}
                        </div>
                      </div>

                      <div style={{ padding: "12px", background: "#f8fafc", borderRadius: "8px" }}>
                        <div style={{ fontSize: "11px", color: "#64748b", textTransform: "uppercase", fontWeight: 600 }}>HQ Location</div>
                        <div style={{ fontSize: "14px", fontWeight: 600, color: "#0f172a", marginTop: "2px" }}>
                          {company?.location || "Delhi-NCR"}
                        </div>
                      </div>
                    </div>

                    <div style={{ padding: "14px", background: "#f8fafc", borderRadius: "8px" }}>
                      <div style={{ fontSize: "11px", color: "#64748b", textTransform: "uppercase", fontWeight: 600 }}>About Organization</div>
                      <div style={{ fontSize: "13px", color: "#334155", marginTop: "4px", lineHeight: "1.5" }}>
                        {company?.description || "No description provided."}
                      </div>
                    </div>

                    <div style={{
                      padding: "12px 14px",
                      background: "#eff6ff",
                      border: "1px solid #bfdbfe",
                      borderRadius: "8px",
                      fontSize: "12px",
                      color: "#1e3a8a",
                    }}>
                      🔒 <strong>Recruiter Access Guard</strong>: You have authenticated rights strictly over <strong>{company?.name}</strong>. Cross-company access is strictly barred by the XYZ CRPC security layer.
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleUpdateCompany} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                    <div>
                      <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#475569", marginBottom: "4px" }}>
                        Website URL
                      </label>
                      <input
                        type="url"
                        value={companyForm.website}
                        onChange={(e) => setCompanyForm({ ...companyForm, website: e.target.value })}
                        placeholder="https://company.com"
                        style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1" }}
                      />
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                      <div>
                        <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#475569", marginBottom: "4px" }}>
                          Industry
                        </label>
                        <input
                          type="text"
                          value={companyForm.industry}
                          onChange={(e) => setCompanyForm({ ...companyForm, industry: e.target.value })}
                          placeholder="e.g. Software Product, Fintech"
                          style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1" }}
                        />
                      </div>

                      <div>
                        <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#475569", marginBottom: "4px" }}>
                          Location
                        </label>
                        <input
                          type="text"
                          value={companyForm.location}
                          onChange={(e) => setCompanyForm({ ...companyForm, location: e.target.value })}
                          placeholder="e.g. Noida / Bengaluru"
                          style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1" }}
                        />
                      </div>
                    </div>

                    <div>
                      <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#475569", marginBottom: "4px" }}>
                        Company Description
                      </label>
                      <textarea
                        rows={4}
                        value={companyForm.description}
                        onChange={(e) => setCompanyForm({ ...companyForm, description: e.target.value })}
                        placeholder="Brief overview of products, tech stack, and workplace..."
                        style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1" }}
                      />
                    </div>

                    <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", marginTop: "10px" }}>
                      <button
                        type="button"
                        onClick={() => setEditingCompany(false)}
                        style={{ padding: "8px 16px", background: "#e2e8f0", border: "none", borderRadius: "6px", cursor: "pointer" }}
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        style={{ padding: "8px 18px", background: "#0284c7", color: "#fff", border: "none", borderRadius: "6px", fontWeight: 600, cursor: "pointer" }}
                      >
                        Save Company Profile
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          )}

          {/* ========================================================
              TAB 3: OPPORTUNITIES HUB (PLACEMENT DRIVES & INTERNSHIPS)
             ======================================================== */}
          {activeTab === "opportunities" && (
            <div>
              {/* Filter Pills & Create Button Bar */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px", flexWrap: "wrap", gap: "12px" }}>
                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                  <button
                    onClick={() => setOppCategoryFilter("all")}
                    style={{
                      padding: "6px 14px",
                      borderRadius: "20px",
                      border: "1px solid",
                      borderColor: oppCategoryFilter === "all" ? "#0284c7" : "#cbd5e1",
                      background: oppCategoryFilter === "all" ? "#0284c7" : "#fff",
                      color: oppCategoryFilter === "all" ? "#fff" : "#475569",
                      fontWeight: 600,
                      fontSize: "12px",
                      cursor: "pointer",
                    }}
                  >
                    All Opportunities ({drives.length})
                  </button>

                  <button
                    onClick={() => setOppCategoryFilter("placement_drive")}
                    style={{
                      padding: "6px 14px",
                      borderRadius: "20px",
                      border: "1px solid",
                      borderColor: oppCategoryFilter === "placement_drive" ? "#0284c7" : "#cbd5e1",
                      background: oppCategoryFilter === "placement_drive" ? "#0284c7" : "#fff",
                      color: oppCategoryFilter === "placement_drive" ? "#fff" : "#475569",
                      fontWeight: 600,
                      fontSize: "12px",
                      cursor: "pointer",
                    }}
                  >
                    💼 Placement Drives ({drives.filter((d) => (d.opportunityType || "placement_drive") === "placement_drive").length})
                  </button>

                  <button
                    onClick={() => setOppCategoryFilter("internship")}
                    style={{
                      padding: "6px 14px",
                      borderRadius: "20px",
                      border: "1px solid",
                      borderColor: oppCategoryFilter === "internship" ? "#0284c7" : "#cbd5e1",
                      background: oppCategoryFilter === "internship" ? "#0284c7" : "#fff",
                      color: oppCategoryFilter === "internship" ? "#fff" : "#475569",
                      fontWeight: 600,
                      fontSize: "12px",
                      cursor: "pointer",
                    }}
                  >
                    🎓 Internships ({drives.filter((d) => d.opportunityType === "internship").length})
                  </button>

                </div>

                <button
                  onClick={() => setShowCreateOppModal(true)}
                  style={{
                    padding: "8px 16px",
                    background: "#0284c7",
                    color: "#fff",
                    border: "none",
                    borderRadius: "8px",
                    fontWeight: 600,
                    fontSize: "13px",
                    cursor: "pointer",
                  }}
                >
                  ➕ New Opportunity
                </button>
              </div>

              {/* Opportunities Grid */}
              {filteredOpportunities.length === 0 ? (
                <div style={{
                  background: "#fff",
                  borderRadius: "14px",
                  border: "1px solid #e2e8f0",
                  padding: "48px 24px",
                  textAlign: "center",
                  color: "#64748b",
                }}>
                  <div style={{ fontSize: "40px", marginBottom: "12px" }}>📢</div>
                  <h3 style={{ margin: "0 0 6px", color: "#0f172a" }}>No Opportunities in this Category</h3>
                  <p style={{ margin: "0 0 16px", fontSize: "14px" }}>Click the button below to publish a full-time placement drive or internship opportunity.</p>
                  <button
                    onClick={() => setShowCreateOppModal(true)}
                    style={{
                      padding: "8px 16px",
                      background: "#0284c7",
                      color: "#fff",
                      border: "none",
                      borderRadius: "8px",
                      fontWeight: 600,
                      fontSize: "13px",
                      cursor: "pointer",
                    }}
                  >
                    + Create First Opportunity
                  </button>
                </div>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: "18px" }}>
                  {filteredOpportunities.map((drive) => {
                    const oppType = drive.opportunityType || "placement_drive";
                    return (
                      <div
                        key={drive._id}
                        style={{
                          background: "#ffffff",
                          borderRadius: "14px",
                          border: "1px solid #e2e8f0",
                          padding: "20px",
                          display: "flex",
                          flexDirection: "column",
                          justifyContent: "space-between",
                          boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
                        }}
                      >
                        <div>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "10px" }}>
                            <div>
                              <span style={{
                                fontSize: "11px",
                                fontWeight: 700,
                                padding: "2px 8px",
                                borderRadius: "4px",
                                background:
                                  oppType === "placement_drive"
                                    ? "#dbeafe"
                                    : oppType === "internship"
                                    ? "#fef3c7"
                                    : oppType === "hackathon"
                                    ? "#f3e8ff"
                                    : "#e0e7ff",
                                color:
                                  oppType === "placement_drive"
                                    ? "#1d4ed8"
                                    : oppType === "internship"
                                    ? "#b45309"
                                    : oppType === "hackathon"
                                    ? "#7e22ce"
                                    : "#3730a3",
                                textTransform: "capitalize",
                              }}>
                                {oppType.replace("_", " ")}
                              </span>
                              {drive.isOpenToAll && (
                                <span style={{
                                  fontSize: "11px",
                                  fontWeight: 700,
                                  padding: "2px 8px",
                                  borderRadius: "4px",
                                  background: "#dcfce7",
                                  color: "#15803d",
                                  border: "1px solid #86efac",
                                  marginLeft: "6px",
                                }}>
                                  ✨ Open for All
                                </span>
                              )}
                              <h3 style={{ margin: "6px 0 2px", fontSize: "16px", color: "#0f172a" }}>
                                {drive.jobTitle}
                              </h3>
                              <span style={{ fontSize: "12px", color: "#64748b" }}>
                                📍 {drive.location} &nbsp;•&nbsp; {drive.workMode}
                              </span>
                            </div>

                            <span style={{
                              fontSize: "11px",
                              fontWeight: 700,
                              padding: "2px 8px",
                              borderRadius: "12px",
                              background: drive.status === "open" ? "#ecfdf5" : drive.status === "pending_approval" ? "#fef3c7" : "#fee2e2",
                              color: drive.status === "open" ? "#047857" : drive.status === "pending_approval" ? "#b45309" : "#b91c1c",
                            }}>
                              {drive.status === "pending_approval" ? "Pending TPO" : drive.status}
                            </span>
                          </div>

                          {/* Specific Highlights */}
                          <div style={{ margin: "14px 0", padding: "10px 12px", background: "#f8fafc", borderRadius: "8px" }}>
                            {oppType === "placement_drive" && (
                              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "13px" }}>
                                <span style={{ color: "#64748b" }}>Package (CTC):</span>
                                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                  <strong style={{ color: "#16a34a" }}>₹{drive.package} LPA</strong>
                                  {(drive.category || (drive.package >= 10 ? "Super Dream" : drive.package >= 6 ? "Dream" : "Regular")) && (
                                    <span style={{
                                      fontSize: "10px",
                                      fontWeight: 700,
                                      padding: "2px 6px",
                                      borderRadius: "4px",
                                      background: (drive.category === "Super Dream" || (!drive.category && drive.package >= 10))
                                        ? "#ede9fe"
                                        : (drive.category === "Dream" || (!drive.category && drive.package >= 6))
                                        ? "#fef3c7"
                                        : "#f1f5f9",
                                      color: (drive.category === "Super Dream" || (!drive.category && drive.package >= 10))
                                        ? "#7c3aed"
                                        : (drive.category === "Dream" || (!drive.category && drive.package >= 6))
                                        ? "#b45309"
                                        : "#475569",
                                      border: "1px solid",
                                      borderColor: (drive.category === "Super Dream" || (!drive.category && drive.package >= 10))
                                        ? "#ddd6fe"
                                        : (drive.category === "Dream" || (!drive.category && drive.package >= 6))
                                        ? "#fde68a"
                                        : "#cbd5e1",
                                    }}>
                                      {(drive.category === "Super Dream" || (!drive.category && drive.package >= 10))
                                        ? "🔥 Super Dream"
                                        : (drive.category === "Dream" || (!drive.category && drive.package >= 6))
                                        ? "⭐ Dream"
                                        : "Regular"}
                                    </span>
                                  )}
                                </div>
                              </div>
                            )}

                            {oppType === "internship" && (
                              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px" }}>
                                <span style={{ color: "#64748b" }}>Stipend / Duration:</span>
                                <strong style={{ color: "#b45309" }}>{drive.stipend || "₹25k/mo"} ({drive.duration || "6M"})</strong>
                              </div>
                            )}

                            {oppType === "hackathon" && (
                              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px" }}>
                                <span style={{ color: "#64748b" }}>Prize Pool / Team:</span>
                                <strong style={{ color: "#7e22ce" }}>{drive.prizePool || "₹1L"} ({drive.teamSize || "2-4"})</strong>
                              </div>
                            )}

                            {oppType === "event" && (
                              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px" }}>
                                <span style={{ color: "#64748b" }}>Event Format:</span>
                                <strong style={{ color: "#3730a3" }}>{drive.eventType || "Webinar"}</strong>
                              </div>
                            )}
                          </div>

                          {/* Criteria Summary */}
                          <div style={{ fontSize: "12px", color: "#64748b", marginBottom: "14px", lineHeight: "1.5" }}>
                            {drive.isOpenToAll ? (
                              <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: "#f0fdf4", color: "#166534", border: "1px solid #bbf7d0", padding: "3px 8px", borderRadius: "6px", fontWeight: 700, marginBottom: "6px" }}>
                                ✨ Open for All Students (No Cutoffs)
                              </div>
                            ) : (
                              <>
                                <div>Min CGPA: <strong>{drive.minimumCgpa}</strong> &nbsp;•&nbsp; Max Backlogs: <strong>{drive.maximumBacklogs}</strong></div>
                                <div>Courses: <strong>{(drive.allowedCourses || []).join(", ") || "All"}</strong></div>
                              </>
                            )}
                            <div>Deadline: <strong>{new Date(drive.applicationDeadline).toLocaleDateString()}</strong></div>
                          </div>
                        </div>

                        {/* Actions */}
                        <div style={{ display: "flex", gap: "8px", borderTop: "1px solid #f1f5f9", paddingTop: "12px" }}>
                          <button
                            onClick={() => {
                              setSelectedOppFilter(drive._id);
                              setActiveTab("applications");
                            }}
                            style={{
                              flex: 1,
                              padding: "7px",
                              background: "#0284c7",
                              color: "#fff",
                              border: "none",
                              borderRadius: "6px",
                              fontSize: "12px",
                              fontWeight: 600,
                              cursor: "pointer",
                            }}
                          >
                            View Applicants ({drive.applicationCount || 0})
                          </button>

                          <button
                            onClick={() => handleToggleDriveStatus(drive._id, drive.status)}
                            style={{
                              padding: "7px 12px",
                              background: "#f1f5f9",
                              border: "1px solid #cbd5e1",
                              borderRadius: "6px",
                              fontSize: "12px",
                              fontWeight: 600,
                              color: drive.status === "open" ? "#dc2626" : "#16a34a",
                              cursor: "pointer",
                            }}
                          >
                            {drive.status === "open" ? "Close" : "Open"}
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
              TAB 4: APPLICATIONS & CANDIDATES (MULTI-FILTER & BULK ACTIONS)
             ======================================================== */}
          {activeTab === "applications" && (
            <div>
              {/* Multi-Filter Bar */}
              <div style={{
                background: "#ffffff",
                borderRadius: "14px",
                border: "1px solid #e2e8f0",
                padding: "16px 20px",
                marginBottom: "20px",
                display: "flex",
                flexWrap: "wrap",
                gap: "12px",
                alignItems: "center",
              }}>
                {/* Search query input */}
                <div style={{ flex: "1 1 200px" }}>
                  <input
                    type="text"
                    placeholder="🔍 Search name, roll, skill..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px" }}
                  />
                </div>

                {/* Drive Selector */}
                <select
                  value={selectedOppFilter}
                  onChange={(e) => setSelectedOppFilter(e.target.value)}
                  style={{ padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px" }}
                >
                  <option value="all">All Opportunities ({drives.length})</option>
                  {drives.map((d) => (
                    <option key={d._id} value={d._id}>{d.jobTitle}</option>
                  ))}
                </select>

                {/* Status Filter */}
                <select
                  value={appStatusFilter}
                  onChange={(e) => setAppStatusFilter(e.target.value)}
                  style={{ padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px" }}
                >
                  <option value="all">All Statuses</option>
                  <option value="applied">Applied</option>
                  <option value="under_review">Under Review</option>
                  <option value="shortlisted">Shortlisted</option>
                  <option value="interview">Interview</option>
                  <option value="selected">Selected</option>
                  <option value="rejected">Rejected</option>
                </select>

                {/* Branch Filter */}
                <select
                  value={branchFilter}
                  onChange={(e) => setBranchFilter(e.target.value)}
                  style={{ padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px" }}
                >
                  <option value="all">All Branches</option>
                  <option value="CSE">Computer Science (CSE)</option>
                  <option value="IT">Information Tech (IT)</option>
                  <option value="ECE">Electronics (ECE)</option>
                  <option value="MCA">MCA</option>
                </select>

                {/* CGPA Filter */}
                <select
                  value={cgpaFilter}
                  onChange={(e) => setCgpaFilter(e.target.value)}
                  style={{ padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px" }}
                >
                  <option value="all">All CGPA</option>
                  <option value="8.5">≥ 8.5 CGPA</option>
                  <option value="8.0">≥ 8.0 CGPA</option>
                  <option value="7.0">≥ 7.0 CGPA</option>
                  <option value="6.0">≥ 6.0 CGPA</option>
                </select>

                {/* Clear filters */}
                {(selectedOppFilter !== "all" || appStatusFilter !== "all" || branchFilter !== "all" || cgpaFilter !== "all" || searchQuery) && (
                  <button
                    onClick={() => {
                      setSelectedOppFilter("all");
                      setAppStatusFilter("all");
                      setBranchFilter("all");
                      setCgpaFilter("all");
                      setSearchQuery("");
                    }}
                    style={{ background: "none", border: "none", color: "#dc2626", fontSize: "12px", fontWeight: 600, cursor: "pointer" }}
                  >
                    Reset Filters ✕
                  </button>
                )}
              </div>

              {/* Bulk Action Sticky Bar (Appears when >= 1 candidate checked) */}
              {selectedAppIds.length > 0 && (
                <div style={{
                  background: "#0f172a",
                  color: "#fff",
                  borderRadius: "10px",
                  padding: "12px 20px",
                  marginBottom: "16px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  boxShadow: "0 4px 15px rgba(15, 23, 42, 0.25)",
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <span style={{
                      background: "#0284c7",
                      color: "#fff",
                      padding: "2px 10px",
                      borderRadius: "12px",
                      fontWeight: 700,
                      fontSize: "12px",
                    }}>
                      {selectedAppIds.length} Candidate(s) Selected
                    </span>
                    <span style={{ fontSize: "13px", color: "#cbd5e1" }}>
                      Perform bulk pipeline action:
                    </span>
                  </div>

                  <div style={{ display: "flex", gap: "10px" }}>
                    <button
                      disabled={bulkLoading}
                      onClick={() => handleBulkStatusChange("shortlisted")}
                      style={{
                        padding: "6px 14px",
                        background: "#10b981",
                        color: "#fff",
                        border: "none",
                        borderRadius: "6px",
                        fontWeight: 700,
                        fontSize: "12px",
                        cursor: "pointer",
                      }}
                    >
                      ✓ Bulk Shortlist
                    </button>

                    <button
                      disabled={bulkLoading}
                      onClick={() => handleBulkStatusChange("rejected")}
                      style={{
                        padding: "6px 14px",
                        background: "#ef4444",
                        color: "#fff",
                        border: "none",
                        borderRadius: "6px",
                        fontWeight: 700,
                        fontSize: "12px",
                        cursor: "pointer",
                      }}
                    >
                      ✕ Bulk Reject
                    </button>

                    <button
                      onClick={() => setSelectedAppIds([])}
                      style={{
                        padding: "6px 10px",
                        background: "transparent",
                        color: "#94a3b8",
                        border: "1px solid #334155",
                        borderRadius: "6px",
                        fontSize: "12px",
                        cursor: "pointer",
                      }}
                    >
                      Deselect
                    </button>
                  </div>
                </div>
              )}

              {/* Candidates Table */}
              <div style={{
                background: "#ffffff",
                borderRadius: "14px",
                border: "1px solid #e2e8f0",
                overflow: "hidden",
                boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
              }}>
                <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "13px" }}>
                  <thead>
                    <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0", color: "#64748b" }}>
                      <th style={{ padding: "12px 16px", width: "40px" }}>
                        <input
                          type="checkbox"
                          checked={filteredApplications.length > 0 && selectedAppIds.length === filteredApplications.length}
                          onChange={toggleSelectAll}
                        />
                      </th>
                      <th style={{ padding: "12px 16px" }}>Candidate & Roll No</th>
                      <th style={{ padding: "12px 16px" }}>Academic Profile</th>
                      <th style={{ padding: "12px 16px" }}>Applied Opportunity</th>
                      <th style={{ padding: "12px 16px" }}>Resume</th>
                      <th style={{ padding: "12px 16px" }}>Status</th>
                      <th style={{ padding: "12px 16px", textAlign: "right" }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredApplications.length === 0 ? (
                      <tr>
                        <td colSpan={7} style={{ padding: "40px", textAlign: "center", color: "#64748b" }}>
                          No candidates match the selected filters.
                        </td>
                      </tr>
                    ) : (
                      filteredApplications.map((app) => {
                        const isChecked = selectedAppIds.includes(app._id);
                        return (
                          <tr
                            key={app._id}
                            style={{
                              borderBottom: "1px solid #f1f5f9",
                              background: isChecked ? "#f0f9ff" : "transparent",
                            }}
                          >
                            <td style={{ padding: "12px 16px" }}>
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => toggleSelectOne(app._id)}
                              />
                            </td>

                            <td style={{ padding: "12px 16px" }}>
                              <div
                                onClick={() => setViewingCandidateApp(app)}
                                style={{ fontWeight: 700, color: "#0284c7", cursor: "pointer" }}
                                title="Click to view full student profile"
                              >
                                {app.student?.user?.name || "Student"} 🔍
                              </div>
                              <div style={{ fontSize: "11px", color: "#64748b" }}>
                                Roll: <strong>{app.student?.rollNumber || "N/A"}</strong>
                              </div>
                              <div style={{ fontSize: "11px", color: "#94a3b8" }}>
                                {app.student?.user?.email}
                              </div>
                            </td>

                            <td style={{ padding: "12px 16px" }}>
                              <div>{app.student?.course} - {app.student?.branch}</div>
                              <div style={{ fontSize: "12px" }}>
                                CGPA: <strong style={{ color: "#0f172a" }}>{app.student?.cgpa ?? "N/A"}</strong>
                                &nbsp;•&nbsp;
                                Backlogs:{" "}
                                <strong style={{ color: (app.student?.backlogs || 0) === 0 ? "#16a34a" : "#dc2626" }}>
                                  {app.student?.backlogs ?? 0}
                                </strong>
                              </div>
                            </td>

                            <td style={{ padding: "12px 16px" }}>
                              <div style={{ fontWeight: 600, color: "#0f172a" }}>{app.drive?.jobTitle || "Job"}</div>
                              <div style={{ fontSize: "11px", color: "#64748b" }}>
                                Applied on {new Date(app.createdAt).toLocaleDateString()}
                              </div>
                            </td>

                            <td style={{ padding: "12px 16px" }}>
                              {(() => {
                                const resumeUrl =
                                  app.resume?.url ||
                                  app.student?.resumes?.find((r) => r.isPrimary)?.url ||
                                  app.student?.resumes?.[0]?.url;
                                const resumeName =
                                  app.resume?.name ||
                                  app.student?.resumes?.find((r) => r.isPrimary)?.name ||
                                  app.student?.resumes?.[0]?.name ||
                                  "Resume PDF";

                                return resumeUrl ? (
                                  <a
                                    href={resumeUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    style={{
                                      display: "inline-flex",
                                      alignItems: "center",
                                      gap: "4px",
                                      padding: "5px 10px",
                                      background: "#eff6ff",
                                      color: "#1d4ed8",
                                      border: "1px solid #bfdbfe",
                                      borderRadius: "6px",
                                      fontSize: "11px",
                                      textDecoration: "none",
                                      fontWeight: 600,
                                      boxShadow: "0 1px 2px rgba(0,0,0,0.03)",
                                    }}
                                    title={`Click to view/download ${resumeName}`}
                                  >
                                    📄 View Resume
                                  </a>
                                ) : (
                                  <span style={{ fontSize: "11px", color: "#94a3b8" }}>No Resume</span>
                                );
                              })()}
                            </td>

                            <td style={{ padding: "12px 16px" }}>
                              <select
                                value={app.status}
                                onChange={(e) => handleStatusChange(app._id, e.target.value)}
                                style={{
                                  padding: "4px 8px",
                                  borderRadius: "6px",
                                  border: "1px solid #cbd5e1",
                                  fontSize: "12px",
                                  fontWeight: 600,
                                  background:
                                    app.status === "shortlisted"
                                      ? "#fef3c7"
                                      : app.status === "interview"
                                      ? "#e0e7ff"
                                      : app.status === "selected"
                                      ? "#ecfdf5"
                                      : app.status === "rejected"
                                      ? "#fee2e2"
                                      : "#f8fafc",
                                  color:
                                    app.status === "shortlisted"
                                      ? "#b45309"
                                      : app.status === "interview"
                                      ? "#3730a3"
                                      : app.status === "selected"
                                      ? "#047857"
                                      : app.status === "rejected"
                                      ? "#b91c1c"
                                      : "#0f172a",
                                }}
                              >
                                <option value="applied">Applied</option>
                                <option value="under_review">Under Review</option>
                                <option value="shortlisted">Shortlisted</option>
                                <option value="interview">Interview</option>
                                <option value="selected">Selected</option>
                                <option value="rejected">Rejected</option>
                              </select>
                            </td>

                            <td style={{ padding: "12px 16px", textAlign: "right" }}>
                              <div style={{ display: "flex", gap: "6px", justifyContent: "flex-end" }}>
                                {app.status === "shortlisted" && (
                                  <button
                                    onClick={() => {
                                      setSchedulingApp(app);
                                      setInterviewScheduleForm({
                                        roundName: "Technical Interview - Round 1",
                                        interviewer: "",
                                        scheduledAt: "",
                                        mode: "online",
                                        meetingLink: "",
                                        location: "XYZ CRPC Interview Cabin",
                                      });
                                    }}
                                    style={{
                                      padding: "5px 10px",
                                      background: "#e11d48",
                                      color: "#fff",
                                      border: "none",
                                      borderRadius: "6px",
                                      fontSize: "11px",
                                      fontWeight: 600,
                                      cursor: "pointer",
                                    }}
                                  >
                                    🎙️ Schedule
                                  </button>
                                )}

                                {app.status === "selected" && (
                                  <button
                                    onClick={() => {
                                      setOfferingApp(app);
                                      setOfferCreateForm({
                                        joiningDate: "",
                                        baseSalary: app.drive?.baseSalary || "",
                                        variableSalary: app.drive?.variableSalary || "",
                                        offerLetterUrl: "",
                                        autoGeneratePdf: true,
                                      });
                                    }}
                                    style={{
                                      padding: "5px 10px",
                                      background: "#16a34a",
                                      color: "#fff",
                                      border: "none",
                                      borderRadius: "6px",
                                      fontSize: "11px",
                                      fontWeight: 600,
                                      cursor: "pointer",
                                    }}
                                  >
                                    🎁 Issue Offer
                                  </button>
                                )}

                                <button
                                  onClick={() => setViewingCandidateApp(app)}
                                  style={{
                                    padding: "5px 8px",
                                    background: "#f1f5f9",
                                    border: "1px solid #cbd5e1",
                                    borderRadius: "6px",
                                    fontSize: "11px",
                                    color: "#475569",
                                    cursor: "pointer",
                                  }}
                                  title="Candidate Info"
                                >
                                  👤
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ========================================================
              TAB 5: INTERVIEW MANAGEMENT (SCHEDULE & EVALUATION)
             ======================================================== */}
          {activeTab === "interviews" && (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                <div>
                  <h2 style={{ margin: "0 0 4px", fontSize: "18px", color: "#0f172a" }}>Interview Schedules & Evaluations</h2>
                  <span style={{ fontSize: "13px", color: "#64748b" }}>Track technical, coding, and HR rounds assigned by your recruiting team</span>
                </div>
              </div>

              {interviews.length === 0 ? (
                <div style={{
                  background: "#fff",
                  borderRadius: "14px",
                  border: "1px solid #e2e8f0",
                  padding: "48px 24px",
                  textAlign: "center",
                  color: "#64748b",
                }}>
                  <div style={{ fontSize: "40px", marginBottom: "12px" }}>🎙️</div>
                  <h3 style={{ margin: "0 0 6px", color: "#0f172a" }}>No Interviews Scheduled Yet</h3>
                  <p style={{ margin: 0, fontSize: "14px" }}>
                    Go to the <strong>Applications</strong> tab, shortlist candidates, and click "Schedule" to create interview slots.
                  </p>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                  {interviews.map((item) => (
                    <div
                      key={item._id}
                      style={{
                        background: "#ffffff",
                        borderRadius: "12px",
                        border: "1px solid #e2e8f0",
                        padding: "18px 20px",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        flexWrap: "wrap",
                        gap: "14px",
                      }}
                    >
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "4px" }}>
                          <h3 style={{ margin: 0, fontSize: "16px", color: "#0f172a" }}>
                            {item.student?.user?.name || "Student"} &nbsp;•&nbsp; {item.roundName}
                          </h3>
                          <span style={{
                            fontSize: "11px",
                            fontWeight: 700,
                            padding: "2px 8px",
                            borderRadius: "6px",
                            background: item.status === "completed" ? "#ecfdf5" : "#fee2e2",
                            color: item.status === "completed" ? "#047857" : "#b91c1c",
                          }}>
                            {item.status}
                          </span>
                          {item.result && item.result !== "pending" && (
                            <span style={{
                              fontSize: "11px",
                              fontWeight: 700,
                              padding: "2px 8px",
                              borderRadius: "6px",
                              background: item.result === "passed" ? "#ecfdf5" : "#fee2e2",
                              color: item.result === "passed" ? "#047857" : "#b91c1c",
                              textTransform: "capitalize",
                            }}>
                              Result: {item.result} ({item.score}/100)
                            </span>
                          )}
                        </div>

                        <div style={{ fontSize: "12px", color: "#64748b", marginBottom: "4px" }}>
                          Roll: <strong>{item.student?.rollNumber}</strong> ({item.student?.course} - {item.student?.branch}) &nbsp;•&nbsp; Drive: <strong>{item.drive?.jobTitle}</strong>
                        </div>

                        <div style={{ fontSize: "12px", color: "#475569" }}>
                          🕒 Scheduled for: <strong>{new Date(item.scheduledAt).toLocaleString()}</strong> &nbsp;•&nbsp;{" "}
                          {item.mode === "online" ? (
                            <span>Mode: <strong>Online</strong> (Meeting Link: <a href={item.meetingLink} target="_blank" rel="noreferrer" style={{ color: "#0284c7" }}>{item.meetingLink || "Link"}</a>)</span>
                          ) : (
                            <span>Mode: <strong>Offline</strong> (📍 {item.location})</span>
                          )}
                          {item.interviewer && <span> &nbsp;•&nbsp; Interviewer: <strong>{item.interviewer}</strong></span>}
                        </div>

                        {item.feedback && (
                          <div style={{ marginTop: "6px", fontSize: "12px", color: "#047857", background: "#f0fdf4", padding: "4px 8px", borderRadius: "6px" }}>
                            Feedback: {item.feedback}
                          </div>
                        )}
                      </div>

                      <div style={{ display: "flex", gap: "10px" }}>
                        {item.meetingLink && item.mode === "online" && (
                          <a
                            href={item.meetingLink}
                            target="_blank"
                            rel="noreferrer"
                            style={{
                              padding: "7px 14px",
                              background: "#0284c7",
                              color: "#fff",
                              borderRadius: "6px",
                              fontSize: "12px",
                              fontWeight: 600,
                              textDecoration: "none",
                            }}
                          >
                            Join Room 🔗
                          </a>
                        )}

                        <button
                          onClick={() => {
                            setEvaluatingInterview(item);
                            setEvalForm({
                              score: item.score ? String(item.score) : "85",
                              result: item.result && item.result !== "pending" ? item.result : "passed",
                              feedback: item.feedback || "",
                            });
                          }}
                          style={{
                            padding: "7px 14px",
                            background: "#10b981",
                            color: "#fff",
                            border: "none",
                            borderRadius: "6px",
                            fontSize: "12px",
                            fontWeight: 600,
                            cursor: "pointer",
                          }}
                        >
                          Record Result / Score
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ========================================================
              TAB 6: OFFERS RELEASED (ACCEPT/DECLINE TRACKER)
             ======================================================== */}
          {activeTab === "offers" && (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                <div>
                  <h2 style={{ margin: "0 0 4px", fontSize: "18px", color: "#0f172a" }}>Offers Released & Student Responses</h2>
                  <span style={{ fontSize: "13px", color: "#64748b" }}>Live status of official job offers issued to selected students</span>
                </div>
              </div>

              {offers.length === 0 ? (
                <div style={{
                  background: "#fff",
                  borderRadius: "14px",
                  border: "1px solid #e2e8f0",
                  padding: "48px 24px",
                  textAlign: "center",
                  color: "#64748b",
                }}>
                  <div style={{ fontSize: "40px", marginBottom: "12px" }}>📜</div>
                  <h3 style={{ margin: "0 0 6px", color: "#0f172a" }}>No Offers Released Yet</h3>
                  <p style={{ margin: 0, fontSize: "14px" }}>
                    Once candidates clear all interview rounds and are marked <strong>Selected</strong>, you can issue official offers from the Applications tab.
                  </p>
                </div>
              ) : (
                <div style={{
                  background: "#ffffff",
                  borderRadius: "14px",
                  border: "1px solid #e2e8f0",
                  overflow: "hidden",
                }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "13px" }}>
                    <thead>
                      <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0", color: "#64748b" }}>
                        <th style={{ padding: "12px 16px" }}>Candidate & Roll</th>
                        <th style={{ padding: "12px 16px" }}>Role</th>
                        <th style={{ padding: "12px 16px" }}>Compensation (CTC)</th>
                        <th style={{ padding: "12px 16px" }}>Joining Date</th>
                        <th style={{ padding: "12px 16px" }}>Offer Letter</th>
                        <th style={{ padding: "12px 16px" }}>Student Response</th>
                      </tr>
                    </thead>
                    <tbody>
                      {offers.map((o) => (
                        <tr key={o._id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                          <td style={{ padding: "12px 16px" }}>
                            <strong style={{ color: "#0f172a" }}>{o.student?.user?.name || "Candidate"}</strong>
                            <div style={{ fontSize: "11px", color: "#64748b" }}>
                              Roll: {o.student?.rollNumber || "N/A"} ({o.student?.branch})
                            </div>
                          </td>

                          <td style={{ padding: "12px 16px" }}>
                            <strong>{o.jobTitle}</strong>
                          </td>

                          <td style={{ padding: "12px 16px" }}>
                            <strong style={{ color: "#16a34a" }}>₹{o.package} LPA</strong>
                            {(o.baseSalary || o.variableSalary) && (
                              <div style={{ fontSize: "11px", color: "#64748b" }}>
                                Base: ₹{o.baseSalary || "N/A"} LPA | Var: ₹{o.variableSalary || "N/A"} LPA
                              </div>
                            )}
                          </td>

                          <td style={{ padding: "12px 16px" }}>
                            {o.joiningDate ? new Date(o.joiningDate).toLocaleDateString() : "TBD"}
                          </td>

                          <td style={{ padding: "12px 16px" }}>
                            {(() => {
                              const pdfLink = o.offerLetterUrl
                                ? (o.offerLetterUrl.startsWith("http") ? o.offerLetterUrl : `http://localhost:5000${o.offerLetterUrl}`)
                                : `http://localhost:5000/api/offers/${o._id}/pdf`;
                              return (
                                <a
                                  href={pdfLink}
                                  target="_blank"
                                  rel="noreferrer"
                                  style={{
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: "4px",
                                    color: "#0284c7",
                                    fontWeight: 600,
                                    fontSize: "12px",
                                    textDecoration: "none",
                                    background: "#f0f9ff",
                                    border: "1px solid #bae6fd",
                                    padding: "4px 10px",
                                    borderRadius: "6px",
                                  }}
                                >
                                  📄 View PDF
                                </a>
                              );
                            })()}
                          </td>

                          <td style={{ padding: "12px 16px" }}>
                            <span style={{
                              padding: "4px 10px",
                              borderRadius: "12px",
                              fontSize: "11px",
                              fontWeight: 700,
                              textTransform: "capitalize",
                              background:
                                o.status === "accepted"
                                  ? "#ecfdf5"
                                  : o.status === "declined"
                                  ? "#fee2e2"
                                  : "#fef3c7",
                              color:
                                o.status === "accepted"
                                  ? "#047857"
                                  : o.status === "declined"
                                  ? "#b91c1c"
                                  : "#b45309",
                            }}>
                              {o.status === "accepted" ? "🎉 Accepted" : o.status === "declined" ? "Declined ✕" : "Pending Response ⏳"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ========================================================
              TAB 7: HIRING FUNNEL & ANALYTICS
             ======================================================== */}
          {activeTab === "analytics" && (
            <div>
              <div style={{ marginBottom: "20px" }}>
                <h2 style={{ margin: "0 0 4px", fontSize: "18px", color: "#0f172a" }}>Recruiter Hiring Funnel & Branch Analytics</h2>
                <span style={{ fontSize: "13px", color: "#64748b" }}>Conversion ratios from application submission to final offer acceptance</span>
              </div>

              {/* Recruitment Funnel Bar */}
              <div style={{
                background: "#ffffff",
                borderRadius: "14px",
                border: "1px solid #e2e8f0",
                padding: "24px",
                marginBottom: "24px",
              }}>
                <h3 style={{ margin: "0 0 16px", fontSize: "15px", color: "#0f172a" }}>Candidate Progression Funnel</h3>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "10px", textAlign: "center" }}>
                  <div style={{ padding: "14px", background: "#eff6ff", borderRadius: "10px", border: "1px solid #bfdbfe" }}>
                    <div style={{ fontSize: "11px", color: "#1d4ed8", fontWeight: 700 }}>1. APPLIED</div>
                    <div style={{ fontSize: "24px", fontWeight: 800, color: "#1e3a8a", margin: "4px 0" }}>{applications.length}</div>
                    <span style={{ fontSize: "11px", color: "#64748b" }}>100% Candidates</span>
                  </div>

                  <div style={{ padding: "14px", background: "#fef3c7", borderRadius: "10px", border: "1px solid #fde68a" }}>
                    <div style={{ fontSize: "11px", color: "#b45309", fontWeight: 700 }}>2. SHORTLISTED</div>
                    <div style={{ fontSize: "24px", fontWeight: 800, color: "#78350f", margin: "4px 0" }}>{shortlistedCount}</div>
                    <span style={{ fontSize: "11px", color: "#64748b" }}>
                      {applications.length ? Math.round((shortlistedCount / applications.length) * 100) : 0}% ratio
                    </span>
                  </div>

                  <div style={{ padding: "14px", background: "#ede9fe", borderRadius: "10px", border: "1px solid #ddd6fe" }}>
                    <div style={{ fontSize: "11px", color: "#6d28d9", fontWeight: 700 }}>3. INTERVIEWED</div>
                    <div style={{ fontSize: "24px", fontWeight: 800, color: "#4c1d95", margin: "4px 0" }}>{interviews.length}</div>
                    <span style={{ fontSize: "11px", color: "#64748b" }}>Technical & HR</span>
                  </div>

                  <div style={{ padding: "14px", background: "#ecfdf5", borderRadius: "10px", border: "1px solid #a7f3d0" }}>
                    <div style={{ fontSize: "11px", color: "#047857", fontWeight: 700 }}>4. SELECTED</div>
                    <div style={{ fontSize: "24px", fontWeight: 800, color: "#064e3b", margin: "4px 0" }}>
                      {applications.filter((a) => a.status === "selected").length}
                    </div>
                    <span style={{ fontSize: "11px", color: "#64748b" }}>Cleared Rounds</span>
                  </div>

                  <div style={{ padding: "14px", background: "#f0fdf4", borderRadius: "10px", border: "1px solid #86efac" }}>
                    <div style={{ fontSize: "11px", color: "#15803d", fontWeight: 700 }}>5. OFFERS ACCEPTED</div>
                    <div style={{ fontSize: "24px", fontWeight: 800, color: "#14532d", margin: "4px 0" }}>
                      {offers.filter((o) => o.status === "accepted").length}
                    </div>
                    <span style={{ fontSize: "11px", color: "#64748b" }}>Joined Org</span>
                  </div>
                </div>
              </div>

              {/* Branch Breakdown */}
              <div style={{
                background: "#ffffff",
                borderRadius: "14px",
                border: "1px solid #e2e8f0",
                padding: "24px",
              }}>
                <h3 style={{ margin: "0 0 16px", fontSize: "15px", color: "#0f172a" }}>Branch Distribution of Applicants</h3>

                {["CSE", "IT", "ECE", "MCA"].map((b) => {
                  const bCount = applications.filter((a) => a.student?.branch === b).length;
                  const pct = applications.length ? Math.round((bCount / applications.length) * 100) : 0;
                  return (
                    <div key={b} style={{ marginBottom: "14px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", marginBottom: "4px" }}>
                        <span style={{ fontWeight: 600 }}>{b} Department</span>
                        <span style={{ color: "#64748b" }}>{bCount} Candidates ({pct}%)</span>
                      </div>
                      <div style={{ width: "100%", height: "8px", background: "#f1f5f9", borderRadius: "4px", overflow: "hidden" }}>
                        <div style={{ width: `${pct}%`, height: "100%", background: "#0284c7", borderRadius: "4px" }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* ========================================================
          MODAL 1: CREATE OPPORTUNITY (DYNAMIC ADAPTABLE FORM)
         ======================================================== */}
      {showCreateOppModal && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(0,0,0,0.5)",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          zIndex: 100,
          padding: "20px",
        }}>
          <div style={{
            background: "#fff",
            borderRadius: "16px",
            width: "100%",
            maxWidth: "680px",
            maxHeight: "90vh",
            overflowY: "auto",
            padding: "24px",
            boxShadow: "0 20px 40px rgba(0,0,0,0.2)",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h3 style={{ margin: 0, fontSize: "18px", color: "#0f172a" }}>Post New Opportunity for Students</h3>
              <button
                onClick={() => setShowCreateOppModal(false)}
                style={{ background: "none", border: "none", fontSize: "18px", cursor: "pointer" }}
              >
                ✕
              </button>
            </div>

            {/* Opportunity Type Selector */}
            <div style={{ display: "flex", gap: "10px", marginBottom: "18px" }}>
              {[
                { type: "placement_drive", label: "💼 Placement Drive (Full-Time Role)" },
                { type: "internship", label: "🎓 Internship Opportunity" },
              ].map((item) => (
                <button
                  key={item.type}
                  type="button"
                  onClick={() => setOppForm({ ...oppForm, opportunityType: item.type })}
                  style={{
                    flex: 1,
                    padding: "8px",
                    borderRadius: "8px",
                    border: "1px solid",
                    borderColor: oppForm.opportunityType === item.type ? "#0284c7" : "#cbd5e1",
                    background: oppForm.opportunityType === item.type ? "#f0f9ff" : "#fff",
                    color: oppForm.opportunityType === item.type ? "#0284c7" : "#475569",
                    fontWeight: 600,
                    fontSize: "12px",
                    cursor: "pointer",
                  }}
                >
                  {item.label}
                </button>
              ))}
            </div>

            <form onSubmit={handleCreateOpportunity} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#475569", marginBottom: "4px" }}>
                  Opportunity Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Software Engineer - Cloud Platform"
                  value={oppForm.jobTitle}
                  onChange={(e) => setOppForm({ ...oppForm, jobTitle: e.target.value })}
                  style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1" }}
                />
              </div>

              {/* Dynamic Type-Specific Fields */}
              {oppForm.opportunityType === "placement_drive" && (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#475569", marginBottom: "4px" }}>
                      CTC Package (LPA) *
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      required
                      value={oppForm.package}
                      onChange={(e) => setOppForm({ ...oppForm, package: e.target.value })}
                      style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1" }}
                    />
                    {oppForm.package && (
                      <div style={{ marginTop: "4px", fontSize: "11px", fontWeight: 600 }}>
                        {Number(oppForm.package) >= 10 ? (
                          <span style={{ color: "#7c3aed" }}>🔥 Super Dream (≥ 10 LPA) — 1-Offer waived</span>
                        ) : Number(oppForm.package) >= 6 ? (
                          <span style={{ color: "#b45309" }}>⭐ Dream (6-10 LPA) — 1-Offer waived</span>
                        ) : (
                          <span style={{ color: "#475569" }}>Regular Drive (&lt; 6 LPA) — 1-Offer strictly applies</span>
                        )}
                      </div>
                    )}
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#475569", marginBottom: "4px" }}>
                      Base Salary (LPA)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={oppForm.baseSalary}
                      onChange={(e) => setOppForm({ ...oppForm, baseSalary: e.target.value })}
                      style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1" }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#475569", marginBottom: "4px" }}>
                      Variable (LPA)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={oppForm.variableSalary}
                      onChange={(e) => setOppForm({ ...oppForm, variableSalary: e.target.value })}
                      style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1" }}
                    />
                  </div>
                </div>
              )}

              {oppForm.opportunityType === "internship" && (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#475569", marginBottom: "4px" }}>
                      Duration
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 6 Months"
                      value={oppForm.duration}
                      onChange={(e) => setOppForm({ ...oppForm, duration: e.target.value })}
                      style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1" }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#475569", marginBottom: "4px" }}>
                      Stipend
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. ₹25,000/month"
                      value={oppForm.stipend}
                      onChange={(e) => setOppForm({ ...oppForm, stipend: e.target.value })}
                      style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1" }}
                    />
                  </div>
                </div>
              )}

              {/* Work Mode, Location & Deadline */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#475569", marginBottom: "4px" }}>
                    Work Mode
                  </label>
                  <select
                    value={oppForm.workMode}
                    onChange={(e) => setOppForm({ ...oppForm, workMode: e.target.value })}
                    style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1" }}
                  >
                    <option value="On-site">On-site</option>
                    <option value="Hybrid">Hybrid</option>
                    <option value="Remote">Remote</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#475569", marginBottom: "4px" }}>
                    Location
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Noida / Delhi-NCR"
                    value={oppForm.location}
                    onChange={(e) => setOppForm({ ...oppForm, location: e.target.value })}
                    style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1" }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#475569", marginBottom: "4px" }}>
                    Application Deadline *
                  </label>
                  <input
                    type="date"
                    required
                    value={oppForm.applicationDeadline}
                    onChange={(e) => setOppForm({ ...oppForm, applicationDeadline: e.target.value })}
                    style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1" }}
                  />
                </div>
              </div>

              {/* Eligibility Criteria Mode: Open for All vs Specific Criteria */}
              <div style={{ background: "#f8fafc", borderRadius: "12px", border: "1px solid #e2e8f0", padding: "14px" }}>
                <span style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#334155", marginBottom: "8px" }}>
                  Eligibility Policy *
                </span>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "12px" }}>
                  <button
                    type="button"
                    onClick={() => setOppForm({ ...oppForm, isOpenToAll: true })}
                    style={{
                      padding: "10px 14px",
                      borderRadius: "8px",
                      border: "1px solid",
                      borderColor: oppForm.isOpenToAll ? "#16a34a" : "#cbd5e1",
                      background: oppForm.isOpenToAll ? "#f0fdf4" : "#ffffff",
                      color: oppForm.isOpenToAll ? "#15803d" : "#475569",
                      fontWeight: 700,
                      fontSize: "13px",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "6px",
                      transition: "all 0.15s ease",
                    }}
                  >
                    <span>✨</span> Open for All (No Eligibility Criteria)
                  </button>

                  <button
                    type="button"
                    onClick={() => setOppForm({ ...oppForm, isOpenToAll: false })}
                    style={{
                      padding: "10px 14px",
                      borderRadius: "8px",
                      border: "1px solid",
                      borderColor: !oppForm.isOpenToAll ? "#0284c7" : "#cbd5e1",
                      background: !oppForm.isOpenToAll ? "#f0f9ff" : "#ffffff",
                      color: !oppForm.isOpenToAll ? "#0284c7" : "#475569",
                      fontWeight: 700,
                      fontSize: "13px",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "6px",
                      transition: "all 0.15s ease",
                    }}
                  >
                    <span>🎯</span> Specific Eligibility Criteria
                  </button>
                </div>

                {oppForm.isOpenToAll ? (
                  <div style={{ padding: "12px 14px", background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "8px", color: "#166534", fontSize: "13px", display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ fontSize: "18px" }}>🌟</span>
                    <span>
                      <strong>Open for All Students:</strong> No cutoffs required! Every registered student across all branches, courses, and CGPAs will be 100% eligible to apply.
                    </span>
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                      <div>
                        <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#475569", marginBottom: "4px" }}>
                          Min CGPA Cutoff
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          placeholder="e.g. 7.0"
                          value={oppForm.minimumCgpa}
                          onChange={(e) => setOppForm({ ...oppForm, minimumCgpa: e.target.value })}
                          style={{ width: "100%", padding: "9px 12px", borderRadius: "8px", border: "1px solid #cbd5e1" }}
                        />
                      </div>

                      <div>
                        <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#475569", marginBottom: "4px" }}>
                          Max Backlogs Allowed
                        </label>
                        <input
                          type="number"
                          placeholder="e.g. 0 or 1"
                          value={oppForm.maximumBacklogs}
                          onChange={(e) => setOppForm({ ...oppForm, maximumBacklogs: e.target.value })}
                          style={{ width: "100%", padding: "9px 12px", borderRadius: "8px", border: "1px solid #cbd5e1" }}
                        />
                      </div>
                    </div>

                    <div>
                      <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#475569", marginBottom: "4px" }}>
                        Eligible Branches (comma separated)
                      </label>
                      <input
                        type="text"
                        value={oppForm.eligibleBranches}
                        onChange={(e) => setOppForm({ ...oppForm, eligibleBranches: e.target.value })}
                        placeholder="CSE, IT, ECE, MCA"
                        style={{ width: "100%", padding: "9px 12px", borderRadius: "8px", border: "1px solid #cbd5e1" }}
                      />
                    </div>

                    <div>
                      <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#475569", marginBottom: "4px" }}>
                        Required Skills (comma separated)
                      </label>
                      <input
                        type="text"
                        value={oppForm.requiredSkills}
                        onChange={(e) => setOppForm({ ...oppForm, requiredSkills: e.target.value })}
                        placeholder="Java, Spring Boot, SQL, React"
                        style={{ width: "100%", padding: "9px 12px", borderRadius: "8px", border: "1px solid #cbd5e1" }}
                      />
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#475569", marginBottom: "4px" }}>
                  Opportunity Description
                </label>
                <textarea
                  rows={3}
                  value={oppForm.description}
                  onChange={(e) => setOppForm({ ...oppForm, description: e.target.value })}
                  placeholder="Roles, responsibilities, growth, perks..."
                  style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1" }}
                />
              </div>

              <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", marginTop: "12px" }}>
                <button
                  type="button"
                  onClick={() => setShowCreateOppModal(false)}
                  style={{ padding: "8px 16px", background: "#e2e8f0", border: "none", borderRadius: "6px", cursor: "pointer" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ padding: "8px 20px", background: "#0284c7", color: "#fff", border: "none", borderRadius: "6px", fontWeight: 600, cursor: "pointer" }}
                >
                  Publish for TPO Review
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL 2: CANDIDATE PROFILE MODAL (READ-ONLY RECORD)
         ======================================================== */}
      {viewingCandidateApp && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(0,0,0,0.5)",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          zIndex: 100,
          padding: "20px",
        }}>
          <div style={{
            background: "#fff",
            borderRadius: "16px",
            width: "100%",
            maxWidth: "600px",
            padding: "24px",
            boxShadow: "0 20px 40px rgba(0,0,0,0.2)",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <div>
                <h3 style={{ margin: "0 0 2px", fontSize: "18px", color: "#0f172a" }}>
                  {viewingCandidateApp.student?.user?.name || "Student Profile"}
                </h3>
                <span style={{ fontSize: "12px", color: "#16a34a", fontWeight: 600 }}>
                  ✓ Verified Academic Record
                </span>
              </div>
              <button
                onClick={() => setViewingCandidateApp(null)}
                style={{ background: "none", border: "none", fontSize: "18px", cursor: "pointer" }}
              >
                ✕
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div style={{ padding: "10px", background: "#f8fafc", borderRadius: "8px" }}>
                  <span style={{ fontSize: "11px", color: "#64748b" }}>Roll Number</span>
                  <div style={{ fontWeight: 700, color: "#0f172a" }}>{viewingCandidateApp.student?.rollNumber || "N/A"}</div>
                </div>
                <div style={{ padding: "10px", background: "#f8fafc", borderRadius: "8px" }}>
                  <span style={{ fontSize: "11px", color: "#64748b" }}>Email Address</span>
                  <div style={{ fontWeight: 700, color: "#0f172a" }}>{viewingCandidateApp.student?.user?.email || "N/A"}</div>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "10px" }}>
                <div style={{ padding: "10px", background: "#eff6ff", borderRadius: "8px", textAlign: "center" }}>
                  <span style={{ fontSize: "11px", color: "#1d4ed8" }}>CGPA</span>
                  <div style={{ fontSize: "18px", fontWeight: 800, color: "#1e3a8a" }}>
                    {viewingCandidateApp.student?.cgpa ?? "N/A"}
                  </div>
                </div>
                <div style={{ padding: "10px", background: "#f8fafc", borderRadius: "8px", textAlign: "center" }}>
                  <span style={{ fontSize: "11px", color: "#64748b" }}>10th %</span>
                  <div style={{ fontSize: "16px", fontWeight: 700, color: "#0f172a" }}>
                    {viewingCandidateApp.student?.tenthPercentage ?? "N/A"}%
                  </div>
                </div>
                <div style={{ padding: "10px", background: "#f8fafc", borderRadius: "8px", textAlign: "center" }}>
                  <span style={{ fontSize: "11px", color: "#64748b" }}>12th %</span>
                  <div style={{ fontSize: "16px", fontWeight: 700, color: "#0f172a" }}>
                    {viewingCandidateApp.student?.twelfthPercentage ?? "N/A"}%
                  </div>
                </div>
                <div style={{ padding: "10px", background: "#f8fafc", borderRadius: "8px", textAlign: "center" }}>
                  <span style={{ fontSize: "11px", color: "#64748b" }}>Backlogs</span>
                  <div style={{ fontSize: "16px", fontWeight: 700, color: (viewingCandidateApp.student?.backlogs || 0) === 0 ? "#16a34a" : "#dc2626" }}>
                    {viewingCandidateApp.student?.backlogs ?? 0}
                  </div>
                </div>
              </div>

              {/* Skills */}
              <div>
                <span style={{ fontSize: "12px", color: "#64748b", fontWeight: 600, display: "block", marginBottom: "6px" }}>
                  Verified Skills:
                </span>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                  {(viewingCandidateApp.student?.skills || []).length > 0 ? (
                    viewingCandidateApp.student.skills.map((s, idx) => (
                      <span key={idx} style={{ padding: "3px 8px", background: "#f1f5f9", borderRadius: "6px", fontSize: "12px", color: "#334155" }}>
                        {s}
                      </span>
                    ))
                  ) : (
                    <span style={{ fontSize: "12px", color: "#94a3b8" }}>No skills listed</span>
                  )}
                </div>
              </div>

              {/* Resume */}
              <div style={{ padding: "16px", background: "#f8fafc", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
                <span style={{ fontSize: "12px", color: "#64748b", fontWeight: 700, display: "block", marginBottom: "8px", textTransform: "uppercase" }}>
                  Candidate Resume & Documents:
                </span>
                {(() => {
                  const appliedResume = viewingCandidateApp.resume?.url ? viewingCandidateApp.resume : null;
                  const profilePrimary =
                    viewingCandidateApp.student?.resumes?.find((r) => r.isPrimary) ||
                    viewingCandidateApp.student?.resumes?.[0];
                  const activeResume = appliedResume || profilePrimary;

                  return activeResume?.url ? (
                    <div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#ffffff", padding: "12px 14px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                        <div>
                          <div style={{ fontSize: "14px", fontWeight: 700, color: "#0f172a" }}>
                            📄 {activeResume.name || "Resume PDF"}
                          </div>
                          <span style={{ fontSize: "11px", color: appliedResume ? "#16a34a" : "#0284c7", fontWeight: 600 }}>
                            {appliedResume ? "✓ Snapshot attached at time of application" : "★ Primary resume from candidate profile"}
                          </span>
                        </div>
                        <a
                          href={activeResume.url}
                          target="_blank"
                          rel="noreferrer"
                          style={{
                            padding: "8px 16px",
                            background: "#0284c7",
                            color: "#fff",
                            borderRadius: "6px",
                            fontSize: "12px",
                            textDecoration: "none",
                            fontWeight: 700,
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "6px",
                          }}
                        >
                          View Resume (PDF) ↗
                        </a>
                      </div>

                      {/* Other uploaded profile resumes if available */}
                      {viewingCandidateApp.student?.resumes && viewingCandidateApp.student.resumes.length > 1 && (
                        <div style={{ marginTop: "12px", paddingTop: "10px", borderTop: "1px dashed #cbd5e1" }}>
                          <span style={{ fontSize: "11px", color: "#64748b", fontWeight: 600, display: "block", marginBottom: "6px" }}>
                            Other Candidate Resumes on Profile:
                          </span>
                          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                            {viewingCandidateApp.student.resumes.map((r) => (
                              <a
                                key={r._id || r.url}
                                href={r.url}
                                target="_blank"
                                rel="noreferrer"
                                style={{
                                  padding: "4px 10px",
                                  background: "#ffffff",
                                  border: "1px solid #cbd5e1",
                                  color: "#0369a1",
                                  borderRadius: "6px",
                                  fontSize: "11px",
                                  textDecoration: "none",
                                  fontWeight: 600,
                                }}
                              >
                                📄 {r.name} {r.isPrimary ? "⭐" : ""} ↗
                              </a>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <span style={{ fontSize: "12px", color: "#94a3b8" }}>No resume attached to this application or student profile</span>
                  );
                })()}
              </div>

              <div style={{
                fontSize: "11px",
                color: "#64748b",
                textAlign: "center",
                borderTop: "1px solid #f1f5f9",
                paddingTop: "12px",
              }}>
                🔒 Recruiter Read-Only Mode. Candidate records cannot be altered.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL 3: SCHEDULE INTERVIEW
         ======================================================== */}
      {schedulingApp && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(0,0,0,0.5)",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          zIndex: 100,
          padding: "20px",
        }}>
          <div style={{
            background: "#fff",
            borderRadius: "16px",
            width: "100%",
            maxWidth: "500px",
            padding: "24px",
            boxShadow: "0 20px 40px rgba(0,0,0,0.2)",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h3 style={{ margin: 0, fontSize: "18px", color: "#0f172a" }}>
                Schedule Interview for {schedulingApp.student?.user?.name}
              </h3>
              <button
                onClick={() => setSchedulingApp(null)}
                style={{ background: "none", border: "none", fontSize: "18px", cursor: "pointer" }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleScheduleInterview} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#475569", marginBottom: "4px" }}>
                  Interview Round Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Technical Round 1 (DSA & System Design)"
                  value={interviewScheduleForm.roundName}
                  onChange={(e) => setInterviewScheduleForm({ ...interviewScheduleForm, roundName: e.target.value })}
                  style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1" }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#475569", marginBottom: "4px" }}>
                  Interviewer Name / Title
                </label>
                <input
                  type="text"
                  placeholder="e.g. Lead Architect / Senior SDE"
                  value={interviewScheduleForm.interviewer}
                  onChange={(e) => setInterviewScheduleForm({ ...interviewScheduleForm, interviewer: e.target.value })}
                  style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1" }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#475569", marginBottom: "4px" }}>
                  Scheduled Date & Time *
                </label>
                <input
                  type="datetime-local"
                  required
                  value={interviewScheduleForm.scheduledAt}
                  onChange={(e) => setInterviewScheduleForm({ ...interviewScheduleForm, scheduledAt: e.target.value })}
                  style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1" }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#475569", marginBottom: "4px" }}>
                  Interview Mode *
                </label>
                <select
                  value={interviewScheduleForm.mode}
                  onChange={(e) => setInterviewScheduleForm({ ...interviewScheduleForm, mode: e.target.value })}
                  style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1" }}
                >
                  <option value="online">Online (Video Call)</option>
                  <option value="offline">In-Person (Campus Venue)</option>
                </select>
              </div>

              {interviewScheduleForm.mode === "online" ? (
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#475569", marginBottom: "4px" }}>
                    Meeting Link (Google Meet / Zoom / Teams) *
                  </label>
                  <input
                    type="url"
                    required
                    placeholder="https://meet.google.com/xyz-abc-def"
                    value={interviewScheduleForm.meetingLink}
                    onChange={(e) => setInterviewScheduleForm({ ...interviewScheduleForm, meetingLink: e.target.value })}
                    style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1" }}
                  />
                </div>
              ) : (
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#475569", marginBottom: "4px" }}>
                    Campus Venue *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Audi-2 Placement Cabin 4"
                    value={interviewScheduleForm.location}
                    onChange={(e) => setInterviewScheduleForm({ ...interviewScheduleForm, location: e.target.value })}
                    style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1" }}
                  />
                </div>
              )}

              <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", marginTop: "10px" }}>
                <button
                  type="button"
                  onClick={() => setSchedulingApp(null)}
                  style={{ padding: "8px 16px", background: "#e2e8f0", border: "none", borderRadius: "6px", cursor: "pointer" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ padding: "8px 18px", background: "#0284c7", color: "#fff", border: "none", borderRadius: "6px", fontWeight: 600, cursor: "pointer" }}
                >
                  Confirm & Schedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL 4: RECORD INTERVIEW EVALUATION & RESULT
         ======================================================== */}
      {evaluatingInterview && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(0,0,0,0.5)",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          zIndex: 100,
          padding: "20px",
        }}>
          <div style={{
            background: "#fff",
            borderRadius: "16px",
            width: "100%",
            maxWidth: "500px",
            padding: "24px",
            boxShadow: "0 20px 40px rgba(0,0,0,0.2)",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h3 style={{ margin: 0, fontSize: "18px", color: "#0f172a" }}>
                Record Evaluation: {evaluatingInterview.roundName}
              </h3>
              <button
                onClick={() => setEvaluatingInterview(null)}
                style={{ background: "none", border: "none", fontSize: "18px", cursor: "pointer" }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleRecordInterviewResult} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#475569", marginBottom: "4px" }}>
                  Evaluation Score (out of 100)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  required
                  value={evalForm.score}
                  onChange={(e) => setEvalForm({ ...evalForm, score: e.target.value })}
                  style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1" }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#475569", marginBottom: "4px" }}>
                  Round Result *
                </label>
                <select
                  value={evalForm.result}
                  onChange={(e) => setEvalForm({ ...evalForm, result: e.target.value })}
                  style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1" }}
                >
                  <option value="passed">Passed ✓ (Advance / Select Candidate)</option>
                  <option value="failed">Failed ✕ (Reject Candidate)</option>
                  <option value="on_hold">On Hold ⏸️ (Requires Internal Discussion)</option>
                </select>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#475569", marginBottom: "4px" }}>
                  Interviewer Feedback Notes
                </label>
                <textarea
                  rows={3}
                  value={evalForm.feedback}
                  onChange={(e) => setEvalForm({ ...evalForm, feedback: e.target.value })}
                  placeholder="Strong problem solving, clear explanation of React lifecycle..."
                  style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1" }}
                />
              </div>

              <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", marginTop: "10px" }}>
                <button
                  type="button"
                  onClick={() => setEvaluatingInterview(null)}
                  style={{ padding: "8px 16px", background: "#e2e8f0", border: "none", borderRadius: "6px", cursor: "pointer" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ padding: "8px 18px", background: "#10b981", color: "#fff", border: "none", borderRadius: "6px", fontWeight: 600, cursor: "pointer" }}
                >
                  Save Evaluation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL 5: RELEASE OFFICIAL JOB OFFER
         ======================================================== */}
      {offeringApp && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(0,0,0,0.5)",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          zIndex: 100,
          padding: "20px",
        }}>
          <div style={{
            background: "#fff",
            borderRadius: "16px",
            width: "100%",
            maxWidth: "560px",
            maxHeight: "90vh",
            overflowY: "auto",
            padding: "24px",
            boxShadow: "0 20px 40px rgba(0,0,0,0.2)",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <div>
                <h3 style={{ margin: 0, fontSize: "18px", color: "#0f172a" }}>
                  Release Official Job Offer
                </h3>
                <div style={{ fontSize: "12px", color: "#64748b", marginTop: "2px" }}>
                  Candidate: <strong>{offeringApp.student?.user?.name || offeringApp.student?.name}</strong> • Roll: <strong>{offeringApp.student?.user?.rollNumber || offeringApp.student?.rollNumber || "N/A"}</strong>
                </div>
              </div>
              <button
                onClick={() => setOfferingApp(null)}
                style={{ background: "none", border: "none", fontSize: "18px", cursor: "pointer", color: "#64748b" }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleReleaseOffer} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              {/* Offer Summary Ribbon */}
              <div style={{ padding: "12px 14px", background: "#f8fafc", borderRadius: "10px", border: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "13px" }}>
                <div>
                  <div style={{ fontSize: "11px", color: "#64748b", textTransform: "uppercase", fontWeight: 700 }}>Designation & Role</div>
                  <strong style={{ color: "#0f172a" }}>{offeringApp.drive?.jobTitle}</strong>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: "11px", color: "#64748b", textTransform: "uppercase", fontWeight: 700 }}>Annual CTC Package</div>
                  <strong style={{ color: "#16a34a", fontSize: "15px" }}>₹{offeringApp.drive?.package} LPA</strong>
                </div>
              </div>

              {/* Offer Letter Mode Selector Toggle */}
              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#334155", marginBottom: "6px" }}>
                  Offer Letter Generation Mode:
                </label>
                <div style={{ display: "flex", gap: "8px" }}>
                  <button
                    type="button"
                    onClick={() => setOfferCreateForm({ ...offerCreateForm, autoGeneratePdf: true })}
                    style={{
                      flex: 1,
                      padding: "8px 12px",
                      borderRadius: "8px",
                      border: "1.5px solid",
                      borderColor: offerCreateForm.autoGeneratePdf ? "#0284c7" : "#cbd5e1",
                      background: offerCreateForm.autoGeneratePdf ? "#eff6ff" : "#ffffff",
                      color: offerCreateForm.autoGeneratePdf ? "#0369a1" : "#475569",
                      fontWeight: 700,
                      fontSize: "12px",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "6px",
                    }}
                  >
                    ⚡ 1-Click Auto-Generate Branded PDF (Recommended)
                  </button>
                  <button
                    type="button"
                    onClick={() => setOfferCreateForm({ ...offerCreateForm, autoGeneratePdf: false })}
                    style={{
                      padding: "8px 14px",
                      borderRadius: "8px",
                      border: "1.5px solid",
                      borderColor: !offerCreateForm.autoGeneratePdf ? "#0284c7" : "#cbd5e1",
                      background: !offerCreateForm.autoGeneratePdf ? "#eff6ff" : "#ffffff",
                      color: !offerCreateForm.autoGeneratePdf ? "#0369a1" : "#475569",
                      fontWeight: 600,
                      fontSize: "12px",
                      cursor: "pointer",
                    }}
                  >
                    📎 Custom PDF URL
                  </button>
                </div>
              </div>

              {/* Live Document Preview Card when Auto-Generate is active */}
              {offerCreateForm.autoGeneratePdf && (
                <div style={{
                  background: "#f0fdf4",
                  border: "1.5px dashed #86efac",
                  borderRadius: "10px",
                  padding: "14px",
                  fontSize: "12px",
                  color: "#166534",
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px", borderBottom: "1px dashed #bbf7d0", paddingBottom: "6px" }}>
                    <span style={{ fontWeight: 800, textTransform: "uppercase", fontSize: "11px", letterSpacing: "0.5px" }}>
                      🏛️ Official Letterhead Preview (Auto-Compiled)
                    </span>
                    <span style={{ background: "#dcfce7", color: "#15803d", padding: "2px 8px", borderRadius: "4px", fontSize: "10px", fontWeight: 700 }}>
                      ✓ Seal & Ref Included
                    </span>
                  </div>

                  <div style={{ lineHeight: "1.7", color: "#14532d" }}>
                    <div><strong>Organization:</strong> XYZ Group of Institutions • CRPC & {company?.name || "Corporate Partner"}</div>
                    <div><strong>Issued To:</strong> {offeringApp.student?.user?.name || "Student"} (Roll: {offeringApp.student?.user?.rollNumber || "N/A"})</div>
                    <div><strong>Compensation:</strong> Total CTC ₹{offeringApp.drive?.package} LPA {offerCreateForm.baseSalary ? `(Base: ₹${offerCreateForm.baseSalary} LPA)` : ""}</div>
                    <div><strong>Expected Joining:</strong> {offerCreateForm.joiningDate ? new Date(offerCreateForm.joiningDate).toLocaleDateString("en-IN", { dateStyle: "long" }) : "Please select date below"}</div>
                  </div>

                  <div style={{ marginTop: "8px", fontSize: "11px", color: "#15803d", fontStyle: "italic" }}>
                    💡 The system will compile this executive-grade PDF letter, attach it directly to the student's email, and provide an instant download link in the dashboard.
                  </div>
                </div>
              )}

              {/* Custom PDF URL Input when mode is manual */}
              {!offerCreateForm.autoGeneratePdf && (
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#475569", marginBottom: "4px" }}>
                    Offer Letter Document URL (Cloudinary / External PDF Link)
                  </label>
                  <input
                    type="url"
                    placeholder="https://cloudinary.com/.../offer_letter.pdf"
                    value={offerCreateForm.offerLetterUrl}
                    onChange={(e) => setOfferCreateForm({ ...offerCreateForm, offerLetterUrl: e.target.value })}
                    style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1" }}
                  />
                </div>
              )}

              {/* Salary Breakdown Fields */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#475569", marginBottom: "4px" }}>
                    Base Salary (LPA)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={offerCreateForm.baseSalary}
                    onChange={(e) => setOfferCreateForm({ ...offerCreateForm, baseSalary: e.target.value })}
                    placeholder="e.g. 7.5"
                    style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1" }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#475569", marginBottom: "4px" }}>
                    Variable Bonus (LPA)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={offerCreateForm.variableSalary}
                    onChange={(e) => setOfferCreateForm({ ...offerCreateForm, variableSalary: e.target.value })}
                    placeholder="e.g. 1.5"
                    style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1" }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#475569", marginBottom: "4px" }}>
                  Expected Joining Date *
                </label>
                <input
                  type="date"
                  required
                  value={offerCreateForm.joiningDate}
                  onChange={(e) => setOfferCreateForm({ ...offerCreateForm, joiningDate: e.target.value })}
                  style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1" }}
                />
              </div>

              <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", marginTop: "10px" }}>
                <button
                  type="button"
                  onClick={() => setOfferingApp(null)}
                  style={{ padding: "9px 18px", background: "#f1f5f9", color: "#475569", border: "1px solid #cbd5e1", borderRadius: "8px", fontWeight: 600, cursor: "pointer" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    padding: "9px 22px",
                    background: offerCreateForm.autoGeneratePdf ? "linear-gradient(135deg, #059669 0%, #047857 100%)" : "#16a34a",
                    color: "#fff",
                    border: "none",
                    borderRadius: "8px",
                    fontWeight: 700,
                    fontSize: "13px",
                    cursor: "pointer",
                    boxShadow: "0 2px 8px rgba(5,150,105,0.3)",
                  }}
                >
                  {offerCreateForm.autoGeneratePdf ? "⚡ Generate & Release Official Offer 📄" : "Release Offer Letter 🎉"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
