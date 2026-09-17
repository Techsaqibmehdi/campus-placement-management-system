import { useState, useEffect } from "react";
import { Routes, Route } from "react-router-dom";
import axios from "axios";
import ProtectedRoute from "./ProtectedRoute";
import api from "./api";
import {
  getStudentProfile,
  getPlacementDrives,
  getMyApplications,
  getMyInterviews,
} from "./api/studentApi";

function Home() {
  return <h1>Campus Placement Management System</h1>;
}

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      const response = await axios.post(
        "http://localhost:5000/api/auth/login",
        {
          email,
          password,
        }
      );

      localStorage.setItem("token", response.data.token);
      localStorage.setItem("role", response.data.user.role);

      const role = response.data.user.role;

      if (role === "student") {
        window.location.href = "/student/dashboard";
      } else if (role === "recruiter") {
        window.location.href = "/recruiter/dashboard";
      } else if (role === "admin") {
        window.location.href = "/admin/dashboard";
      }
    } catch (error) {
      setMessage(
        error.response?.data?.message ||
          error.message ||
          "Login failed"
      );

      console.log("LOGIN ERROR:", error);
    }
  };

  return (
    <div>
      <h1>Login</h1>

      <form onSubmit={handleLogin}>
        <div>
          <label>Email</label>
          <br />

          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter email"
          />
        </div>

        <br />

        <div>
          <label>Password</label>
          <br />

          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter password"
          />
        </div>

        <br />

        <button type="submit">Login</button>
      </form>

      {message && <p>{message}</p>}
    </div>
  );
}

function StudentDashboard() {
  const [profile, setProfile] = useState(null);
  const [drives, setDrives] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [applications, setApplications] = useState([]);
  const [interviews, setInterviews] = useState([]);

 const fetchDashboardData = async () => {
  try {
    const [profileData, drivesData, applicationsData, interviewsData] =
  await Promise.all([
    getStudentProfile(),
    getPlacementDrives(),
    getMyApplications(),
    getMyInterviews(),
  ]);

setProfile(profileData);
setDrives(drivesData);
setApplications(applicationsData);
setInterviews(interviewsData);
  } catch (error) {
    setError(
      error.response?.data?.message ||
        "Failed to load dashboard"
    );
  } finally {
    setLoading(false);
  }
};

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (loading) {
    return <h1>Loading...</h1>;
  }

  if (error) {
    return <p>{error}</p>;
  }

 return (
  <div>
    <h1>Student Dashboard</h1>

    {profile && (
      <div>
        <h2>Welcome, {profile.user?.name}</h2>

        <p>Roll Number: {profile.rollNumber}</p>
        <p>Course: {profile.course}</p>
        <p>Branch: {profile.branch}</p>
        <p>CGPA: {profile.cgpa}</p>
      </div>
    )}

    <hr />

    <h2>My Applications: {applications.length}</h2>
    <hr />

<h2>My Interviews: {interviews.length}</h2>

    <hr />

    <h2>Available Placement Drives</h2>

    {drives.length === 0 ? (
      <p>No placement drives available.</p>
    ) : (
      drives.map((drive) => (
        <div key={drive._id}>
          <h3>{drive.jobTitle}</h3>

          <p>
            Company: {drive.company?.name}
          </p>

          <p>
            Package: {drive.package} LPA
          </p>

          <p>
            Location: {drive.location}
          </p>

          <p>
            Minimum CGPA: {drive.minimumCgpa}
          </p>

          <p>
            Deadline:{" "}
            {new Date(
              drive.applicationDeadline
            ).toLocaleDateString()}
          </p>

          <hr />
        </div>
      ))
    )}
  </div>
);
}

function RecruiterDashboard() {
  return <h1>Recruiter Dashboard</h1>;
}

function AdminDashboard() {
  return <h1>Admin Dashboard</h1>;
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />

      <Route path="/login" element={<Login />} />
<Route
  path="/student/dashboard"
  element={
    <ProtectedRoute allowedRoles={["student"]}>
      <StudentDashboard />
    </ProtectedRoute>
  }
/>

<Route
  path="/recruiter/dashboard"
  element={
    <ProtectedRoute allowedRoles={["recruiter"]}>
      <RecruiterDashboard />
    </ProtectedRoute>
  }
/>

<Route
  path="/admin/dashboard"
  element={
    <ProtectedRoute allowedRoles={["admin"]}>
      <AdminDashboard />
    </ProtectedRoute>
  }
/>
    </Routes>
  );
}

export default App;