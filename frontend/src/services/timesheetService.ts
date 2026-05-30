// @ts-nocheck
import { apiService } from "./apiService";
import { endpoints } from "./endpoints";
import { getStatusInfo } from "../helper/timesheetFormatters";

export const TASK_STATUS = Object.freeze({
  PENDING: "pending",
  IN_PROGRESS: "in-progress",
  COMPLETED: "completed",
});

export const TIMESHEET_STATUS = Object.freeze({
  DRAFT: "draft",
  CORRECTED: "corrected",
  CHECKED: "checked",
  APPROVED: "approved",
});

export const TIMESHEET_ROLE = Object.freeze({
  SUPERVISOR: "supervisor",
  PAYROLL_MANAGER: "payroll_manager",
});

export const TIMESHEET_TYPE = Object.freeze({
  WEEKLY: "weekly",
  MONTHLY: "monthly",
});

export const TIMESHEET_ACTION = Object.freeze({
  CORRECT: "correct",
  CHECK: "check",
  APPROVE: "approve",
});

const TASK_LIFECYCLE_TRANSITIONS = Object.freeze({
  [TASK_STATUS.PENDING]: [TASK_STATUS.IN_PROGRESS],
  [TASK_STATUS.IN_PROGRESS]: [TASK_STATUS.COMPLETED],
  [TASK_STATUS.COMPLETED]: [],
});

const TIMESHEET_TRANSITIONS = Object.freeze({
  [TIMESHEET_STATUS.DRAFT]: [TIMESHEET_STATUS.CORRECTED, TIMESHEET_STATUS.CHECKED, TIMESHEET_STATUS.APPROVED],
  [TIMESHEET_STATUS.CORRECTED]: [TIMESHEET_STATUS.CORRECTED, TIMESHEET_STATUS.CHECKED, TIMESHEET_STATUS.APPROVED],
  [TIMESHEET_STATUS.CHECKED]: [TIMESHEET_STATUS.CORRECTED, TIMESHEET_STATUS.CHECKED, TIMESHEET_STATUS.APPROVED],
  [TIMESHEET_STATUS.APPROVED]: [],
});

const normalizeValue = (value) => String(value || "").toLowerCase().trim();

const normalizeStatus = (status) => normalizeValue(status);

const normalizeRole = (role) => {
  const normalized = normalizeValue(role).replace(/\s+/g, "_");

  if ([TIMESHEET_ROLE.SUPERVISOR, "weekly"].includes(normalized)) {
    return TIMESHEET_ROLE.SUPERVISOR;
  }

  if (
    [TIMESHEET_ROLE.PAYROLL_MANAGER, "payroll", "payrollmanager", "monthly"].includes(
      normalized
    )
  ) {
    return TIMESHEET_ROLE.PAYROLL_MANAGER;
  }

  return normalized;
};

const normalizeTimesheetType = (timesheetType) => {
  const normalized = normalizeValue(timesheetType);
  return normalized === TIMESHEET_TYPE.MONTHLY
    ? TIMESHEET_TYPE.MONTHLY
    : TIMESHEET_TYPE.WEEKLY;
};

const normalizeAction = (action) => normalizeValue(action);

const getReviewStatusFromStatus = (status) => {
  const normalized = normalizeStatus(status);

  if ([TASK_STATUS.PENDING, TASK_STATUS.IN_PROGRESS, TASK_STATUS.COMPLETED].includes(normalized)) {
    return TIMESHEET_STATUS.DRAFT;
  }

  if (normalized === TIMESHEET_STATUS.CORRECTED) {
    return TIMESHEET_STATUS.CORRECTED;
  }

  if (normalized === TIMESHEET_STATUS.CHECKED) {
    return TIMESHEET_STATUS.CHECKED;
  }

  if (normalized === TIMESHEET_STATUS.APPROVED) {
    return TIMESHEET_STATUS.APPROVED;
  }

  return TIMESHEET_STATUS.DRAFT;
};

// Status states that are not editable because the task itself is still running.
export const LOCKED_TIMESHEET_STATES = [
  TASK_STATUS.PENDING,
  "check-in",
  TASK_STATUS.IN_PROGRESS,
];

export const isTaskReviewableStatus = (status) => {
  const normalized = normalizeStatus(status);
  return [
    TASK_STATUS.COMPLETED,
    TIMESHEET_STATUS.CORRECTED,
    TIMESHEET_STATUS.CHECKED,
  ].includes(normalized);
};

export const isTimesheetApproved = (status) => {
  return normalizeStatus(status) === TIMESHEET_STATUS.APPROVED;
};

export const getRoleTimesheetType = (role) => {
  return normalizeRole(role) === TIMESHEET_ROLE.SUPERVISOR
    ? TIMESHEET_TYPE.WEEKLY
    : TIMESHEET_TYPE.MONTHLY;
};

/**
 * Check if a timesheet status is locked (prevents editing/approvals)
 * @param {string} status - The timesheet status to check
 * @returns {boolean} True if the status is locked
 */
export const isLockedTimesheetStatus = (status) => {
  return LOCKED_TIMESHEET_STATES.includes(normalizeStatus(status));
};

/**
 * Validate a task lifecycle transition.
 * Only pending -> in-progress -> completed is allowed.
 * @param {string} currentStatus
 * @param {string} nextStatus
 * @returns {{valid: boolean, message: string, currentStatus: string, nextStatus: string}}
 */
export const validateTaskTransition = (currentStatus, nextStatus) => {
  const normalizedCurrent = normalizeStatus(currentStatus) || TASK_STATUS.PENDING;
  const normalizedNext = normalizeStatus(nextStatus);
  const allowedTransitions = TASK_LIFECYCLE_TRANSITIONS[normalizedCurrent] || [];

  if (!allowedTransitions.includes(normalizedNext)) {
    return {
      valid: false,
      message: `Invalid task transition from ${normalizedCurrent} to ${normalizedNext}`,
      currentStatus: normalizedCurrent,
      nextStatus: normalizedNext,
    };
  }

  return {
    valid: true,
    message: "",
    currentStatus: normalizedCurrent,
    nextStatus: normalizedNext,
  };
};

/**
 * Validate a timesheet review transition.
 * DRAFT -> CORRECTED/CHECKED/APPROVED
 * CORRECTED -> CHECKED/APPROVED
 * CHECKED -> CORRECTED/APPROVED
 * APPROVED -> locked
 * @param {string} currentStatus
 * @param {string} nextStatus
 * @returns {{valid: boolean, message: string, currentStatus: string, nextStatus: string}}
 */
export const validateTimesheetTransition = (currentStatus, nextStatus) => {
  const normalizedCurrent = normalizeStatus(currentStatus) || TIMESHEET_STATUS.DRAFT;
  const normalizedNext = normalizeStatus(nextStatus);
  const allowedTransitions = TIMESHEET_TRANSITIONS[normalizedCurrent] || [];

  if (!allowedTransitions.includes(normalizedNext)) {
    return {
      valid: false,
      message: `Invalid timesheet transition from ${normalizedCurrent} to ${normalizedNext}`,
      currentStatus: normalizedCurrent,
      nextStatus: normalizedNext,
    };
  }

  return {
    valid: true,
    message: "",
    currentStatus: normalizedCurrent,
    nextStatus: normalizedNext,
  };
};

/**
 * Validate a role-based review action against the current workflow state.
 * @param {Object} params
 * @param {string} params.role - Role name or normalized role
 * @param {string} params.timesheetType - "weekly" or "monthly"
 * @param {string} params.action - "correct", "check" or "approve"
 * @param {string} params.status - Current task/timesheet status
 * @returns {{valid: boolean, message: string, nextStatus: string, currentStatus: string}}
 */
export const validateTimesheetAction = ({
  role,
  timesheetType,
  action,
  status,
}) => {
  const normalizedRole = normalizeRole(role);
  const normalizedType = normalizeTimesheetType(timesheetType);
  const normalizedAction = normalizeAction(action);
  const normalizedStatus = normalizeStatus(status);

  if (isTimesheetApproved(normalizedStatus)) {
    return {
      valid: false,
      message: "Approved timesheets are locked",
      nextStatus: normalizedStatus,
      currentStatus: normalizedStatus,
    };
  }

  if (normalizedRole === TIMESHEET_ROLE.SUPERVISOR && normalizedType !== TIMESHEET_TYPE.WEEKLY) {
    return {
      valid: false,
      message: "Supervisor actions are limited to weekly timesheets",
      nextStatus: normalizedStatus,
      currentStatus: normalizedStatus,
    };
  }

  if (
    normalizedRole === TIMESHEET_ROLE.PAYROLL_MANAGER &&
    normalizedType !== TIMESHEET_TYPE.MONTHLY
  ) {
    return {
      valid: false,
      message: "Payroll manager actions are limited to monthly timesheets",
      nextStatus: normalizedStatus,
      currentStatus: normalizedStatus,
    };
  }

  if (
    normalizedAction === TIMESHEET_ACTION.APPROVE &&
    normalizedRole !== TIMESHEET_ROLE.PAYROLL_MANAGER
  ) {
    return {
      valid: false,
      message: "Only the payroll manager can approve timesheets",
      nextStatus: normalizedStatus,
      currentStatus: normalizedStatus,
    };
  }

  const nextStatusByAction = {
    [TIMESHEET_ACTION.CORRECT]: TIMESHEET_STATUS.CORRECTED,
    [TIMESHEET_ACTION.CHECK]: TIMESHEET_STATUS.CHECKED,
    [TIMESHEET_ACTION.APPROVE]: TIMESHEET_STATUS.APPROVED,
  };

  const nextStatus = nextStatusByAction[normalizedAction];

  if (!nextStatus) {
    return {
      valid: false,
      message: `Unknown review action: ${normalizedAction}`,
      nextStatus: normalizedStatus,
      currentStatus: normalizedStatus,
    };
  }

  const reviewStatus = getReviewStatusFromStatus(normalizedStatus);
  const transition = validateTimesheetTransition(reviewStatus, nextStatus);

  if (!transition.valid) {
    return {
      valid: false,
      message: transition.message,
      nextStatus,
      currentStatus: reviewStatus,
    };
  }

  return {
    valid: true,
    message: "",
    nextStatus,
    currentStatus: reviewStatus,
  };
};

/**
 * Check if a role can perform a review action in the current workflow state.
 * @param {Object} params
 * @returns {boolean}
 */
export const canPerformTimesheetAction = (params) => {
  return validateTimesheetAction(params).valid;
};

/**
 * Get all eligible task IDs for a given role/action pair.
 * @param {Array} tasks - Array of task-like objects containing id/status fields
 * @param {Object} options
 * @param {string} options.role
 * @param {string} options.timesheetType
 * @param {string} options.action
 * @returns {Array<string|number>}
 */
export const getEligibleTaskIdsForAction = (tasks = [], options = {}) => {
  const eligibleIds = tasks
    .filter((task) => {
      const taskStatus = task?.status || task?.currentStatus || task?.timesheetStatus;
      return canPerformTimesheetAction({
        role: options.role,
        timesheetType: options.timesheetType,
        action: options.action,
        status: taskStatus,
      });
    })
    .map((task) => task?.id || task?._id)
    .filter((id) => id !== null && id !== undefined);

  return [...new Set(eligibleIds)];
};

/**
 * Get status display with clear labels and tooltips.
 * Uses shared getStatusInfo for consistency.
 * @param {string} status - The task status
 * @returns {string} Display string (e.g. "✔ Checked", "✔✔ Approved")
 */
export const getStatusDisplay = (status) => {
  return getStatusInfo(status).label;
};

/**
 * Check if finalize button should be enabled
 * Button is enabled only if NO tasks are in check-in or in-progress for the period
 * @param {Array} rows - Rows of timesheet data for the period
 * @returns {Object} { canFinalize: boolean, reason: string }
 */
export const canFinalizePeriod = (rows = []) => {
  if (!rows || rows.length === 0) {
    return {
      canFinalize: false,
      reason: "No tasks available; the period is already approved.",
    };
  }

  const lockedTasks = rows.filter((row) =>
    isLockedTimesheetStatus(row.currentStatus || row.status)
  );

  if (lockedTasks.length > 0) {
    return {
      canFinalize: false,
      reason: `Cannot finalize: ${lockedTasks.length} task(s) in check-in or in-progress state`,
    };
  }

  const completedOrLater = rows.filter((row) =>
    isTaskReviewableStatus(row.currentStatus || row.status) ||
    isTimesheetApproved(row.currentStatus || row.status)
  );

  if (completedOrLater.length === 0) {
    return {
      canFinalize: false,
      reason: "No tasks ready for finalization",
    };
  }

  return { canFinalize: true, reason: "" };
};

/**
 * Check if all tasks in period are in specified status or later
 * @param {Array} rows - Rows of timesheet data
 * @param {string} minStatus - Minimum status required ("completed", "corrected", "checked", "approved")
 * @returns {boolean}
 */
export const allTasksHaveMinStatus = (rows = [], minStatus = "completed") => {
  const statusHierarchy = {
    [TASK_STATUS.PENDING]: 0,
    "check-in": 0,
    [TASK_STATUS.IN_PROGRESS]: 1,
    [TASK_STATUS.COMPLETED]: 2,
    [TIMESHEET_STATUS.CORRECTED]: 3,
    [TIMESHEET_STATUS.CHECKED]: 4,
    [TIMESHEET_STATUS.APPROVED]: 5,
  };

  const minLevel = statusHierarchy[normalizeStatus(minStatus)] || 2;

  return rows.every((row) => {
    const status = normalizeStatus(row.currentStatus || row.status);
    return (statusHierarchy[status] || 0) >= minLevel;
  });
};

/**
 * Send task corrections to the backend
 * @param {Array} corrections - Array of correction objects with taskId, hours, minutes, comments, etc.
 * @returns {Promise} API response
 */
export const patchTaskCorrections = async (corrections) => {
  try {
    const response = await apiService.patch(
      endpoints.taskCorrections,
      Array.isArray(corrections) ? corrections : [corrections]
    );
    return response.data;
  } catch (error) {
    console.error("Failed to patch task corrections:", error);
    throw error;
  }
};

/**
 * Finalize weekly timesheet (calls the finalize-weekly endpoint)
 * @param {Object} payload - Payload with week/employee/client details for finalization
 * @returns {Promise} API response
 */
export const finalizeWeeklyTimesheet = async (payload) => {
  try {
    const response = await apiService.post(
      endpoints.taskFinalizeWeekly,
      payload
    );
    return response.data;
  } catch (error) {
    console.error("Failed to finalize weekly timesheet:", error);
    throw error;
  }
};

/**
 * Finalize monthly timesheet (calls the finalize-monthly endpoint)
 * @param {Object} payload - Payload with month/employee/client details for finalization
 * @returns {Promise} API response
 */
export const finalizeMonthlyTimesheet = async (payload) => {
  try {
    const response = await apiService.post(
      endpoints.taskFinalizeMonthly,
      payload
    );
    return response.data;
  } catch (error) {
    console.error("Failed to finalize monthly timesheet:", error);
    throw error;
  }
};
