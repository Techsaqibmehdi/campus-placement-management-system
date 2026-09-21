import { useState, useEffect } from "react";
import {
  getStudentProfile,
  getPlacementDrives,
  getMyApplications,
  getMyInterviews,
  getMyOffers,
  applyToDrive,
  updateStudentProfile,
  uploadStudentResume,
  deleteStudentResume,
  setPrimaryStudentResume,
  updateOfferStatus,
} from "../api/studentApi";
import { getCompetitions } from "../api/competitionApi";
import { getMyTickets, createTicket } from "../api/ticketApi";
import JobProfilesView from "./JobProfilesView";
import StudentProfileView from "./StudentProfileView";
import CompetitionsView from "./CompetitionsView";
import WorkshopsView from "./WorkshopsView";

export default function StudentDashboard() {
  const [profile, setProfile] = useState(null);
  const [drives, setDrives] = useState([]);
  const [applications, setApplications] = useState([]);
  const [interviews, setInterviews] = useState([]);
  const [offers, setOffers] = useState([]);
  const [competitions, setCompetitions] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Navigation & Interactive UI state
  const [activeNav, setActiveNav] = useState("dashboard"); // "dashboard" | "jobs" | "competitions" | "workshops" | "profile" | "interviews" | "offers" | "helpdesk"
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [applyLoading, setApplyLoading] = useState(false);
  const [applyMessage, setApplyMessage] = useState("");
  const [resumeLoading, setResumeLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState("");
  const [confirmingOffer, setConfirmingOffer] = useState(null); // { offer, action: 'accept' | 'decline' }
  const [respondingOfferLoading, setRespondingOfferLoading] = useState(false);

  // Helpdesk & Support State
  const [showCreateTicketModal, setShowCreateTicketModal] = useState(false);
  const [submittingTicket, setSubmittingTicket] = useState(false);
  const [ticketFeedback, setTicketFeedback] = useState("");
  const [ticketFeedbackType, setTicketFeedbackType] = useState("");
  const [activeFaqIndex, setActiveFaqIndex] = useState(null);
  const [ticketStatusFilter, setTicketStatusFilter] = useState("all");
  const [newTicketForm, setNewTicketForm] = useState({
    subject: "",
    category: "academic_discrepancy",
    priority: "medium",
    description: "",
    driveId: "",
  });

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError("");

      const [
        profileData,
        drivesData,
        applicationsData,
        interviewsData,
        offersData,
        competitionsData,
        ticketsData,
      ] = await Promise.all([
        getStudentProfile().catch((err) => {
          console.warn("Profile fetch error:", err);
          return null;
        }),
        getPlacementDrives().catch((err) => {
          console.warn("Drives fetch error:", err);
          return [];
        }),
        getMyApplications().catch((err) => {
          console.warn("Applications fetch error:", err);
          return [];
        }),
        getMyInterviews().catch((err) => {
          console.warn("Interviews fetch error:", err);
          return [];
        }),
        getMyOffers().catch((err) => {
          console.warn("Offers fetch error:", err);
          return [];
        }),
        getCompetitions().catch((err) => {
          console.warn("Competitions fetch error:", err);
          return [];
        }),
        getMyTickets().catch((err) => {
          console.warn("Tickets fetch error:", err);
          return [];
        }),
      ]);

      setProfile(profileData);
      setDrives(drivesData || []);
      setApplications(applicationsData || []);
      setInterviews(interviewsData || []);
      setOffers(offersData || []);
      setCompetitions(competitionsData || []);
      setTickets(ticketsData || []);
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTicketSubmit = async (e) => {
    e.preventDefault();
    if (!newTicketForm.subject.trim() || !newTicketForm.description.trim()) {
      setTicketFeedback("Please provide a subject and detailed description.");
      setTicketFeedbackType("error");
      return;
    }
    setSubmittingTicket(true);
    setTicketFeedback("");
    try {
      await createTicket({
        subject: newTicketForm.subject.trim(),
        category: newTicketForm.category,
        priority: newTicketForm.priority,
        description: newTicketForm.description.trim(),
        driveId: newTicketForm.driveId || null,
      });
      setTicketFeedback("✓ Support ticket submitted successfully! The TPO placement desk has been notified.");
      setTicketFeedbackType("success");
      setNewTicketForm({
        subject: "",
        category: "academic_discrepancy",
        priority: "medium",
        description: "",
        driveId: "",
      });
      const updatedTickets = await getMyTickets();
      setTickets(updatedTickets || []);
      setTimeout(() => {
        setShowCreateTicketModal(false);
        setTicketFeedback("");
      }, 1600);
    } catch (err) {
      setTicketFeedback(err.response?.data?.message || err.message || "Failed to submit support ticket");
      setTicketFeedbackType("error");
    } finally {
      setSubmittingTicket(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleApply = async (driveId, resumeId) => {
    try {
      setApplyLoading(true);
      setApplyMessage("");
      const res = await applyToDrive(driveId, resumeId);
      setApplyMessage(res.message || "Application submitted successfully!");

      const [updatedApps, updatedDrives] = await Promise.all([
        getMyApplications(),
        getPlacementDrives(),
      ]);
      setApplications(updatedApps || []);
      setDrives(updatedDrives || []);
    } catch (err) {
      const errMsg = err.response?.data?.message || "Failed to submit application";
      const reasons = err.response?.data?.reasons;
      setApplyMessage(reasons?.length ? `${errMsg}: ${reasons.join(". ")}` : errMsg);
    } finally {
      setApplyLoading(false);
    }
  };

  const handleUpdateProfile = async (data) => {
    try {
      const updated = await updateStudentProfile(data);
      setProfile(updated);
      alert("Profile updated successfully!");
    } catch (err) {
      alert(err.response?.data?.message || "Failed to update profile");
    }
  };

  const handleResumeUpload = async (file) => {
    try {
      setResumeLoading(true);
      const res = await uploadStudentResume(file);
      setProfile((prev) => ({
        ...prev,
        resumes: [...(prev?.resumes || []), res.resume],
      }));
      return res;
    } catch (err) {
      const errMsg = err.response?.data?.message || err.message || "Failed to upload resume";
      alert(errMsg);
      throw err;
    } finally {
      setResumeLoading(false);
    }
  };

  const handleDeleteResume = async (resumeId) => {
    if (!window.confirm("Are you sure you want to delete this resume?")) return;
    try {
      const res = await deleteStudentResume(resumeId);
      setProfile((prev) => ({
        ...prev,
        resumes: res.resumes,
      }));
      alert("Resume deleted successfully!");
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete resume");
    }
  };

  const handleSetPrimaryResume = async (resumeId) => {
    try {
      const res = await setPrimaryStudentResume(resumeId);
      setProfile((prev) => ({
        ...prev,
        resumes: res.resumes,
      }));
      alert("Primary resume updated!");
    } catch (err) {
      alert(err.response?.data?.message || "Failed to set primary resume");
    }
  };

  const handleOfferResponse = async (offerId, status) => {
    const action = status === "accepted" ? "accept" : "decline";
    const statusVal = status === "accepted" ? "accepted" : "declined";
    try {
      setRespondingOfferLoading(true);
      setActionMessage("");
      await updateOfferStatus(offerId, statusVal);
      setActionMessage(
        status === "accepted"
          ? "🎉 Congratulations! You have successfully accepted the job offer."
          : "Job offer has been declined."
      );
      setConfirmingOffer(null);
      const [updatedOffers, updatedProfile, updatedDrives] = await Promise.all([
        getMyOffers().catch(() => []),
        getStudentProfile().catch(() => profile),
        getPlacementDrives().catch(() => drives),
      ]);
      setOffers(updatedOffers || []);
      if (updatedProfile) setProfile(updatedProfile);
      if (updatedDrives) setDrives(updatedDrives);
    } catch (err) {
      alert(err.response?.data?.message || `Failed to ${action} offer`);
    } finally {
      setRespondingOfferLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("status");
    localStorage.removeItem("userName");
    window.location.replace("/login");
  };

  const calculateProfileCompletion = () => {
    if (!profile) return 0;
    const checks = [
      !!profile.user?.name,
      !!profile.user?.email,
      !!profile.user?.college,
      !!profile.rollNumber,
      !!profile.course,
      !!profile.branch,
      profile.tenthPercentage !== null && profile.tenthPercentage !== undefined,
      profile.twelfthPercentage !== null && profile.twelfthPercentage !== undefined,
      profile.cgpa !== null && profile.cgpa !== undefined,
      Array.isArray(profile.skills) && profile.skills.length > 0,
      Array.isArray(profile.resumes) && profile.resumes.length > 0,
    ];
    return Math.round((checks.filter(Boolean).length / checks.length) * 100);
  };

  const completionScore = calculateProfileCompletion();
  const eligibleDrivesCount = drives.filter((d) => d.eligibility?.eligible).length;
  const primaryResume = profile?.resumes?.find((r) => r.isPrimary) || profile?.resumes?.[0];
  const hasPlacedOffer = offers.some((o) => o.status === "accepted" || o.status === "active") || drives.some((d) => d.oneOfferPolicy?.hasOffer);
  const activeOffer = offers.find((o) => o.status === "accepted" || o.status === "active");
  const placedPackage = activeOffer?.package || drives.find((d) => d.oneOfferPolicy?.hasOffer)?.oneOfferPolicy?.existingOfferPackage;

  // Mock TPO Bulletin notices
  const tpoBulletins = [
    {
      id: 1,
      tag: "URGENT",
      tagColor: "#ef4444",
      title: "Infosys & Cognizant Pool Campus Registration",
      desc: "Deadline extended until 25th September. Ensure your primary resume is uploaded.",
      time: "2 hours ago",
    },
    {
      id: 2,
      tag: "HACKATHON",
      tagColor: "#f59e0b",
      title: "XYZ CodeSprint 2026 Announced!",
      desc: "Cash prize pool ₹50,000 + PPI Opportunity. Register via TPO Contests tab.",
      time: "1 day ago",
    },
    {
      id: 3,
      tag: "NOTICE",
      tagColor: "#3b82f6",
      title: "Resume & Mock Interview Drive at Audi-2",
      desc: "CRPC is organizing 1-on-1 technical mock interviews this Saturday.",
      time: "2 days ago",
    },
  ];

  if (loading) {
    return (
      <div style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
        background: "#f4f5f7",
        fontFamily: "'Inter', sans-serif",
      }}>
        <div style={{ textAlign: "center" }}>
          <div style={{
            fontSize: "36px",
            marginBottom: "14px",
            animation: "spin 1s infinite linear"
          }}>
            ⚡
          </div>
          <h3 style={{ margin: "0 0 6px", color: "#1e293b", fontSize: "18px", fontWeight: 700 }}>
            XYZ CRPC Placement Portal
          </h3>
          <p style={{ margin: 0, color: "#64748b", fontSize: "14px" }}>
            Synchronizing academic records & campus placement opportunities...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#f8fafc", fontFamily: "'Inter', sans-serif" }}>
      {/* 1. INTERACTIVE LEFT SIDEBAR (COLLAPSIBLE / EXPANDABLE) */}
      <aside
        className={`xyz-sidebar ${sidebarCollapsed ? "collapsed" : ""}`}
        style={{
          width: sidebarCollapsed ? "76px" : "260px",
          background: "#0f172a", // Deep slate
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
                background: "linear-gradient(135deg, #1d4ed8, #0284c7)", // Corporate Blue
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#ffffff",
                fontWeight: 900,
                fontSize: "13px",
                letterSpacing: "0.5px",
                flexShrink: 0,
                boxShadow: "0 2px 8px rgba(2, 132, 199, 0.4)",
              }}>
                XYZ
              </div>
              {!sidebarCollapsed && (
                <div style={{ whiteSpace: "nowrap", overflow: "hidden" }}>
                  <h2 style={{ margin: 0, fontSize: "15px", fontWeight: 700, letterSpacing: "-0.01em", color: "#ffffff" }}>
                    {profile?.user?.name || "Student"}
                  </h2>
                  <span style={{ fontSize: "11px", color: "#94a3b8", display: "block" }}>
                    Student
                  </span>
                </div>
              )}
            </div>

            {/* Toggle Collapse Button */}
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

          {/* Quick expand button when collapsed */}
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
              onClick={() => setActiveNav("dashboard")}
              className={`xyz-nav-btn ${activeNav === "dashboard" ? "active" : ""} ${sidebarCollapsed ? "collapsed" : ""}`}
              data-tooltip="Career Cockpit"
              title={sidebarCollapsed ? "Career Cockpit" : ""}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                width: "100%",
                padding: "10px 14px",
                borderRadius: "8px",
                border: "none",
                background: "transparent",
                color: activeNav === "dashboard" ? "#fff" : "#94a3b8",
                fontSize: "14px",
                fontWeight: activeNav === "dashboard" ? 600 : 500,
                cursor: "pointer",
                textAlign: "left",
              }}
            >
              <span style={{ fontSize: "18px", flexShrink: 0 }}>📊</span>
              {!sidebarCollapsed && <span>Career Cockpit</span>}
            </button>

            <button
              onClick={() => setActiveNav("jobs")}
              className={`xyz-nav-btn ${activeNav === "jobs" ? "active" : ""} ${sidebarCollapsed ? "collapsed" : ""}`}
              data-tooltip={`Campus Drives (${drives.length})`}
              title={sidebarCollapsed ? `Campus Drives (${drives.length})` : ""}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: sidebarCollapsed ? "center" : "space-between",
                width: "100%",
                padding: "10px 14px",
                borderRadius: "8px",
                border: "none",
                background: "transparent",
                color: activeNav === "jobs" ? "#fff" : "#94a3b8",
                fontSize: "14px",
                fontWeight: activeNav === "jobs" ? 600 : 500,
                cursor: "pointer",
                textAlign: "left",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <span style={{ fontSize: "18px", flexShrink: 0 }}>💼</span>
                {!sidebarCollapsed && <span>Campus Drives</span>}
              </div>
              {!sidebarCollapsed && (
                <span style={{
                  background: activeNav === "jobs" ? "#1d4ed8" : "#1e293b",
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
              onClick={() => setActiveNav("competitions")}
              className={`xyz-nav-btn ${activeNav === "competitions" ? "active" : ""} ${sidebarCollapsed ? "collapsed" : ""}`}
              data-tooltip={`TPO Contests & Hackathons (${competitions.length})`}
              title={sidebarCollapsed ? `TPO Contests & Hackathons (${competitions.length})` : ""}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: sidebarCollapsed ? "center" : "space-between",
                width: "100%",
                padding: "10px 14px",
                borderRadius: "8px",
                border: "none",
                background: "transparent",
                color: activeNav === "competitions" ? "#fff" : "#94a3b8",
                fontSize: "14px",
                fontWeight: activeNav === "competitions" ? 600 : 500,
                cursor: "pointer",
                textAlign: "left",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <span style={{ fontSize: "18px", flexShrink: 0 }}>🏆</span>
                {!sidebarCollapsed && <span>Contests</span>}
              </div>
              {!sidebarCollapsed && competitions.length > 0 && (
                <span style={{
                  background: "#f59e0b",
                  color: "#000",
                  fontSize: "11px",
                  fontWeight: 800,
                  padding: "2px 6px",
                  borderRadius: "10px",
                }}>
                  {competitions.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveNav("workshops")}
              className={`xyz-nav-btn ${activeNav === "workshops" ? "active" : ""} ${sidebarCollapsed ? "collapsed" : ""}`}
              data-tooltip="Skill Workshops & Masterclasses"
              title={sidebarCollapsed ? "Skill Workshops & Masterclasses" : ""}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: sidebarCollapsed ? "center" : "space-between",
                width: "100%",
                padding: "10px 14px",
                borderRadius: "8px",
                border: "none",
                background: "transparent",
                color: activeNav === "workshops" ? "#fff" : "#94a3b8",
                fontSize: "14px",
                fontWeight: activeNav === "workshops" ? 600 : 500,
                cursor: "pointer",
                textAlign: "left",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <span style={{ fontSize: "18px", flexShrink: 0 }}>💡</span>
                {!sidebarCollapsed && <span>Skill Workshops</span>}
              </div>
              {!sidebarCollapsed && (
                <span style={{
                  background: "#0284c7",
                  color: "#fff",
                  fontSize: "10px",
                  fontWeight: 700,
                  padding: "2px 6px",
                  borderRadius: "10px",
                }}>
                  NEW
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveNav("profile")}
              className={`xyz-nav-btn ${activeNav === "profile" ? "active" : ""} ${sidebarCollapsed ? "collapsed" : ""}`}
              data-tooltip={`Academic Profile (${completionScore}%)`}
              title={sidebarCollapsed ? `Academic Profile (${completionScore}%)` : ""}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: sidebarCollapsed ? "center" : "space-between",
                width: "100%",
                padding: "10px 14px",
                borderRadius: "8px",
                border: "none",
                background: "transparent",
                color: activeNav === "profile" ? "#fff" : "#94a3b8",
                fontSize: "14px",
                fontWeight: activeNav === "profile" ? 600 : 500,
                cursor: "pointer",
                textAlign: "left",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <span style={{ fontSize: "18px", flexShrink: 0 }}>👤</span>
                {!sidebarCollapsed && <span>Academic Profile</span>}
              </div>
              {!sidebarCollapsed && (
                <span style={{
                  background: completionScore >= 80 ? "#16a34a" : "#d97706",
                  color: "#fff",
                  fontSize: "11px",
                  fontWeight: 700,
                  padding: "2px 6px",
                  borderRadius: "10px",
                }}>
                  {completionScore}%
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveNav("interviews")}
              className={`xyz-nav-btn ${activeNav === "interviews" ? "active" : ""} ${sidebarCollapsed ? "collapsed" : ""}`}
              data-tooltip={`Interview Calls (${interviews.length})`}
              title={sidebarCollapsed ? `Interview Calls (${interviews.length})` : ""}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: sidebarCollapsed ? "center" : "space-between",
                width: "100%",
                padding: "10px 14px",
                borderRadius: "8px",
                border: "none",
                background: "transparent",
                color: activeNav === "interviews" ? "#fff" : "#94a3b8",
                fontSize: "14px",
                fontWeight: activeNav === "interviews" ? 600 : 500,
                cursor: "pointer",
                textAlign: "left",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <span style={{ fontSize: "18px", flexShrink: 0 }}>🎙️</span>
                {!sidebarCollapsed && <span>Interview Calls</span>}
              </div>
              {!sidebarCollapsed && interviews.length > 0 && (
                <span style={{
                  background: "#e11d48",
                  color: "#fff",
                  fontSize: "11px",
                  fontWeight: 700,
                  padding: "2px 7px",
                  borderRadius: "10px",
                }}>
                  {interviews.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveNav("offers")}
              className={`xyz-nav-btn ${activeNav === "offers" ? "active" : ""} ${sidebarCollapsed ? "collapsed" : ""}`}
              data-tooltip={`Placement Offers (${offers.length})`}
              title={sidebarCollapsed ? `Placement Offers (${offers.length})` : ""}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: sidebarCollapsed ? "center" : "space-between",
                width: "100%",
                padding: "10px 14px",
                borderRadius: "8px",
                border: "none",
                background: "transparent",
                color: activeNav === "offers" ? "#fff" : "#94a3b8",
                fontSize: "14px",
                fontWeight: activeNav === "offers" ? 600 : 500,
                cursor: "pointer",
                textAlign: "left",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <span style={{ fontSize: "18px", flexShrink: 0 }}>📜</span>
                {!sidebarCollapsed && <span>Placement Offers</span>}
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
              onClick={() => setActiveNav("helpdesk")}
              className={`xyz-nav-btn ${activeNav === "helpdesk" ? "active" : ""} ${sidebarCollapsed ? "collapsed" : ""}`}
              data-tooltip="Help & Support Desk"
              title={sidebarCollapsed ? "Help & Support Desk" : ""}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: sidebarCollapsed ? "center" : "space-between",
                width: "100%",
                padding: "10px 14px",
                borderRadius: "8px",
                border: "none",
                background: "transparent",
                color: activeNav === "helpdesk" ? "#fff" : "#94a3b8",
                fontSize: "14px",
                fontWeight: activeNav === "helpdesk" ? 600 : 500,
                cursor: "pointer",
                textAlign: "left",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <span style={{ fontSize: "18px", flexShrink: 0 }}>🎧</span>
                {!sidebarCollapsed && <span>Help & Support Desk</span>}
              </div>
              {!sidebarCollapsed && tickets.filter((t) => t.status === "open").length > 0 && (
                <span style={{
                  background: "#eab308",
                  color: "#713f12",
                  fontSize: "11px",
                  fontWeight: 700,
                  padding: "2px 7px",
                  borderRadius: "10px",
                }}>
                  {tickets.filter((t) => t.status === "open").length}
                </span>
              )}
            </button>
          </nav>
        </div>

        {/* User Card & Logout Bottom */}
        <div style={{
          padding: sidebarCollapsed ? "16px 10px" : "16px 14px",
          borderTop: "1px solid #1e293b",
          background: "#090d16",
        }}>
          {!sidebarCollapsed ? (
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
                <div style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "50%",
                  background: "#2563eb",
                  color: "#fff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 700,
                  fontSize: "14px",
                  flexShrink: 0,
                }}>
                  {(profile?.user?.name || "S")[0].toUpperCase()}
                </div>
                <div style={{ overflow: "hidden" }}>
                  <div style={{ fontSize: "13px", fontWeight: 600, color: "#fff", whiteSpace: "nowrap", textOverflow: "ellipsis", overflow: "hidden" }}>
                    {profile?.user?.name || "Student"}
                  </div>
                  <div style={{ fontSize: "11px", color: "#94a3b8" }}>
                    Roll: {profile?.rollNumber || "N/A"}
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
                  background: "#2563eb",
                  color: "#fff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 700,
                  fontSize: "14px",
                  margin: "0 auto 8px",
                }}
                title={`${profile?.user?.name} (${profile?.rollNumber})`}
              >
                {(profile?.user?.name || "S")[0].toUpperCase()}
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
        {/* Modern Interactive Top Bar */}
        <header className="xyz-header">
          <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
            {/* Header Hamburger / Toggle Button */}
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
              title={sidebarCollapsed ? "Expand Sidebar (Ctrl+B)" : "Collapse Sidebar (Ctrl+B)"}
            >
              ☰
            </button>

            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontSize: "13px", color: "#64748b", fontWeight: 500 }}>XYZ CRPC</span>
              <span style={{ color: "#cbd5e1" }}>/</span>
              <span style={{ fontSize: "14px", fontWeight: 700, color: "#0f172a" }}>
                {activeNav === "dashboard"
                  ? "Career Cockpit"
                  : activeNav === "jobs"
                  ? "Campus Placement Drives"
                  : activeNav === "competitions"
                  ? "TPO Contests & Hackathons"
                  : activeNav === "workshops"
                  ? "Skill Workshops & Masterclasses"
                  : activeNav === "profile"
                  ? "Student Profile"
                  : activeNav === "interviews"
                  ? "Interview Calls"
                  : activeNav === "helpdesk"
                  ? "Help & Support Desk"
                  : "Placement Offers"}
              </span>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            {/* TPO Notification Bell */}
            <div style={{ position: "relative" }}>
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "50%",
                  border: "1px solid #e2e8f0",
                  background: "#ffffff",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  position: "relative",
                  fontSize: "15px",
                  transition: "all 0.18s ease",
                }}
                title="TPO Announcements"
              >
                🔔
                <span
                  className="xyz-pulse"
                  style={{
                    position: "absolute",
                    top: "3px",
                    right: "3px",
                    width: "8px",
                    height: "8px",
                    background: "#ef4444",
                    borderRadius: "50%",
                  }}
                />
              </button>

              {/* Notification Dropdown */}
              {showNotifications && (
                <div
                  className="xyz-dropdown-pop"
                  style={{
                    position: "absolute",
                    right: 0,
                    top: "46px",
                    width: "340px",
                    background: "#fff",
                    borderRadius: "12px",
                    border: "1px solid #e2e8f0",
                    boxShadow: "0 10px 25px -5px rgba(0,0,0,0.15)",
                    padding: "16px",
                    zIndex: 50,
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                    <h4 style={{ margin: 0, fontSize: "14px", fontWeight: 700 }}>TPO Campus Bulletins</h4>
                    <span style={{ fontSize: "11px", color: "#2563eb", cursor: "pointer" }} onClick={() => setShowNotifications(false)}>
                      Close ✕
                    </span>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    {tpoBulletins.map((b) => (
                      <div key={b.id} style={{ padding: "10px", background: "#f8fafc", borderRadius: "8px", border: "1px solid #f1f5f9" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                          <span style={{ background: b.tagColor, color: "#fff", fontSize: "10px", fontWeight: 700, padding: "1px 6px", borderRadius: "4px" }}>
                            {b.tag}
                          </span>
                          <span style={{ fontSize: "11px", color: "#94a3b8" }}>{b.time}</span>
                        </div>
                        <div style={{ fontSize: "12px", fontWeight: 600, color: "#1e293b", marginBottom: "2px" }}>{b.title}</div>
                        <div style={{ fontSize: "11px", color: "#64748b" }}>{b.desc}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Academic Season Badge */}
            <span style={{
              background: "#ecfdf5",
              color: "#047857",
              border: "1px solid #a7f3d0",
              borderRadius: "20px",
              padding: "5px 12px",
              fontSize: "12px",
              fontWeight: 600,
            }}>
              ● Batch 2026 Season
            </span>

            {/* Student Specialization */}
            <div style={{ fontSize: "13px", color: "#475569" }}>
              <strong>{profile?.course || "B.Tech"}</strong> ({profile?.branch || "CSE"})
            </div>
          </div>
        </header>

        {/* Global Action Message Banner */}
        {actionMessage && (
          <div style={{
            margin: "16px 24px 0",
            padding: "12px 16px",
            background: "#f0fdf4",
            border: "1px solid #bbf7d0",
            color: "#15803d",
            borderRadius: "8px",
            fontSize: "14px",
          }}>
            {actionMessage}
          </div>
        )}

        {/* Main Content Body */}
        <main style={{ padding: "24px", flex: 1 }}>
          {/* ========================================================
              TAB 1: CAREER COCKPIT (INTERACTIVE DASHBOARD HOME)
             ======================================================== */}
          {activeNav === "dashboard" && (
            <div>
              {/* Placed Candidate Dream Upgrade Banner */}
              {hasPlacedOffer && (
                <div style={{
                  background: "linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)",
                  border: "1px solid #6ee7b7",
                  borderRadius: "14px",
                  padding: "16px 22px",
                  marginBottom: "20px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "16px",
                  flexWrap: "wrap",
                  boxShadow: "0 2px 8px rgba(16, 185, 129, 0.12)",
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                    <span style={{ fontSize: "28px" }}>🎉</span>
                    <div>
                      <div style={{ fontWeight: 800, color: "#065f46", fontSize: "15px", display: "flex", alignItems: "center", gap: "8px" }}>
                        <span>Congratulations! You hold an Active Placement Offer</span>
                        {placedPackage && (
                          <span style={{ background: "#059669", color: "#fff", padding: "2px 8px", borderRadius: "6px", fontSize: "12px", fontWeight: 700 }}>
                            ₹{placedPackage} LPA
                          </span>
                        )}
                      </div>
                      <div style={{ color: "#047857", fontSize: "13px", marginTop: "3px" }}>
                        Under XYZ Placement Policy, Regular drives (&lt; 6 LPA) are locked (1-Offer Rule), but you are <strong>fully eligible to apply for Dream (6 - 10 LPA) and Super Dream (≥ 10 LPA)</strong> drives to upgrade your CTC!
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => setActiveNav("jobs")}
                    style={{
                      padding: "8px 18px",
                      background: "#059669",
                      color: "#fff",
                      border: "none",
                      borderRadius: "8px",
                      fontWeight: 700,
                      fontSize: "13px",
                      cursor: "pointer",
                      whiteSpace: "nowrap",
                      boxShadow: "0 2px 6px rgba(5, 150, 105, 0.3)",
                    }}
                  >
                    Explore Dream Drives →
                  </button>
                </div>
              )}

              {/* 1. Student Hero Profile Banner with Readiness Gauge */}
              <div style={{
                background: "linear-gradient(135deg, #0b132b 0%, #1c2541 60%, #0f172a 100%)",
                color: "#ffffff",
                borderRadius: "16px",
                padding: "28px",
                marginBottom: "24px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: "24px",
                boxShadow: "0 10px 25px -5px rgba(11, 19, 43, 0.2)",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: "18px" }}>
                  <div style={{
                    width: "68px",
                    height: "68px",
                    borderRadius: "50%",
                    background: "linear-gradient(135deg, #2563eb, #38bdf8)",
                    color: "#fff",
                    fontSize: "26px",
                    fontWeight: 800,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: "0 0 0 4px rgba(56, 189, 248, 0.25)",
                  }}>
                    {(profile?.user?.name || "S")[0].toUpperCase()}
                  </div>

                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "4px" }}>
                      <h1 style={{ margin: 0, fontSize: "22px", fontWeight: 700 }}>
                        Welcome, {profile?.user?.name || "Student"}
                      </h1>
                      <span style={{
                        background: "rgba(34, 197, 94, 0.2)",
                        color: "#4ade80",
                        padding: "2px 8px",
                        borderRadius: "6px",
                        fontSize: "11px",
                        fontWeight: 600,
                      }}>
                        Verified Profile ✓
                      </span>
                    </div>
                    <p style={{ margin: "0 0 6px", color: "#94a3b8", fontSize: "14px" }}>
                      Roll No: <strong>{profile?.rollNumber || "Not Assigned"}</strong> &nbsp;•&nbsp;{" "}
                      {profile?.course || "B.Tech"} - {profile?.branch || "Computer Science"}
                    </p>
                    <div style={{ display: "flex", gap: "14px", fontSize: "12px", color: "#cbd5e1" }}>
                      <span>CGPA: <strong>{profile?.cgpa ?? "N/A"}</strong></span>
                      <span>•</span>
                      <span>
                        Backlogs:{" "}
                        <strong style={{ color: (profile?.backlogs || 0) === 0 ? "#4ade80" : "#f87171" }}>
                          {profile?.backlogs === 0 ? "0 (Eligible)" : `${profile?.backlogs} Active`}
                        </strong>
                      </span>
                      <span>•</span>
                      <span>
                        Primary Resume:{" "}
                        <strong>{primaryResume ? "Uploaded ⭐" : "Missing ⚠️"}</strong>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Readiness Circular / Gauge Card */}
                <div style={{
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.12)",
                  borderRadius: "14px",
                  padding: "16px 20px",
                  display: "flex",
                  alignItems: "center",
                  gap: "18px",
                  minWidth: "240px",
                }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                      <span style={{ fontSize: "11px", color: "#94a3b8", textTransform: "uppercase", fontWeight: 600 }}>
                        Placement Readiness
                      </span>
                      <span style={{ fontSize: "18px", fontWeight: 900, color: completionScore >= 80 ? "#4ade80" : "#fbbf24" }}>
                        {completionScore}%
                      </span>
                    </div>

                    {/* Visual Animated Progress Track */}
                    <div style={{
                      width: "100%",
                      height: "7px",
                      background: "rgba(255, 255, 255, 0.12)",
                      borderRadius: "999px",
                      overflow: "hidden",
                      margin: "6px 0",
                    }}>
                      <div style={{
                        width: `${Math.min(completionScore, 100)}%`,
                        height: "100%",
                        background: completionScore >= 80
                          ? "linear-gradient(90deg, #22c55e, #4ade80)"
                          : "linear-gradient(90deg, #f59e0b, #fbbf24)",
                        borderRadius: "999px",
                        transition: "width 0.6s cubic-bezier(0.4, 0, 0.2, 1)",
                        boxShadow: completionScore >= 80 ? "0 0 10px rgba(74, 222, 128, 0.5)" : "none",
                      }} />
                    </div>

                    <div style={{ fontSize: "11px", color: completionScore >= 80 ? "#4ade80" : "#fbbf24" }}>
                      {completionScore >= 80 ? "🔥 Ready For Placements" : "⚡ Add details to reach 100%"}
                    </div>
                  </div>

                  <button
                    onClick={() => setActiveNav("profile")}
                    style={{
                      padding: "8px 14px",
                      background: "#2563eb",
                      color: "#fff",
                      border: "none",
                      borderRadius: "8px",
                      fontWeight: 600,
                      fontSize: "12px",
                      cursor: "pointer",
                      whiteSpace: "nowrap",
                      flexShrink: 0,
                    }}
                  >
                    Edit Profile →
                  </button>
                </div>
              </div>

              {/* 2. Interactive KPI Stats Row */}
              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                gap: "16px",
                marginBottom: "24px",
              }}>
                <div
                  className="xyz-stat-card green"
                  onClick={() => setActiveNav("jobs")}
                  style={{ cursor: "pointer" }}
                >
                  <div style={{ fontSize: "12px", color: "#64748b", fontWeight: 600, textTransform: "uppercase" }}>
                    Eligible Drives
                  </div>
                  <div style={{ fontSize: "28px", fontWeight: 800, color: "#16a34a", margin: "6px 0 2px" }}>
                    {eligibleDrivesCount}
                  </div>
                  <span style={{ fontSize: "12px", color: "#16a34a" }}>
                    Satisfy all criteria →
                  </span>
                </div>

                <div
                  className="xyz-stat-card blue"
                  onClick={() => setActiveNav("jobs")}
                  style={{ cursor: "pointer" }}
                >
                  <div style={{ fontSize: "12px", color: "#64748b", fontWeight: 600, textTransform: "uppercase" }}>
                    Total Applications
                  </div>
                  <div style={{ fontSize: "28px", fontWeight: 800, color: "#2563eb", margin: "6px 0 2px" }}>
                    {applications.length}
                  </div>
                  <span style={{ fontSize: "12px", color: "#64748b" }}>
                    Active submissions
                  </span>
                </div>

                <div
                  className="xyz-stat-card rose"
                  onClick={() => setActiveNav("interviews")}
                  style={{ cursor: "pointer" }}
                >
                  <div style={{ fontSize: "12px", color: "#64748b", fontWeight: 600, textTransform: "uppercase" }}>
                    Upcoming Interviews
                  </div>
                  <div style={{ fontSize: "28px", fontWeight: 800, color: "#e11d48", margin: "6px 0 2px" }}>
                    {interviews.filter((i) => i.status === "scheduled").length}
                  </div>
                  <span style={{ fontSize: "12px", color: "#e11d48" }}>
                    Scheduled rounds
                  </span>
                </div>

                <div
                  className="xyz-stat-card amber"
                  onClick={() => setActiveNav("competitions")}
                  style={{ cursor: "pointer" }}
                >
                  <div style={{ fontSize: "12px", color: "#64748b", fontWeight: 600, textTransform: "uppercase" }}>
                    TPO Contests & Hackathons
                  </div>
                  <div style={{ fontSize: "28px", fontWeight: 800, color: "#d97706", margin: "6px 0 2px" }}>
                    {competitions.length}
                  </div>
                  <span style={{ fontSize: "12px", color: "#d97706" }}>
                    Hosted by TPO Cell
                  </span>
                </div>

                <div
                  className="xyz-stat-card emerald"
                  onClick={() => setActiveNav("offers")}
                  style={{ cursor: "pointer" }}
                >
                  <div style={{ fontSize: "12px", color: "#64748b", fontWeight: 600, textTransform: "uppercase" }}>
                    Placement Offers
                  </div>
                  <div style={{ fontSize: "28px", fontWeight: 800, color: "#059669", margin: "6px 0 2px" }}>
                    {offers.length}
                  </div>
                  <span style={{ fontSize: "12px", color: "#059669" }}>
                    Official letters
                  </span>
                </div>
              </div>

              {/* 3. TPO Live Bulletin Broadcast Banner */}
              <div style={{
                background: "#eff6ff",
                border: "1px solid #bfdbfe",
                borderRadius: "14px",
                padding: "16px 20px",
                marginBottom: "24px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: "12px",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <span style={{ fontSize: "24px" }}>📢</span>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: "14px", color: "#1e3a8a" }}>
                      XYZ Corporate Relations & Placement Centre (CRPC) Announcement
                    </div>
                    <div style={{ fontSize: "13px", color: "#1d4ed8" }}>
                      Mega Campus Placement Drive 2026 registrations are live. Check eligible drives and apply before the respective deadlines.
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setActiveNav("jobs")}
                  style={{
                    padding: "6px 14px",
                    background: "#2563eb",
                    color: "#fff",
                    border: "none",
                    borderRadius: "6px",
                    fontSize: "12px",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  View Live Drives →
                </button>
              </div>

              {/* 4. Two Column Layout: Application Status & Interview Calls */}
              <div style={{ display: "grid", gridTemplateColumns: "1.2fr 0.8fr", gap: "20px" }}>
                {/* Active Applications Tracker */}
                <div style={{
                  background: "#ffffff",
                  borderRadius: "14px",
                  border: "1px solid #e2e8f0",
                  padding: "20px",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                    <h3 style={{ margin: 0, fontSize: "16px", color: "#0f172a" }}>
                      Active Applications ({applications.length})
                    </h3>
                    <button
                      onClick={() => setActiveNav("jobs")}
                      style={{ background: "none", border: "none", color: "#2563eb", fontWeight: 600, fontSize: "13px", cursor: "pointer" }}
                    >
                      Browse Drives →
                    </button>
                  </div>

                  {applications.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "36px 16px", color: "#64748b", fontSize: "14px" }}>
                      <div style={{ fontSize: "36px", marginBottom: "8px" }}>📬</div>
                      No applications submitted yet. Browse open campus drives to apply!
                    </div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                      {applications.slice(0, 5).map((app) => (
                        <div
                          key={app._id}
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            padding: "12px 14px",
                            borderRadius: "10px",
                            background: "#f8fafc",
                            border: "1px solid #f1f5f9",
                          }}
                        >
                          <div>
                            <div style={{ fontWeight: 600, fontSize: "14px", color: "#0f172a" }}>
                              {app.drive?.jobTitle || "Job Position"}
                            </div>
                            <div style={{ fontSize: "12px", color: "#64748b" }}>
                              {app.drive?.company?.name || "Company"} &nbsp;•&nbsp; Applied on {new Date(app.createdAt).toLocaleDateString()}
                            </div>
                          </div>

                          <span style={{
                            fontSize: "12px",
                            fontWeight: 600,
                            padding: "4px 10px",
                            borderRadius: "6px",
                            textTransform: "capitalize",
                            background:
                              app.status === "offered"
                                ? "#ecfdf5"
                                : app.status === "rejected"
                                ? "#fee2e2"
                                : app.status === "interview"
                                ? "#e0e7ff"
                                : "#eff6ff",
                            color:
                              app.status === "offered"
                                ? "#047857"
                                : app.status === "rejected"
                                ? "#b91c1c"
                                : app.status === "interview"
                                ? "#3730a3"
                                : "#1d4ed8",
                          }}>
                            {app.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Upcoming Interview Calls Widget */}
                <div style={{
                  background: "#ffffff",
                  borderRadius: "14px",
                  border: "1px solid #e2e8f0",
                  padding: "20px",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                    <h3 style={{ margin: 0, fontSize: "16px", color: "#0f172a" }}>
                      Upcoming Interview Calls
                    </h3>
                    <button
                      onClick={() => setActiveNav("interviews")}
                      style={{ background: "none", border: "none", color: "#2563eb", fontWeight: 600, fontSize: "13px", cursor: "pointer" }}
                    >
                      View Schedule →
                    </button>
                  </div>

                  {interviews.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "36px 16px", color: "#64748b", fontSize: "14px" }}>
                      <div style={{ fontSize: "36px", marginBottom: "8px" }}>🎙️</div>
                      No interviews scheduled right now. Shortlisted candidates will be notified here.
                    </div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                      {interviews.slice(0, 4).map((item) => (
                        <div
                          key={item._id}
                          style={{
                            padding: "12px",
                            borderRadius: "10px",
                            border: "1px solid #e2e8f0",
                            background: "#ffffff",
                          }}
                        >
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                            <strong style={{ fontSize: "13px", color: "#0f172a" }}>{item.roundName}</strong>
                            <span style={{ fontSize: "11px", color: "#dc2626", fontWeight: 700 }}>Scheduled</span>
                          </div>
                          <div style={{ fontSize: "12px", color: "#64748b", marginBottom: "4px" }}>
                            {item.drive?.company?.name || item.company?.name || "Company"} &nbsp;•&nbsp;{" "}
                            {new Date(item.scheduledAt).toLocaleString([], { dateStyle: "short", timeStyle: "short" })}
                          </div>
                          {item.meetingLink && (
                            <a
                              href={item.meetingLink}
                              target="_blank"
                              rel="noreferrer"
                              style={{ fontSize: "12px", color: "#2563eb", textDecoration: "none", fontWeight: 600 }}
                            >
                              Join Video Room 🔗
                            </a>
                          )}
                          {item.roomNumber && (
                            <span style={{ fontSize: "12px", color: "#475569" }}>
                              📍 Venue: {item.roomNumber}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ========================================================
              TAB 2: CAMPUS DRIVES EXPLORER
             ======================================================== */}
          {activeNav === "jobs" && (
            <JobProfilesView
              drives={drives}
              applications={applications}
              profile={profile}
              onApply={handleApply}
              applyLoading={applyLoading}
              applyMessage={applyMessage}
            />
          )}

          {/* ========================================================
              TAB 3: TPO HACKATHONS & CONTESTS (ADMIN POSTED)
             ======================================================== */}
          {activeNav === "competitions" && <CompetitionsView />}

          {/* ========================================================
              TAB 3.5: SKILL WORKSHOPS & MASTERCLASSES (RAZORPAY INTEGRATED)
             ======================================================== */}
          {activeNav === "workshops" && <WorkshopsView />}

          {/* ========================================================
              TAB 4: STUDENT ACADEMIC PROFILE
             ======================================================== */}
          {activeNav === "profile" && (
            <StudentProfileView
              profile={profile}
              offers={offers}
              onUpdateProfile={handleUpdateProfile}
              onUploadResume={handleResumeUpload}
              onDeleteResume={handleDeleteResume}
              onSetPrimaryResume={handleSetPrimaryResume}
              onRefreshProfile={fetchDashboardData}
              resumeLoading={resumeLoading}
            />
          )}

          {/* ========================================================
              TAB 5: INTERVIEW SCHEDULES
             ======================================================== */}
          {activeNav === "interviews" && (
            <div style={{ background: "#fff", borderRadius: "14px", border: "1px solid #e2e8f0", padding: "24px" }}>
              <h2 style={{ margin: "0 0 6px", fontSize: "20px", color: "#0f172a" }}>Interview Schedule & Venues</h2>
              <p style={{ margin: "0 0 20px", color: "#64748b", fontSize: "14px" }}>
                All scheduled technical, coding, and HR rounds assigned by hiring recruiters.
              </p>

              {interviews.length === 0 ? (
                <div style={{ textAlign: "center", padding: "48px 24px", color: "#64748b" }}>
                  <div style={{ fontSize: "40px", marginBottom: "12px" }}>🎙️</div>
                  <h3 style={{ margin: "0 0 6px", color: "#0f172a" }}>No Interview Calls Yet</h3>
                  <p style={{ margin: 0, fontSize: "14px" }}>Once shortlisted for a drive round, your slot and venue will appear here.</p>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  {interviews.map((item) => (
                    <div
                      key={item._id}
                      style={{
                        padding: "18px",
                        borderRadius: "10px",
                        border: "1px solid #e2e8f0",
                        background: "#f8fafc",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        flexWrap: "wrap",
                        gap: "14px",
                      }}
                    >
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "4px" }}>
                          <h3 style={{ margin: 0, fontSize: "16px", color: "#0f172a" }}>{item.roundName}</h3>
                          <span style={{
                            background: "#e0e7ff",
                            color: "#3730a3",
                            fontSize: "11px",
                            fontWeight: 600,
                            padding: "2px 8px",
                            borderRadius: "6px",
                          }}>
                            {item.status}
                          </span>
                        </div>
                        <div style={{ fontSize: "13px", color: "#475569", marginBottom: "4px" }}>
                          <strong>Drive:</strong> {item.drive?.jobTitle} &nbsp;|&nbsp;
                          <strong>Company:</strong> {item.drive?.company?.name || item.company?.name}
                        </div>
                        <div style={{ fontSize: "13px", color: "#64748b" }}>
                          🕒 <strong>Date & Time:</strong> {new Date(item.scheduledAt).toLocaleString()}
                        </div>
                      </div>

                      <div style={{ textAlign: "right" }}>
                        {item.meetingLink && (
                          <a
                            href={item.meetingLink}
                            target="_blank"
                            rel="noreferrer"
                            style={{
                              display: "inline-block",
                              background: "#2563eb",
                              color: "#fff",
                              padding: "8px 16px",
                              borderRadius: "8px",
                              fontSize: "13px",
                              fontWeight: 600,
                              textDecoration: "none",
                            }}
                          >
                            Join Online Meet 🔗
                          </a>
                        )}
                        {item.roomNumber && (
                          <div style={{ fontSize: "13px", color: "#475569", marginTop: "6px" }}>
                            📍 Campus Venue: <strong>{item.roomNumber}</strong>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ========================================================
          {/* ========================================================
              TAB 6: PLACEMENT OFFERS
             ======================================================== */}
          {activeNav === "offers" && (
            <div style={{ background: "#fff", borderRadius: "14px", border: "1px solid #e2e8f0", padding: "28px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px", flexWrap: "wrap", gap: "12px" }}>
                <div>
                  <h2 style={{ margin: "0 0 6px", fontSize: "22px", color: "#0f172a", fontWeight: 700 }}>Campus Placement Offers</h2>
                  <p style={{ margin: 0, color: "#64748b", fontSize: "14px" }}>
                    Official employment offers rolled out to you by recruiting companies via XYZ CRPC.
                  </p>
                </div>
                {offers.length > 0 && (
                  <span style={{
                    background: "#ecfdf5",
                    color: "#047857",
                    border: "1px solid #a7f3d0",
                    padding: "6px 14px",
                    borderRadius: "20px",
                    fontSize: "12px",
                    fontWeight: 700,
                  }}>
                    {offers.length} Offer{offers.length > 1 ? "s" : ""} Released
                  </span>
                )}
              </div>

              {offers.length === 0 ? (
                <div style={{ textAlign: "center", padding: "56px 24px", color: "#64748b", background: "#f8fafc", borderRadius: "12px", border: "1px dashed #cbd5e1" }}>
                  <div style={{ fontSize: "44px", marginBottom: "12px" }}>🎉</div>
                  <h3 style={{ margin: "0 0 6px", color: "#0f172a", fontSize: "17px" }}>No Offers Released Yet</h3>
                  <p style={{ margin: 0, fontSize: "14px" }}>Keep applying to live campus drives and doing your best in technical interviews!</p>
                  <button
                    onClick={() => setActiveNav("jobs")}
                    style={{
                      marginTop: "16px",
                      padding: "8px 18px",
                      background: "#2563eb",
                      color: "#fff",
                      border: "none",
                      borderRadius: "8px",
                      fontWeight: 600,
                      fontSize: "13px",
                      cursor: "pointer",
                    }}
                  >
                    Browse Campus Drives →
                  </button>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                  {offers.map((offer) => {
                    const isPending = offer.status === "active" || offer.status === "released";
                    const isAccepted = offer.status === "accepted";
                    const isDeclined = offer.status === "declined" || offer.status === "rejected";
                    const pkg = Number(offer.package) || 0;
                    const tierLabel = pkg >= 10 ? "🔥 Super Dream" : pkg >= 6 ? "⭐ Dream" : "Regular Drive";
                    const tierBadgeBg = pkg >= 10 ? "#ede9fe" : pkg >= 6 ? "#fef3c7" : "#f1f5f9";
                    const tierBadgeColor = pkg >= 10 ? "#7c3aed" : pkg >= 6 ? "#b45309" : "#475569";
                    const companyTitle = offer.company?.name || offer.drive?.company?.name || "Corporate Partner";
                    const jobTitle = offer.jobTitle || offer.designation || offer.drive?.jobTitle || "Software Engineer";

                    return (
                      <div
                        key={offer._id}
                        style={{
                          borderRadius: "14px",
                          border: isAccepted ? "2px solid #86efac" : isPending ? "2px solid #fde047" : "1px solid #e2e8f0",
                          background: isAccepted ? "#f0fdf4" : isPending ? "#fffbeb" : "#f8fafc",
                          padding: "24px",
                          boxShadow: isPending ? "0 4px 15px rgba(245, 158, 11, 0.12)" : "0 1px 3px rgba(0,0,0,0.03)",
                        }}
                      >
                        {/* Top Ribbon */}
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "10px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <span style={{
                              background: tierBadgeBg,
                              color: tierBadgeColor,
                              fontSize: "11px",
                              fontWeight: 800,
                              padding: "3px 10px",
                              borderRadius: "6px",
                              textTransform: "uppercase",
                              border: "1px solid rgba(0,0,0,0.08)",
                            }}>
                              {tierLabel}
                            </span>
                            <span style={{ fontSize: "12px", color: "#64748b" }}>
                              Offered on {new Date(offer.offerDate || offer.createdAt).toLocaleDateString([], { dateStyle: "medium" })}
                            </span>
                          </div>

                          <span style={{
                            fontSize: "12px",
                            fontWeight: 800,
                            padding: "4px 12px",
                            borderRadius: "20px",
                            textTransform: "uppercase",
                            letterSpacing: "0.5px",
                            background: isAccepted ? "#15803d" : isDeclined ? "#dc2626" : "#d97706",
                            color: "#fff",
                            display: "flex",
                            alignItems: "center",
                            gap: "5px",
                          }}>
                            {isAccepted ? "✓ Offer Accepted" : isDeclined ? "✕ Offer Declined" : "⚡ Action Required"}
                          </span>
                        </div>

                        {/* Core Details Grid */}
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px", marginBottom: "18px" }}>
                          <div>
                            <div style={{ fontSize: "12px", color: "#64748b", textTransform: "uppercase", fontWeight: 600 }}>Designation / Role</div>
                            <h3 style={{ margin: "3px 0 0", fontSize: "19px", color: "#0f172a", fontWeight: 700 }}>
                              {jobTitle}
                            </h3>
                            <div style={{ fontSize: "13px", color: "#475569", marginTop: "2px" }}>
                              🏢 <strong>{companyTitle}</strong>
                            </div>
                          </div>

                          <div>
                            <div style={{ fontSize: "12px", color: "#64748b", textTransform: "uppercase", fontWeight: 600 }}>Compensation (CTC)</div>
                            <div style={{ fontSize: "24px", color: "#047857", fontWeight: 900, marginTop: "2px" }}>
                              ₹{offer.package} <span style={{ fontSize: "14px", fontWeight: 600, color: "#166534" }}>LPA</span>
                            </div>
                            {offer.baseSalary && (
                              <div style={{ fontSize: "12px", color: "#64748b" }}>Base Salary: ₹{offer.baseSalary} LPA</div>
                            )}
                          </div>

                          <div>
                            <div style={{ fontSize: "12px", color: "#64748b", textTransform: "uppercase", fontWeight: 600 }}>Tentative Joining</div>
                            <div style={{ fontSize: "14px", color: "#0f172a", fontWeight: 600, marginTop: "4px" }}>
                              🗓️ {offer.joiningDate ? new Date(offer.joiningDate).toLocaleDateString([], { dateStyle: "long" }) : "To be confirmed by employer"}
                            </div>
                            <div style={{ fontSize: "12px", color: "#64748b", marginTop: "2px" }}>
                              📍 {offer.drive?.location || offer.company?.location || "Delhi-NCR / On-site"}
                            </div>
                          </div>
                        </div>

                        {/* Notice Banner */}
                        {isPending && (
                          <div style={{
                            background: "#fff",
                            border: "1px solid #fef08a",
                            borderRadius: "10px",
                            padding: "12px 16px",
                            marginBottom: "18px",
                            fontSize: "13px",
                            color: "#854d0e",
                            display: "flex",
                            alignItems: "center",
                            gap: "10px",
                          }}>
                            <span style={{ fontSize: "20px" }}>🔔</span>
                            <div>
                              <strong>Response Pending:</strong> Please review your employment terms and choose to accept or decline this offer. Accepting will officially record you as placed in the XYZ placement portal.
                            </div>
                          </div>
                        )}

                        {isAccepted && (
                          <div style={{
                            background: "#ecfdf5",
                            border: "1px solid #a7f3d0",
                            borderRadius: "10px",
                            padding: "14px 16px",
                            marginBottom: "18px",
                            fontSize: "13px",
                            color: "#065f46",
                            display: "flex",
                            alignItems: "center",
                            gap: "12px",
                          }}>
                            <span style={{ fontSize: "22px" }}>🎉</span>
                            <div>
                              <strong>Offer Officially Accepted!</strong> You have confirmed your employment with {companyTitle}.
                              {pkg < 6 && (
                                <span style={{ display: "block", marginTop: "4px", color: "#047857" }}>
                                  💡 <em>XYZ Placement Policy:</em> Regular drives (&lt; 6 LPA) are now locked, but you are <strong>fully eligible to apply for Dream (6-10 LPA) and Super Dream (≥ 10 LPA)</strong> drives to upgrade your offer!
                                </span>
                              )}
                            </div>
                          </div>
                        )}

                        {isDeclined && (
                          <div style={{
                            background: "#fef2f2",
                            border: "1px solid #fecaca",
                            borderRadius: "10px",
                            padding: "10px 14px",
                            marginBottom: "18px",
                            fontSize: "12px",
                            color: "#991b1b",
                          }}>
                            ✕ You declined this offer. You can continue applying to other campus drives.
                          </div>
                        )}

                        {/* Action Buttons Row */}
                        <div style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          flexWrap: "wrap",
                          gap: "12px",
                          paddingTop: "16px",
                          borderTop: "1px solid rgba(0,0,0,0.06)",
                        }}>
                          <div>
                            {(() => {
                              const pdfDownloadUrl = offer.offerLetterUrl
                                ? (offer.offerLetterUrl.startsWith("http") ? offer.offerLetterUrl : `http://localhost:5000${offer.offerLetterUrl}`)
                                : `http://localhost:5000/api/offers/${offer._id}/pdf`;
                              return (
                                <a
                                  href={pdfDownloadUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  style={{
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: "6px",
                                    padding: "9px 18px",
                                    background: "#ffffff",
                                    border: "1.5px solid #0284c7",
                                    borderRadius: "8px",
                                    color: "#0284c7",
                                    fontWeight: 700,
                                    fontSize: "13px",
                                    textDecoration: "none",
                                    boxShadow: "0 2px 6px rgba(2,132,199,0.15)",
                                  }}
                                >
                                  <span>📄</span>
                                  <span>Download Official Offer Letter (PDF) ↗</span>
                                </a>
                              );
                            })()}
                          </div>

                          <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                            {isPending && (
                              <>
                                <button
                                  onClick={() => setConfirmingOffer({ offer, action: "decline" })}
                                  disabled={respondingOfferLoading}
                                  style={{
                                    padding: "10px 20px",
                                    background: "#ffffff",
                                    color: "#dc2626",
                                    border: "1px solid #fca5a5",
                                    borderRadius: "8px",
                                    fontWeight: 700,
                                    fontSize: "13px",
                                    cursor: "pointer",
                                    transition: "all 0.15s ease",
                                  }}
                                >
                                  ✕ Decline Offer
                                </button>
                                <button
                                  onClick={() => setConfirmingOffer({ offer, action: "accept" })}
                                  disabled={respondingOfferLoading}
                                  style={{
                                    padding: "10px 26px",
                                    background: "linear-gradient(135deg, #15803d, #16a34a)",
                                    color: "#ffffff",
                                    border: "none",
                                    borderRadius: "8px",
                                    fontWeight: 800,
                                    fontSize: "14px",
                                    cursor: "pointer",
                                    boxShadow: "0 3px 10px rgba(22, 163, 74, 0.35)",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "8px",
                                  }}
                                >
                                  <span>✓</span>
                                  <span>Accept Job Offer</span>
                                </button>
                              </>
                            )}

                            {isAccepted && (
                              <span style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "6px",
                                color: "#15803d",
                                fontWeight: 800,
                                fontSize: "14px",
                              }}>
                                <span>✓</span>
                                <span>Offer Accepted & Placed</span>
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ========================================================
              TAB 7: HELP & SUPPORT DESK (FAQS + GRIEVANCE TICKETS)
             ======================================================== */}
          {activeNav === "helpdesk" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
              {/* Header Banner */}
              <div style={{
                background: "linear-gradient(135deg, #0f172a 0%, #1e293b 55%, #0284c7 100%)",
                borderRadius: "16px",
                padding: "26px 28px",
                color: "#ffffff",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: "20px",
                boxShadow: "0 10px 25px -5px rgba(15, 23, 42, 0.2)",
              }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
                    <span style={{ fontSize: "26px" }}>🎧</span>
                    <h2 style={{ margin: 0, fontSize: "22px", fontWeight: 800 }}>
                      Placement Help & Support Desk
                    </h2>
                    <span style={{
                      background: "rgba(56, 189, 248, 0.2)",
                      color: "#38bdf8",
                      border: "1px solid rgba(56, 189, 248, 0.4)",
                      padding: "3px 10px",
                      borderRadius: "12px",
                      fontSize: "11px",
                      fontWeight: 700,
                    }}>
                      XYZ CRPC Desk
                    </span>
                  </div>
                  {/* <p style={{ margin: "0 0 12px", color: "#94a3b8", fontSize: "14px", maxWidth: "680px", lineHeight: 1.5 }}>
                    Facing discrepancies in your academic scores, interview schedule clashes, or have queries regarding placement policy? Read through our self-serve guides or file an official ticket for instant TPO review.
                  </p> */}
                  <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", fontSize: "12px", color: "#cbd5e1" }}>
                    <span>📍 <strong>Location:</strong> Room 104, CRPC Block</span>
                    <span>✉️ <strong>Email:</strong> crpc@xyz.edu</span>
                    <span>📞 <strong>Campus Ext:</strong> 2410 / 2412</span>
                  </div>
                </div>

                <button
                  onClick={() => setShowCreateTicketModal(true)}
                  style={{
                    padding: "12px 22px",
                    background: "linear-gradient(135deg, #0284c7, #0369a1)",
                    color: "#ffffff",
                    border: "none",
                    borderRadius: "10px",
                    fontSize: "14px",
                    fontWeight: 700,
                    cursor: "pointer",
                    boxShadow: "0 4px 14px rgba(2, 132, 199, 0.4)",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  <span>🎫</span>
                  <span>Raise Support Ticket</span>
                </button>
              </div>

              {/* Section 1: Self-Serve FAQ Guide */}
              <div style={{
                background: "#ffffff",
                borderRadius: "16px",
                border: "1px solid #e2e8f0",
                padding: "24px",
                boxShadow: "0 4px 12px rgba(15, 23, 42, 0.04)",
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "10px" }}>
                  <div>
                    <h3 style={{ margin: "0 0 4px", fontSize: "18px", color: "#0f172a", fontWeight: 700, display: "flex", alignItems: "center", gap: "8px" }}>
                      <span>❓</span> FAQs
                    </h3>
                    <p style={{ margin: 0, color: "#64748b", fontSize: "13px" }}>
                      Click on any question below to see official XYZ CRPC placement policies and instructions.
                    </p>
                  </div>
                  <span style={{ fontSize: "12px", color: "#0284c7", fontWeight: 600 }}>
                    Help
                  </span>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {[
                    {
                      q: "What is the criteria for Regular, Dream, and Super Dream placement drives?",
                      a: "Under XYZ Placement Policy: Regular drives offer CTC below 6 LPA. Dream drives offer between 6 LPA and 10 LPA. Super Dream drives offer 10 LPA and above. If you receive an offer from a Regular drive, you remain fully eligible to compete in Dream and Super Dream drives to upgrade your offer!",
                    },
                    {
                      q: "Can I hold multiple campus placement offers simultaneously?",
                      a: "You can hold one officially accepted offer at a time. When you accept an offer, lower-tier drives are automatically locked. However, if you are subsequently selected in a higher tier (e.g. Dream or Super Dream), the CRPC portal allows you to transition your acceptance to the upgraded offer with formal endorsement.",
                    },
                    {
                      q: "My CGPA or backlog status changed after semester re-evaluation. How do I update it?",
                      a: "You can request from profile section to edit your CGPA, 10th/12th marks, and backlogs from the 'Academic Profile' tab. For urgent updates before drive application deadlines, raise a Support Ticket with category 'Academic Discrepancy' so the TPO desk can expedite mark-sheet verification.",
                    },
                    {
                      q: "What should I do if two recruiting companies schedule my interview at the same time?",
                      a: "Raise a ticket immediately under 'Interview Schedule Conflict' specifying both drive names and your roll number. The TPO team directly coordinates with corporate HR representatives to stagger your interview slots without forfeiting your opportunity.",
                    },
                    {
                      q: "I paid for a Skill Workshop via Razorpay, but my status is still showing Pending. What should I do?",
                      a: "Razorpay webhooks confirm payments in real time. If your bank debited the amount but network lag delayed portal confirmation, raise a ticket with category 'Technical Issue' and paste your Razorpay Payment ID. Our desk will verify the transaction hash within 2 hours.",
                    },
                    {
                      q: "Is there any penalty for missing an interview round without intimation?",
                      a: "Yes. In accordance with the XYZ Placement Code of Conduct, unexcused absence from an interview or written test leads to automatic debarment from the next 2 visiting recruitment drives.",
                    },
                  ].map((faq, idx) => {
                    const isOpen = activeFaqIndex === idx;
                    return (
                      <div
                        key={idx}
                        style={{
                          border: "1px solid",
                          borderColor: isOpen ? "#93c5fd" : "#e2e8f0",
                          borderRadius: "10px",
                          overflow: "hidden",
                          background: isOpen ? "#f0f9ff" : "#ffffff",
                          transition: "all 0.2s ease",
                        }}
                      >
                        <button
                          type="button"
                          onClick={() => setActiveFaqIndex(isOpen ? null : idx)}
                          style={{
                            width: "100%",
                            padding: "14px 18px",
                            background: "transparent",
                            border: "none",
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            cursor: "pointer",
                            textAlign: "left",
                            gap: "14px",
                          }}
                        >
                          <span style={{ fontSize: "14px", fontWeight: 700, color: isOpen ? "#0369a1" : "#1e293b" }}>
                            {faq.q}
                          </span>
                          <span style={{ fontSize: "16px", color: isOpen ? "#0284c7" : "#64748b", fontWeight: 700 }}>
                            {isOpen ? "−" : "+"}
                          </span>
                        </button>
                        {isOpen && (
                          <div style={{ padding: "0 18px 16px", color: "#334155", fontSize: "13px", lineHeight: 1.6, borderTop: "1px solid #e0f2fe" }}>
                            <p style={{ margin: "10px 0 0" }}>{faq.a}</p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Section 2: My Support Tickets Tracker */}
              <div style={{
                background: "#ffffff",
                borderRadius: "16px",
                border: "1px solid #e2e8f0",
                padding: "24px",
                boxShadow: "0 4px 12px rgba(15, 23, 42, 0.04)",
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", flexWrap: "wrap", gap: "12px" }}>
                  <div>
                    <h3 style={{ margin: "0 0 4px", fontSize: "18px", color: "#0f172a", fontWeight: 700, display: "flex", alignItems: "center", gap: "8px" }}>
                      <span>🎫</span> My Raised Grievance & Support Tickets
                    </h3>
                    <p style={{ margin: 0, color: "#64748b", fontSize: "13px" }}>
                      Track live status updates and official responses from the XYZ Placement Office.
                    </p>
                  </div>

                  {/* Filter chips */}
                  <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                    {[
                      { id: "all", label: `All (${tickets.length})` },
                      { id: "open", label: `Open (${tickets.filter(t => t.status === "open").length})` },
                      { id: "in_progress", label: `In Progress (${tickets.filter(t => t.status === "in_progress").length})` },
                      { id: "resolved", label: `Resolved (${tickets.filter(t => t.status === "resolved").length})` },
                    ].map(f => (
                      <button
                        key={f.id}
                        onClick={() => setTicketStatusFilter(f.id)}
                        style={{
                          padding: "6px 12px",
                          borderRadius: "8px",
                          fontSize: "12px",
                          fontWeight: 600,
                          border: "1px solid",
                          borderColor: ticketStatusFilter === f.id ? "#0284c7" : "#cbd5e1",
                          background: ticketStatusFilter === f.id ? "#f0f9ff" : "#ffffff",
                          color: ticketStatusFilter === f.id ? "#0284c7" : "#475569",
                          cursor: "pointer",
                        }}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Tickets List */}
                {(() => {
                  const filtered = ticketStatusFilter === "all"
                    ? tickets
                    : tickets.filter(t => t.status === ticketStatusFilter);

                  if (filtered.length === 0) {
                    return (
                      <div style={{
                        padding: "40px 20px",
                        textAlign: "center",
                        background: "#f8fafc",
                        borderRadius: "12px",
                        border: "1px dashed #cbd5e1",
                      }}>
                        <div style={{ fontSize: "36px", marginBottom: "10px" }}>📭</div>
                        <h4 style={{ margin: "0 0 6px", fontSize: "16px", color: "#0f172a" }}>
                          No Support Tickets Found
                        </h4>
                        <p style={{ margin: "0 0 16px", color: "#64748b", fontSize: "13px" }}>
                          {ticketStatusFilter === "all"
                            ? "You haven't filed any grievance or support tickets yet. Need help with anything?"
                            : `No tickets with status "${ticketStatusFilter}".`}
                        </p>
                        <button
                          onClick={() => setShowCreateTicketModal(true)}
                          style={{
                            padding: "8px 18px",
                            background: "#0284c7",
                            color: "#fff",
                            border: "none",
                            borderRadius: "8px",
                            fontSize: "13px",
                            fontWeight: 600,
                            cursor: "pointer",
                          }}
                        >
                          + Raise Support Ticket
                        </button>
                      </div>
                    );
                  }

                  return (
                    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                      {filtered.map((t) => {
                        const statusColors = {
                          open: { bg: "#fef9c3", text: "#854d0e", border: "#fde047", label: "Open / Pending TPO" },
                          in_progress: { bg: "#e0f2fe", text: "#0369a1", border: "#bae6fd", label: "Under Review" },
                          resolved: { bg: "#dcfce7", text: "#15803d", border: "#86efac", label: "Resolved" },
                        };
                        const sc = statusColors[t.status] || statusColors.open;

                        const categoryLabels = {
                          academic_discrepancy: "Academic Discrepancy",
                          drive_eligibility: "Drive Eligibility",
                          interview_clash: "Interview Conflict",
                          offer_query: "Offer Letter Query",
                          technical_issue: "Technical / Payment Issue",
                          other: "General Query",
                        };

                        const priorityColors = {
                          urgent: { bg: "#fee2e2", text: "#b91c1c" },
                          high: { bg: "#ffedd5", text: "#c2410c" },
                          medium: { bg: "#f1f5f9", text: "#475569" },
                          low: { bg: "#f8fafc", text: "#64748b" },
                        };
                        const pc = priorityColors[t.priority] || priorityColors.medium;

                        return (
                          <div
                            key={t._id}
                            style={{
                              border: "1px solid #e2e8f0",
                              borderRadius: "14px",
                              padding: "20px",
                              background: "#ffffff",
                              boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
                            }}
                          >
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "10px", flexWrap: "wrap", gap: "10px" }}>
                              <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                                <span style={{
                                  background: "#f1f5f9",
                                  color: "#0f172a",
                                  border: "1px solid #e2e8f0",
                                  padding: "3px 10px",
                                  borderRadius: "6px",
                                  fontSize: "12px",
                                  fontWeight: 700,
                                }}>
                                  🏷️ {categoryLabels[t.category] || t.category}
                                </span>
                                <span style={{
                                  background: pc.bg,
                                  color: pc.text,
                                  padding: "3px 8px",
                                  borderRadius: "6px",
                                  fontSize: "11px",
                                  fontWeight: 700,
                                  textTransform: "uppercase",
                                }}>
                                  {t.priority} Priority
                                </span>
                                {t.drive && (
                                  <span style={{ fontSize: "12px", color: "#64748b" }}>
                                    Drive: <strong>{t.drive.jobTitle}</strong>
                                  </span>
                                )}
                              </div>

                              <span style={{
                                background: sc.bg,
                                color: sc.text,
                                border: `1px solid ${sc.border}`,
                                padding: "4px 12px",
                                borderRadius: "20px",
                                fontSize: "12px",
                                fontWeight: 700,
                              }}>
                                {sc.label}
                              </span>
                            </div>

                            <h4 style={{ margin: "0 0 6px", fontSize: "16px", color: "#0f172a", fontWeight: 700 }}>
                              {t.subject}
                            </h4>
                            <p style={{ margin: "0 0 12px", color: "#475569", fontSize: "13px", lineHeight: 1.6, whiteSpace: "pre-line" }}>
                              {t.description}
                            </p>
                            <div style={{ fontSize: "11px", color: "#94a3b8", marginBottom: t.adminResponse ? "14px" : 0 }}>
                              Raised on {new Date(t.createdAt).toLocaleDateString()} at {new Date(t.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>

                            {/* TPO Official Response */}
                            {t.adminResponse && (
                              <div style={{
                                background: "#f0fdf4",
                                border: "1px solid #bbf7d0",
                                borderRadius: "10px",
                                padding: "14px 16px",
                                marginTop: "12px",
                              }}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                                  <span style={{ fontSize: "12px", fontWeight: 700, color: "#15803d", display: "flex", alignItems: "center", gap: "6px" }}>
                                    <span>👨‍💼</span> Official Resolution from TPO Desk
                                  </span>
                                  {t.resolvedAt && (
                                    <span style={{ fontSize: "11px", color: "#166534" }}>
                                      Resolved {new Date(t.resolvedAt).toLocaleDateString()}
                                    </span>
                                  )}
                                </div>
                                <p style={{ margin: 0, fontSize: "13px", color: "#1e293b", lineHeight: 1.6, whiteSpace: "pre-line" }}>
                                  {t.adminResponse}
                                </p>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* ========================================================
          MODAL: ACCEPT / DECLINE OFFER CONFIRMATION
         ======================================================== */}
      {confirmingOffer && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(15, 23, 42, 0.65)",
          backdropFilter: "blur(4px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 100,
          padding: "20px",
        }}>
          <div style={{
            background: "#ffffff",
            borderRadius: "16px",
            width: "100%",
            maxWidth: "520px",
            padding: "28px",
            boxShadow: "0 20px 40px rgba(0,0,0,0.25)",
            border: "1px solid #e2e8f0",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <span style={{ fontSize: "28px" }}>
                  {confirmingOffer.action === "accept" ? "🎉" : "⚠️"}
                </span>
                <h3 style={{ margin: 0, fontSize: "18px", color: "#0f172a", fontWeight: 700 }}>
                  {confirmingOffer.action === "accept" ? "Accept Employment Offer" : "Decline Job Offer"}
                </h3>
              </div>
              <button
                onClick={() => setConfirmingOffer(null)}
                style={{ background: "none", border: "none", fontSize: "18px", color: "#64748b", cursor: "pointer" }}
              >
                ✕
              </button>
            </div>

            <div style={{
              background: confirmingOffer.action === "accept" ? "#f0fdf4" : "#fef2f2",
              border: `1px solid ${confirmingOffer.action === "accept" ? "#bbf7d0" : "#fecaca"}`,
              borderRadius: "10px",
              padding: "16px",
              marginBottom: "18px",
            }}>
              <div style={{ fontSize: "16px", fontWeight: 700, color: "#0f172a" }}>
                {confirmingOffer.offer.jobTitle || confirmingOffer.offer.designation || "Job Position"}
              </div>
              <div style={{ fontSize: "13px", color: "#475569", marginTop: "2px" }}>
                🏢 {confirmingOffer.offer.company?.name || confirmingOffer.offer.drive?.company?.name || "Company"}
              </div>
              <div style={{ fontSize: "20px", fontWeight: 800, color: "#047857", marginTop: "6px" }}>
                ₹{confirmingOffer.offer.package} LPA CTC
              </div>
            </div>

            {confirmingOffer.action === "accept" ? (
              <p style={{ margin: "0 0 20px", fontSize: "13px", color: "#475569", lineHeight: "1.6" }}>
                By accepting, you officially confirm your acceptance of this campus placement offer. Your status will be updated to <strong>Placed</strong> in the XYZ CRPC portal.
                {Number(confirmingOffer.offer.package) < 6 && (
                  <span style={{ display: "block", marginTop: "8px", color: "#047857", fontWeight: 600 }}>
                    💡 Under XYZ policy, you will still remain eligible to apply for Dream (6-10 LPA) and Super Dream (≥ 10 LPA) drives to upgrade your offer!
                  </span>
                )}
              </p>
            ) : (
              <p style={{ margin: "0 0 20px", fontSize: "13px", color: "#dc2626", lineHeight: "1.6" }}>
                Are you sure you want to decline this job offer? Once declined, you will not be able to reclaim this offer.
              </p>
            )}

            <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
              <button
                onClick={() => setConfirmingOffer(null)}
                disabled={respondingOfferLoading}
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
                onClick={() => handleOfferResponse(confirmingOffer.offer._id, confirmingOffer.action === "accept" ? "accepted" : "declined")}
                disabled={respondingOfferLoading}
                style={{
                  padding: "9px 24px",
                  background: confirmingOffer.action === "accept" ? "#15803d" : "#dc2626",
                  color: "#ffffff",
                  border: "none",
                  borderRadius: "8px",
                  fontWeight: 700,
                  fontSize: "13px",
                  cursor: "pointer",
                  boxShadow: confirmingOffer.action === "accept" ? "0 2px 8px rgba(21, 128, 61, 0.3)" : "0 2px 8px rgba(220, 38, 38, 0.3)",
                }}
              >
                {respondingOfferLoading ? "Processing..." : confirmingOffer.action === "accept" ? "✓ Yes, Accept Offer" : "✕ Yes, Decline Offer"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: CREATE SUPPORT TICKET */}
      {showCreateTicketModal && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(15, 23, 42, 0.65)",
          backdropFilter: "blur(4px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 110,
          padding: "20px",
        }}>
          <div style={{
            background: "#ffffff",
            borderRadius: "16px",
            width: "100%",
            maxWidth: "560px",
            maxHeight: "90vh",
            overflowY: "auto",
            padding: "28px",
            boxShadow: "0 20px 40px rgba(0,0,0,0.25)",
            border: "1px solid #e2e8f0",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <span style={{ fontSize: "26px" }}>🎫</span>
                <div>
                  <h3 style={{ margin: 0, fontSize: "18px", color: "#0f172a", fontWeight: 700 }}>
                    Raise Grievance / Support Ticket
                  </h3>
                  <p style={{ margin: 0, fontSize: "12px", color: "#64748b" }}>
                    Official placement support request to XYZ CRPC
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowCreateTicketModal(false);
                  setTicketFeedback("");
                }}
                style={{ background: "none", border: "none", fontSize: "18px", color: "#64748b", cursor: "pointer" }}
              >
                ✕
              </button>
            </div>

            {ticketFeedback && (
              <div style={{
                padding: "12px 16px",
                borderRadius: "8px",
                marginBottom: "16px",
                fontSize: "13px",
                fontWeight: 500,
                background: ticketFeedbackType === "success" ? "#f0fdf4" : "#fef2f2",
                color: ticketFeedbackType === "success" ? "#166534" : "#991b1b",
                border: `1px solid ${ticketFeedbackType === "success" ? "#bbf7d0" : "#fecaca"}`,
              }}>
                {ticketFeedback}
              </div>
            )}

            <form onSubmit={handleCreateTicketSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#334155", marginBottom: "6px" }}>
                  Category <span style={{ color: "#ef4444" }}>*</span>
                </label>
                <select
                  value={newTicketForm.category}
                  onChange={(e) => setNewTicketForm({ ...newTicketForm, category: e.target.value })}
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
                  <option value="academic_discrepancy">Academic / CGPA / Backlog Discrepancy</option>
                  <option value="drive_eligibility">Placement Drive Eligibility Issue</option>
                  <option value="interview_clash">Interview Schedule Clash / Rescheduling</option>
                  <option value="offer_query">Offer Letter / Package / Joining Verification</option>
                  <option value="technical_issue">Portal / Resume / Technical Bug</option>
                  <option value="other">Other Grievance / Inquiries</option>
                </select>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#334155", marginBottom: "6px" }}>
                    Priority Level <span style={{ color: "#ef4444" }}>*</span>
                  </label>
                  <select
                    value={newTicketForm.priority}
                    onChange={(e) => setNewTicketForm({ ...newTicketForm, priority: e.target.value })}
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
                    <option value="low">Low (Informational query)</option>
                    <option value="medium">Medium (Standard inquiry)</option>
                    <option value="high">High (Time sensitive / Clash)</option>
                    <option value="urgent">Urgent (Immediate deadline)</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#334155", marginBottom: "6px" }}>
                    Related Company / Drive
                  </label>
                  <select
                    value={newTicketForm.driveId}
                    onChange={(e) => setNewTicketForm({ ...newTicketForm, driveId: e.target.value })}
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
                    <option value="">-- None / General Campus Issue --</option>
                    {drives && drives.map((d) => (
                      <option key={d._id} value={d._id}>
                        {d.company?.name || "Company"} - {d.jobTitle}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#334155", marginBottom: "6px" }}>
                  Subject / Summary <span style={{ color: "#ef4444" }}>*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g., Unable to apply due to Semester 5 CGPA mismatch"
                  value={newTicketForm.subject}
                  onChange={(e) => setNewTicketForm({ ...newTicketForm, subject: e.target.value })}
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    borderRadius: "8px",
                    border: "1px solid #cbd5e1",
                    fontSize: "14px",
                    color: "#0f172a",
                    boxSizing: "border-box",
                    outline: "none",
                  }}
                  required
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#334155", marginBottom: "6px" }}>
                  Detailed Description <span style={{ color: "#ef4444" }}>*</span>
                </label>
                <textarea
                  rows={4}
                  placeholder="Please describe the issue in detail, mentioning semester, subject codes, error messages, or affected interview rounds..."
                  value={newTicketForm.description}
                  onChange={(e) => setNewTicketForm({ ...newTicketForm, description: e.target.value })}
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    borderRadius: "8px",
                    border: "1px solid #cbd5e1",
                    fontSize: "14px",
                    color: "#0f172a",
                    boxSizing: "border-box",
                    outline: "none",
                    resize: "vertical",
                    fontFamily: "inherit",
                  }}
                  required
                />
              </div>

              <div style={{
                background: "#f8fafc",
                border: "1px dashed #cbd5e1",
                borderRadius: "8px",
                padding: "10px 14px",
                fontSize: "12px",
                color: "#64748b",
                lineHeight: "1.5",
              }}>
                🔒 <strong>Placement Cell Policy:</strong> All grievances are audited by the Training & Placement Officer. Malicious or abusive submissions will result in immediate disqualification from ongoing campus placement cycles.
              </div>

              <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", marginTop: "8px" }}>
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateTicketModal(false);
                    setTicketFeedback("");
                  }}
                  disabled={submittingTicket}
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
                  disabled={submittingTicket}
                  style={{
                    padding: "9px 22px",
                    background: submittingTicket ? "#94a3b8" : "#2563eb",
                    color: "#ffffff",
                    border: "none",
                    borderRadius: "8px",
                    fontWeight: 700,
                    fontSize: "13px",
                    cursor: submittingTicket ? "not-allowed" : "pointer",
                    boxShadow: "0 2px 8px rgba(37, 99, 235, 0.25)",
                  }}
                >
                  {submittingTicket ? "Submitting Ticket..." : "Submit Grievance Ticket"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
