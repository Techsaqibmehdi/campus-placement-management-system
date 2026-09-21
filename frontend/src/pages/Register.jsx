import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../api";

export default function Register() {
  const navigate = useNavigate();
  const [regRole, setRegRole] = useState("student"); // "student" | "recruiter"

  // Auto-redirect if already logged in
  useEffect(() => {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");
    if (token && role) {
      if (role === "student") navigate("/student/dashboard", { replace: true });
      else if (role === "recruiter") navigate("/recruiter/dashboard", { replace: true });
      else if (role === "admin") navigate("/admin/dashboard", { replace: true });
    }
  }, [navigate]);

  // Student Form State
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    course: "",
    branch: "",
    rollNumber: "",
  });

  // Recruiter Form State
  const [recruiterData, setRecruiterData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    companyName: "",
    companyWebsite: "",
    designation: "",
    contactNumber: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState("");
  const [recruiterSuccess, setRecruiterSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleStudentChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
      // Reset branch if course changes
      ...(name === "course" ? { branch: "" } : {}),
    }));
  };

  const handleRecruiterChange = (e) => {
    const { name, value } = e.target;
    setRecruiterData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleStudentRegister = async (e) => {
    e.preventDefault();
    setMessage("");

    if (formData.password.length < 8) {
      setMessage("Password must be at least 8 characters long");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setMessage("Passwords do not match");
      return;
    }

    setLoading(true);

    try {
      await api.post("/auth/register", {
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        college: "XYZ Group of Institutions",
        course: formData.course,
        branch: formData.course === "M.Tech" ? null : formData.branch,
        rollNumber: formData.rollNumber.trim(),
      });

      navigate("/verify-registration", {
        state: {
          email: formData.email.trim().toLowerCase(),
        },
      });
    } catch (error) {
      setMessage(
        error.response?.data?.message ||
          error.message ||
          "Student registration failed. Please check your details."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleRecruiterRegister = async (e) => {
    e.preventDefault();
    setMessage("");

    if (recruiterData.password.length < 8) {
      setMessage("Password must be at least 8 characters long");
      return;
    }

    if (recruiterData.password !== recruiterData.confirmPassword) {
      setMessage("Passwords do not match");
      return;
    }

    setLoading(true);

    try {
      const response = await api.post("/auth/register-recruiter", {
        name: recruiterData.name.trim(),
        email: recruiterData.email.trim().toLowerCase(),
        password: recruiterData.password,
        companyName: recruiterData.companyName.trim(),
        companyWebsite: recruiterData.companyWebsite.trim(),
        designation: recruiterData.designation.trim(),
        contactNumber: recruiterData.contactNumber.trim(),
      });

      setRecruiterSuccess(true);
      setMessage(response.data.message);
    } catch (error) {
      setMessage(
        error.response?.data?.message ||
          error.message ||
          "Recruiter registration failed"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "radial-gradient(ellipse at 50% 10%, #eff6ff 0%, #f8fafc 60%, #e2e8f0 100%)",
        padding: "32px 20px",
        fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "540px",
          background: "#ffffff",
          borderRadius: "20px",
          border: "1px solid #e2e8f0",
          boxShadow: "0 25px 50px -12px rgba(15, 23, 42, 0.12), 0 0 0 1px rgba(15, 23, 42, 0.04)",
          padding: "36px 32px",
        }}
      >
        {/* Brand Header */}
        <div style={{ textAlign: "center", marginBottom: "24px" }}>
          <div
            style={{
              width: "52px",
              height: "52px",
              margin: "0 auto 12px",
              borderRadius: "14px",
              background: "linear-gradient(135deg, #0284c7, #0f172a)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "24px",
              color: "#ffffff",
              boxShadow: "0 8px 20px rgba(2, 132, 199, 0.35)",
            }}
          >
            🎓
          </div>

          <div
            style={{
              display: "inline-block",
              padding: "4px 12px",
              background: "#eff6ff",
              border: "1px solid #bfdbfe",
              borderRadius: "20px",
              fontSize: "11px",
              fontWeight: 700,
              color: "#1d4ed8",
              letterSpacing: "0.5px",
              textTransform: "uppercase",
              marginBottom: "10px",
            }}
          >
            XYZ Group of Institutions • CRPC
          </div>

          <h1
            style={{
              margin: "0 0 6px",
              fontSize: "24px",
              fontWeight: 800,
              color: "#0f172a",
              letterSpacing: "-0.5px",
            }}
          >
            Create Your Account
          </h1>
          <p style={{ margin: 0, color: "#64748b", fontSize: "13px" }}>
            Join the centralized campus recruitment & placement ecosystem
          </p>
        </div>

        {/* Role Selector Tabs */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "8px",
            background: "#f1f5f9",
            padding: "4px",
            borderRadius: "12px",
            marginBottom: "24px",
          }}
        >
          <button
            type="button"
            onClick={() => {
              setRegRole("student");
              setMessage("");
              setRecruiterSuccess(false);
            }}
            style={{
              padding: "10px 14px",
              borderRadius: "10px",
              border: "none",
              background: regRole === "student" ? "#ffffff" : "transparent",
              color: regRole === "student" ? "#0f172a" : "#64748b",
              fontWeight: regRole === "student" ? 700 : 600,
              fontSize: "13px",
              cursor: "pointer",
              boxShadow: regRole === "student" ? "0 2px 8px rgba(0,0,0,0.08)" : "none",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "6px",
              transition: "all 0.15s ease",
            }}
          >
            <span>🎓</span>
            <span>Student Portal</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setRegRole("recruiter");
              setMessage("");
              setRecruiterSuccess(false);
            }}
            style={{
              padding: "10px 14px",
              borderRadius: "10px",
              border: "none",
              background: regRole === "recruiter" ? "#ffffff" : "transparent",
              color: regRole === "recruiter" ? "#0f172a" : "#64748b",
              fontWeight: regRole === "recruiter" ? 700 : 600,
              fontSize: "13px",
              cursor: "pointer",
              boxShadow: regRole === "recruiter" ? "0 2px 8px rgba(0,0,0,0.08)" : "none",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "6px",
              transition: "all 0.15s ease",
            }}
          >
            <span>🏢</span>
            <span>Corporate Recruiter</span>
          </button>
        </div>

        {/* Message Alert */}
        {message && (
          <div
            style={{
              padding: "12px 14px",
              background: recruiterSuccess ? "#f0fdf4" : "#fef2f2",
              color: recruiterSuccess ? "#166534" : "#991b1b",
              border: `1px solid ${recruiterSuccess ? "#bbf7d0" : "#fecaca"}`,
              borderRadius: "10px",
              marginBottom: "20px",
              fontSize: "13px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <span>{recruiterSuccess ? "✅" : "⚠️"}</span>
            <span>{message}</span>
          </div>
        )}

        {/* Recruiter Success Screen */}
        {recruiterSuccess ? (
          <div
            style={{
              textAlign: "center",
              padding: "24px 16px",
              background: "#f8fafc",
              borderRadius: "14px",
              border: "1px solid #e2e8f0",
            }}
          >
            <div style={{ fontSize: "44px", marginBottom: "12px" }}>⏳</div>
            <h3 style={{ margin: "0 0 8px", fontSize: "18px", color: "#0f172a" }}>
              Profile Submitted for TPO Verification
            </h3>
            <p
              style={{
                color: "#64748b",
                fontSize: "13px",
                lineHeight: "1.5",
                marginBottom: "20px",
              }}
            >
              Your corporate hiring partner profile has been recorded. Once the XYZ placement cell verifies your organization, your account will be activated to post placement drives and schedule interviews.
            </p>
            <button
              onClick={() => navigate("/login", { replace: true })}
              style={{
                padding: "11px 24px",
                background: "#0f172a",
                color: "#fff",
                border: "none",
                borderRadius: "8px",
                fontWeight: 700,
                fontSize: "13px",
                cursor: "pointer",
              }}
            >
              Proceed to Sign In →
            </button>
          </div>
        ) : regRole === "student" ? (
          /* ========================================================
              STUDENT REGISTRATION FORM
             ======================================================== */
          <form onSubmit={handleStudentRegister} autoComplete="off" style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            <div>
              <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#334155", marginBottom: "4px" }}>
                Full Name *
              </label>
              <input
                type="text"
                name="name"
                autoComplete="off"
                value={formData.name}
                onChange={handleStudentChange}
                placeholder=""
                required
                style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px" }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#334155", marginBottom: "4px" }}>
                College / Institutional Email *
              </label>
              <input
                type="email"
                name="email"
                autoComplete="off"
                value={formData.email}
                onChange={handleStudentChange}
                placeholder=""
                required
                style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px" }}
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#334155", marginBottom: "4px" }}>
                  Degree Course *
                </label>
                <select
                  name="course"
                  value={formData.course}
                  onChange={handleStudentChange}
                  required
                  style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px", background: "#fff" }}
                >
                  <option value="">Select Course</option>
                  <option value="B.Tech">B.Tech</option>
                  <option value="MCA">MCA</option>
                  <option value="BCA">BCA</option>
                  <option value="M.Tech">M.Tech</option>
                  <option value="MBA">MBA</option>
                </select>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#334155", marginBottom: "4px" }}>
                  University Roll Number *
                </label>
                <input
                  type="text"
                  name="rollNumber"
                  autoComplete="off"
                  value={formData.rollNumber}
                  onChange={handleStudentChange}
                  placeholder=""
                  required
                  style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px" }}
                />
              </div>
            </div>

            {formData.course && formData.course !== "M.Tech" && (
              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#334155", marginBottom: "4px" }}>
                  Branch / Department *
                </label>
                <select
                  name="branch"
                  value={formData.branch}
                  onChange={handleStudentChange}
                  required
                  style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px", background: "#fff" }}
                >
                  <option value="">Select Department</option>
                  {formData.course === "B.Tech" && (
                    <>
                      <option value="Computer Science and Engineering">Computer Science and Engineering (CSE)</option>
                      <option value="Information Technology">Information Technology (IT)</option>
                      <option value="Electronics and Communication Engineering">Electronics and Communication (ECE)</option>
                      <option value="Electrical and Electronics Engineering">Electrical & Electronics (EEE)</option>
                      <option value="Mechanical Engineering">Mechanical Engineering (ME)</option>
                      <option value="Artificial Intelligence">Artificial Intelligence (AI)</option>
                      <option value="Artificial Intelligence and Machine Learning">AI & Machine Learning (AIML)</option>
                    </>
                  )}
                  {formData.course === "MCA" && (
                    <option value="Computer Applications">Computer Applications (MCA)</option>
                  )}
                  {formData.course === "BCA" && (
                    <option value="Computer Applications">Computer Applications (BCA)</option>
                  )}
                  {formData.course === "MBA" && (
                    <>
                      <option value="Finance">Finance</option>
                      <option value="Marketing">Marketing</option>
                      <option value="Human Resources">Human Resources</option>
                      <option value="Operations">Operations</option>
                    </>
                  )}
                </select>
              </div>
            )}

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#334155", marginBottom: "4px" }}>
                  Password * (Min 8 chars)
                </label>
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  autoComplete="new-password"
                  value={formData.password}
                  onChange={handleStudentChange}
                  placeholder=""
                  minLength="8"
                  required
                  style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px" }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#334155", marginBottom: "4px" }}>
                  Confirm Password *
                </label>
                <input
                  type={showPassword ? "text" : "password"}
                  name="confirmPassword"
                  autoComplete="new-password"
                  value={formData.confirmPassword}
                  onChange={handleStudentChange}
                  placeholder=""
                  minLength="8"
                  required
                  style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px" }}
                />
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{ background: "none", border: "none", fontSize: "12px", color: "#0284c7", cursor: "pointer", fontWeight: 600, padding: 0 }}
              >
                {showPassword ? "🙈 Hide Passwords" : "👁️ Show Passwords"}
              </button>
              <span style={{ fontSize: "11px", color: "#64748b" }}>
                College: XYZ Group of Institutions
              </span>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: "100%",
                padding: "12px",
                background: "linear-gradient(135deg, #0284c7, #0f172a)",
                color: "#ffffff",
                border: "none",
                borderRadius: "10px",
                fontSize: "14px",
                fontWeight: 700,
                cursor: loading ? "not-allowed" : "pointer",
                boxShadow: "0 4px 14px rgba(2, 132, 199, 0.35)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                marginTop: "4px",
              }}
            >
              {loading ? (
                <span>Sending Verification OTP...</span>
              ) : (
                <>
                  <span>Register & Verify Email</span>
                  <span style={{ fontSize: "16px" }}>→</span>
                </>
              )}
            </button>
          </form>
        ) : (
          /* ========================================================
              RECRUITER REGISTRATION FORM
             ======================================================== */
          <form onSubmit={handleRecruiterRegister} autoComplete="off" style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#334155", marginBottom: "4px" }}>
                  Recruiter Full Name *
                </label>
                <input
                  type="text"
                  name="name"
                  autoComplete="off"
                  value={recruiterData.name}
                  onChange={handleRecruiterChange}
                  placeholder=""
                  required
                  style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px" }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#334155", marginBottom: "4px" }}>
                  Work Email *
                </label>
                <input
                  type="email"
                  name="email"
                  autoComplete="off"
                  value={recruiterData.email}
                  onChange={handleRecruiterChange}
                  placeholder=""
                  required
                  style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px" }}
                />
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#334155", marginBottom: "4px" }}>
                  Hiring Organization *
                </label>
                <input
                  type="text"
                  name="companyName"
                  autoComplete="off"
                  value={recruiterData.companyName}
                  onChange={handleRecruiterChange}
                  placeholder=""
                  required
                  style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px" }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#334155", marginBottom: "4px" }}>
                  Official Website
                </label>
                <input
                  type="url"
                  name="companyWebsite"
                  autoComplete="off"
                  value={recruiterData.companyWebsite}
                  onChange={handleRecruiterChange}
                  placeholder=""
                  style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px" }}
                />
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#334155", marginBottom: "4px" }}>
                  Your Designation *
                </label>
                <input
                  type="text"
                  name="designation"
                  autoComplete="off"
                  value={recruiterData.designation}
                  onChange={handleRecruiterChange}
                  placeholder=""
                  required
                  style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px" }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#334155", marginBottom: "4px" }}>
                  Contact Phone Number *
                </label>
                <input
                  type="tel"
                  name="contactNumber"
                  autoComplete="off"
                  value={recruiterData.contactNumber}
                  onChange={handleRecruiterChange}
                  placeholder=""
                  required
                  style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px" }}
                />
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#334155", marginBottom: "4px" }}>
                  Password * (Min 8 chars)
                </label>
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  autoComplete="new-password"
                  value={recruiterData.password}
                  onChange={handleRecruiterChange}
                  placeholder=""
                  minLength="8"
                  required
                  style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px" }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#334155", marginBottom: "4px" }}>
                  Confirm Password *
                </label>
                <input
                  type={showPassword ? "text" : "password"}
                  name="confirmPassword"
                  autoComplete="new-password"
                  value={recruiterData.confirmPassword}
                  onChange={handleRecruiterChange}
                  placeholder=""
                  minLength="8"
                  required
                  style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px" }}
                />
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-start" }}>
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{ background: "none", border: "none", fontSize: "12px", color: "#0284c7", cursor: "pointer", fontWeight: 600, padding: 0 }}
              >
                {showPassword ? "🙈 Hide Passwords" : "👁️ Show Passwords"}
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: "100%",
                padding: "12px",
                background: "linear-gradient(135deg, #0284c7, #0f172a)",
                color: "#ffffff",
                border: "none",
                borderRadius: "10px",
                fontSize: "14px",
                fontWeight: 700,
                cursor: loading ? "not-allowed" : "pointer",
                boxShadow: "0 4px 14px rgba(2, 132, 199, 0.35)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                marginTop: "4px",
              }}
            >
              {loading ? (
                <span>Registering Recruiter Profile...</span>
              ) : (
                <>
                  <span>Create Recruiter Profile</span>
                  <span style={{ fontSize: "16px" }}>→</span>
                </>
              )}
            </button>
          </form>
        )}

        {/* Bottom Link */}
        <div
          style={{
            marginTop: "20px",
            textAlign: "center",
            fontSize: "13px",
            color: "#64748b",
          }}
        >
          Already have an account?{" "}
          <Link
            to="/login"
            style={{
              color: "#0284c7",
              textDecoration: "none",
              fontWeight: 700,
            }}
          >
            Sign in here
          </Link>
        </div>
      </div>
    </div>
  );
}

