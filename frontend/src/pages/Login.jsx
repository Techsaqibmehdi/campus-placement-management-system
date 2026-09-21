import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../api";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  // Auto-redirect if already logged in (solves back-button loop)
  useEffect(() => {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");
    if (token && role) {
      if (role === "student") navigate("/student/dashboard", { replace: true });
      else if (role === "recruiter") navigate("/recruiter/dashboard", { replace: true });
      else if (role === "admin") navigate("/admin/dashboard", { replace: true });
    }
  }, [navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setMessage("");
    setLoading(true);

    try {
      const response = await api.post("/auth/login", {
        email: email.trim().toLowerCase(),
        password,
      });

      localStorage.setItem("token", response.data.token);
      localStorage.setItem("role", response.data.user.role);
      localStorage.setItem("status", response.data.user.status || "active");
      localStorage.setItem("userName", response.data.user.name);

      const role = response.data.user.role;

      // Use replace: true so /login is replaced in browser history
      if (role === "student") {
        navigate("/student/dashboard", { replace: true });
      } else if (role === "recruiter") {
        navigate("/recruiter/dashboard", { replace: true });
      } else if (role === "admin") {
        navigate("/admin/dashboard", { replace: true });
      }
    } catch (error) {
      setMessage(
        error.response?.data?.message ||
          error.message ||
          "Invalid email or password"
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
        backgroundImage: "url('/login-bg.jpg')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        padding: "24px",
        fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
        position: "relative",
      }}
    >
      {/* Subtle backdrop tint overlay */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "linear-gradient(180deg, rgba(15, 23, 42, 0.18) 0%, rgba(15, 23, 42, 0.08) 50%, rgba(15, 23, 42, 0.22) 100%)",
          pointerEvents: "none",
        }}
      />

      <div
        style={{
          width: "100%",
          maxWidth: "460px",
          background: "rgba(255, 255, 255, 0.94)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          borderRadius: "24px",
          border: "1px solid rgba(255, 255, 255, 0.8)",
          boxShadow: "0 25px 60px -15px rgba(15, 23, 42, 0.35), 0 0 0 1px rgba(255, 255, 255, 0.6)",
          padding: "36px 32px",
          position: "relative",
          zIndex: 2,
        }}
      >
        {/* Brand Header */}
        <div style={{ textAlign: "center", marginBottom: "26px" }}>
          <div
            style={{
              width: "56px",
              height: "56px",
              margin: "0 auto 14px",
              borderRadius: "16px",
              background: "linear-gradient(135deg, #0284c7, #0f172a)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "26px",
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
            Welcome Back
          </h1>
          <p
            style={{
              margin: 0,
              color: "#64748b",
              fontSize: "13px",
              lineHeight: "1.4",
            }}
          >
            Sign in to access your placement opportunities, drives & hackathons
          </p>
        </div>

        {/* Unified Portal Indicator */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: "8px",
            marginBottom: "20px",
            padding: "8px 12px",
            background: "#f8fafc",
            borderRadius: "10px",
            border: "1px solid #f1f5f9",
          }}
        >
          <span style={{ fontSize: "11px", fontWeight: 600, color: "#475569" }}>
            🎓 Student
          </span>
          <span style={{ fontSize: "11px", color: "#cbd5e1" }}>•</span>
          <span style={{ fontSize: "11px", fontWeight: 600, color: "#475569" }}>
            🏢 Recruiter
          </span>
          <span style={{ fontSize: "11px", color: "#cbd5e1" }}>•</span>
          <span style={{ fontSize: "11px", fontWeight: 600, color: "#475569" }}>
            🧑‍💼 TPO Admin
          </span>
        </div>

        {/* Error Alert */}
        {message && (
          <div
            style={{
              padding: "12px 14px",
              background: "#fef2f2",
              color: "#991b1b",
              border: "1px solid #fecaca",
              borderRadius: "10px",
              marginBottom: "18px",
              fontSize: "13px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <span style={{ fontSize: "16px" }}>⚠️</span>
            <span>{message}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleLogin} autoComplete="off" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div>
            <label
              style={{
                display: "block",
                fontSize: "12px",
                fontWeight: 700,
                color: "#334155",
                marginBottom: "6px",
              }}
            >
              Email Address
            </label>
            <div style={{ position: "relative" }}>
              <span
                style={{
                  position: "absolute",
                  left: "12px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  fontSize: "15px",
                  color: "#94a3b8",
                }}
              >
                ✉️
              </span>
              <input
                type="email"
                name="email"
                id="login-email"
                autoComplete="off"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder=""
                required
                style={{
                  width: "100%",
                  padding: "11px 12px 11px 38px",
                  borderRadius: "10px",
                  border: "1px solid #cbd5e1",
                  fontSize: "13px",
                  color: "#0f172a",
                  outline: "none",
                  transition: "border-color 0.15s ease",
                  background: "#ffffff",
                }}
              />
            </div>
          </div>

          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
              <label
                style={{
                  fontSize: "12px",
                  fontWeight: 700,
                  color: "#334155",
                }}
              >
                Password
              </label>
              <span style={{ fontSize: "11px", color: "#64748b" }}>
                Min 6 characters
              </span>
            </div>
            <div style={{ position: "relative" }}>
              <span
                style={{
                  position: "absolute",
                  left: "12px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  fontSize: "15px",
                  color: "#94a3b8",
                }}
              >
                🔒
              </span>
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                id="login-password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder=""
                required
                style={{
                  width: "100%",
                  padding: "11px 40px 11px 38px",
                  borderRadius: "10px",
                  border: "1px solid #cbd5e1",
                  fontSize: "13px",
                  color: "#0f172a",
                  outline: "none",
                  background: "#ffffff",
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: "absolute",
                  right: "10px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  fontSize: "14px",
                  padding: "4px",
                  color: "#64748b",
                }}
                title={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? "👁️" : "🙈"}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              padding: "12px",
              marginTop: "4px",
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
              transition: "transform 0.1s ease, box-shadow 0.15s ease",
            }}
          >
            {loading ? (
              <span>Signing in...</span>
            ) : (
              <>
                <span>Sign In to Portal</span>
                <span style={{ fontSize: "16px" }}>→</span>
              </>
            )}
          </button>
        </form>


        {/* Bottom Registration Link */}
        <div
          style={{
            marginTop: "20px",
            textAlign: "center",
            fontSize: "13px",
            color: "#64748b",
          }}
        >
          New to XYZ Placement Portal?{" "}
          <Link
            to="/register"
            style={{
              color: "#0284c7",
              textDecoration: "none",
              fontWeight: 700,
            }}
          >
            Create an Account
          </Link>
        </div>
      </div>
    </div>
  );
}

