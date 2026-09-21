import { useState, useEffect } from "react";

export default function JobProfilesView({
  drives,
  applications,
  profile,
  onApply,
  applyLoading,
  applyMessage,
}) {
  const [selectedJobTab, setSelectedJobTab] = useState("all"); // "all" | "applied"
  const [categoryFilter, setCategoryFilter] = useState("all"); // "all" | "eligible" | "dream" | "applied"
  const [selectedDriveId, setSelectedDriveId] = useState(
    drives && drives.length > 0 ? drives[0]._id : null
  );
  const [detailTab, setDetailTab] = useState("description"); // "description" | "workflow" | "eligibility"
  const [searchQuery, setSearchQuery] = useState("");
  const [positionTypeFilter, setPositionTypeFilter] = useState("All");
  const [selectedResumeId, setSelectedResumeId] = useState(
    profile?.resumes?.find((r) => r.isPrimary)?._id || profile?.resumes?.[0]?._id || ""
  );

  useEffect(() => {
    if (
      (!selectedResumeId || !profile?.resumes?.some((r) => r._id === selectedResumeId)) &&
      profile?.resumes?.length > 0
    ) {
      const primary = profile.resumes.find((r) => r.isPrimary);
      setSelectedResumeId(primary ? primary._id : profile.resumes[0]._id);
    }
  }, [profile, selectedResumeId]);

  const hasApplied = (driveId) =>
    applications.some((app) => app.drive?._id === driveId || app.drive === driveId);

  const getApplication = (driveId) =>
    applications.find((app) => app.drive?._id === driveId || app.drive === driveId);

  // Filter logic
  const filteredDrives = (drives || []).filter((drive) => {
    if ((selectedJobTab === "applied" || categoryFilter === "applied") && !hasApplied(drive._id)) {
      return false;
    }

    if (categoryFilter === "eligible" && !drive.eligibility?.eligible) {
      return false;
    }

    if (categoryFilter === "dream") {
      const isDreamOrSuper =
        drive.category === "Dream" ||
        drive.category === "Super Dream" ||
        Number(drive.package) >= 6;
      if (!isDreamOrSuper) return false;
    }

    if (positionTypeFilter !== "All" && drive.employmentType !== positionTypeFilter) {
      return false;
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = drive.jobTitle?.toLowerCase().includes(q);
      const matchComp = drive.company?.name?.toLowerCase().includes(q);
      const matchLoc = drive.location?.toLowerCase().includes(q);
      if (!matchTitle && !matchComp && !matchLoc) return false;
    }

    return true;
  });

  const selectedDrive =
    drives.find((d) => d._id === selectedDriveId) ||
    filteredDrives[0] ||
    null;

  return (
    <div>
      {/* Category Pills Bar (Portal Experience) */}
      <div style={{ display: "flex", gap: "10px", marginBottom: "16px", flexWrap: "wrap" }}>
        <button
          type="button"
          className={`filter-pill ${categoryFilter === "all" ? "active" : ""}`}
          onClick={() => setCategoryFilter("all")}
        >
          All Campus Drives ({drives.length})
        </button>
        <button
          type="button"
          className={`filter-pill ${categoryFilter === "eligible" ? "active" : ""}`}
          onClick={() => setCategoryFilter("eligible")}
          style={{
            borderColor: categoryFilter === "eligible" ? "#16a34a" : "#cbd5e1",
            background: categoryFilter === "eligible" ? "#16a34a" : "#fff",
            color: categoryFilter === "eligible" ? "#fff" : "#16a34a",
            fontWeight: 700,
          }}
        >
          ⭐ Eligible For Me ({drives.filter((d) => d.eligibility?.eligible).length})
        </button>
        <button
          type="button"
          className={`filter-pill ${categoryFilter === "dream" ? "active" : ""}`}
          onClick={() => setCategoryFilter("dream")}
          style={{
            borderColor: categoryFilter === "dream" ? "#d97706" : "#cbd5e1",
            background: categoryFilter === "dream" ? "#d97706" : "#fff",
            color: categoryFilter === "dream" ? "#fff" : "#d97706",
            fontWeight: 700,
          }}
        >
          🔥 Dream & Super Dream (≥ 6 LPA) ({drives.filter((d) => Number(d.package) >= 6 || d.category === "Dream" || d.category === "Super Dream").length})
        </button>
        <button
          type="button"
          className={`filter-pill ${categoryFilter === "applied" ? "active" : ""}`}
          onClick={() => setCategoryFilter("applied")}
        >
          📝 My Applications ({applications.length})
        </button>
      </div>

      {/* Top Filter Bar */}
      <div style={{
        background: "#ffffff",
        border: "1px solid #e5e7eb",
        borderRadius: "12px",
        padding: "16px 20px",
        marginBottom: "20px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: "14px",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
          <div>
            <label style={{ fontSize: "12px", fontWeight: 600, color: "#64748b", display: "block", marginBottom: "3px" }}>
              Position Type
            </label>
            <select
              value={positionTypeFilter}
              onChange={(e) => setPositionTypeFilter(e.target.value)}
              style={{ padding: "6px 12px", borderRadius: "8px", border: "1px solid #d1d5db", fontSize: "13px" }}
            >
              <option value="All">All Types</option>
              <option value="Full Time">Full Time</option>
              <option value="Internship">Internship</option>
              <option value="Internship + PPO">Internship + PPO</option>
            </select>
          </div>

          <button
            type="button"
            className="filter-pill"
            style={{ marginTop: "16px" }}
            onClick={() => {
              setPositionTypeFilter("All");
              setSearchQuery("");
            }}
          >
            Clear Filters
          </button>
        </div>

        <div style={{ flex: "1", maxWidth: "360px", minWidth: "240px" }}>
          <label style={{ fontSize: "12px", fontWeight: 600, color: "#64748b", display: "block", marginBottom: "3px" }}>
            Search
          </label>
          <input
            type="text"
            placeholder="Search by job title or company..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: "100%",
              padding: "7px 14px",
              borderRadius: "8px",
              border: "1px solid #d1d5db",
              fontSize: "13px",
              outline: "none",
            }}
          />
        </div>
      </div>

      {/* Master-Detail Split Screen Layout (Screenshot 4) */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "380px 1fr",
        gap: "20px",
        alignItems: "start",
      }}>
        {/* Left Column: Job List Pane */}
        <div style={{
          background: "#ffffff",
          borderRadius: "12px",
          border: "1px solid #e5e7eb",
          overflow: "hidden",
        }}>
          {/* Sub-tabs: All Jobs | Applied Jobs */}
          <div style={{
            display: "flex",
            borderBottom: "1px solid #e5e7eb",
            background: "#f8fafc",
          }}>
            <button
              onClick={() => setSelectedJobTab("all")}
              style={{
                flex: 1,
                padding: "12px 16px",
                border: "none",
                background: "transparent",
                fontWeight: selectedJobTab === "all" ? 700 : 500,
                color: selectedJobTab === "all" ? "#2563eb" : "#64748b",
                borderBottom: selectedJobTab === "all" ? "2px solid #2563eb" : "none",
                cursor: "pointer",
                fontSize: "14px",
              }}
            >
              All Jobs ({drives.length})
            </button>
            <button
              onClick={() => setSelectedJobTab("applied")}
              style={{
                flex: 1,
                padding: "12px 16px",
                border: "none",
                background: "transparent",
                fontWeight: selectedJobTab === "applied" ? 700 : 500,
                color: selectedJobTab === "applied" ? "#2563eb" : "#64748b",
                borderBottom: selectedJobTab === "applied" ? "2px solid #2563eb" : "none",
                cursor: "pointer",
                fontSize: "14px",
              }}
            >
              Applied Jobs ({applications.length})
            </button>
          </div>

          {/* Job Cards List */}
          <div style={{ maxHeight: "720px", overflowY: "auto", padding: "8px" }}>
            {filteredDrives.length === 0 ? (
              <p style={{ padding: "24px 16px", textAlign: "center", color: "#64748b", fontSize: "14px" }}>
                No jobs found in this section.
              </p>
            ) : (
              filteredDrives.map((drive) => {
                const isSelected = selectedDrive?._id === drive._id;
                const applied = hasApplied(drive._id);
                const isEligible = drive.eligibility?.eligible;

                return (
                  <div
                    key={drive._id}
                    onClick={() => setSelectedDriveId(drive._id)}
                    style={{
                      padding: "16px",
                      borderRadius: "10px",
                      border: isSelected ? "2px solid #2563eb" : "1px solid #f1f5f9",
                      background: isSelected ? "#eff6ff" : "#ffffff",
                      marginBottom: "8px",
                      cursor: "pointer",
                      transition: "all 0.15s ease",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
                      {/* Avatar initial */}
                      <div style={{
                        width: "42px",
                        height: "42px",
                        borderRadius: "8px",
                        background: isSelected ? "#2563eb" : "#e2e8f0",
                        color: isSelected ? "#ffffff" : "#334155",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontWeight: 700,
                        fontSize: "16px",
                        flexShrink: 0,
                      }}>
                        {drive.company?.name ? drive.company.name.charAt(0).toUpperCase() : "C"}
                      </div>

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <h4 style={{
                          margin: "0 0 3px",
                          fontSize: "15px",
                          fontWeight: 600,
                          color: "#1e293b",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}>
                          {drive.jobTitle}
                        </h4>
                        <p style={{ margin: "0 0 6px", fontSize: "13px", color: "#64748b" }}>
                          {drive.company?.name || "Company"} • {drive.location}
                        </p>

                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "8px", flexWrap: "wrap", marginBottom: "4px" }}>
                          <span style={{ fontSize: "13px", fontWeight: 700, color: "#0f766e" }}>
                            ₹{drive.package} LPA
                          </span>

                          {/* Category Badge */}
                          {(() => {
                            const cat = drive.category || (Number(drive.package) >= 10 ? "Super Dream" : Number(drive.package) >= 6 ? "Dream" : "Regular");
                            if (cat === "Super Dream") {
                              return (
                                <span style={{ fontSize: "10px", padding: "1px 6px", borderRadius: "6px", background: "#fef3c7", color: "#b45309", fontWeight: 700, border: "1px solid #fde68a" }}>
                                  🔥 Super Dream
                                </span>
                              );
                            }
                            if (cat === "Dream") {
                              return (
                                <span style={{ fontSize: "10px", padding: "1px 6px", borderRadius: "6px", background: "#f3e8ff", color: "#7e22ce", fontWeight: 700, border: "1px solid #e9d5ff" }}>
                                  ⭐ Dream
                                </span>
                              );
                            }
                            return (
                              <span style={{ fontSize: "10px", padding: "1px 6px", borderRadius: "6px", background: "#f1f5f9", color: "#64748b", fontWeight: 600 }}>
                                Regular
                              </span>
                            );
                          })()}
                        </div>

                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
                          {applied ? (
                            <span className="eligibility-badge eligible" style={{ fontSize: "11px", padding: "2px 8px" }}>
                              ✓ Applied
                            </span>
                          ) : drive.oneOfferPolicy?.isBlocked ? (
                            <span style={{ fontSize: "10px", padding: "2px 6px", borderRadius: "6px", background: "#fee2e2", color: "#b91c1c", fontWeight: 700, border: "1px solid #fca5a5" }}>
                              🚫 1-Offer Blocked
                            </span>
                          ) : drive.oneOfferPolicy?.hasOffer && (drive.category === "Dream" || drive.category === "Super Dream" || Number(drive.package) >= 6) ? (
                            <span style={{ fontSize: "10px", padding: "2px 6px", borderRadius: "6px", background: "#dbeafe", color: "#1d4ed8", fontWeight: 700, border: "1px solid #bfdbfe" }}>
                              ✨ Upgrade Allowed
                            </span>
                          ) : drive.isOpenToAll ? (
                            <span style={{ fontSize: "11px", padding: "2px 8px", borderRadius: "12px", background: "#dcfce7", color: "#15803d", fontWeight: 700, border: "1px solid #86efac" }}>
                              ✨ Open for All
                            </span>
                          ) : isEligible ? (
                            <span className="eligibility-badge eligible" style={{ fontSize: "11px", padding: "2px 8px" }}>
                              ✓ Eligible
                            </span>
                          ) : (
                            <span className="eligibility-badge ineligible" style={{ fontSize: "11px", padding: "2px 8px" }}>
                              ✗ Ineligible
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Selected Job Details View (Screenshot 4) */}
        {selectedDrive ? (
          <div style={{
            background: "#ffffff",
            borderRadius: "12px",
            border: "1px solid #e5e7eb",
            padding: "24px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
          }}>
            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "16px", marginBottom: "16px" }}>
              <div style={{ display: "flex", gap: "14px", alignItems: "center" }}>
                <div style={{
                  width: "56px",
                  height: "56px",
                  borderRadius: "10px",
                  background: "#f1f5f9",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "24px",
                  fontWeight: 700,
                  color: "#1e40af",
                }}>
                  💼
                </div>
                <div>
                  <h2 style={{ margin: "0 0 4px", fontSize: "22px", color: "#0f172a", fontWeight: 700 }}>
                    {selectedDrive.jobTitle}
                  </h2>
                  <p style={{ margin: 0, color: "#64748b", fontSize: "14px" }}>
                    <strong>{selectedDrive.company?.name}</strong> • {selectedDrive.employmentType || "Full Time"} • {selectedDrive.location}
                  </p>
                </div>
              </div>

              <span style={{
                background: "#f1f5f9",
                color: "#475569",
                fontSize: "13px",
                fontWeight: 600,
                padding: "6px 14px",
                borderRadius: "20px",
              }}>
                Deadline: {new Date(selectedDrive.applicationDeadline).toLocaleDateString()}
              </span>
            </div>

            {/* Notice Callout Box */}
            {hasApplied(selectedDrive._id) ? (
              <div style={{
                background: "#eff6ff",
                border: "1px solid #bfdbfe",
                color: "#1e40af",
                padding: "12px 16px",
                borderRadius: "8px",
                marginBottom: "20px",
                fontSize: "13px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}>
                <span>
                  ✓ <strong>Application Submitted:</strong> You have applied for this job profile. Status: <strong>{getApplication(selectedDrive._id)?.status?.toUpperCase()}</strong>
                </span>
                <span className={`status-badge status-${getApplication(selectedDrive._id)?.status}`}>
                  {getApplication(selectedDrive._id)?.status}
                </span>
              </div>
            ) : selectedDrive.oneOfferPolicy?.isBlocked ? (
              <div style={{
                background: "#fef2f2",
                border: "1px solid #fca5a5",
                color: "#991b1b",
                padding: "14px 18px",
                borderRadius: "10px",
                marginBottom: "20px",
                fontSize: "13px",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                  <span style={{ fontSize: "20px" }}>🚫</span>
                  <strong style={{ fontSize: "14px" }}>One Student One Offer Policy Active:</strong>
                </div>
                <p style={{ margin: "0 0 8px", lineHeight: "1.5" }}>
                  You already hold an active campus placement offer {selectedDrive.oneOfferPolicy.existingOfferPackage ? `(₹${selectedDrive.oneOfferPolicy.existingOfferPackage} LPA)` : ""}. As per institutional placement policy, students with an existing offer <strong>cannot apply for Regular drives (&lt; 6 LPA)</strong>.
                </p>
                <div style={{ background: "#fee2e2", border: "1px solid #fecaca", padding: "6px 12px", borderRadius: "6px", fontWeight: 600, display: "inline-block", color: "#b91c1c" }}>
                  ✨ You can still apply for <strong>Dream (≥ 6 LPA)</strong> and <strong>Super Dream (≥ 10 LPA)</strong> drives to upgrade your placement CTC!
                </div>
              </div>
            ) : selectedDrive.oneOfferPolicy?.hasOffer && (selectedDrive.category === "Dream" || selectedDrive.category === "Super Dream" || Number(selectedDrive.package) >= 6) ? (
              <div style={{
                background: "#f0fdf4",
                border: "1px solid #86efac",
                color: "#15803d",
                padding: "12px 16px",
                borderRadius: "10px",
                marginBottom: "20px",
                fontSize: "13px",
                display: "flex",
                alignItems: "center",
                gap: "10px",
              }}>
                <span style={{ fontSize: "22px" }}>🌟</span>
                <div>
                  <strong>{selectedDrive.category || (Number(selectedDrive.package) >= 10 ? "Super Dream" : "Dream")} Opportunity:</strong> You currently hold a placement offer, and <strong>One Offer Policy is waived</strong> for this drive. You are eligible to apply and upgrade your CTC!
                </div>
              </div>
            ) : selectedDrive.isOpenToAll ? (
              <div style={{
                background: "#f0fdf4",
                border: "1px solid #bbf7d0",
                color: "#166534",
                padding: "12px 16px",
                borderRadius: "8px",
                marginBottom: "20px",
                fontSize: "13px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}>
                <span style={{ fontSize: "18px" }}>✨</span>
                <div>
                  <strong>Open for All Students:</strong> No eligibility cutoffs are enforced for this drive. All enrolled students are eligible to apply!
                </div>
              </div>
            ) : selectedDrive.eligibility?.eligible ? (
              <div style={{
                background: "#f0fdf4",
                border: "1px solid #bbf7d0",
                color: "#166534",
                padding: "12px 16px",
                borderRadius: "8px",
                marginBottom: "20px",
                fontSize: "13px",
              }}>
                ✓ <strong>Eligible to Apply:</strong> Your academic profile and courses meet all eligibility criteria for this position.
              </div>
            ) : (
              <div style={{
                background: "#fef2f2",
                border: "1px solid #fecaca",
                color: "#991b1b",
                padding: "12px 16px",
                borderRadius: "8px",
                marginBottom: "20px",
                fontSize: "13px",
              }}>
                ⚠️ <strong>Ineligible to Apply:</strong> {selectedDrive.eligibility?.reasons?.join(" • ") || "Criteria not met"}
              </div>
            )}

            {/* Sub-Tabs: Job Description | Hiring Workflow | Eligibility Criteria */}
            <div style={{
              display: "flex",
              borderBottom: "1px solid #e5e7eb",
              marginBottom: "20px",
            }}>
              <button
                onClick={() => setDetailTab("description")}
                style={{
                  padding: "10px 18px",
                  border: "none",
                  background: "transparent",
                  fontWeight: detailTab === "description" ? 700 : 500,
                  color: detailTab === "description" ? "#2563eb" : "#64748b",
                  borderBottom: detailTab === "description" ? "2px solid #2563eb" : "none",
                  cursor: "pointer",
                  fontSize: "14px",
                }}
              >
                Job Description
              </button>
              <button
                onClick={() => setDetailTab("workflow")}
                style={{
                  padding: "10px 18px",
                  border: "none",
                  background: "transparent",
                  fontWeight: detailTab === "workflow" ? 700 : 500,
                  color: detailTab === "workflow" ? "#2563eb" : "#64748b",
                  borderBottom: detailTab === "workflow" ? "2px solid #2563eb" : "none",
                  cursor: "pointer",
                  fontSize: "14px",
                }}
              >
                Hiring Workflow
              </button>
              <button
                onClick={() => setDetailTab("eligibility")}
                style={{
                  padding: "10px 18px",
                  border: "none",
                  background: "transparent",
                  fontWeight: detailTab === "eligibility" ? 700 : 500,
                  color: detailTab === "eligibility" ? "#2563eb" : "#64748b",
                  borderBottom: detailTab === "eligibility" ? "2px solid #2563eb" : "none",
                  cursor: "pointer",
                  fontSize: "14px",
                }}
              >
                Eligibility Criteria
              </button>
            </div>

            {/* TAB 1: JOB DESCRIPTION */}
            {detailTab === "description" && (
              <div>
                <h3 style={{ fontSize: "16px", color: "#1e293b", margin: "0 0 14px" }}>
                  Opening Overview
                </h3>

                <div className="profile-grid" style={{ marginBottom: "20px" }}>
                  <div className="profile-item">
                    <span>Category</span>
                    <strong style={{
                      color:
                        selectedDrive.category === "Super Dream" || selectedDrive.package >= 10
                          ? "#b45309"
                          : selectedDrive.category === "Dream" || selectedDrive.package >= 6
                          ? "#7e22ce"
                          : "#1e293b",
                    }}>
                      {selectedDrive.category === "Super Dream" || selectedDrive.package >= 10
                        ? "🔥 Super Dream (≥ 10 LPA)"
                        : selectedDrive.category === "Dream" || selectedDrive.package >= 6
                        ? "⭐ Dream Offer (6 - 10 LPA)"
                        : "Regular Drive (< 6 LPA)"}
                    </strong>
                  </div>
                  <div className="profile-item">
                    <span>Job Profile CTC</span>
                    <strong style={{ color: "#059669" }}>₹{selectedDrive.package} LPA</strong>
                  </div>
                  <div className="profile-item">
                    <span>Work Mode</span>
                    <strong>{selectedDrive.workMode || "On-site"}</strong>
                  </div>
                  <div className="profile-item">
                    <span>Location</span>
                    <strong>{selectedDrive.location}</strong>
                  </div>
                </div>

                <h4 style={{ fontSize: "14px", color: "#1e293b", margin: "16px 0 8px" }}>
                  Role Description & Expectations:
                </h4>
                <p style={{ color: "#4b5563", fontSize: "14px", lineHeight: "1.6", whiteSpace: "pre-line" }}>
                  {selectedDrive.description || "No specific job description provided by recruiter."}
                </p>

                {selectedDrive.requiredSkills?.length > 0 && (
                  <div style={{ marginTop: "16px" }}>
                    <h4 style={{ fontSize: "14px", color: "#1e293b", margin: "0 0 8px" }}>
                      Required Technologies & Skills:
                    </h4>
                    <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                      {selectedDrive.requiredSkills.map((s, idx) => (
                        <span key={idx} className="filter-pill" style={{ background: "#f1f5f9", cursor: "default" }}>
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: HIRING WORKFLOW (Screenshot 4) */}
            {detailTab === "workflow" && (
              <div>
                <h3 style={{ fontSize: "16px", color: "#1e293b", margin: "0 0 16px" }}>
                  Selection Process & Rounds
                </h3>
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  {(selectedDrive.selectionRounds && selectedDrive.selectionRounds.length > 0
                    ? selectedDrive.selectionRounds
                    : ["Resume Screening", "Technical Interview", "HR Interview"]
                  ).map((round, idx) => (
                    <div
                      key={idx}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "14px",
                        padding: "12px 16px",
                        background: "#f8fafc",
                        borderRadius: "10px",
                        border: "1px solid #e2e8f0",
                      }}
                    >
                      <div style={{
                        width: "32px",
                        height: "32px",
                        borderRadius: "50%",
                        background: "#2563eb",
                        color: "#fff",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontWeight: 700,
                        fontSize: "14px",
                      }}>
                        {idx + 1}
                      </div>
                      <div>
                        <strong style={{ fontSize: "15px", color: "#0f172a" }}>{round}</strong>
                        <p style={{ margin: "2px 0 0", fontSize: "13px", color: "#64748b" }}>
                          {idx === 0 ? "Initial evaluation of profile & academic records" : "Evaluated by hiring panel"}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 3: ELIGIBILITY CRITERIA (Screenshot 4) */}
            {detailTab === "eligibility" && (
              <div>
                <h3 style={{ fontSize: "16px", color: "#1e293b", margin: "0 0 16px" }}>
                  Detailed Diagnostic Eligibility Checklist
                </h3>

                {selectedDrive.isOpenToAll ? (
                  <div style={{
                    padding: "20px",
                    background: "#f0fdf4",
                    border: "1px solid #bbf7d0",
                    borderRadius: "10px",
                    color: "#166534",
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
                      <span style={{ fontSize: "24px" }}>🎉</span>
                      <h4 style={{ margin: 0, fontSize: "16px", color: "#15803d" }}>Open for All Enrolled Students</h4>
                    </div>
                    <p style={{ margin: "0 0 12px", fontSize: "13px", lineHeight: "1.5" }}>
                      This drive has <strong>No Eligibility Criteria</strong> restrictions. Any student from any department, CGPA, backlog status, or batch can freely apply without academic restrictions.
                    </p>
                    <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", fontSize: "12px" }}>
                      <span style={{ background: "#dcfce7", padding: "4px 10px", borderRadius: "20px", fontWeight: 600 }}>✓ Any CGPA Allowed</span>
                      <span style={{ background: "#dcfce7", padding: "4px 10px", borderRadius: "20px", fontWeight: 600 }}>✓ All Courses & Branches</span>
                      <span style={{ background: "#dcfce7", padding: "4px 10px", borderRadius: "20px", fontWeight: 600 }}>✓ Any Backlog Count Allowed</span>
                    </div>
                  </div>
                ) : selectedDrive.eligibility?.criteria ? (
                  <div className="criteria-list">
                    {/* CGPA */}
                    <div className={`criteria-item ${selectedDrive.eligibility.criteria.cgpa?.passed ? "passed" : "failed"}`}>
                      <span>{selectedDrive.eligibility.criteria.cgpa?.passed ? "✓" : "✗"}</span>
                      <div>
                        <strong>Minimum CGPA:</strong> {selectedDrive.eligibility.criteria.cgpa?.message}
                      </div>
                    </div>

                    {/* Course */}
                    {selectedDrive.eligibility.criteria.course && (
                      <div className={`criteria-item ${selectedDrive.eligibility.criteria.course?.passed ? "passed" : "failed"}`}>
                        <span>{selectedDrive.eligibility.criteria.course?.passed ? "✓" : "✗"}</span>
                        <div>
                          <strong>Allowed Course:</strong> {selectedDrive.eligibility.criteria.course?.message}
                        </div>
                      </div>
                    )}

                    {/* Branch */}
                    {selectedDrive.eligibility.criteria.branch && (
                      <div className={`criteria-item ${selectedDrive.eligibility.criteria.branch?.passed ? "passed" : "failed"}`}>
                        <span>{selectedDrive.eligibility.criteria.branch?.passed ? "✓" : "✗"}</span>
                        <div>
                          <strong>Eligible Branch:</strong> {selectedDrive.eligibility.criteria.branch?.message}
                        </div>
                      </div>
                    )}

                    {/* Backlogs */}
                    <div className={`criteria-item ${selectedDrive.eligibility.criteria.backlogs?.passed ? "passed" : "failed"}`}>
                      <span>{selectedDrive.eligibility.criteria.backlogs?.passed ? "✓" : "✗"}</span>
                      <div>
                        <strong>Backlog Limit:</strong> {selectedDrive.eligibility.criteria.backlogs?.message}
                      </div>
                    </div>

                    {/* 10th & 12th */}
                    {selectedDrive.minimumTenthPercentage != null && (
                      <div className={`criteria-item ${selectedDrive.eligibility.criteria.tenth?.passed ? "passed" : "failed"}`}>
                        <span>{selectedDrive.eligibility.criteria.tenth?.passed ? "✓" : "✗"}</span>
                        <div>
                          <strong>Class 10th %:</strong> {selectedDrive.eligibility.criteria.tenth?.message}
                        </div>
                      </div>
                    )}

                    {selectedDrive.minimumTwelfthPercentage != null && (
                      <div className={`criteria-item ${selectedDrive.eligibility.criteria.twelfth?.passed ? "passed" : "failed"}`}>
                        <span>{selectedDrive.eligibility.criteria.twelfth?.passed ? "✓" : "✗"}</span>
                        <div>
                          <strong>Class 12th %:</strong> {selectedDrive.eligibility.criteria.twelfth?.message}
                        </div>
                      </div>
                    )}

                    {/* Skills */}
                    {selectedDrive.eligibility.criteria.skills && (
                      <div className={`criteria-item ${selectedDrive.eligibility.criteria.skills?.passed ? "passed" : "failed"}`}>
                        <span>{selectedDrive.eligibility.criteria.skills?.passed ? "✓" : "✗"}</span>
                        <div>
                          <strong>Skills Requirement:</strong> {selectedDrive.eligibility.criteria.skills?.message}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <p style={{ color: "#64748b" }}>Criteria diagnostics not available.</p>
                )}
              </div>
            )}

            {/* Sticky Bottom Apply Action Bar */}
            <div style={{
              marginTop: "24px",
              paddingTop: "20px",
              borderTop: "1px solid #e5e7eb",
              display: "flex",
              flexDirection: "column",
              gap: "12px",
            }}>
              {!hasApplied(selectedDrive._id) && !selectedDrive.oneOfferPolicy?.isBlocked && (selectedDrive.isOpenToAll || selectedDrive.eligibility?.eligible) && (
                <div>
                  {profile?.resumes && profile.resumes.length > 0 ? (
                    <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
                      <label style={{ fontSize: "13px", fontWeight: 600, color: "#334155" }}>
                        Select Resume for Submission:
                      </label>
                      <select
                        value={selectedResumeId}
                        onChange={(e) => setSelectedResumeId(e.target.value)}
                        style={{ padding: "8px 12px", borderRadius: "8px", border: "1px solid #d1d5db", fontSize: "13px", flex: 1, maxWidth: "340px" }}
                      >
                        {profile.resumes.map((r) => (
                          <option key={r._id} value={r._id}>
                            {r.name} {r.isPrimary ? "⭐ (Primary Resume)" : ""}
                          </option>
                        ))}
                      </select>
                    </div>
                  ) : (
                    <div style={{
                      background: "#fffbeb",
                      border: "1px solid #fde68a",
                      color: "#92400e",
                      padding: "10px 14px",
                      borderRadius: "8px",
                      fontSize: "13px",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                    }}>
                      <span>⚠️</span>
                      <span>
                        <strong>No Resume Found:</strong> You must upload a resume before applying. Go to <strong>Academic Profile &gt; My Resumes</strong> tab to upload your PDF resume.
                      </span>
                    </div>
                  )}
                </div>
              )}

              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                {hasApplied(selectedDrive._id) ? (
                  <button
                    className="drive-button"
                    disabled
                    style={{ background: "#059669", cursor: "default" }}
                  >
                    ✓ Already Applied
                  </button>
                ) : (
                  <button
                    className="drive-button"
                    disabled={
                      applyLoading ||
                      Boolean(selectedDrive.oneOfferPolicy?.isBlocked) ||
                      (!selectedDrive.isOpenToAll && selectedDrive.eligibility && !selectedDrive.eligibility.eligible) ||
                      !profile?.resumes ||
                      profile.resumes.length === 0
                    }
                    onClick={() => {
                      const resumeToUse =
                        selectedResumeId ||
                        profile?.resumes?.find((r) => r.isPrimary)?._id ||
                        profile?.resumes?.[0]?._id;
                      onApply(selectedDrive._id, resumeToUse);
                    }}
                    style={{
                      background:
                        Boolean(selectedDrive.oneOfferPolicy?.isBlocked) ||
                        (!selectedDrive.isOpenToAll && selectedDrive.eligibility && !selectedDrive.eligibility.eligible) ||
                        !profile?.resumes ||
                        profile.resumes.length === 0
                          ? "#94a3b8"
                          : "#2563eb",
                      padding: "10px 24px",
                      fontSize: "14px",
                    }}
                  >
                    {applyLoading
                      ? "Submitting Application..."
                      : selectedDrive.oneOfferPolicy?.isBlocked
                      ? "🚫 Blocked by 1-Offer Policy (Regular Drive)"
                      : !profile?.resumes || profile.resumes.length === 0
                      ? "Upload Resume in Profile First"
                      : !selectedDrive.isOpenToAll && selectedDrive.eligibility && !selectedDrive.eligibility.eligible
                      ? "Ineligible to Apply"
                      : "Apply for Job Profile"}
                  </button>
                )}
              </div>

              {applyMessage && (
                <p style={{ margin: "4px 0 0", color: "#2563eb", fontSize: "13px", fontWeight: 600 }}>
                  {applyMessage}
                </p>
              )}
            </div>
          </div>
        ) : (
          <div style={{ padding: "40px", textAlign: "center", background: "#ffffff", borderRadius: "12px", border: "1px solid #e5e7eb" }}>
            <p style={{ color: "#64748b" }}>Select a placement drive on the left to view details.</p>
          </div>
        )}
      </div>
    </div>
  );
}

