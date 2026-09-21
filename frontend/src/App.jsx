import { useEffect } from "react";
import { Routes, Route, useNavigate } from "react-router-dom";
import ProtectedRoute from "./ProtectedRoute";
import Login from "./pages/Login";
import Register from "./pages/Register";
import VerifyOTP from "./pages/VerifyOTP";
import StudentDashboard from "./pages/StudentDashboard";
import RecruiterDashboard from "./pages/RecruiterDashboard";
import AdminDashboard from "./pages/AdminDashboard";

function Home() {
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");

    if (token && role) {
      if (role === "student") {
        navigate("/student/dashboard", { replace: true });
      } else if (role === "recruiter") {
        navigate("/recruiter/dashboard", { replace: true });
      } else if (role === "admin") {
        navigate("/admin/dashboard", { replace: true });
      } else {
        navigate("/login", { replace: true });
      }
    } else {
      navigate("/login", { replace: true });
    }
  }, [navigate]);

  return null;
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/verify-registration" element={<VerifyOTP />} />

      {/* Protected Student Portal */}
      <Route
        path="/student/dashboard"
        element={
          <ProtectedRoute allowedRoles={["student"]}>
            <StudentDashboard />
          </ProtectedRoute>
        }
      />

      {/* Protected Recruiter Portal */}
      <Route
        path="/recruiter/dashboard"
        element={
          <ProtectedRoute allowedRoles={["recruiter"]}>
            <RecruiterDashboard />
          </ProtectedRoute>
        }
      />

      {/* Protected Admin/TPO Command Center */}
      <Route
        path="/admin/dashboard"
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />

      {/* Fallback Catch-all Route */}
      <Route path="*" element={<Home />} />
    </Routes>
  );
}

export default App;