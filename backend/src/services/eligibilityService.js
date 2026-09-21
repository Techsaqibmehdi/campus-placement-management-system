const checkCgpaEligibility = (student, drive) => {
  if (student.cgpa == null) {
    return {
      passed: false,
      required: drive.minimumCgpa,
      actual: null,
      message: `CGPA is not set in your profile. Minimum required is ${drive.minimumCgpa}`,
    };
  }

  const passed = student.cgpa >= drive.minimumCgpa;
  return {
    passed,
    required: drive.minimumCgpa,
    actual: student.cgpa,
    message: passed
      ? `CGPA meets requirement (${student.cgpa} >= ${drive.minimumCgpa})`
      : `Minimum CGPA required: ${drive.minimumCgpa}, your CGPA: ${student.cgpa}`,
  };
};

const checkCourseEligibility = (student, drive) => {
  if (!drive.allowedCourses || drive.allowedCourses.length === 0) {
    return {
      passed: true,
      allowed: [],
      actual: student.course,
      message: "All courses eligible",
    };
  }

  if (!student.course) {
    return {
      passed: false,
      allowed: drive.allowedCourses,
      actual: null,
      message: "Course is not specified in your profile",
    };
  }

  const passed = drive.allowedCourses.some(
    (c) => c.toLowerCase() === student.course.toLowerCase()
  );

  return {
    passed,
    allowed: drive.allowedCourses,
    actual: student.course,
    message: passed
      ? `Course ${student.course} is eligible`
      : `Course ${student.course} is not eligible. Allowed: ${drive.allowedCourses.join(", ")}`,
  };
};

const checkBranchEligibility = (student, drive) => {
  if (!drive.eligibleBranches || drive.eligibleBranches.length === 0) {
    return {
      passed: true,
      allowed: [],
      actual: student.branch,
      message: "All branches eligible",
    };
  }

  if (!student.branch) {
    return {
      passed: false,
      allowed: drive.eligibleBranches,
      actual: null,
      message: "Branch is not specified in your profile",
    };
  }

  const passed = drive.eligibleBranches.some(
    (b) => b.toLowerCase() === student.branch.toLowerCase()
  );

  return {
    passed,
    allowed: drive.eligibleBranches,
    actual: student.branch,
    message: passed
      ? `Branch ${student.branch} is eligible`
      : `Branch ${student.branch} is not eligible. Allowed: ${drive.eligibleBranches.join(", ")}`,
  };
};

const checkTenthEligibility = (student, drive) => {
  if (drive.minimumTenthPercentage == null) {
    return {
      passed: true,
      required: null,
      actual: student.tenthPercentage,
      message: "No minimum 10th percentage requirement",
    };
  }

  if (student.tenthPercentage == null) {
    return {
      passed: false,
      required: drive.minimumTenthPercentage,
      actual: null,
      message: `10th percentage is missing. Minimum required: ${drive.minimumTenthPercentage}%`,
    };
  }

  const passed = student.tenthPercentage >= drive.minimumTenthPercentage;
  return {
    passed,
    required: drive.minimumTenthPercentage,
    actual: student.tenthPercentage,
    message: passed
      ? `10th percentage requirement met (${student.tenthPercentage}% >= ${drive.minimumTenthPercentage}%)`
      : `Minimum 10th % required: ${drive.minimumTenthPercentage}%, your score: ${student.tenthPercentage}%`,
  };
};

const checkTwelfthEligibility = (student, drive) => {
  if (drive.minimumTwelfthPercentage == null) {
    return {
      passed: true,
      required: null,
      actual: student.twelfthPercentage,
      message: "No minimum 12th percentage requirement",
    };
  }

  if (student.twelfthPercentage == null) {
    return {
      passed: false,
      required: drive.minimumTwelfthPercentage,
      actual: null,
      message: `12th percentage is missing. Minimum required: ${drive.minimumTwelfthPercentage}%`,
    };
  }

  const passed = student.twelfthPercentage >= drive.minimumTwelfthPercentage;
  return {
    passed,
    required: drive.minimumTwelfthPercentage,
    actual: student.twelfthPercentage,
    message: passed
      ? `12th percentage requirement met (${student.twelfthPercentage}% >= ${drive.minimumTwelfthPercentage}%)`
      : `Minimum 12th % required: ${drive.minimumTwelfthPercentage}%, your score: ${student.twelfthPercentage}%`,
  };
};

const checkBacklogEligibility = (student, drive) => {
  const maxAllowed = drive.maximumBacklogs ?? 0;
  const currentBacklogs = student.backlogs ?? 0;
  const passed = currentBacklogs <= maxAllowed;

  return {
    passed,
    maxAllowed,
    actual: currentBacklogs,
    message: passed
      ? `Backlog criteria met (${currentBacklogs} <= ${maxAllowed})`
      : `Maximum allowed backlogs: ${maxAllowed}, you have: ${currentBacklogs}`,
  };
};

const checkSkillsEligibility = (student, drive) => {
  if (!drive.requiredSkills || drive.requiredSkills.length === 0) {
    return {
      passed: true,
      required: [],
      missing: [],
      message: "No mandatory skill requirements",
    };
  }

  const studentSkillsLower = (student.skills || []).map((s) => s.toLowerCase());
  const missing = drive.requiredSkills.filter(
    (reqSkill) => !studentSkillsLower.includes(reqSkill.toLowerCase())
  );

  const passed = missing.length === 0;

  return {
    passed,
    required: drive.requiredSkills,
    missing,
    actual: student.skills || [],
    message: passed
      ? "All required skills present"
      : `Missing required skills: ${missing.join(", ")}`,
  };
};

const checkEligibility = (student, drive) => {
  // 1. If drive is explicitly flagged as Open for All Students (No Cutoffs)
  if (drive && (drive.isOpenToAll || drive.noEligibilityCriteria)) {
    return {
      eligible: true,
      isOpenToAll: true,
      reasons: [],
      criteria: {
        openToAll: {
          passed: true,
          message: "Open for all students (No cutoffs or restrictions applied)",
        },
      },
      checks: {
        cgpa: true,
        course: true,
        branch: true,
        tenth: true,
        twelfth: true,
        backlogs: true,
        skills: true,
      },
    };
  }

  const cgpaCheck = checkCgpaEligibility(student, drive);
  const courseCheck = checkCourseEligibility(student, drive);
  const branchCheck = checkBranchEligibility(student, drive);
  const tenthCheck = checkTenthEligibility(student, drive);
  const twelfthCheck = checkTwelfthEligibility(student, drive);
  const backlogCheck = checkBacklogEligibility(student, drive);
  const skillsCheck = checkSkillsEligibility(student, drive);

  const criteria = {
    cgpa: cgpaCheck,
    course: courseCheck,
    branch: branchCheck,
    tenth: tenthCheck,
    twelfth: twelfthCheck,
    backlogs: backlogCheck,
    skills: skillsCheck,
  };

  const checks = {
    cgpa: cgpaCheck.passed,
    course: courseCheck.passed,
    branch: branchCheck.passed,
    tenth: tenthCheck.passed,
    twelfth: twelfthCheck.passed,
    backlogs: backlogCheck.passed,
    skills: skillsCheck.passed,
  };

  const reasons = [];
  if (!cgpaCheck.passed) reasons.push(cgpaCheck.message);
  if (!courseCheck.passed) reasons.push(courseCheck.message);
  if (!branchCheck.passed) reasons.push(branchCheck.message);
  if (!tenthCheck.passed) reasons.push(tenthCheck.message);
  if (!twelfthCheck.passed) reasons.push(twelfthCheck.message);
  if (!backlogCheck.passed) reasons.push(backlogCheck.message);
  if (!skillsCheck.passed) reasons.push(skillsCheck.message);

  const eligible = reasons.length === 0;

  return {
    eligible,
    reasons,
    criteria,
    checks,
  };
};

module.exports = {
  checkCgpaEligibility,
  checkCourseEligibility,
  checkBranchEligibility,
  checkTenthEligibility,
  checkTwelfthEligibility,
  checkBacklogEligibility,
  checkSkillsEligibility,
  checkEligibility,
};
