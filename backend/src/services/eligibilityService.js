const checkCgpaEligibility = (student, drive) => {
  return student.cgpa >= drive.minimumCgpa;
};

const checkBranchEligibility = (student, drive) => {
  return drive.eligibleBranches.includes(student.branch);
};

const checkTenthEligibility = (student, drive) => {
  if (drive.minimumTenthPercentage == null) {
    return true;
  }

  return student.tenthPercentage >= drive.minimumTenthPercentage;
};


const checkTwelfthEligibility = (student, drive) => {
  if (drive.minimumTwelfthPercentage == null) {
    return true;
  }

  return student.twelfthPercentage >= drive.minimumTwelfthPercentage;
};

const checkBacklogEligibility = (student, drive) => {
  return student.backlogs <= drive.maximumBacklogs;
};

const checkSkillsEligibility = (student, drive) => {
  if (!drive.requiredSkills || drive.requiredSkills.length === 0) {
    return true;
  }

  return drive.requiredSkills.every((requiredSkill) =>
    student.skills.includes(requiredSkill)
  );
};


const checkEligibility = (student, drive) => {
  const checks = {
    cgpa: checkCgpaEligibility(student, drive),
    branch: checkBranchEligibility(student, drive),
    tenth: checkTenthEligibility(student, drive),
    twelfth: checkTwelfthEligibility(student, drive),
    backlogs: checkBacklogEligibility(student, drive),
    skills: checkSkillsEligibility(student, drive),
  };

  const eligible = Object.values(checks).every(Boolean);

  return {
    eligible,
    checks,
  };
};


module.exports = {
  checkCgpaEligibility,
  checkBranchEligibility,
  checkTenthEligibility,
  checkTwelfthEligibility,
  checkBacklogEligibility,
  checkSkillsEligibility,
  checkEligibility,
};