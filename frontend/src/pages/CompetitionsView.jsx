import { useState, useEffect } from "react";
import {
  getCompetitions,
  registerForCompetition,
  getMyRegistrations,
} from "../api/competitionApi";

export default function CompetitionsView() {
  const [competitions, setCompetitions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [filterType, setFilterType] = useState("all"); // "all" | "Coding Contest" | "Hackathon" | "Technical Quiz" | "my_registrations"
  const [searchQuery, setSearchQuery] = useState("");
  const [registeringId, setRegisteringId] = useState(null);

  useEffect(() => {
    loadCompetitions();
  }, []);

  const loadCompetitions = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await getCompetitions();
      setCompetitions(data || []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load competitions");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (compId) => {
    try {
      setRegisteringId(compId);
      setError("");
      setSuccessMsg("");
      const res = await registerForCompetition(compId);
      setSuccessMsg(res.message || "Successfully registered for competition!");
      await loadCompetitions();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to register for competition");
    } finally {
      setRegisteringId(null);
    }
  };

  const displayedCompetitions = competitions.filter((comp) => {
    if (filterType === "my_registrations") {
      if (!comp.hasRegistered) return false;
    } else if (filterType !== "all" && comp.type !== filterType) {
      return false;
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = comp.title?.toLowerCase().includes(q);
      const matchOrg = comp.organizer?.toLowerCase().includes(q);
      const matchPrize = comp.prizes?.toLowerCase().includes(q);
      if (!matchTitle && !matchOrg && !matchPrize) return false;
    }

    return true;
  });

  const myRegisteredCount = competitions.filter((c) => c.hasRegistered).length;

  return (
    <div style={{ padding: "0 0 32px 0" }}>
      {/* Top Header */}
      <div style={{ marginBottom: "20px" }}>
        <h1 style={{ margin: "0 0 6px", fontSize: "26px", fontWeight: 700, color: "#111827" }}>
          TPO Hackathons & Coding Contests
        </h1>
        <p style={{ margin: 0, color: "#6b7280", fontSize: "14px" }}>
          Campus coding contests, hackathons, and technical challenges hosted exclusively by XYZ Corporate Relations & Placement Centre (CRPC).
        </p>
      </div>

      {error && (
        <div style={{ padding: "12px 16px", background: "#fef2f2", color: "#b91c1c", borderRadius: "8px", marginBottom: "16px", border: "1px solid #fecaca", fontSize: "14px" }}>
          {error}
        </div>
      )}

      {successMsg && (
        <div style={{ padding: "12px 16px", background: "#f0fdf4", color: "#15803d", borderRadius: "8px", marginBottom: "16px", border: "1px solid #bbf7d0", fontSize: "14px" }}>
          {successMsg}
        </div>
      )}

      {/* Filter & Search Bar */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px", marginBottom: "24px" }}>
        <div className="filter-bar" style={{ margin: 0 }}>
          <button
            className={`filter-pill ${filterType === "all" ? "active" : ""}`}
            onClick={() => setFilterType("all")}
          >
            All Competitions ({competitions.length})
          </button>
          <button
            className={`filter-pill ${filterType === "Coding Contest" ? "active" : ""}`}
            onClick={() => setFilterType("Coding Contest")}
          >
            Coding Contests ({competitions.filter((c) => c.type === "Coding Contest").length})
          </button>
          <button
            className={`filter-pill ${filterType === "Hackathon" ? "active" : ""}`}
            onClick={() => setFilterType("Hackathon")}
          >
            Hackathons ({competitions.filter((c) => c.type === "Hackathon").length})
          </button>
          <button
            className={`filter-pill ${filterType === "my_registrations" ? "active" : ""}`}
            onClick={() => setFilterType("my_registrations")}
          >
            My Registrations ({myRegisteredCount})
          </button>
        </div>

        <div style={{ minWidth: "260px" }}>
          <input
            type="text"
            placeholder="Search by title, organizer, prize..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: "100%",
              padding: "8px 14px",
              borderRadius: "20px",
              border: "1px solid #d1d5db",
              fontSize: "13px",
              outline: "none",
            }}
          />
        </div>
      </div>

      {loading ? (
        <p style={{ color: "#6b7280" }}>Loading competitions...</p>
      ) : displayedCompetitions.length === 0 ? (
        /* Empty Competitions State */
        <div style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "60px 20px",
          background: "#ffffff",
          borderRadius: "14px",
          border: "1px solid #e5e7eb",
          textAlign: "center",
          marginTop: "20px",
        }}>
          <div style={{
            width: "120px",
            height: "120px",
            borderRadius: "50%",
            background: "#f1f5f9",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: "16px",
            fontSize: "48px",
          }}>
            📦
          </div>
          <h2 style={{ margin: "0 0 8px", fontSize: "20px", color: "#1e293b", fontWeight: 700 }}>
            No competitions to show
          </h2>
          <p style={{ margin: 0, color: "#64748b", fontSize: "14px" }}>
            Sit back and relax till new competitions are added by the TPO!
          </p>
        </div>
      ) : (
        /* Competitions Grid */
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: "20px" }}>
          {displayedCompetitions.map((comp) => {
            const isDeadlinePassed = new Date(comp.registrationDeadline) < new Date();

            return (
              <div
                key={comp._id}
                style={{
                  background: "#ffffff",
                  borderRadius: "14px",
                  border: "1px solid #e2e8f0",
                  padding: "22px",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                }}
              >
                <div>
                  {/* Top tags */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "10px", marginBottom: "12px" }}>
                    <div style={{ display: "flex", gap: "6px", alignItems: "center", flexWrap: "wrap" }}>
                      <span style={{
                        background: "#e0e7ff",
                        color: "#3730a3",
                        fontSize: "12px",
                        fontWeight: 600,
                        padding: "4px 10px",
                        borderRadius: "12px",
                      }}>
                        🏆 {comp.type}
                      </span>
                      {comp.isOpenToAll !== false && (
                        <span style={{
                          background: "#dcfce7",
                          color: "#15803d",
                          fontSize: "11px",
                          fontWeight: 700,
                          padding: "3px 8px",
                          borderRadius: "12px",
                          border: "1px solid #86efac",
                        }}>
                          ✨ Open for All
                        </span>
                      )}
                    </div>
                    <span style={{
                      background: comp.status === "active" ? "#dcfce7" : "#f1f5f9",
                      color: comp.status === "active" ? "#166534" : "#475569",
                      fontSize: "12px",
                      fontWeight: 600,
                      padding: "4px 10px",
                      borderRadius: "12px",
                    }}>
                      {comp.status.toUpperCase()}
                    </span>
                  </div>

                  <h3 style={{ margin: "0 0 6px", fontSize: "18px", color: "#0f172a", fontWeight: 700 }}>
                    {comp.title}
                  </h3>
                  <p style={{ margin: "0 0 12px", color: "#64748b", fontSize: "13px" }}>
                    🏛️ <strong>Host:</strong> {comp.organizer}
                  </p>

                  <div style={{
                    background: "#f8fafc",
                    border: "1px solid #f1f5f9",
                    borderRadius: "10px",
                    padding: "12px",
                    marginBottom: "14px",
                    fontSize: "13px",
                    color: "#334155",
                  }}>
                    <p style={{ margin: "0 0 6px" }}>
                      📅 <strong>Event Date:</strong> {new Date(comp.startDate).toLocaleDateString()}
                    </p>
                    <p style={{ margin: "0 0 6px" }}>
                      ⏳ <strong>Reg. Deadline:</strong> {new Date(comp.registrationDeadline).toLocaleDateString()}
                    </p>
                    <p style={{ margin: "0 0 6px" }}>
                      📍 <strong>Mode / Venue:</strong> {comp.mode} ({comp.venue})
                    </p>
                    <p style={{ margin: 0 }}>
                      👥 <strong>Format:</strong> {comp.teamSize} • {comp.participantCount || 0} Registered
                    </p>
                  </div>

                  {comp.prizes && (
                    <div style={{
                      background: "#fef3c7",
                      border: "1px solid #fde68a",
                      color: "#92400e",
                      padding: "8px 12px",
                      borderRadius: "8px",
                      fontSize: "12px",
                      fontWeight: 600,
                      marginBottom: "14px",
                    }}>
                      🎁 {comp.prizes}
                    </div>
                  )}

                  {comp.description && (
                    <p style={{ fontSize: "13px", color: "#475569", margin: "0 0 14px", lineHeight: "1.4" }}>
                      {comp.description.length > 130 ? `${comp.description.slice(0, 130)}...` : comp.description}
                    </p>
                  )}
                </div>

                {/* Bottom Action */}
                <div style={{ marginTop: "14px", paddingTop: "12px", borderTop: "1px solid #f1f5f9" }}>
                  {comp.hasRegistered ? (
                    <button
                      className="drive-button"
                      disabled
                      style={{ width: "100%", background: "#059669", cursor: "default" }}
                    >
                      ✓ Registered
                    </button>
                  ) : isDeadlinePassed ? (
                    <button
                      className="drive-button-secondary"
                      disabled
                      style={{ width: "100%", cursor: "not-allowed" }}
                    >
                      Registration Closed
                    </button>
                  ) : (
                    <button
                      className="drive-button"
                      style={{ width: "100%", background: "#3730a3" }}
                      onClick={() => handleRegister(comp._id)}
                      disabled={registeringId === comp._id}
                    >
                      {registeringId === comp._id ? "Registering..." : "Register for Contest"}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

