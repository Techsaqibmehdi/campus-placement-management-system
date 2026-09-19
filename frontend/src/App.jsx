import { useState, useEffect } from "react";
import {
  Routes,
  Route,
  useNavigate,
  useLocation,
} from "react-router-dom";
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
  updateStudentProfile,
  uploadStudentResume,
  deleteStudentResume,
  setPrimaryStudentResume,
} from "./api/studentApi";

function Home() {
  return <h1>Campus Placement Management System</h1>;
}

function Register() {

  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    course: "",
    branch: "",
    rollNumber: "",
  });

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleRegister = async (e) => {
    e.preventDefault();

    setMessage("");
    setLoading(true);

    try {
      const response = await axios.post(
        "http://localhost:5000/api/auth/register",
        {
          name: formData.name,
          email: formData.email,
          password: formData.password,
          college: "KIET Group of Institutions",
          course: formData.course,
          branch:
            formData.course === "M.Tech"
              ? null
              : formData.branch,
          rollNumber: formData.rollNumber,
        }
      );

     navigate("/verify-registration", {
  state: {
    email: formData.email,
  },
});

    } catch (error) {
      setMessage(
        error.response?.data?.message ||
          "Registration failed"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1>Student Registration</h1>

      <form onSubmit={handleRegister}>

        <div>
          <label>Full Name</label>
          <br />

          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="Enter full name"
            required
          />
        </div>

        <br />

        <div>
          <label>Email</label>
          <br />

          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="Enter email"
            required
          />
        </div>

        <br />

        <div>
          <label>Password</label>
          <br />

          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="Enter password"
            minLength="8"
            required
          />
        </div>

        <br />

        <div>
          <label>College</label>
          <br />

          <input
            type="text"
            value="KIET Group of Institutions"
            disabled
          />
        </div>

        <br />

        <div>
          <label>Course</label>
          <br />

          <select
            name="course"
            value={formData.course}
            onChange={handleChange}
            required
          >
            <option value="">
              Select Course
            </option>

            <option value="BCA">
              BCA
            </option>

            <option value="MCA">
              MCA
            </option>

            <option value="B.Tech">
              B.Tech
            </option>

            <option value="M.Tech">
              M.Tech
            </option>

            <option value="MBA">
              MBA
            </option>
          </select>
        </div>

        <br />

        {formData.course !== "M.Tech" && (
          <div>
            <label>Branch / Specialization</label>
            <br />

            <select
  name="branch"
  value={formData.branch}
  onChange={handleChange}
  required
>
  <option value="">
    Select Branch / Specialization
  </option>

  {formData.course === "BCA" && (
    <>
      <option value="Computer Applications">
        Computer Applications
      </option>
    </>
  )}

  {formData.course === "MCA" && (
    <>
      <option value="Computer Applications">
        Computer Applications
      </option>
    </>
  )}

  {formData.course === "B.Tech" && (
    <>
      <option value="Computer Science and Engineering">
        Computer Science and Engineering
      </option>

      <option value="Information Technology">
        Information Technology
      </option>

      <option value="Electronics and Communication Engineering">
        Electronics and Communication Engineering
      </option>

      <option value="Electrical Engineering">
        Electrical Engineering
      </option>

      <option value="Mechanical Engineering">
        Mechanical Engineering
      </option>

      <option value="Artificial Intelligence">
        Artificial Intelligence
      </option>

      <option value="Artificial Intelligence and Machine Learning">
        Artificial Intelligence and Machine Learning
      </option>
    </>
  )}

  {formData.course === "MBA" && (
    <>
      <option value="Finance">
        Finance
      </option>

      <option value="Marketing">
        Marketing
      </option>

      <option value="Human Resources">
        Human Resources
      </option>
    </>
  )}
</select>
          </div>
        )}

        <br />

        <div>
          <label>Roll Number</label>
          <br />

          <input
            type="text"
            name="rollNumber"
            value={formData.rollNumber}
            onChange={handleChange}
            placeholder="Enter roll number"
            required
          />
        </div>

        <br />

        <button
          type="submit"
          disabled={loading}
        >
          {loading
            ? "Sending OTP..."
            : "Register"}
        </button>

      </form>

      {message && (
        <p>{message}</p>
      )}
    </div>
  );
}

function VerifyRegistration() {
  const navigate = useNavigate();
const location = useLocation();

  const [email, setEmail] = useState(
    location.state?.email || ""
  );
  const [otp, setOtp] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleVerify = async (e) => {
    e.preventDefault();

    setMessage("");
    setLoading(true);

    try {
      const response = await axios.post(
  "http://localhost:5000/api/auth/verify-registration-otp",
  {
    email,
    otp,
  }
);

navigate("/login");

    } catch (error) {
      setMessage(
        error.response?.data?.message ||
          "OTP verification failed"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1>Verify Email</h1>

      <p>
        Enter the OTP sent to your email.
      </p>

      <form onSubmit={handleVerify}>

        <div>
          <label>Email</label>
          <br />

       <input
  type="email"
  value={email}
  onChange={(e) => setEmail(e.target.value)}
  placeholder="Enter your email"
  required
/>
        </div>

        <br />

        <div>
          <label>OTP</label>
          <br />

          <input
            type="text"
            value={otp}
            onChange={(e) =>
              setOtp(e.target.value)
            }
            placeholder="Enter 6-digit OTP"
            maxLength="6"
            required
          />
        </div>

        <br />

        <button
          type="submit"
          disabled={loading}
        >
          {loading
            ? "Verifying..."
            : "Verify OTP"}
        </button>

      </form>

      {message && (
        <p>{message}</p>
      )}
    </div>
  );
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
  const [resumeFile, setResumeFile] = useState(null);
  const [resumeLoading, setResumeLoading] = useState(false);

  const SKILLS = [
    "Java", "C++", "Python", "JavaScript", "TypeScript",
    "React.js", "Angular", "Vue.js", "Node.js", "Express.js",
    "Spring Boot", "HTML", "CSS", "Bootstrap", "Tailwind CSS",
    "MongoDB", "MySQL", "PostgreSQL", "Redis", "SQL",
    "Git", "GitHub", "Docker", "Kubernetes", "AWS", "Azure",
    "GCP", "REST API", "GraphQL", "JWT", "Next.js", "Django",
    "Flask", ".NET", "C#", "PHP", "Laravel", "Flutter",
    "React Native", "Android", "Kotlin", "Swift", "Firebase",
    "TensorFlow", "Machine Learning", "Data Structures & Algorithms",
    "Linux", "Jenkins", "Postman", "Figma",
  ];

    const emptySocialProfiles = {
    github: "",
    linkedin: "",
    portfolio: "",
    leetcode: "",
    codechef: "",
    hackerrank: "",
  };

  const [editProfile, setEditProfile] = useState({
    cgpa: "",
    tenthPercentage: "",
    twelfthPercentage: "",
    backlogs: "",
    skills: [],
    internships: [],
    projects: [],
    por: [],
    achievements: [],
    socialProfiles: emptySocialProfiles,
  });

const [skillSearch, setSkillSearch] = useState("");
const [showSkillDropdown, setShowSkillDropdown] = useState(false);

  const filteredSkills = SKILLS.filter((skill) =>
    skill.toLowerCase().includes(skillSearch.toLowerCase())
  );

  const [newInternship, setNewInternship] = useState({
    company: "",
    role: "",
    startDate: "",
    endDate: "",
    description: "",
    technologies: [],
  });

  const [newProject, setNewProject] = useState({
    name: "",
    description: "",
    technologies: [],
    githubUrl: "",
    liveUrl: "",
  });

  const [newPor, setNewPor] = useState({
    position: "",
    organization: "",
    startDate: "",
    endDate: "",
    description: "",
  });

  const [newAchievement, setNewAchievement] = useState({
    title: "",
    description: "",
    year: "",
  });

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
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Failed to load dashboard"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (loading) return <h1>Loading...</h1>;
  if (error) return <p>{error}</p>;

  const hasApplied = (driveId) =>
    applications.some(
      (application) => application.drive?._id === driveId
    );

  const handleApply = async () => {
    try {
      setApplyLoading(true);
      setApplyMessage("");

      const response = await applyToDrive(selectedDrive._id);
      setApplyMessage(
        response.message ||
          "Application submitted successfully"
      );

      setApplications(await getMyApplications());
    } catch (err) {
      setApplyMessage(
        err.response?.data?.message ||
          "Failed to apply for this drive"
      );
    } finally {
      setApplyLoading(false);
    }
  };

  const openProfileEditor = (targetId = null) => {
    setEditProfile({
      cgpa: profile?.cgpa ?? "",
      tenthPercentage: profile?.tenthPercentage ?? "",
      twelfthPercentage: profile?.twelfthPercentage ?? "",
      backlogs: profile?.backlogs ?? 0,
      skills: profile?.skills || [],
      internships: profile?.internships || [],
      projects: profile?.projects || [],
      por: profile?.por || [],
      achievements: profile?.achievements || [],
      socialProfiles: {
        ...emptySocialProfiles,
        ...(profile?.socialProfiles || {}),
      },
    });

    const openingProfile = activeSection !== "profile";

    setActiveSection("profile");

    if (targetId) {
      setTimeout(() => {
        const target = document.getElementById(targetId);

        if (!target) return;

        target.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });

        if (
          target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT"
        ) {
          target.focus();
        }
      }, openingProfile ? 150 : 0);
    }
  };

  const handleUpdateProfile = async () => {

    if (
  editProfile.cgpa !== "" &&
  (Number(editProfile.cgpa) < 0 || Number(editProfile.cgpa) > 10)
) {
  alert("CGPA must be between 0 and 10");
  return;
}

if (
  editProfile.tenthPercentage !== "" &&
  (Number(editProfile.tenthPercentage) < 0 ||
    Number(editProfile.tenthPercentage) > 100)
) {
  alert("10th percentage must be between 0 and 100");
  return;
}

if (
  editProfile.twelfthPercentage !== "" &&
  (Number(editProfile.twelfthPercentage) < 0 ||
    Number(editProfile.twelfthPercentage) > 100)
) {
  alert("12th percentage must be between 0 and 100");
  return;
}

if (
  editProfile.backlogs !== "" &&
  Number(editProfile.backlogs) < 0
) {
  alert("Backlogs cannot be negative");
  return;
}
    try {
      const updatedProfile = await updateStudentProfile({
        cgpa:
          editProfile.cgpa === ""
            ? null
            : Number(editProfile.cgpa),
        tenthPercentage:
          editProfile.tenthPercentage === ""
            ? null
            : Number(editProfile.tenthPercentage),
        twelfthPercentage:
          editProfile.twelfthPercentage === ""
            ? null
            : Number(editProfile.twelfthPercentage),
        backlogs:
          editProfile.backlogs === ""
            ? 0
            : Number(editProfile.backlogs),
        skills: editProfile.skills,
        internships: editProfile.internships,
        projects: editProfile.projects,
        por: editProfile.por,
        achievements: editProfile.achievements,
        socialProfiles: editProfile.socialProfiles,
      });

      setProfile(updatedProfile);
      setActiveSection(null);
      alert("Profile updated successfully");
    } catch (err) {
      alert(
        err.response?.data?.message ||
          "Failed to update profile"
      );
    }
  };

  const handleResumeUpload = async () => {
    if (!resumeFile) {
      alert("Please select a PDF resume");
      return;
    }

    if ((profile?.resumes || []).length >= 3) {
      alert("Maximum 3 resumes can be uploaded");
      return;
    }

    try {
      setResumeLoading(true);

      const response = await uploadStudentResume(resumeFile);

      setProfile((prev) => ({
        ...prev,
        resumes: [
          ...(prev.resumes || []),
          response.resume,
        ],
      }));

      setResumeFile(null);
      alert("Resume uploaded successfully");
    } catch (err) {
      alert(
        err.response?.data?.message ||
          "Failed to upload resume"
      );
    } finally {
      setResumeLoading(false);
    }
  };

const handleDeleteResume = async (resumeId) => {
  const confirmed = window.confirm(
    "Are you sure you want to delete this resume?"
  );

  if (!confirmed) return;

  try {
    const response = await deleteStudentResume(resumeId);

    setProfile((prev) => ({
      ...prev,
      resumes: response.resumes,
    }));

    alert("Resume deleted successfully");
  } catch (err) {
    alert(
      err.response?.data?.message ||
        "Failed to delete resume"
    );
  }
};

const handleSetPrimaryResume = async (resumeId) => {
  try {
    const response = await setPrimaryStudentResume(resumeId);

    setProfile((prev) => ({
      ...prev,
      resumes: response.resumes,
    }));

    alert("Primary resume updated successfully");
  } catch (err) {
    alert(
      err.response?.data?.message ||
        "Failed to update primary resume"
    );
  }
};


  const addInternship = () => {
    if (!newInternship.company || !newInternship.role) {
      alert("Company and role are required");
      return;
    }

    setEditProfile((prev) => ({
      ...prev,
      internships: [
        ...prev.internships,
        {
          ...newInternship,
          technologies: newInternship.technologies || [],
        },
      ],
    }));

    setNewInternship({
      company: "",
      role: "",
      startDate: "",
      endDate: "",
      description: "",
      technologies: [],
    });
  };

  const addProject = () => {
    if (!newProject.name) {
      alert("Project name is required");
      return;
    }

    setEditProfile((prev) => ({
      ...prev,
      projects: [
        ...prev.projects,
        {
          ...newProject,
          technologies: newProject.technologies || [],
        },
      ],
    }));

    setNewProject({
      name: "",
      description: "",
      technologies: [],
      githubUrl: "",
      liveUrl: "",
    });
  };

  const addPor = () => {
    if (!newPor.position || !newPor.organization) {
      alert("Position and organization are required");
      return;
    }

    setEditProfile((prev) => ({
      ...prev,
      por: [...prev.por, { ...newPor }],
    }));

    setNewPor({
      position: "",
      organization: "",
      startDate: "",
      endDate: "",
      description: "",
    });
  };

  const addAchievement = () => {
    if (!newAchievement.title) {
      alert("Achievement title is required");
      return;
    }

    setEditProfile((prev) => ({
      ...prev,
      achievements: [
        ...prev.achievements,
        {
          ...newAchievement,
          year: newAchievement.year
            ? Number(newAchievement.year)
            : null,
        },
      ],
    }));

    setNewAchievement({
      title: "",
      description: "",
      year: "",
    });
  };

  const removeArrayItem = (field, index) => {
    setEditProfile((prev) => ({
      ...prev,
      [field]: prev[field].filter(
        (_, i) => i !== index
      ),
    }));
  };

  const updateSocialProfile = (field, value) => {
    setEditProfile((prev) => ({
      ...prev,
      socialProfiles: {
        ...prev.socialProfiles,
        [field]: value,
      },
    }));
  };

  const calculateProfileCompletion = () => {
    if (!profile) return 0;

    const checks = [
      !!profile.user?.name &&
        !!profile.user?.email &&
        !!profile.user?.college &&
        !!profile.rollNumber &&
        !!profile.course &&
        !!profile.branch,
      profile.tenthPercentage !== null &&
        profile.tenthPercentage !== undefined &&
        profile.twelfthPercentage !== null &&
        profile.twelfthPercentage !== undefined &&
        profile.cgpa !== null &&
        profile.cgpa !== undefined,
      Array.isArray(profile.skills) &&
        profile.skills.length > 0,
      Array.isArray(profile.internships) &&
        profile.internships.length > 0,
      Array.isArray(profile.projects) &&
        profile.projects.length > 0,
      Array.isArray(profile.por) &&
        profile.por.length > 0,
      Array.isArray(profile.achievements) &&
        profile.achievements.length > 0,
      Array.isArray(profile.resumes) &&
        profile.resumes.length > 0,
      profile.socialProfiles &&
        Object.values(profile.socialProfiles).some(Boolean),
    ];

    return Math.round(
      (checks.filter(Boolean).length / checks.length) * 100
    );
  };

  const getMissingProfileFields = () => {
  if (!profile) return [];

  const missing = [];

  if (!profile.user?.name) missing.push("Name");
  if (!profile.user?.email) missing.push("Email");
  if (!profile.user?.college) missing.push("College");
  if (!profile.rollNumber) missing.push("Roll Number");
  if (!profile.course) missing.push("Course");
  if (!profile.branch) missing.push("Branch");

  if (
    profile.tenthPercentage === null ||
    profile.tenthPercentage === undefined
  ) {
    missing.push("10th Percentage");
  }

  if (
    profile.twelfthPercentage === null ||
    profile.twelfthPercentage === undefined
  ) {
    missing.push("12th Percentage");
  }

  if (profile.cgpa === null || profile.cgpa === undefined) {
    missing.push("CGPA");
  }

  if (!profile.skills?.length) missing.push("Skills");
  if (!profile.internships?.length) missing.push("Internship");
  if (!profile.projects?.length) missing.push("Projects");
  if (!profile.por?.length) missing.push("POR");
  if (!profile.achievements?.length) missing.push("Achievements");
  if (!profile.resumes?.length) missing.push("Resume");

  if (
    !profile.socialProfiles ||
    !Object.values(profile.socialProfiles).some(Boolean)
  ) {
    missing.push("Social Profile");
  }

  return missing;
};

  return (
    <div className="dashboard">
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

            {applyMessage && <p>{applyMessage}</p>}
          </div>
        </div>
      )}

      {!selectedDrive && (
        <>
          <div className="dashboard-header">
            <h1>Student Dashboard</h1>
            <p>Track your placement journey</p>
          </div>

          {profile && (
            <div className="profile-card">
              <h2>
                Welcome, {profile.user?.name}
              </h2>

              <div className="profile-grid">
                <div className="profile-item">
                  <span>Roll Number</span>
                  <strong>{profile.rollNumber}</strong>
                </div>
                <div className="profile-item">
                  <span>Course</span>
                  <strong>{profile.course}</strong>
                </div>
                <div className="profile-item">
                  <span>Branch</span>
                  <strong>{profile.branch}</strong>
                </div>
                <div className="profile-item">
                  <span>CGPA</span>
                  <strong>
                    {profile.cgpa ?? "Not added"}
                  </strong>
                </div>
              </div>

              <p>
                <strong>Profile Completion:</strong>{" "}
                {calculateProfileCompletion()}%
              </p>

             {getMissingProfileFields().length > 0 && (
  <div>
    <p>
      <strong>Missing:</strong>
    </p>

    <div>
      {getMissingProfileFields().map((field) => {
        const fieldTargets = {
          "10th Percentage": "tenth-field",
          "12th Percentage": "twelfth-field",
          CGPA: "cgpa-field",
          Skills: "skills-field",
          Internship: "internships-section",
          Projects: "projects-section",
          POR: "por-section",
          Achievements: "achievements-section",
          Resume: "resume-section",
          "Social Profile": "social-profiles-section",
        };

        return (
          <button
            key={field}
            type="button"
            onClick={() =>
              openProfileEditor(fieldTargets[field])
            }
          >
            {field}
          </button>
        );
      })}
    </div>
  </div>
)}

              <button
                className="drive-button"
                onClick={openProfileEditor}
              >
                {activeSection === "profile"
                  ? "← Back to Dashboard"
                  : "My Profile"}
              </button>
            </div>
          )}

          {activeSection === "profile" && profile && (
            <div className="section">
              <h2 className="section-title">
                My Profile
              </h2>

              <div className="profile-form">
                <h3>Basic Details 🔒</h3>

                <div className="form-group">
                  <label>Name</label>
                  <input
                    type="text"
                    value={profile.user?.name || ""}
                    disabled
                  />
                </div>

                <div className="form-group">
                  <label>Email</label>
                  <input
                    type="email"
                    value={profile.user?.email || ""}
                    disabled
                  />
                </div>

                <div className="form-group">
                  <label>College</label>
                  <input
                    type="text"
                    value={profile.user?.college || ""}
                    disabled
                  />
                </div>

                <div className="form-group">
                  <label>Roll Number</label>
                  <input
                    type="text"
                    value={profile.rollNumber || ""}
                    disabled
                  />
                </div>

                <div className="form-group">
                  <label>Course</label>
                  <input
                    type="text"
                    value={profile.course || ""}
                    disabled
                  />
                </div>

                <div className="form-group">
                  <label>Branch</label>
                  <input
                    type="text"
                    value={profile.branch || ""}
                    disabled
                  />
                </div>

                <hr />

                <h3>Education</h3>

                <div className="form-group">
                  <label>10th Percentage</label>
                  <input
                    id="tenth-field"
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={editProfile.tenthPercentage}
                    onChange={(e) =>
                      setEditProfile({
                        ...editProfile,
                        tenthPercentage:
                          e.target.value,
                      })
                    }
                  />
                </div>

                <div className="form-group">
                  <label>12th Percentage</label>
                  <input
                    id="twelfth-field"
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={editProfile.twelfthPercentage}
                    onChange={(e) =>
                      setEditProfile({
                        ...editProfile,
                        twelfthPercentage:
                          e.target.value,
                      })
                    }
                  />
                </div>

                <div className="form-group">
                  <label>CGPA</label>
                  <input
  id="cgpa-field"
  type="number"
  min="0"
  max="10"
  step="0.01"
  value={editProfile.cgpa}
  onChange={(e) =>
    setEditProfile({
      ...editProfile,
      cgpa: e.target.value,
    })
  }
/>
                </div>

                <div className="form-group">
                  <label>Backlogs</label>
                  <input
                    type="number"
                    min="0"
                    value={editProfile.backlogs}
                    onChange={(e) =>
                      setEditProfile({
                        ...editProfile,
                        backlogs: e.target.value,
                      })
                    }
                  />
                </div>

                <hr />

                <h3 id="skills-section">Skills</h3>

                <div className="form-group">
                  <label>Select Skills</label>

                  <div className="skills-selector">

  {/* Selected Skills */}
  <div className="selected-skills">
    {editProfile.skills.length === 0 ? (
      <span className="skills-placeholder">
        No skills selected
      </span>
    ) : (
      editProfile.skills.map((skill) => (
        <span className="skill-chip" key={skill}>
          {skill}

          <button
            type="button"
            onClick={() =>
              setEditProfile((prev) => ({
                ...prev,
                skills: prev.skills.filter(
                  (item) => item !== skill
                ),
              }))
            }
          >
            ×
          </button>
        </span>
      ))
    )}
  </div>

  {/* Search */}
  <input
    id="skills-field"
    type="text"
    value={skillSearch}
    placeholder="Search skills..."
    onFocus={() => setShowSkillDropdown(true)}
    onChange={(e) => {
      setSkillSearch(e.target.value);
      setShowSkillDropdown(true);
    }}
  />

  {/* Dropdown */}
  {showSkillDropdown && (
    <div className="skills-dropdown">

      {filteredSkills.length === 0 ? (
        <div className="no-skills">
          No skills found
        </div>
      ) : (
        filteredSkills.map((skill) => {
          const selected =
            editProfile.skills.includes(skill);

          return (
            <button
              type="button"
              key={skill}
              className={`skill-option ${
                selected ? "selected" : ""
              }`}
              disabled={
                !selected &&
                editProfile.skills.length >= 20
              }
              onClick={() => {
                setEditProfile((prev) => ({
                  ...prev,
                  skills: selected
                    ? prev.skills.filter(
                        (item) => item !== skill
                      )
                    : [...prev.skills, skill],
                }));

                setSkillSearch("");
              }}
            >
              <span>{skill}</span>

              {selected && <span>✓</span>}
            </button>
          );
        })
      )}

    </div>
  )}

  <div className="skills-footer">
    <small>
      {editProfile.skills.length} / 20 skills selected
    </small>

    {editProfile.skills.length >= 20 && (
      <small>
        Maximum skills selected
      </small>
    )}
  </div>

</div>
                </div>

                <hr />

                <h3 id="internships-section">
                  Internships / Work Experience
                </h3>

                {editProfile.internships.map(
                  (internship, index) => (
                    <div
                      className="application-card"
                      key={index}
                    >
                      <h4>{internship.role}</h4>
                      <p>
                        <strong>Company:</strong>{" "}
                        {internship.company}
                      </p>
                      <p>
                        {internship.description}
                      </p>
                      <button
                        type="button"
                        className="drive-button"
                        onClick={() =>
                          removeArrayItem(
                            "internships",
                            index
                          )
                        }
                      >
                        Remove
                      </button>
                    </div>
                  )
                )}

                <div className="form-group">
                  <label>Company</label>
                  <input
                    type="text"
                    value={newInternship.company}
                    onChange={(e) =>
                      setNewInternship({
                        ...newInternship,
                        company: e.target.value,
                      })
                    }
                  />
                </div>

                <div className="form-group">
                  <label>Role</label>
                  <input
                    type="text"
                    value={newInternship.role}
                    onChange={(e) =>
                      setNewInternship({
                        ...newInternship,
                        role: e.target.value,
                      })
                    }
                  />
                </div>

                <div className="form-group">
                  <label>Start Date</label>
                  <input
                    type="date"
                    value={newInternship.startDate}
                    onChange={(e) =>
                      setNewInternship({
                        ...newInternship,
                        startDate: e.target.value,
                      })
                    }
                  />
                </div>

                <div className="form-group">
                  <label>End Date</label>
                  <input
                    type="date"
                    value={newInternship.endDate}
                    onChange={(e) =>
                      setNewInternship({
                        ...newInternship,
                        endDate: e.target.value,
                      })
                    }
                  />
                </div>

                <div className="form-group">
                  <label>Description</label>
                  <textarea
                    value={newInternship.description}
                    onChange={(e) =>
                      setNewInternship({
                        ...newInternship,
                        description: e.target.value,
                      })
                    }
                  />
                </div>

                <button
                  type="button"
                  className="drive-button"
                  onClick={addInternship}
                >
                  + Add Internship
                </button>

                <hr />

                <h3 id="projects-section">Projects</h3>

                {editProfile.projects.map(
                  (project, index) => (
                    <div
                      className="application-card"
                      key={index}
                    >
                      <h4>{project.name}</h4>
                      <p>{project.description}</p>

                      {project.githubUrl && (
                        <p>
                          <a
                            href={project.githubUrl}
                            target="_blank"
                            rel="noreferrer"
                          >
                            GitHub
                          </a>
                        </p>
                      )}

                      {project.liveUrl && (
                        <p>
                          <a
                            href={project.liveUrl}
                            target="_blank"
                            rel="noreferrer"
                          >
                            Live Project
                          </a>
                        </p>
                      )}

                      <button
                        type="button"
                        className="drive-button"
                        onClick={() =>
                          removeArrayItem(
                            "projects",
                            index
                          )
                        }
                      >
                        Remove
                      </button>
                    </div>
                  )
                )}

                <div className="form-group">
                  <label>Project Name</label>
                  <input
                    type="text"
                    value={newProject.name}
                    onChange={(e) =>
                      setNewProject({
                        ...newProject,
                        name: e.target.value,
                      })
                    }
                  />
                </div>

                <div className="form-group">
                  <label>Description</label>
                  <textarea
                    value={newProject.description}
                    onChange={(e) =>
                      setNewProject({
                        ...newProject,
                        description: e.target.value,
                      })
                    }
                  />
                </div>

                <div className="form-group">
                  <label>GitHub URL</label>
                  <input
                    type="url"
                    value={newProject.githubUrl}
                    onChange={(e) =>
                      setNewProject({
                        ...newProject,
                        githubUrl: e.target.value,
                      })
                    }
                  />
                </div>

                <div className="form-group">
                  <label>Live URL</label>
                  <input
                    type="url"
                    value={newProject.liveUrl}
                    onChange={(e) =>
                      setNewProject({
                        ...newProject,
                        liveUrl: e.target.value,
                      })
                    }
                  />
                </div>

                <button
                  type="button"
                  className="drive-button"
                  onClick={addProject}
                >
                  + Add Project
                </button>

                <hr />

                <h3 id="por-section">
                  Positions of Responsibility
                </h3>

                {editProfile.por.map((item, index) => (
                  <div
                    className="application-card"
                    key={index}
                  >
                    <h4>{item.position}</h4>
                    <p>
                      <strong>Organization:</strong>{" "}
                      {item.organization}
                    </p>
                    <p>{item.description}</p>
                    <button
                      type="button"
                      className="drive-button"
                      onClick={() =>
                        removeArrayItem("por", index)
                      }
                    >
                      Remove
                    </button>
                  </div>
                ))}

                <div className="form-group">
                  <label>Position</label>
                  <input
                    type="text"
                    value={newPor.position}
                    onChange={(e) =>
                      setNewPor({
                        ...newPor,
                        position: e.target.value,
                      })
                    }
                  />
                </div>

                <div className="form-group">
                  <label>Organization</label>
                  <input
                    type="text"
                    value={newPor.organization}
                    onChange={(e) =>
                      setNewPor({
                        ...newPor,
                        organization: e.target.value,
                      })
                    }
                  />
                </div>

                <div className="form-group">
                  <label>Start Date</label>
                  <input
                    type="date"
                    value={newPor.startDate}
                    onChange={(e) =>
                      setNewPor({
                        ...newPor,
                        startDate: e.target.value,
                      })
                    }
                  />
                </div>

                <div className="form-group">
                  <label>End Date</label>
                  <input
                    type="date"
                    value={newPor.endDate}
                    onChange={(e) =>
                      setNewPor({
                        ...newPor,
                        endDate: e.target.value,
                      })
                    }
                  />
                </div>

                <div className="form-group">
                  <label>Description</label>
                  <textarea
                    value={newPor.description}
                    onChange={(e) =>
                      setNewPor({
                        ...newPor,
                        description: e.target.value,
                      })
                    }
                  />
                </div>

                <button
                  type="button"
                  className="drive-button"
                  onClick={addPor}
                >
                  + Add POR
                </button>

                <hr />

                <h3 id="achievements-section">Achievements</h3>

                {editProfile.achievements.map(
                  (achievement, index) => (
                    <div
                      className="application-card"
                      key={index}
                    >
                      <h4>{achievement.title}</h4>
                      <p>{achievement.description}</p>

                      {achievement.year && (
                        <p>
                          <strong>Year:</strong>{" "}
                          {achievement.year}
                        </p>
                      )}

                      <button
                        type="button"
                        className="drive-button"
                        onClick={() =>
                          removeArrayItem(
                            "achievements",
                            index
                          )
                        }
                      >
                        Remove
                      </button>
                    </div>
                  )
                )}

                <div className="form-group">
                  <label>Achievement Title</label>
                  <input
                    type="text"
                    value={newAchievement.title}
                    onChange={(e) =>
                      setNewAchievement({
                        ...newAchievement,
                        title: e.target.value,
                      })
                    }
                  />
                </div>

                <div className="form-group">
                  <label>Description</label>
                  <textarea
                    value={newAchievement.description}
                    onChange={(e) =>
                      setNewAchievement({
                        ...newAchievement,
                        description: e.target.value,
                      })
                    }
                  />
                </div>

                <div className="form-group">
                  <label>Year</label>
                  <input
                    type="number"
                    min="2000"
                    max="2100"
                    value={newAchievement.year}
                    onChange={(e) =>
                      setNewAchievement({
                        ...newAchievement,
                        year: e.target.value,
                      })
                    }
                  />
                </div>

                <button
                  type="button"
                  className="drive-button"
                  onClick={addAchievement}
                >
                  + Add Achievement
                </button>

                <hr />

                <h3 id="social-profiles-section">Social Profiles</h3>

                {[
                  ["github", "GitHub"],
                  ["linkedin", "LinkedIn"],
                  ["portfolio", "Portfolio"],
                  ["leetcode", "LeetCode"],
                  ["codechef", "CodeChef"],
                  ["hackerrank", "HackerRank"],
                ].map(([field, label]) => (
                  <div
                    className="form-group"
                    key={field}
                  >
                    <label>{label}</label>
                    <input
                      type="url"
                      value={
                        editProfile.socialProfiles[
                          field
                        ] || ""
                      }
                      onChange={(e) =>
                        updateSocialProfile(
                          field,
                          e.target.value
                        )
                      }
                      placeholder={`Enter ${label} URL`}
                    />
                  </div>
                ))}

                <hr />

                <h3 id="resume-section">Resume / Documents</h3>

                <p>
                  {profile.resumes?.length || 0} / 3
                  resumes uploaded
                </p>

                {profile.resumes?.map((resume) => (
                  <div
                    className="application-card"
                    key={resume._id}
                  >
                    <h4>
                      {resume.name}{" "}
                      {resume.isPrimary && "⭐ Primary"}
                    </h4>

                    <p>
                      Uploaded:{" "}
                      {resume.uploadedAt
                        ? new Date(
                            resume.uploadedAt
                          ).toLocaleDateString()
                        : "N/A"}
                    </p>

                    <a
                      href={resume.url}
                      target="_blank"
                      rel="noreferrer"
                    >
                      View Resume
                    </a>
                    {" | "}
                    <a
                      href={resume.url}
                      download
                      target="_blank"
                      rel="noreferrer"
                    >
                      Download
                    </a>


{" | "}

{!resume.isPrimary && (
  <button
    type="button"
    className="drive-button"
    onClick={() =>
      handleSetPrimaryResume(resume._id)
    }
  >
    Set as Primary
  </button>
)}

{" "}

<button
  type="button"
  className="drive-button"
  onClick={() =>
    handleDeleteResume(resume._id)
  }
>
  Delete
</button>

                  </div>
                ))}

                {(!profile.resumes ||
                  profile.resumes.length < 3) && (
                  <>
                    <div className="form-group">
                      <label>
                        Upload Resume (PDF)
                      </label>
                      <input
                        type="file"
                        accept=".pdf,application/pdf"
                        onChange={(e) =>
                          setResumeFile(
                            e.target.files?.[0] ||
                              null
                          )
                        }
                      />
                    </div>

                    <button
                      type="button"
                      className="drive-button"
                      onClick={handleResumeUpload}
                      disabled={resumeLoading}
                    >
                      {resumeLoading
                        ? "Uploading..."
                        : "Upload Resume"}
                    </button>
                  </>
                )}

                <hr />

                <div className="form-actions">
                  <button
                    type="button"
                    className="drive-button"
                    onClick={() =>
                      setActiveSection(null)
                    }
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    className="drive-button"
                    onClick={handleUpdateProfile}
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeSection !== "profile" && (
            <div className="summary-grid">
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
                <strong>{applications.length}</strong>
                <span>
                  {activeSection === "applications"
                    ? "← Back to Placement Drives"
                    : "View Applications"}
                </span>
              </div>

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
                <strong>{interviews.length}</strong>
                <span>
                  {activeSection === "interviews"
                    ? "← Back to Placement Drives"
                    : "View Interviews"}
                </span>
              </div>

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
                <strong>{offers.length}</strong>
                <span>
                  {activeSection === "offers"
                    ? "← Back to Placement Drives"
                    : "View Offers"}
                </span>
              </div>
            </div>
          )}

          {activeSection === "applications" && (
            <div className="section">
              <h2 className="section-title">
                My Applications
              </h2>

              {applications.length === 0 ? (
                <p>No applications yet.</p>
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
                          interview.application?.drive
                            ?.jobTitle ||
                          "Interview"}
                      </h3>
                      <p>
                        <strong>Company:</strong>{" "}
                        {interview.company?.name ||
                          interview.application?.drive
                            ?.company?.name ||
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
                              href={
                                interview.meetingLink
                              }
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

          {activeSection === "offers" && (
            <div className="section">
              <h2 className="section-title">
                My Offers
              </h2>

              {offers.length === 0 ? (
                <p>No offers received yet.</p>
              ) : (
                <div className="applications-grid">
                  {offers.map((offer) => (
                    <div
                      className="application-card"
                      key={offer._id}
                    >
                      <h3>{offer.jobTitle}</h3>
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
                      <h3>{drive.jobTitle}</h3>
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
  path="/register"
  element={<Register />}
/>

<Route
  path="/verify-registration"
  element={<VerifyRegistration />}
/>


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