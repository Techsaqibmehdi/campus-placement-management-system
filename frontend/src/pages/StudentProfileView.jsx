import { useState } from "react";
import { submitScoreUpdateRequest } from "../api/studentApi";

export default function StudentProfileView({
  profile,
  offers,
  onUpdateProfile,
  onUploadResume,
  onDeleteResume,
  onSetPrimaryResume,
  onRefreshProfile,
  resumeLoading,
}) {
  const [subTab, setSubTab] = useState("education"); // "basic" | "education" | "skills" | "projects" | "resumes"
  const [editingEducation, setEditingEducation] = useState(false);
  const [savingEducation, setSavingEducation] = useState(false);
  const [educationForm, setEducationForm] = useState({
    cgpa: profile?.cgpa ?? "",
    tenthPercentage: profile?.tenthPercentage ?? "",
    twelfthPercentage: profile?.twelfthPercentage ?? "",
    backlogs: profile?.backlogs ?? 0,
  });

  // Academic Score Locking & TPO Approval State
  const isScoresLocked = Boolean(
    profile?.academicScoresLocked ||
    (profile?.cgpa !== null && profile?.cgpa !== undefined &&
     profile?.tenthPercentage !== null && profile?.tenthPercentage !== undefined)
  );
  const latestScoreRequest = profile?.latestScoreRequest;
  const isPendingApproval = latestScoreRequest?.status === "pending";

  const [showScoreRequestModal, setShowScoreRequestModal] = useState(false);
  const [submittingScoreRequest, setSubmittingScoreRequest] = useState(false);
  const [scoreRequestFeedback, setScoreRequestFeedback] = useState("");
  const [scoreRequestFeedbackType, setScoreRequestFeedbackType] = useState("");
  const [scoreRequestForm, setScoreRequestForm] = useState({
    cgpa: profile?.cgpa ?? "",
    tenthPercentage: profile?.tenthPercentage ?? "",
    twelfthPercentage: profile?.twelfthPercentage ?? "",
    backlogs: profile?.backlogs ?? 0,
    reason: "",
    proofDocumentUrl: "",
  });

  const [editingSkills, setEditingSkills] = useState(false);
  const [newSkillInput, setNewSkillInput] = useState("");

  const [editingProject, setEditingProject] = useState(false);
  const [editingProjectIndex, setEditingProjectIndex] = useState(null);
  const [savingProject, setSavingProject] = useState(false);
  const [projectForm, setProjectForm] = useState({
    name: "",
    description: "",
    technologies: "",
    githubUrl: "",
    liveUrl: "",
  });

  const [resumeFile, setResumeFile] = useState(null);
  const [uploadMessage, setUploadMessage] = useState("");

  const handleEducationSubmit = async (e) => {
    e.preventDefault();
    setSavingEducation(true);
    try {
      await onUpdateProfile({
        cgpa: Number(educationForm.cgpa),
        tenthPercentage: Number(educationForm.tenthPercentage),
        twelfthPercentage: Number(educationForm.twelfthPercentage),
        backlogs: Number(educationForm.backlogs),
      });
      setEditingEducation(false);
      if (onRefreshProfile) {
        await onRefreshProfile();
      }
    } catch (err) {
      console.error("Failed to update education:", err);
    } finally {
      setSavingEducation(false);
    }
  };

  const handleScoreRequestSubmit = async (e) => {
    e.preventDefault();
    if (!scoreRequestForm.reason.trim()) {
      setScoreRequestFeedback("Please provide an official justification / reason for the score change.");
      setScoreRequestFeedbackType("error");
      return;
    }
    setSubmittingScoreRequest(true);
    setScoreRequestFeedback("");
    try {
      await submitScoreUpdateRequest({
        requestedScores: {
          cgpa: Number(scoreRequestForm.cgpa),
          tenthPercentage: Number(scoreRequestForm.tenthPercentage),
          twelfthPercentage: Number(scoreRequestForm.twelfthPercentage),
          backlogs: Number(scoreRequestForm.backlogs),
        },
        reason: scoreRequestForm.reason.trim(),
        proofDocumentUrl: (scoreRequestForm.proofDocumentUrl || "").trim(),
      });
      setScoreRequestFeedback("✓ Academic score change request submitted to TPO! The CRPC Placement Desk has been notified.");
      setScoreRequestFeedbackType("success");
      if (onRefreshProfile) {
        await onRefreshProfile();
      }
      setTimeout(() => {
        setShowScoreRequestModal(false);
        setScoreRequestFeedback("");
      }, 2000);
    } catch (err) {
      setScoreRequestFeedback(err.response?.data?.message || err.message || "Failed to submit score change request");
      setScoreRequestFeedbackType("error");
    } finally {
      setSubmittingScoreRequest(false);
    }
  };

  const handleAddSkill = async (e) => {
    e.preventDefault();
    if (!newSkillInput.trim()) return;
    const currentSkills = profile?.skills || [];
    if (!currentSkills.includes(newSkillInput.trim())) {
      const updated = [...currentSkills, newSkillInput.trim()];
      await onUpdateProfile({ skills: updated });
    }
    setNewSkillInput("");
  };

  const handleRemoveSkill = async (skillToRemove) => {
    const updated = (profile?.skills || []).filter((s) => s !== skillToRemove);
    await onUpdateProfile({ skills: updated });
  };

  const handleProjectSubmit = async (e) => {
    e.preventDefault();
    if (!projectForm.name.trim()) return;
    setSavingProject(true);
    try {
      const currentProjects = profile?.projects || [];
      const techArray = projectForm.technologies
        ? projectForm.technologies.split(",").map((t) => t.trim()).filter(Boolean)
        : [];
      const newProjData = {
        name: projectForm.name.trim(),
        description: projectForm.description ? projectForm.description.trim() : "",
        technologies: techArray,
        githubUrl: projectForm.githubUrl ? projectForm.githubUrl.trim() : "",
        liveUrl: projectForm.liveUrl ? projectForm.liveUrl.trim() : "",
      };

      let updated;
      if (editingProjectIndex !== null && editingProjectIndex >= 0) {
        updated = currentProjects.map((p, idx) => (idx === editingProjectIndex ? newProjData : p));
      } else {
        updated = [...currentProjects, newProjData];
      }

      await onUpdateProfile({ projects: updated });
      setProjectForm({ name: "", description: "", technologies: "", githubUrl: "", liveUrl: "" });
      setEditingProjectIndex(null);
      setEditingProject(false);
    } catch (err) {
      console.error("Failed to save project:", err);
    } finally {
      setSavingProject(false);
    }
  };

  const handleDeleteProject = async (indexToDelete) => {
    const proj = profile?.projects?.[indexToDelete];
    const projName = proj?.name || "this project";
    if (!window.confirm(`Are you sure you want to delete "${projName}"?`)) {
      return;
    }
    const currentProjects = profile?.projects || [];
    const updated = currentProjects.filter((_, idx) => idx !== indexToDelete);
    await onUpdateProfile({ projects: updated });
  };

  const handleEditProjectClick = (proj, idx) => {
    setEditingProjectIndex(idx);
    setProjectForm({
      name: proj.name || "",
      description: proj.description || "",
      technologies: (proj.technologies || []).join(", "),
      githubUrl: proj.githubUrl || "",
      liveUrl: proj.liveUrl || "",
    });
    setEditingProject(true);
  };

  const handleCancelProject = () => {
    setProjectForm({ name: "", description: "", technologies: "", githubUrl: "", liveUrl: "" });
    setEditingProjectIndex(null);
    setEditingProject(false);
  };

  const handleResumeUploadSubmit = async (e) => {
    e.preventDefault();
    if (!resumeFile) return;
    setUploadMessage("");
    try {
      await onUploadResume(resumeFile);
      setResumeFile(null);
      setUploadMessage("✓ Resume uploaded successfully!");
    } catch (err) {
      setUploadMessage(err.response?.data?.message || err.message || "Failed to upload resume");
    }
  };

  const isPlaced = offers?.some((o) => o.status === "accepted");
  const acceptedOffer = offers?.find((o) => o.status === "accepted");

  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: "280px 1fr",
      gap: "24px",
      alignItems: "start",
    }}>
      {/* Left Sub-Sidebar (Profile Navigation) */}
      <div style={{
        background: "#ffffff",
        border: "1px solid #e5e7eb",
        borderRadius: "14px",
        padding: "24px 16px",
        boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
      }}>
        {/* User Card */}
        <div style={{ textAlign: "center", marginBottom: "20px" }}>
          <div style={{
            width: "72px",
            height: "72px",
            borderRadius: "50%",
            background: "#2563eb",
            color: "#ffffff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "26px",
            fontWeight: 700,
            margin: "0 auto 12px",
          }}>
            {profile?.user?.name ? profile.user.name.charAt(0).toUpperCase() : "S"}
          </div>
          <h3 style={{ margin: "0 0 4px", fontSize: "17px", color: "#0f172a", fontWeight: 700 }}>
            {profile?.user?.name || "Student"}
          </h3>
          <p style={{ margin: 0, color: "#64748b", fontSize: "13px" }}>
            Roll No: <strong>{profile?.rollNumber || "N/A"}</strong>
          </p>
        </div>

        {/* Verification / Placement Banner */}
        <div style={{
          background: isPlaced ? "#ecfdf5" : "#f5f3ff",
          border: isPlaced ? "1px solid #a7f3d0" : "1px solid #ddd6fe",
          borderRadius: "8px",
          padding: "10px 12px",
          marginBottom: "20px",
          textAlign: "center",
          fontSize: "12px",
          fontWeight: 600,
          color: isPlaced ? "#065f46" : "#6d28d9",
        }}>
          {isPlaced ? `🏆 Placed at ${acceptedOffer?.company?.name || "Company"}` : "✓ Your profile is verified for campus placements"}
        </div>

        {/* Navigation Menu */}
        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          {[
            { id: "basic", label: "Basic Details" },
            { id: "education", label: "Education Details" },
            { id: "skills", label: "Skills & Languages" },
            { id: "projects", label: "Projects & Accomplishments" },
            { id: "resumes", label: "Resume, Docs & Write-ups" },
          ].map((tab) => {
            const isActive = subTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setSubTab(tab.id)}
                style={{
                  textAlign: "left",
                  padding: "11px 16px",
                  borderRadius: "8px",
                  border: "none",
                  background: isActive ? "#eff6ff" : "transparent",
                  color: isActive ? "#2563eb" : "#475569",
                  fontWeight: isActive ? 700 : 500,
                  fontSize: "14px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  transition: "all 0.15s",
                }}
              >
                <span>{tab.label}</span>
                {isActive && <span style={{ color: "#2563eb" }}>›</span>}
              </button>
            );
          })}
        </div>
      </div>

      {/* Right Content Area */}
      <div style={{
        background: "#ffffff",
        border: "1px solid #e5e7eb",
        borderRadius: "14px",
        padding: "28px",
        boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
      }}>
        {/* SUBTAB 1: BASIC DETAILS */}
        {subTab === "basic" && (
          <div>
            <h2 style={{ margin: "0 0 20px", fontSize: "20px", color: "#0f172a" }}>Basic Details</h2>
            <div className="profile-grid">
              <div className="profile-item">
                <span>Full Name</span>
                <strong>{profile?.user?.name || "N/A"}</strong>
              </div>
              <div className="profile-item">
                <span>Registered Email</span>
                <strong>{profile?.user?.email || "N/A"}</strong>
              </div>
              <div className="profile-item">
                <span>College Institution</span>
                <strong>{profile?.user?.college || "XYZ Group of Institutions"}</strong>
              </div>
              <div className="profile-item">
                <span>Institutional Roll No.</span>
                <strong>{profile?.rollNumber || "N/A"}</strong>
              </div>
              <div className="profile-item">
                <span>Program / Degree</span>
                <strong>{profile?.course || "MCA"}</strong>
              </div>
              <div className="profile-item">
                <span>Department / Branch</span>
                <strong>{profile?.branch || "Computer Applications"}</strong>
              </div>
            </div>

            {/* Placement Status Card */}
            <div style={{ marginTop: "24px", paddingTop: "20px", borderTop: "1px solid #f1f5f9" }}>
              <h3 style={{ fontSize: "16px", color: "#1e293b", margin: "0 0 14px" }}>
                Placement Enrolment Status
              </h3>
              <div style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "16px 20px",
                borderRadius: "10px",
                border: "1px solid #e2e8f0",
                background: "#f8fafc",
              }}>
                <div>
                  <h4 style={{ margin: "0 0 4px", fontSize: "15px", color: "#0f172a" }}>
                    Campus Placement - Batch 2026
                  </h4>
                  <p style={{ margin: 0, fontSize: "13px", color: "#64748b" }}>
                    Status: {isPlaced ? "Placed with offer" : "Eligible for on-campus and virtual drives"}
                  </p>
                </div>
                <span className={`status-badge ${isPlaced ? "status-selected" : "status-applied"}`}>
                  {isPlaced ? "🏆 Placed" : "Enrolled"}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* SUBTAB 2: EDUCATION DETAILS (Screenshot 3 & 4) */}
        {subTab === "education" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", flexWrap: "wrap", gap: "10px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                <h2 style={{ margin: 0, fontSize: "20px", color: "#0f172a" }}>Education Details</h2>
                {isScoresLocked ? (
                  <span style={{
                    fontSize: "11px",
                    fontWeight: 700,
                    background: "#f0fdf4",
                    color: "#15803d",
                    border: "1px solid #bbf7d0",
                    padding: "3px 9px",
                    borderRadius: "20px",
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                  }}>
                    🔒 Verified & Locked by CRPC
                  </span>
                ) : (
                  <span style={{
                    fontSize: "11px",
                    fontWeight: 700,
                    background: "#eff6ff",
                    color: "#1d4ed8",
                    border: "1px solid #bfdbfe",
                    padding: "3px 9px",
                    borderRadius: "20px",
                  }}>
                    🟢 1st-Time Setup (Direct Entry)
                  </span>
                )}
              </div>

              {!editingEducation && (
                <div>
                  {isScoresLocked ? (
                    <button
                      onClick={() => {
                        setScoreRequestForm({
                          cgpa: profile?.cgpa ?? "",
                          tenthPercentage: profile?.tenthPercentage ?? "",
                          twelfthPercentage: profile?.twelfthPercentage ?? "",
                          backlogs: profile?.backlogs ?? 0,
                          reason: "",
                          proofDocumentUrl: "",
                        });
                        setShowScoreRequestModal(true);
                        setScoreRequestFeedback("");
                      }}
                      style={{
                        padding: "9px 18px",
                        background: isPendingApproval ? "#fffbeb" : "#eff6ff",
                        color: isPendingApproval ? "#b45309" : "#1d4ed8",
                        border: `1px solid ${isPendingApproval ? "#fde68a" : "#bfdbfe"}`,
                        borderRadius: "8px",
                        fontSize: "13px",
                        fontWeight: 700,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                      }}
                    >
                      <span>{isPendingApproval ? "⏳ Score Update Pending TPO Approval" : "📝 Request Score Update (TPO Approval)"}</span>
                    </button>
                  ) : (
                    <button
                      className="drive-button-secondary"
                      onClick={() => {
                        setEducationForm({
                          cgpa: profile?.cgpa ?? "",
                          tenthPercentage: profile?.tenthPercentage ?? "",
                          twelfthPercentage: profile?.twelfthPercentage ?? "",
                          backlogs: profile?.backlogs ?? 0,
                        });
                        setEditingEducation(true);
                      }}
                    >
                      ⚡ Set Initial Academic Scores
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Pending Score Update Alert */}
            {latestScoreRequest?.status === "pending" && (
              <div style={{
                background: "#fffbeb",
                border: "1px solid #fde68a",
                borderRadius: "12px",
                padding: "16px 20px",
                marginBottom: "20px",
                boxShadow: "0 2px 8px rgba(217,119,6,0.06)",
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "8px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ fontSize: "22px" }}>⏳</span>
                    <div>
                      <h4 style={{ margin: 0, fontSize: "14px", fontWeight: 700, color: "#92400e" }}>
                        Score Update Request Under TPO Review
                      </h4>
                      <p style={{ margin: "2px 0 0", fontSize: "12px", color: "#b45309" }}>
                        Submitted on {new Date(latestScoreRequest.createdAt).toLocaleDateString()} • Pending administrative verification
                      </p>
                    </div>
                  </div>
                  <span style={{ background: "#fef3c7", color: "#92400e", fontSize: "11px", fontWeight: 800, padding: "3px 8px", borderRadius: "6px", border: "1px solid #fcd34d" }}>
                    PENDING APPROVAL
                  </span>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: "10px", marginTop: "12px", background: "#ffffff", padding: "12px", borderRadius: "8px", border: "1px solid #fef3c7" }}>
                  <div>
                    <span style={{ fontSize: "11px", color: "#64748b", display: "block" }}>Requested CGPA</span>
                    <strong style={{ fontSize: "15px", color: "#0f172a" }}>{latestScoreRequest.requestedScores?.cgpa}</strong>
                    <span style={{ fontSize: "11px", color: "#64748b", marginLeft: "4px" }}>(Current: {profile?.cgpa ?? "N/A"})</span>
                  </div>
                  <div>
                    <span style={{ fontSize: "11px", color: "#64748b", display: "block" }}>Requested 10th %</span>
                    <strong style={{ fontSize: "15px", color: "#0f172a" }}>{latestScoreRequest.requestedScores?.tenthPercentage}%</strong>
                    <span style={{ fontSize: "11px", color: "#64748b", marginLeft: "4px" }}>(Current: {profile?.tenthPercentage ?? "N/A"}%)</span>
                  </div>
                  <div>
                    <span style={{ fontSize: "11px", color: "#64748b", display: "block" }}>Requested 12th %</span>
                    <strong style={{ fontSize: "15px", color: "#0f172a" }}>{latestScoreRequest.requestedScores?.twelfthPercentage}%</strong>
                    <span style={{ fontSize: "11px", color: "#64748b", marginLeft: "4px" }}>(Current: {profile?.twelfthPercentage ?? "N/A"}%)</span>
                  </div>
                  <div>
                    <span style={{ fontSize: "11px", color: "#64748b", display: "block" }}>Requested Backlogs</span>
                    <strong style={{ fontSize: "15px", color: "#0f172a" }}>{latestScoreRequest.requestedScores?.backlogs}</strong>
                    <span style={{ fontSize: "11px", color: "#64748b", marginLeft: "4px" }}>(Current: {profile?.backlogs ?? 0})</span>
                  </div>
                </div>

                <div style={{ marginTop: "10px", fontSize: "12px", color: "#78350f" }}>
                  <strong>Official Justification:</strong> <em>"{latestScoreRequest.reason}"</em>
                </div>
              </div>
            )}

            {/* Rejected Score Update Alert */}
            {latestScoreRequest?.status === "rejected" && (
              <div style={{
                background: "#fef2f2",
                border: "1px solid #fecaca",
                borderRadius: "12px",
                padding: "16px 20px",
                marginBottom: "20px",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
                  <span style={{ fontSize: "18px" }}>❌</span>
                  <h4 style={{ margin: 0, fontSize: "14px", fontWeight: 700, color: "#991b1b" }}>
                    Previous Score Update Request Rejected by TPO
                  </h4>
                </div>
                <div style={{ fontSize: "13px", color: "#7f1d1d", lineHeight: 1.5 }}>
                  <strong>TPO Officer Remarks:</strong> <em>"{latestScoreRequest.reviewRemarks || 'Discrepancy in submitted grades'}"</em>
                </div>
                <div style={{ fontSize: "11px", color: "#991b1b", marginTop: "6px" }}>
                  Reviewed on {new Date(latestScoreRequest.reviewedAt).toLocaleDateString()}. If your marks have been re-evaluated, you may submit a new request with supporting clarification.
                </div>
              </div>
            )}

            {editingEducation ? (
              <div style={{
                background: "#ffffff",
                borderRadius: "16px",
                border: "1px solid #e2e8f0",
                boxShadow: "0 10px 30px -5px rgba(15, 23, 42, 0.08)",
                padding: "28px",
                marginBottom: "24px",
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "22px", flexWrap: "wrap", gap: "10px" }}>
                  <div>
                    <h3 style={{ margin: "0 0 6px", fontSize: "19px", color: "#0f172a", fontWeight: 700, display: "flex", alignItems: "center", gap: "8px" }}>
                      <span>✏️</span> Edit Academic Scores & Eligibility Marks
                    </h3>
                    <p style={{ margin: 0, color: "#64748b", fontSize: "13px", lineHeight: 1.5 }}>
                      Accurate scores ensure your eligibility is automatically calculated for matching Super Dream, Dream, and Regular campus drives.
                    </p>
                  </div>
                  <span style={{
                    background: "#eff6ff",
                    color: "#1d4ed8",
                    border: "1px solid #bfdbfe",
                    padding: "4px 12px",
                    borderRadius: "20px",
                    fontSize: "12px",
                    fontWeight: 600,
                  }}>
                    XYZ Placement Cell Audited
                  </span>
                </div>

                <form onSubmit={handleEducationSubmit} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                  {/* Section 1: Current Degree Standing */}
                  <div style={{
                    background: "#f8fafc",
                    border: "1px solid #e2e8f0",
                    borderRadius: "12px",
                    padding: "20px",
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
                      <span style={{ fontSize: "20px" }}>🎓</span>
                      <div>
                        <h4 style={{ margin: 0, fontSize: "14px", fontWeight: 700, color: "#1e293b" }}>
                          Current Degree Standing ({profile?.course || "Degree"} - {profile?.branch || "Branch"})
                        </h4>
                        <span style={{ fontSize: "12px", color: "#64748b" }}>
                          Roll No: {profile?.rollNumber || "N/A"} • College: {profile?.user?.college || "XYZ Group of Institutions"}
                        </span>
                      </div>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "18px" }}>
                      <div>
                        <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", fontWeight: 600, color: "#334155", marginBottom: "6px" }}>
                          <span>📈</span> Current CGPA (0.00 - 10.00) *
                        </label>
                        <div style={{ position: "relative" }}>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            max="10"
                            required
                            value={educationForm.cgpa}
                            onChange={(e) => setEducationForm({ ...educationForm, cgpa: e.target.value })}
                            placeholder="e.g. 8.45"
                            style={{
                              width: "100%",
                              padding: "10px 52px 10px 14px",
                              borderRadius: "8px",
                              border: "1px solid #cbd5e1",
                              fontSize: "14px",
                              fontWeight: 600,
                              color: "#0f172a",
                              outline: "none",
                              boxSizing: "border-box",
                              background: "#ffffff",
                            }}
                          />
                          <span style={{
                            position: "absolute",
                            right: "12px",
                            top: "50%",
                            transform: "translateY(-50%)",
                            fontSize: "12px",
                            fontWeight: 700,
                            color: "#64748b",
                          }}>
                            / 10.0
                          </span>
                        </div>
                        <span style={{ display: "block", fontSize: "11px", color: "#64748b", marginTop: "4px" }}>
                          Cumulative Grade Point Average across completed semesters
                        </span>
                      </div>

                      <div>
                        <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", fontWeight: 600, color: "#334155", marginBottom: "6px" }}>
                          <span>⚠️</span> Active / Ongoing Backlogs *
                        </label>
                        <div style={{ position: "relative" }}>
                          <input
                            type="number"
                            min="0"
                            required
                            value={educationForm.backlogs}
                            onChange={(e) => setEducationForm({ ...educationForm, backlogs: e.target.value })}
                            placeholder="0"
                            style={{
                              width: "100%",
                              padding: "10px 64px 10px 14px",
                              borderRadius: "8px",
                              border: "1px solid #cbd5e1",
                              fontSize: "14px",
                              fontWeight: 600,
                              color: Number(educationForm.backlogs) > 0 ? "#dc2626" : "#0f172a",
                              outline: "none",
                              boxSizing: "border-box",
                              background: "#ffffff",
                            }}
                          />
                          <span style={{
                            position: "absolute",
                            right: "12px",
                            top: "50%",
                            transform: "translateY(-50%)",
                            fontSize: "12px",
                            fontWeight: 700,
                            color: Number(educationForm.backlogs) > 0 ? "#dc2626" : "#059669",
                          }}>
                            {Number(educationForm.backlogs) > 0 ? "Pending" : "Cleared"}
                          </span>
                        </div>
                        <span style={{ display: "block", fontSize: "11px", color: "#64748b", marginTop: "4px" }}>
                          Enter 0 if you have cleared all previous semester subjects
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Section 2: School & Pre-University Scores */}
                  <div style={{
                    background: "#f8fafc",
                    border: "1px solid #e2e8f0",
                    borderRadius: "12px",
                    padding: "20px",
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
                      <span style={{ fontSize: "20px" }}>📜</span>
                      <div>
                        <h4 style={{ margin: 0, fontSize: "14px", fontWeight: 700, color: "#1e293b" }}>
                          Prior Secondary & Senior Secondary Records
                        </h4>
                        <span style={{ fontSize: "12px", color: "#64748b" }}>
                          Required by Tier-1 product and MNC recruiters for initial eligibility cutoffs
                        </span>
                      </div>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "18px" }}>
                      <div>
                        <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", fontWeight: 600, color: "#334155", marginBottom: "6px" }}>
                          <span>🏫</span> Class 10th Board Percentage (%) *
                        </label>
                        <div style={{ position: "relative" }}>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            max="100"
                            required
                            value={educationForm.tenthPercentage}
                            onChange={(e) => setEducationForm({ ...educationForm, tenthPercentage: e.target.value })}
                            placeholder="e.g. 86.5"
                            style={{
                              width: "100%",
                              padding: "10px 40px 10px 14px",
                              borderRadius: "8px",
                              border: "1px solid #cbd5e1",
                              fontSize: "14px",
                              fontWeight: 600,
                              color: "#0f172a",
                              outline: "none",
                              boxSizing: "border-box",
                              background: "#ffffff",
                            }}
                          />
                          <span style={{
                            position: "absolute",
                            right: "14px",
                            top: "50%",
                            transform: "translateY(-50%)",
                            fontSize: "13px",
                            fontWeight: 700,
                            color: "#64748b",
                          }}>
                            %
                          </span>
                        </div>
                        <span style={{ display: "block", fontSize: "11px", color: "#64748b", marginTop: "4px" }}>
                          Overall aggregate percentage scored in 10th board exams
                        </span>
                      </div>

                      <div>
                        <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", fontWeight: 600, color: "#334155", marginBottom: "6px" }}>
                          <span>📚</span> Class 12th / Diploma Percentage (%) *
                        </label>
                        <div style={{ position: "relative" }}>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            max="100"
                            required
                            value={educationForm.twelfthPercentage}
                            onChange={(e) => setEducationForm({ ...educationForm, twelfthPercentage: e.target.value })}
                            placeholder="e.g. 82.0"
                            style={{
                              width: "100%",
                              padding: "10px 40px 10px 14px",
                              borderRadius: "8px",
                              border: "1px solid #cbd5e1",
                              fontSize: "14px",
                              fontWeight: 600,
                              color: "#0f172a",
                              outline: "none",
                              boxSizing: "border-box",
                              background: "#ffffff",
                            }}
                          />
                          <span style={{
                            position: "absolute",
                            right: "14px",
                            top: "50%",
                            transform: "translateY(-50%)",
                            fontSize: "13px",
                            fontWeight: 700,
                            color: "#64748b",
                          }}>
                            %
                          </span>
                        </div>
                        <span style={{ display: "block", fontSize: "11px", color: "#64748b", marginTop: "4px" }}>
                          Overall aggregate percentage scored in 12th / 3-Yr Diploma
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Policy Alert Note */}
                  <div style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    background: "#f0f9ff",
                    border: "1px solid #bae6fd",
                    borderRadius: "8px",
                    padding: "12px 16px",
                    fontSize: "12px",
                    color: "#0369a1",
                  }}>
                    <span style={{ fontSize: "18px" }}>ℹ️</span>
                    <div>
                      <strong>Academic Verification Note:</strong> Entered scores will be verified against official college transcripts and marksheets by XYZ CRPC during document verification.
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", paddingTop: "4px" }}>
                    <button
                      type="button"
                      disabled={savingEducation}
                      onClick={() => setEditingEducation(false)}
                      style={{
                        padding: "10px 20px",
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
                      disabled={savingEducation}
                      style={{
                        padding: "10px 24px",
                        background: "linear-gradient(135deg, #0284c7, #0369a1)",
                        border: "none",
                        borderRadius: "8px",
                        fontSize: "13px",
                        fontWeight: 700,
                        color: "#ffffff",
                        cursor: "pointer",
                        boxShadow: "0 2px 8px rgba(2, 132, 199, 0.35)",
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                      }}
                    >
                      <span>💾</span>
                      <span>{savingEducation ? "Saving Scores..." : "Save Academic Details"}</span>
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                {/* Current / Most Recent Course Card (Screenshot 4) */}
                <div style={{
                  border: "1px solid #e2e8f0",
                  borderRadius: "12px",
                  padding: "20px",
                  background: "#f8fafc",
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "14px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      <span style={{ fontSize: "28px" }}>🎓</span>
                      <div>
                        <h3 style={{ margin: "0 0 2px", fontSize: "17px", color: "#0f172a" }}>
                          {profile?.course || "MCA"} - {profile?.branch || "Computer Applications"}
                        </h3>
                        <span style={{ color: "#64748b", fontSize: "13px" }}>2024 - 2026</span>
                      </div>
                    </div>
                    <div style={{
                      fontSize: "22px",
                      fontWeight: 800,
                      color: "#059669",
                      background: "#ecfdf5",
                      padding: "4px 14px",
                      borderRadius: "8px",
                      border: "1px solid #a7f3d0",
                    }}>
                      {profile?.cgpa ? `${profile.cgpa} CGPA` : "Not Added"}
                    </div>
                  </div>

                  <div className="profile-grid">
                    <div className="profile-item">
                      <span>Institution</span>
                      <strong>{profile?.user?.college || "XYZ Group of Institutions"}</strong>
                    </div>
                    <div className="profile-item">
                      <span>Degree</span>
                      <strong>{profile?.course || "MCA"}</strong>
                    </div>
                    <div className="profile-item">
                      <span>Institutional Roll No.</span>
                      <strong>{profile?.rollNumber || "N/A"}</strong>
                    </div>
                    <div className="profile-item">
                      <span>Ongoing Backlogs</span>
                      <strong>{profile?.backlogs ?? 0}</strong>
                    </div>
                  </div>
                </div>

                {/* Class 12th Card (Screenshot 3) */}
                <div style={{
                  border: "1px solid #e2e8f0",
                  borderRadius: "12px",
                  padding: "20px",
                  background: "#ffffff",
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "14px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      <span style={{ fontSize: "24px" }}>🎓</span>
                      <div>
                        <h3 style={{ margin: "0 0 2px", fontSize: "16px", color: "#0f172a" }}>
                          CLASS XII (Senior Secondary)
                        </h3>
                        <span style={{ color: "#64748b", fontSize: "13px" }}>Higher Secondary Education</span>
                      </div>
                    </div>
                    <div style={{
                      fontSize: "18px",
                      fontWeight: 700,
                      color: "#059669",
                      background: "#ecfdf5",
                      padding: "3px 12px",
                      borderRadius: "8px",
                    }}>
                      {profile?.twelfthPercentage ? `${profile.twelfthPercentage}%` : "Not Added"}
                    </div>
                  </div>
                </div>

                {/* Class 10th Card */}
                <div style={{
                  border: "1px solid #e2e8f0",
                  borderRadius: "12px",
                  padding: "20px",
                  background: "#ffffff",
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "14px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      <span style={{ fontSize: "24px" }}>🎓</span>
                      <div>
                        <h3 style={{ margin: "0 0 2px", fontSize: "16px", color: "#0f172a" }}>
                          CLASS X (Secondary School)
                        </h3>
                        <span style={{ color: "#64748b", fontSize: "13px" }}>Secondary School Certificate</span>
                      </div>
                    </div>
                    <div style={{
                      fontSize: "18px",
                      fontWeight: 700,
                      color: "#059669",
                      background: "#ecfdf5",
                      padding: "3px 12px",
                      borderRadius: "8px",
                    }}>
                      {profile?.tenthPercentage ? `${profile.tenthPercentage}%` : "Not Added"}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* SUBTAB 3: SKILLS & LANGUAGES (Screenshot 2) */}
        {subTab === "skills" && (
          <div>
            <h2 style={{ margin: "0 0 20px", fontSize: "20px", color: "#0f172a" }}>Technical Skills</h2>
            <form onSubmit={handleAddSkill} style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
              <input
                type="text"
                placeholder="Type a skill e.g. Java, React, SQL..."
                value={newSkillInput}
                onChange={(e) => setNewSkillInput(e.target.value)}
                style={{ padding: "8px 14px", borderRadius: "8px", border: "1px solid #d1d5db", flex: 1 }}
              />
              <button type="submit" className="drive-button">
                + Add Skill
              </button>
            </form>

            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              {profile?.skills && profile.skills.length > 0 ? (
                profile.skills.map((skill, idx) => (
                  <span
                    key={idx}
                    style={{
                      background: "#f1f5f9",
                      border: "1px solid #e2e8f0",
                      padding: "6px 14px",
                      borderRadius: "20px",
                      fontSize: "13px",
                      fontWeight: 600,
                      color: "#1e293b",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    {skill}
                    <button
                      type="button"
                      onClick={() => handleRemoveSkill(skill)}
                      style={{ border: "none", background: "transparent", cursor: "pointer", color: "#94a3b8", fontWeight: 700 }}
                    >
                      ×
                    </button>
                  </span>
                ))
              ) : (
                <p style={{ color: "#64748b" }}>You have not added any technical skills yet.</p>
              )}
            </div>
          </div>
        )}

        {/* SUBTAB 4: PROJECTS */}
        {subTab === "projects" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", flexWrap: "wrap", gap: "12px" }}>
              <div>
                <h2 style={{ margin: "0 0 4px", fontSize: "20px", color: "#0f172a", fontWeight: 700 }}>
                  Technical Projects & Portfolio
                </h2>
                <p style={{ margin: 0, fontSize: "13px", color: "#64748b" }}>
                  Showcase your real-world software projects, hackathon prototypes, and academic development work.
                </p>
              </div>
              {!editingProject && (
                <button
                  onClick={() => {
                    setEditingProjectIndex(null);
                    setProjectForm({ name: "", description: "", technologies: "", githubUrl: "", liveUrl: "" });
                    setEditingProject(true);
                  }}
                  style={{
                    padding: "9px 18px",
                    background: "linear-gradient(135deg, #0284c7, #0369a1)",
                    color: "#ffffff",
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
                  <span>Add Project</span>
                </button>
              )}
            </div>

            {editingProject ? (
              <div style={{
                background: "#ffffff",
                borderRadius: "16px",
                border: "1px solid #e2e8f0",
                boxShadow: "0 10px 30px -5px rgba(15, 23, 42, 0.08)",
                padding: "26px",
                marginBottom: "24px",
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px" }}>
                  <div>
                    <h3 style={{ margin: "0 0 4px", fontSize: "18px", color: "#0f172a", fontWeight: 700, display: "flex", alignItems: "center", gap: "8px" }}>
                      <span>{editingProjectIndex !== null ? "✏️" : "🚀"}</span>
                      {editingProjectIndex !== null ? "Edit Project Details" : "Add New Technical Project"}
                    </h3>
                    <p style={{ margin: 0, color: "#64748b", fontSize: "13px" }}>
                      Provide clear details, tech stack, and links for hiring recruiters to review your coding competence.
                    </p>
                  </div>
                  <button
                    onClick={handleCancelProject}
                    style={{
                      background: "#f1f5f9",
                      border: "none",
                      width: "32px",
                      height: "32px",
                      borderRadius: "8px",
                      fontSize: "14px",
                      color: "#64748b",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                    title="Close"
                  >
                    ✕
                  </button>
                </div>

                <form onSubmit={handleProjectSubmit} style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "18px" }}>
                    <div>
                      <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", fontWeight: 600, color: "#334155", marginBottom: "6px" }}>
                        <span>🏷️</span> Project Title *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. AI-Powered Placement Portal with Razorpay"
                        value={projectForm.name}
                        onChange={(e) => setProjectForm({ ...projectForm, name: e.target.value })}
                        style={{
                          width: "100%",
                          padding: "10px 14px",
                          borderRadius: "8px",
                          border: "1px solid #cbd5e1",
                          fontSize: "14px",
                          color: "#0f172a",
                          outline: "none",
                          boxSizing: "border-box",
                        }}
                      />
                      <span style={{ display: "block", fontSize: "11px", color: "#64748b", marginTop: "4px" }}>
                        Concise title identifying your project
                      </span>
                    </div>

                    <div>
                      <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", fontWeight: 600, color: "#334155", marginBottom: "6px" }}>
                        <span>🛠️</span> Technologies Used *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. React.js, Node.js, Express, MongoDB, Tailwind"
                        value={projectForm.technologies}
                        onChange={(e) => setProjectForm({ ...projectForm, technologies: e.target.value })}
                        style={{
                          width: "100%",
                          padding: "10px 14px",
                          borderRadius: "8px",
                          border: "1px solid #cbd5e1",
                          fontSize: "14px",
                          color: "#0f172a",
                          outline: "none",
                          boxSizing: "border-box",
                        }}
                      />
                      <span style={{ display: "block", fontSize: "11px", color: "#64748b", marginTop: "4px" }}>
                        Frameworks, languages, or tools separated by commas
                      </span>
                    </div>

                    <div>
                      <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", fontWeight: 600, color: "#334155", marginBottom: "6px" }}>
                        <span>🐙</span> GitHub Repository URL
                      </label>
                      <input
                        type="url"
                        placeholder="https://github.com/your-username/project-repo"
                        value={projectForm.githubUrl}
                        onChange={(e) => setProjectForm({ ...projectForm, githubUrl: e.target.value })}
                        style={{
                          width: "100%",
                          padding: "10px 14px",
                          borderRadius: "8px",
                          border: "1px solid #cbd5e1",
                          fontSize: "14px",
                          color: "#0f172a",
                          outline: "none",
                          boxSizing: "border-box",
                        }}
                      />
                      <span style={{ display: "block", fontSize: "11px", color: "#64748b", marginTop: "4px" }}>
                        Public repository link with source code
                      </span>
                    </div>

                    <div>
                      <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", fontWeight: 600, color: "#334155", marginBottom: "6px" }}>
                        <span>🌐</span> Live Deployment / Demo Link
                      </label>
                      <input
                        type="url"
                        placeholder="https://myproject.vercel.app"
                        value={projectForm.liveUrl}
                        onChange={(e) => setProjectForm({ ...projectForm, liveUrl: e.target.value })}
                        style={{
                          width: "100%",
                          padding: "10px 14px",
                          borderRadius: "8px",
                          border: "1px solid #cbd5e1",
                          fontSize: "14px",
                          color: "#0f172a",
                          outline: "none",
                          boxSizing: "border-box",
                        }}
                      />
                      <span style={{ display: "block", fontSize: "11px", color: "#64748b", marginTop: "4px" }}>
                        Working hosted website or demo link
                      </span>
                    </div>
                  </div>

                  <div>
                    <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", fontWeight: 600, color: "#334155", marginBottom: "6px" }}>
                      <span>📝</span> Project Description & Architecture Details
                    </label>
                    <textarea
                      rows={4}
                      placeholder="• Built a scalable web application with authentication and role-based dashboards.&#10;• Integrated Razorpay for payments and PDFKit for auto-generated documents.&#10;• Optimized database aggregation queries for fast performance."
                      value={projectForm.description}
                      onChange={(e) => setProjectForm({ ...projectForm, description: e.target.value })}
                      style={{
                        width: "100%",
                        padding: "12px 14px",
                        borderRadius: "8px",
                        border: "1px solid #cbd5e1",
                        fontSize: "13px",
                        lineHeight: 1.6,
                        color: "#0f172a",
                        outline: "none",
                        boxSizing: "border-box",
                        fontFamily: "inherit",
                        resize: "vertical",
                      }}
                    />
                    <span style={{ display: "block", fontSize: "11px", color: "#64748b", marginTop: "4px" }}>
                      Highlight your core contributions, technical challenges resolved, and architecture decisions.
                    </span>
                  </div>

                  <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", paddingTop: "6px" }}>
                    <button
                      type="button"
                      onClick={handleCancelProject}
                      disabled={savingProject}
                      style={{
                        padding: "10px 20px",
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
                      disabled={savingProject}
                      style={{
                        padding: "10px 24px",
                        background: "linear-gradient(135deg, #0284c7, #0369a1)",
                        border: "none",
                        borderRadius: "8px",
                        fontSize: "13px",
                        fontWeight: 700,
                        color: "#ffffff",
                        cursor: "pointer",
                        boxShadow: "0 2px 8px rgba(2, 132, 199, 0.35)",
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                      }}
                    >
                      <span>💾</span>
                      <span>{savingProject ? "Saving..." : (editingProjectIndex !== null ? "Update Project" : "Save Project")}</span>
                    </button>
                  </div>
                </form>
              </div>
            ) : profile?.projects && profile.projects.length > 0 ? (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: "18px" }}>
                {profile.projects.map((proj, idx) => (
                  <div
                    key={idx}
                    style={{
                      background: "#ffffff",
                      borderRadius: "14px",
                      border: "1px solid #e2e8f0",
                      padding: "20px",
                      boxShadow: "0 4px 14px rgba(15, 23, 42, 0.04)",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                    }}
                  >
                    <div>
                      {/* Card Header */}
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px", gap: "10px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          <div style={{
                            width: "38px",
                            height: "38px",
                            borderRadius: "10px",
                            background: "#f0f9ff",
                            border: "1px solid #bae6fd",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "18px",
                            flexShrink: 0,
                          }}>
                            💻
                          </div>
                          <div>
                            <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 700, color: "#0f172a" }}>
                              {proj.name}
                            </h3>
                            <span style={{ fontSize: "11px", color: "#64748b" }}>
                              Project #{idx + 1}
                            </span>
                          </div>
                        </div>

                        {/* Actions: Edit & Delete */}
                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          <button
                            onClick={() => handleEditProjectClick(proj, idx)}
                            title="Edit Project"
                            style={{
                              padding: "5px 10px",
                              background: "#f8fafc",
                              border: "1px solid #cbd5e1",
                              borderRadius: "6px",
                              fontSize: "12px",
                              color: "#0369a1",
                              fontWeight: 600,
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              gap: "4px",
                            }}
                          >
                            <span>✏️</span>
                            <span>Edit</span>
                          </button>
                          <button
                            onClick={() => handleDeleteProject(idx)}
                            title="Delete Project"
                            style={{
                              padding: "5px 10px",
                              background: "#fef2f2",
                              border: "1px solid #fecaca",
                              borderRadius: "6px",
                              fontSize: "12px",
                              color: "#dc2626",
                              fontWeight: 600,
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              gap: "4px",
                            }}
                          >
                            <span>🗑️</span>
                            <span>Delete</span>
                          </button>
                        </div>
                      </div>

                      {/* Description */}
                      <p style={{
                        margin: "0 0 14px",
                        color: "#475569",
                        fontSize: "13px",
                        lineHeight: 1.6,
                        whiteSpace: "pre-line",
                      }}>
                        {proj.description || "No description provided."}
                      </p>

                      {/* Tech badges */}
                      {proj.technologies && proj.technologies.length > 0 && (
                        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: "16px" }}>
                          {proj.technologies.map((tech, tIdx) => (
                            <span
                              key={tIdx}
                              style={{
                                background: "#eff6ff",
                                color: "#1e40af",
                                border: "1px solid #dbeafe",
                                padding: "3px 9px",
                                borderRadius: "6px",
                                fontSize: "11px",
                                fontWeight: 600,
                              }}
                            >
                              {tech}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Links Row */}
                    <div style={{
                      display: "flex",
                      gap: "10px",
                      flexWrap: "wrap",
                      paddingTop: "12px",
                      borderTop: "1px solid #f1f5f9",
                    }}>
                      {proj.githubUrl && (
                        <a
                          href={proj.githubUrl}
                          target="_blank"
                          rel="noreferrer"
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "6px",
                            padding: "6px 12px",
                            background: "#0f172a",
                            color: "#ffffff",
                            borderRadius: "6px",
                            fontSize: "12px",
                            fontWeight: 600,
                            textDecoration: "none",
                          }}
                        >
                          <span>🐙</span>
                          <span>GitHub Repo ↗</span>
                        </a>
                      )}
                      {proj.liveUrl && (
                        <a
                          href={proj.liveUrl}
                          target="_blank"
                          rel="noreferrer"
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "6px",
                            padding: "6px 12px",
                            background: "#ecfdf5",
                            color: "#047857",
                            border: "1px solid #a7f3d0",
                            borderRadius: "6px",
                            fontSize: "12px",
                            fontWeight: 600,
                            textDecoration: "none",
                          }}
                        >
                          <span>🌐</span>
                          <span>Live Demo ↗</span>
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              /* Empty Projects State */
              <div style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                padding: "48px 24px",
                textAlign: "center",
                background: "#ffffff",
                borderRadius: "16px",
                border: "2px dashed #cbd5e1",
              }}>
                <div style={{
                  width: "60px",
                  height: "60px",
                  borderRadius: "16px",
                  background: "#f0f9ff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "30px",
                  marginBottom: "14px",
                }}>
                  💻
                </div>
                <h3 style={{ margin: "0 0 6px", fontSize: "17px", color: "#0f172a", fontWeight: 700 }}>
                  No Projects Added Yet
                </h3>
                <p style={{ margin: "0 0 20px", color: "#64748b", fontSize: "13px", maxWidth: "420px", lineHeight: 1.5 }}>
                  Add your major technical projects, assignments, or hackathon prototypes so hiring companies can assess your hands-on coding skills.
                </p>
                <button
                  onClick={() => {
                    setEditingProjectIndex(null);
                    setProjectForm({ name: "", description: "", technologies: "", githubUrl: "", liveUrl: "" });
                    setEditingProject(true);
                  }}
                  style={{
                    padding: "10px 22px",
                    background: "linear-gradient(135deg, #0284c7, #0369a1)",
                    color: "#ffffff",
                    border: "none",
                    borderRadius: "8px",
                    fontSize: "13px",
                    fontWeight: 600,
                    cursor: "pointer",
                    boxShadow: "0 2px 8px rgba(2, 132, 199, 0.3)",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                >
                  <span>➕</span>
                  <span>Add First Project</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* SUBTAB 5: RESUMES */}
        {subTab === "resumes" && (
          <div>
            <h2 style={{ margin: "0 0 8px", fontSize: "20px", color: "#0f172a" }}>My Resumes</h2>
            <p style={{ margin: "0 0 20px", color: "#64748b", fontSize: "13px" }}>
              Upload up to 3 customized resumes. Star ⭐ the one you wish to use as your default primary resume for placement applications.
            </p>

            {/* Upload Form */}
            <form onSubmit={handleResumeUploadSubmit} style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap", marginBottom: "14px" }}>
              <input
                type="file"
                accept=".pdf,application/pdf"
                onChange={(e) => {
                  setResumeFile(e.target.files[0] || null);
                  setUploadMessage("");
                }}
                style={{ padding: "6px", fontSize: "13px" }}
              />
              <button
                type="submit"
                className="drive-button"
                disabled={!resumeFile || resumeLoading}
              >
                {resumeLoading ? "Uploading Resume..." : "+ Upload New Resume (PDF)"}
              </button>
            </form>
            <span style={{ fontSize: "12px", color: "#64748b", display: "block", marginBottom: "16px" }}>
              📌 Only PDF format supported (Max file size: 10MB).
            </span>

            {uploadMessage && (
              <p style={{
                color: uploadMessage.startsWith("✓") ? "#15803d" : "#dc2626",
                background: uploadMessage.startsWith("✓") ? "#ecfdf5" : "#fef2f2",
                border: uploadMessage.startsWith("✓") ? "1px solid #bbf7d0" : "1px solid #fecaca",
                padding: "8px 14px",
                borderRadius: "6px",
                fontSize: "13px",
                fontWeight: 600,
                marginBottom: "16px",
              }}>
                {uploadMessage}
              </p>
            )}

            {/* PDF Resume Cards */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "16px" }}>
              {profile?.resumes && profile.resumes.length > 0 ? (
                profile.resumes.map((resume) => (
                  <div
                    key={resume._id}
                    style={{
                      border: "1px solid #e2e8f0",
                      borderRadius: "10px",
                      padding: "16px",
                      background: "#ffffff",
                      boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                    }}
                  >
                    <div>
                      <div style={{ display: "flex", alignItems: "flex-start", gap: "12px", marginBottom: "10px" }}>
                        <div style={{
                          background: "#fee2e2",
                          color: "#dc2626",
                          fontWeight: 700,
                          fontSize: "12px",
                          padding: "6px 8px",
                          borderRadius: "6px",
                        }}>
                          PDF
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <span style={{ fontSize: "11px", color: "#059669", fontWeight: 600 }}>
                            CV With Photo
                          </span>
                          <h4 style={{
                            margin: "2px 0 0",
                            fontSize: "14px",
                            fontWeight: 600,
                            color: "#0f172a",
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}>
                            {resume.name} {resume.isPrimary && <span title="Primary Resume">⭐</span>}
                          </h4>
                        </div>
                      </div>
                      <p style={{ margin: 0, color: "#94a3b8", fontSize: "12px" }}>
                        Created at {new Date(resume.uploadedAt || Date.now()).toLocaleDateString()}
                      </p>
                    </div>

                    <div style={{ display: "flex", gap: "8px", marginTop: "14px", paddingTop: "10px", borderTop: "1px solid #f1f5f9" }}>
                      <a
                        href={resume.url}
                        target="_blank"
                        rel="noreferrer"
                        className="drive-button-secondary"
                        style={{ padding: "4px 10px", fontSize: "12px", textDecoration: "none" }}
                      >
                        View ↗
                      </a>
                      {!resume.isPrimary && (
                        <button
                          type="button"
                          className="drive-button-secondary"
                          style={{ padding: "4px 10px", fontSize: "12px" }}
                          onClick={() => onSetPrimaryResume(resume._id)}
                        >
                          Set Primary ⭐
                        </button>
                      )}
                      <button
                        type="button"
                        className="drive-button-secondary"
                        style={{ padding: "4px 10px", fontSize: "12px", color: "#dc2626" }}
                        onClick={() => onDeleteResume(resume._id)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <p style={{ color: "#64748b" }}>No resumes uploaded yet. Upload your PDF resume above.</p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* MODAL: REQUEST ACADEMIC SCORE UPDATE (TPO APPROVAL) */}
      {showScoreRequestModal && (
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
          zIndex: 120,
          padding: "20px",
        }}>
          <div style={{
            background: "#ffffff",
            borderRadius: "16px",
            width: "100%",
            maxWidth: "580px",
            maxHeight: "90vh",
            overflowY: "auto",
            padding: "28px",
            boxShadow: "0 20px 40px rgba(0,0,0,0.25)",
            border: "1px solid #e2e8f0",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <span style={{ fontSize: "26px" }}>📝</span>
                <div>
                  <h3 style={{ margin: 0, fontSize: "18px", color: "#0f172a", fontWeight: 700 }}>
                    Request Academic Score Update
                  </h3>
                  <p style={{ margin: 0, fontSize: "12px", color: "#64748b" }}>
                    Official verification request submitted to XYZ CRPC
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowScoreRequestModal(false);
                  setScoreRequestFeedback("");
                }}
                style={{ background: "none", border: "none", fontSize: "18px", color: "#64748b", cursor: "pointer" }}
              >
                ✕
              </button>
            </div>

            <div style={{
              background: "#eff6ff",
              border: "1px solid #bfdbfe",
              borderRadius: "8px",
              padding: "10px 14px",
              fontSize: "12px",
              color: "#1e40af",
              marginBottom: "16px",
              lineHeight: "1.5",
            }}>
              🔒 <strong>Why is approval required?</strong> Under institution placement policy, academic marks determine eligibility for Super Dream, Dream, and Core campus drives. TPO verification prevents unauthorized score manipulation.
            </div>

            {scoreRequestFeedback && (
              <div style={{
                padding: "12px 16px",
                borderRadius: "8px",
                marginBottom: "16px",
                fontSize: "13px",
                fontWeight: 500,
                background: scoreRequestFeedbackType === "success" ? "#f0fdf4" : "#fef2f2",
                color: scoreRequestFeedbackType === "success" ? "#166534" : "#991b1b",
                border: `1px solid ${scoreRequestFeedbackType === "success" ? "#bbf7d0" : "#fecaca"}`,
              }}>
                {scoreRequestFeedback}
              </div>
            )}

            <form onSubmit={handleScoreRequestSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#334155", marginBottom: "4px" }}>
                    Requested CGPA (0 - 10) <span style={{ color: "#ef4444" }}>*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="10"
                    required
                    placeholder="e.g. 8.25"
                    value={scoreRequestForm.cgpa}
                    onChange={(e) => setScoreRequestForm({ ...scoreRequestForm, cgpa: e.target.value })}
                    style={{
                      width: "100%",
                      padding: "9px 12px",
                      borderRadius: "8px",
                      border: "1px solid #cbd5e1",
                      fontSize: "13px",
                      color: "#0f172a",
                      boxSizing: "border-box",
                      outline: "none",
                    }}
                  />
                  <span style={{ fontSize: "11px", color: "#64748b" }}>Current: <strong>{profile?.cgpa ?? "N/A"}</strong></span>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#334155", marginBottom: "4px" }}>
                    Active Backlogs Count <span style={{ color: "#ef4444" }}>*</span>
                  </label>
                  <input
                    type="number"
                    step="1"
                    min="0"
                    required
                    placeholder="e.g. 0"
                    value={scoreRequestForm.backlogs}
                    onChange={(e) => setScoreRequestForm({ ...scoreRequestForm, backlogs: e.target.value })}
                    style={{
                      width: "100%",
                      padding: "9px 12px",
                      borderRadius: "8px",
                      border: "1px solid #cbd5e1",
                      fontSize: "13px",
                      color: "#0f172a",
                      boxSizing: "border-box",
                      outline: "none",
                    }}
                  />
                  <span style={{ fontSize: "11px", color: "#64748b" }}>Current: <strong>{profile?.backlogs ?? 0}</strong></span>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#334155", marginBottom: "4px" }}>
                    10th Board % <span style={{ color: "#ef4444" }}>*</span>
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    required
                    placeholder="e.g. 85.4"
                    value={scoreRequestForm.tenthPercentage}
                    onChange={(e) => setScoreRequestForm({ ...scoreRequestForm, tenthPercentage: e.target.value })}
                    style={{
                      width: "100%",
                      padding: "9px 12px",
                      borderRadius: "8px",
                      border: "1px solid #cbd5e1",
                      fontSize: "13px",
                      color: "#0f172a",
                      boxSizing: "border-box",
                      outline: "none",
                    }}
                  />
                  <span style={{ fontSize: "11px", color: "#64748b" }}>Current: <strong>{profile?.tenthPercentage ?? "N/A"}%</strong></span>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#334155", marginBottom: "4px" }}>
                    12th / Diploma % <span style={{ color: "#ef4444" }}>*</span>
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    required
                    placeholder="e.g. 82.0"
                    value={scoreRequestForm.twelfthPercentage}
                    onChange={(e) => setScoreRequestForm({ ...scoreRequestForm, twelfthPercentage: e.target.value })}
                    style={{
                      width: "100%",
                      padding: "9px 12px",
                      borderRadius: "8px",
                      border: "1px solid #cbd5e1",
                      fontSize: "13px",
                      color: "#0f172a",
                      boxSizing: "border-box",
                      outline: "none",
                    }}
                  />
                  <span style={{ fontSize: "11px", color: "#64748b" }}>Current: <strong>{profile?.twelfthPercentage ?? "N/A"}%</strong></span>
                </div>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#334155", marginBottom: "4px" }}>
                  Official Reason / Justification for Change <span style={{ color: "#ef4444" }}>*</span>
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="e.g., Semester 5 marksheet re-evaluation results declared; CGPA updated from 7.2 to 7.8; cleared backlogs in supplementary exam..."
                  value={scoreRequestForm.reason}
                  onChange={(e) => setScoreRequestForm({ ...scoreRequestForm, reason: e.target.value })}
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

              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#334155", marginBottom: "4px" }}>
                  Supporting Marksheet / Verification Link (Optional)
                </label>
                <input
                  type="url"
                  placeholder="https://drive.google.com/... or university result URL"
                  value={scoreRequestForm.proofDocumentUrl}
                  onChange={(e) => setScoreRequestForm({ ...scoreRequestForm, proofDocumentUrl: e.target.value })}
                  style={{
                    width: "100%",
                    padding: "9px 12px",
                    borderRadius: "8px",
                    border: "1px solid #cbd5e1",
                    fontSize: "13px",
                    color: "#0f172a",
                    boxSizing: "border-box",
                    outline: "none",
                  }}
                />
              </div>

              <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", marginTop: "8px" }}>
                <button
                  type="button"
                  onClick={() => {
                    setShowScoreRequestModal(false);
                    setScoreRequestFeedback("");
                  }}
                  disabled={submittingScoreRequest}
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
                  disabled={submittingScoreRequest || isPendingApproval}
                  style={{
                    padding: "9px 22px",
                    background: submittingScoreRequest || isPendingApproval ? "#94a3b8" : "#2563eb",
                    color: "#ffffff",
                    border: "none",
                    borderRadius: "8px",
                    fontWeight: 700,
                    fontSize: "13px",
                    cursor: submittingScoreRequest || isPendingApproval ? "not-allowed" : "pointer",
                    boxShadow: "0 2px 8px rgba(37, 99, 235, 0.25)",
                  }}
                >
                  {submittingScoreRequest ? "Submitting Request..." : isPendingApproval ? "Request Already Pending" : "Submit Request to TPO"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

