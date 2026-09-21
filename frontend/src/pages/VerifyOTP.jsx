import { useState, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import api from "../api";

export default function VerifyOTP() {
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState(location.state?.email || "");
  const [otp, setOtp] = useState("");
  const [message, setMessage] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [countdown, setCountdown] = useState(30);

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

  // Resend countdown timer
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleVerify = async (e) => {
    e.preventDefault();
    setMessage("");
    setSuccessMsg("");

    if (!email.trim()) {
      setMessage("Please enter your registered email");
      return;
    }

    if (otp.length < 6) {
      setMessage("Please enter the complete 6-digit OTP code");
      return;
    }

    setLoading(true);

    try {
      await api.post("/auth/verify-registration-otp", {
        email: email.trim().toLowerCase(),
        otp: otp.trim(),
      });

      setSuccessMsg("Account verified successfully! Redirecting to login...");
      setTimeout(() => {
        navigate("/login", { replace: true });
      }, 1500);
    } catch (error) {
      setMessage(
        error.response?.data?.message ||
          error.message ||
          "Invalid or expired verification code"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (countdown > 0 || resending) return;
    setMessage("");
    setSuccessMsg("");
    setResending(true);

    try {
      await api.post("/auth/resend-registration-otp", {
        email: email.trim().toLowerCase(),
      });
      setSuccessMsg("A new verification code has been dispatched to your email!");
      setCountdown(45);
    } catch (error) {
      setMessage(
        error.response?.data?.message ||
          "Failed to resend code. Please register again if your session expired."
      );
    } finally {
      setResending(false);
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
        padding: "24px",
        fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "460px",
          background: "#ffffff",
          borderRadius: "20px",
          border: "1px solid #e2e8f0",
          boxShadow: "0 25px 50px -12px rgba(15, 23, 42, 0.12), 0 0 0 1px rgba(15, 23, 42, 0.04)",
          padding: "36px 32px",
          textAlign: "center",
        }}
      >
        {/* Verification Icon Badge */}
        <div
          style={{
            width: "60px",
            height: "60px",
            margin: "0 auto 16px",
            borderRadius: "18px",
            background: "linear-gradient(135deg, #0284c7, #0f172a)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "28px",
            color: "#ffffff",
            boxShadow: "0 8px 20px rgba(2, 132, 199, 0.35)",
          }}
        >
          🔐
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
          XYZ Institutional Security
        </div>

        <h1
          style={{
            margin: "0 0 6px",
            fontSize: "22px",
            fontWeight: 800,
            color: "#0f172a",
            letterSpacing: "-0.5px",
          }}
        >
          Verify Your Email
        </h1>
        <p style={{ margin: "0 0 20px", color: "#64748b", fontSize: "13px", lineHeight: "1.4" }}>
          We sent a 6-digit confirmation code to activate your placement credentials
        </p>

        {/* Email Pill */}
        {email && (
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "6px 14px",
              background: "#f1f5f9",
              borderRadius: "20px",
              fontSize: "13px",
              fontWeight: 600,
              color: "#334155",
              marginBottom: "20px",
            }}
          >
            <span>✉️</span>
            <span>{email}</span>
          </div>
        )}

        {/* Error Alert */}
        {message && (
          <div
            style={{
              padding: "10px 14px",
              background: "#fef2f2",
              color: "#991b1b",
              border: "1px solid #fecaca",
              borderRadius: "10px",
              marginBottom: "16px",
              fontSize: "13px",
              textAlign: "left",
            }}
          >
            ⚠️ {message}
          </div>
        )}

        {/* Success Alert */}
        {successMsg && (
          <div
            style={{
              padding: "10px 14px",
              background: "#f0fdf4",
              color: "#166534",
              border: "1px solid #bbf7d0",
              borderRadius: "10px",
              marginBottom: "16px",
              fontSize: "13px",
              textAlign: "left",
            }}
          >
            ✅ {successMsg}
          </div>
        )}

        {/* OTP Verification Form */}
        <form onSubmit={handleVerify} autoComplete="off" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {!email && (
            <div style={{ textAlign: "left" }}>
              <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#334155", marginBottom: "4px" }}>
                Your Registered Email
              </label>
              <input
                type="email"
                name="email"
                autoComplete="off"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder=""
                required
                style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px" }}
              />
            </div>
          )}

          <div>
            <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#334155", marginBottom: "6px", textAlign: "left" }}>
              Enter 6-Digit OTP Code
            </label>
            <input
              type="text"
              name="otp"
              autoComplete="one-time-code"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
              placeholder=""
              maxLength="6"
              autoFocus
              required
              style={{
                width: "100%",
                padding: "14px 12px",
                borderRadius: "12px",
                border: "2px solid #0284c7",
                fontSize: "26px",
                fontWeight: 800,
                textAlign: "center",
                letterSpacing: "12px",
                color: "#0f172a",
                background: "#f8fafc",
                outline: "none",
              }}
            />
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
              marginTop: "4px",
            }}
          >
            {loading ? "Verifying Credentials..." : "Verify & Activate Account →"}
          </button>
        </form>

        {/* Resend Action */}
        <div style={{ marginTop: "20px", fontSize: "13px", color: "#64748b" }}>
          Didn&apos;t receive the verification email?{" "}
          {countdown > 0 ? (
            <span style={{ fontWeight: 600, color: "#94a3b8" }}>
              Resend code in {countdown}s
            </span>
          ) : (
            <button
              type="button"
              onClick={handleResendOTP}
              disabled={resending}
              style={{
                background: "none",
                border: "none",
                color: "#0284c7",
                fontWeight: 700,
                cursor: "pointer",
                padding: 0,
                fontSize: "13px",
              }}
            >
              {resending ? "Sending..." : "Resend OTP Now"}
            </button>
          )}
        </div>

        {/* Back Link */}
        <div style={{ marginTop: "16px", paddingTop: "14px", borderTop: "1px solid #f1f5f9" }}>
          <Link
            to="/register"
            style={{
              fontSize: "12px",
              color: "#64748b",
              textDecoration: "none",
              fontWeight: 600,
            }}
          >
            ← Back to Registration
          </Link>
        </div>
      </div>
    </div>
  );
}

