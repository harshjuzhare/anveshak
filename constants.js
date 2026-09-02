export const ROLES = {
  CITIZEN: "citizen",
  OFFICER: "officer",
  WORKER: "worker",
  ADMIN: "admin",
};

export const COMPLAINT_STATUS = {
  SUBMITTED: "Submitted",
  UNDER_REVIEW: "Under Review",
  ASSIGNED_TO_OFFICER: "Assigned to Officer",
  WORKER_ASSIGNED: "Worker Assigned",
  WORK_IN_PROGRESS: "Work in Progress",
  WORK_COMPLETED: "Work Completed",
  VERIFICATION_PENDING: "Verification Pending",
  RESOLVED: "Resolved",
  CLOSED: "Closed",
  REOPENED: "Reopened",
};

export const STATUS_TRANSITIONS = {
  [COMPLAINT_STATUS.SUBMITTED]: [COMPLAINT_STATUS.UNDER_REVIEW],
  [COMPLAINT_STATUS.UNDER_REVIEW]: [COMPLAINT_STATUS.ASSIGNED_TO_OFFICER],
  [COMPLAINT_STATUS.ASSIGNED_TO_OFFICER]: [COMPLAINT_STATUS.WORKER_ASSIGNED],
  [COMPLAINT_STATUS.WORKER_ASSIGNED]: [COMPLAINT_STATUS.WORK_IN_PROGRESS],
  [COMPLAINT_STATUS.WORK_IN_PROGRESS]: [COMPLAINT_STATUS.WORK_COMPLETED],
  [COMPLAINT_STATUS.WORK_COMPLETED]: [COMPLAINT_STATUS.VERIFICATION_PENDING],
  [COMPLAINT_STATUS.VERIFICATION_PENDING]: [COMPLAINT_STATUS.RESOLVED, COMPLAINT_STATUS.REOPENED],
  [COMPLAINT_STATUS.REOPENED]: [COMPLAINT_STATUS.WORKER_ASSIGNED, COMPLAINT_STATUS.WORK_IN_PROGRESS],
  [COMPLAINT_STATUS.RESOLVED]: [COMPLAINT_STATUS.CLOSED],
  [COMPLAINT_STATUS.CLOSED]: [],
};

export const PRIORITY = { LOW: "Low", MEDIUM: "Medium", HIGH: "High", CRITICAL: "Critical" };

export const DEPARTMENT_CATEGORY_MAP = {
  pothole: "Road Department",
  road_damage: "Road Department",
  garbage: "Waste Management Department",
  waste_accumulation: "Waste Management Department",
  broken_streetlight: "Electricity Department",
  water_leakage: "Water Department",
  drainage_issue: "Drainage Department",
  sanitation_issue: "Sanitation Department",
  public_cleanliness: "Sanitation Department",
  other: "General Department",
};
