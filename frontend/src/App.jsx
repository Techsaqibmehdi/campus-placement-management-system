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
  getMyOffers,
  applyToDrive,
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
  const [offers, setOffers] = useState([]);
  const [selectedDrive, setSelectedDrive] = useState(null);
  const [applyLoading, setApplyLoading] = useState(false);
const [applyMessage, setApplyMessage] = useState("");
const [activeSection, setActiveSection] = useState(null);

  const fetchDashboardData = async () => {
    try {
      const [
        profileData,
        drivesData,
        applicationsData,
        interviewsData,
        offersData,
      ] = await Promise.all([
        getStudentProfile(),
        getPlacementDrives(),
        getMyApplications(),
        getMyInterviews(),
        getMyOffers(),
      ]);

      setProfile(profileData);
      setDrives(drivesData);
      setApplications(applicationsData);
      setInterviews(interviewsData);
      setOffers(offersData);
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
  const hasApplied = (driveId) => {
  return applications.some(
    (application) => application.drive?._id === driveId
  );
};
const handleApply = async () => {
  try {
    setApplyLoading(true);
    setApplyMessage("");

    const response = await applyToDrive(selectedDrive._id);

    setApplyMessage(
      response.message || "Application submitted successfully"
    );

    const applicationsData = await getMyApplications();
    setApplications(applicationsData);

  } catch (error) {
    setApplyMessage(
      error.response?.data?.message ||
        "Failed to apply for this drive"
    );
  } finally {
    setApplyLoading(false);
  }
};
 return (
  <div className="dashboard">

    {/* ================= DRIVE DETAILS ================= */}

    {selectedDrive && (
      <div className="section">

        <button
          className="drive-button"
          onClick={() => setSelectedDrive(null)}
        >
          ← Back to Drives
        </button>

        <div className="drive-card">

          <h2>{selectedDrive.jobTitle}</h2>

          <p>
            <strong>Company:</strong>{" "}
            {selectedDrive.company?.name}
          </p>

          <p>
            <strong>Package:</strong>{" "}
            {selectedDrive.package} LPA
          </p>

          <p>
            <strong>Location:</strong>{" "}
            {selectedDrive.location}
          </p>

          <p>
            <strong>Minimum CGPA:</strong>{" "}
            {selectedDrive.minimumCgpa}
          </p>

          <p>
            <strong>Eligible Branches:</strong>{" "}
            {selectedDrive.eligibleBranches?.length
              ? selectedDrive.eligibleBranches.join(", ")
              : "All"}
          </p>

          <p>
            <strong>Required Skills:</strong>{" "}
            {selectedDrive.requiredSkills?.length
              ? selectedDrive.requiredSkills.join(", ")
              : "Not specified"}
          </p>

          <p>
            <strong>Minimum 10th Percentage:</strong>{" "}
            {selectedDrive.minimumTenthPercentage ??
              "Not specified"}
          </p>

          <p>
            <strong>Minimum 12th Percentage:</strong>{" "}
            {selectedDrive.minimumTwelfthPercentage ??
              "Not specified"}
          </p>

          <p>
            <strong>Maximum Backlogs:</strong>{" "}
            {selectedDrive.maximumBacklogs}
          </p>

          <p>
            <strong>Application Deadline:</strong>{" "}
            {new Date(
              selectedDrive.applicationDeadline
            ).toLocaleDateString()}
          </p>

          <p>
            <strong>Status:</strong>{" "}
            {selectedDrive.status}
          </p>

          <p>
            <strong>Description:</strong>{" "}
            {selectedDrive.description ||
              "No description available."}
          </p>

          {/* Apply Button */}

          {hasApplied(selectedDrive._id) ? (
            <button
              className="drive-button"
              disabled
            >
              ✓ Applied
            </button>
          ) : (
            <button
              className="drive-button"
              onClick={handleApply}
              disabled={applyLoading}
            >
              {applyLoading
                ? "Applying..."
                : "Apply Now"}
            </button>
          )}

          {applyMessage && (
            <p>{applyMessage}</p>
          )}

        </div>
      </div>
    )}

    {/* ================= MAIN DASHBOARD ================= */}

    {!selectedDrive && (
      <>

        {/* ================= HEADER ================= */}

        <div className="dashboard-header">

          <h1>Student Dashboard</h1>

          <p>
            Track your placement journey
          </p>

        </div>


        {/* ================= PROFILE ================= */}

        {profile && (
          <div className="profile-card">

            <h2>
              Welcome, {profile.user?.name}
            </h2>

            <div className="profile-grid">

              <div className="profile-item">
                <span>Roll Number</span>

                <strong>
                  {profile.rollNumber}
                </strong>
              </div>

              <div className="profile-item">
                <span>Course</span>

                <strong>
                  {profile.course}
                </strong>
              </div>

              <div className="profile-item">
                <span>Branch</span>

                <strong>
                  {profile.branch}
                </strong>
              </div>

              <div className="profile-item">
                <span>CGPA</span>

                <strong>
                  {profile.cgpa}
                </strong>
              </div>

            </div>

          </div>
        )}


        {/* ================= SUMMARY CARDS ================= */}

        <div className="summary-grid">

          {/* Applications */}

          <div
            className="summary-card clickable"
            onClick={() =>
              setActiveSection(
                activeSection === "applications"
                  ? null
                  : "applications"
              )
            }
          >

            <h3>Applications</h3>

            <strong>
              {applications.length}
            </strong>

            <span>
              {activeSection === "applications"
                ? "← Back to Placement Drives"
                : "View Applications"}
            </span>

          </div>


          {/* Interviews */}

          <div
            className="summary-card clickable"
            onClick={() =>
              setActiveSection(
                activeSection === "interviews"
                  ? null
                  : "interviews"
              )
            }
          >

            <h3>Interviews</h3>

            <strong>
              {interviews.length}
            </strong>

            <span>
              {activeSection === "interviews"
                ? "← Back to Placement Drives"
                : "View Interviews"}
            </span>

          </div>


          {/* Offers */}

          <div
            className="summary-card clickable"
            onClick={() =>
              setActiveSection(
                activeSection === "offers"
                  ? null
                  : "offers"
              )
            }
          >

            <h3>Offers</h3>

            <strong>
              {offers.length}
            </strong>

            <span>
              {activeSection === "offers"
                ? "← Back to Placement Drives"
                : "View Offers"}
            </span>

          </div>

        </div>


        {/* ================================================= */}
        {/* ================= MY APPLICATIONS =============== */}
        {/* ================================================= */}

        {activeSection === "applications" && (

          <div className="section">

            <h2 className="section-title">
              My Applications
            </h2>

            {applications.length === 0 ? (

              <p>
                No applications yet.
              </p>

            ) : (

              <div className="applications-grid">

                {applications.map((application) => (

                  <div
                    className="application-card"
                    key={application._id}
                  >

                    <h3>
                      {application.drive?.jobTitle}
                    </h3>

                    <p>
                      <strong>Company:</strong>{" "}
                      {application.drive?.company?.name}
                    </p>

                    <p>
                      <strong>Package:</strong>{" "}
                      {application.drive?.package} LPA
                    </p>

                    <p>
                      <strong>Location:</strong>{" "}
                      {application.drive?.location}
                    </p>

                    <p>
                      <strong>Applied On:</strong>{" "}
                      {new Date(
                        application.createdAt
                      ).toLocaleDateString()}
                    </p>

                    <span
                      className={`status-badge status-${application.status}`}
                    >
                      {application.status}
                    </span>

                  </div>

                ))}

              </div>

            )}

          </div>

        )}


        {/* ================================================= */}
        {/* ================= MY INTERVIEWS ================= */}
        {/* ================================================= */}

        {activeSection === "interviews" && (

          <div className="section">

            <h2 className="section-title">
              My Interviews
            </h2>

            {interviews.length === 0 ? (

              <p>
                No interviews scheduled yet.
              </p>

            ) : (

              <div className="applications-grid">

                {interviews.map((interview) => (

                  <div
                    className="application-card"
                    key={interview._id}
                  >

                    <h3>
                      {interview.drive?.jobTitle ||
                        interview.application?.drive?.jobTitle ||
                        "Interview"}
                    </h3>

                    <p>
                      <strong>Company:</strong>{" "}
                      {interview.company?.name ||
                        interview.application?.drive?.company?.name ||
                        "N/A"}
                    </p>

                    <p>
                      <strong>Date:</strong>{" "}
                      {new Date(
                        interview.scheduledAt
                      ).toLocaleDateString()}
                    </p>

                    <p>
                      <strong>Time:</strong>{" "}
                      {new Date(
                        interview.scheduledAt
                      ).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>

                    <p>
                      <strong>Mode:</strong>{" "}
                      {interview.mode}
                    </p>

                    {interview.mode === "online" &&
                      interview.meetingLink && (
                        <p>
                          <strong>Meeting:</strong>{" "}
                          <a
                            href={interview.meetingLink}
                            target="_blank"
                            rel="noreferrer"
                          >
                            Join Interview
                          </a>
                        </p>
                      )}

                    {interview.mode === "offline" &&
                      interview.location && (
                        <p>
                          <strong>Location:</strong>{" "}
                          {interview.location}
                        </p>
                      )}

                    <span
                      className={`status-badge status-${interview.status}`}
                    >
                      {interview.status}
                    </span>

                    {interview.feedback && (
                      <p>
                        <strong>Feedback:</strong>{" "}
                        {interview.feedback}
                      </p>
                    )}

                  </div>

                ))}

              </div>

            )}

          </div>

        )}


        {/* ================================================= */}
        {/* ================= MY OFFERS ===================== */}
        {/* ================================================= */}

        {activeSection === "offers" && (

          <div className="section">

            <h2 className="section-title">
              My Offers
            </h2>

            {offers.length === 0 ? (

              <p>
                No offers received yet.
              </p>

            ) : (

              <div className="applications-grid">

                {offers.map((offer) => (

                  <div
                    className="application-card"
                    key={offer._id}
                  >

                    <h3>
                      {offer.jobTitle}
                    </h3>

                    <p>
                      <strong>Company:</strong>{" "}
                      {offer.company?.name || "N/A"}
                    </p>

                    <p>
                      <strong>Package:</strong>{" "}
                      {offer.package} LPA
                    </p>

                    <p>
                      <strong>Offer Date:</strong>{" "}
                      {offer.offerDate
                        ? new Date(
                            offer.offerDate
                          ).toLocaleDateString()
                        : "N/A"}
                    </p>

                    <p>
                      <strong>Joining Date:</strong>{" "}
                      {offer.joiningDate
                        ? new Date(
                            offer.joiningDate
                          ).toLocaleDateString()
                        : "N/A"}
                    </p>

                    <span
                      className={`status-badge status-${offer.status}`}
                    >
                      {offer.status}
                    </span>

                  </div>

                ))}

              </div>

            )}

          </div>

        )}


        {/* ================================================= */}
        {/* =============== AVAILABLE DRIVES ================ */}
        {/* ================================================= */}

        {activeSection === null && (

          <div className="section">

            <h2 className="section-title">
              Available Placement Drives
            </h2>

            {drives.length === 0 ? (

              <p>
                No placement drives available.
              </p>

            ) : (

              <div className="drives-grid">

                {drives.map((drive) => (

                  <div
                    className="drive-card"
                    key={drive._id}
                  >

                    <h3>
                      {drive.jobTitle}
                    </h3>

                    <p>
                      <strong>Company:</strong>{" "}
                      {drive.company?.name}
                    </p>

                    <p>
                      <strong>Package:</strong>{" "}
                      {drive.package} LPA
                    </p>

                    <p>
                      <strong>Location:</strong>{" "}
                      {drive.location}
                    </p>

                    <p>
                      <strong>Minimum CGPA:</strong>{" "}
                      {drive.minimumCgpa}
                    </p>

                    <p>
                      <strong>Deadline:</strong>{" "}
                      {new Date(
                        drive.applicationDeadline
                      ).toLocaleDateString()}
                    </p>

                    <button
                      className="drive-button"
                      onClick={() =>
                        setSelectedDrive(drive)
                      }
                    >
                      View Drive
                    </button>

                  </div>

                ))}

              </div>

            )}

          </div>

        )}

      </>
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