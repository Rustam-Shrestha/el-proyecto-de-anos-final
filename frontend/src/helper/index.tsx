// @ts-nocheck
import { useCallback, useRef } from "react";
export { formatDuration, formatDurationFromDecimal, formatContractedHours, getStatusInfo, getStatusLabel, formatCorrectionDelta, validateCorrection, computeCorrectionDelta } from "./timesheetFormatters";
export { formatDisplayNumber, roundToDecimals, toSafeNumber } from "./numberFormatters";

/**
 * Parses a date string into a Date object.
 * Handles ISO 8601 (YYYY-MM-DD) and fallback native parsing.
 * @param {string|Date} dateString - The date value to parse
 * @returns {Date|null} Parsed Date object, or null if invalid
 */
const parseDateString = (dateString) => {
  if (!dateString) return null;

  // If it's already a Date object, return it
  if (dateString instanceof Date) {
    return dateString;
  }

  // If it's not a string, try to convert or return null
  if (typeof dateString !== "string") {
    try {
      return new Date(dateString);
    } catch {
      return null;
    }
  }

  // Handle YYYY-MM-DD format (ISO 8601)
  const parts = dateString.split("-");
  if (parts.length === 3) {
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1; // Months are 0-indexed
    const day = parseInt(parts[2], 10);
    return new Date(year, month, day);
  }

  // Fallback to native Date parsing
  return new Date(dateString);
};

/**
 * Converts a File object to a Base64-encoded string (without the data URI prefix).
 * @param {File} file - File to convert
 * @returns {Promise<string>} Base64 string
 */
const convertToBase64 = async (file) => {
  const reader = new FileReader();

  return new Promise((resolve, reject) => {
    reader.onload = () => resolve(reader.result.split(",")[1]); // Base64 data
    reader.onerror = () =>
      reject(new Error("Failed to convert file to Base64"));
    reader.readAsDataURL(file); // Avoid splitting large files
  });
};

/**
 * Converts a File object to an ArrayBuffer (binary data).
 * @param {File} file - File to convert
 * @returns {Promise<ArrayBuffer>} Binary data
 */
const convertToBinaryString = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const binaryString = reader.result; // Binary data as a string
      resolve(binaryString);
    };
    reader.onerror = (error) => {
      reader.abort();
      reject(new Error("Failed to convert file to binary"));
    };
    reader.readAsArrayBuffer(file);
  });
};

/**
 * Formats an ISO date string or time string into a localized "h:mm AM/PM" string.
 * Returns the original string if it's already in AM/PM format or parsing fails.
 * @param {string} isoString - ISO date string or "h:mm AM/PM" string
 * @returns {string} Formatted time string
 */
const formatTimeFromISOString = (isoString) => {
  if (isoString === null || isoString === undefined || isoString === "") {
    return "";
  }

  // If it's already in "h:mm AM/PM" format, just return it
  if (
    typeof isoString === "string" &&
    /^\d{1,2}:\d{2}\s?(AM|PM|am|pm)$/i.test(isoString.trim())
  ) {
    return isoString;
  }

  const date = new Date(isoString);

  // If parsing failed, return the original string instead of "Invalid Date"
  if (isNaN(date.getTime())) {
    return isoString;
  }

  const options = { hour: "numeric", minute: "2-digit", hour12: true };
  return date.toLocaleTimeString(undefined, options);
};

/**
 * Formats hours and minutes into "H:MM" format.
 * @param {number} hour
 * @param {number} minute
 * @returns {string}
 */
const formatTime = (hour, minute) => {
  const h = Number(hour) || 0;
  const m = Number(minute) || 0;
  return `${h}h ${m.toString().padStart(2, "0")}m`;
};

/**
 * Calculates the time difference between two time values.
 * Returns negative if end is before start.
 * @param {number} startHours
 * @param {number} startMinutes
 * @param {number} endHours
 * @param {number} endMinutes
 * @returns {string} Formatted as "[-]H:MM"
 */
const timeDifference = (startHours, startMinutes, endHours, endMinutes) => {
  const start = startHours * 60 + startMinutes;
  let end = endHours * 60 + endMinutes;
  let diff,
    sign = "";
  if (end < start) {
    diff = start - end;
    sign = "-";
  } else {
    diff = end - start;
  }
  const hours = Math.floor(diff / 60);
  const minutes = diff % 60;
  return `${sign}${hours}:${minutes.toString().padStart(2, "0")}`;
};

/**
 * Formats a date value into a human-readable string (e.g., "Jan 1, 2024").
 * @param {string|Date} date - Date value to format
 * @returns {string} Formatted date or empty string
 */
const formatDate = (date = "") => {
  if (!date) return "";
  const dateObj =
    typeof date === "string" ? parseDateString(date) : new Date(date);
  if (isNaN(dateObj.getTime())) return date;
  return dateObj.toLocaleDateString("en-UK", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

/**
 * Formats a date string into "Mon DD, YYYY, HH:MM" format.
 * @param {string} dateString - Date string to format
 * @returns {string} Formatted date-time string
 */
const formatDateTime = (dateString) => {
  if (!dateString) return "";
  const dateObj =
    typeof dateString === "string" ? parseDateString(dateString) : new Date(dateString);
  if (isNaN(dateObj.getTime())) return dateString;
  return dateObj.toLocaleDateString("en-UK", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

/**
 * Checks whether a given date is today's date.
 * @param {string|Date} date - Date to check
 * @returns {boolean}
 */
const isDateToday = (date) => {
  const today = new Date();
  const selectedDate = typeof date === "string" ? parseDateString(date) : new Date(date);
  return (
    selectedDate.getDate() === today.getDate() &&
    selectedDate.getMonth() === today.getMonth() &&
    selectedDate.getFullYear() === today.getFullYear()
  );
};

/**
 * Formats an ISO string into "YYYY / MM / DD" format.
 * @param {string} isoString - ISO date string
 * @returns {string|null} Formatted date or null if invalid
 */
const formatISOStringToCustomDate = (isoString) => {
  // Create a new Date object from the ISO string
  const date = typeof isoString === "string" ? parseDateString(isoString) : new Date(isoString);

  // Check if the date is valid
  if (isNaN(date.getTime())) {
    console.error("Invalid ISO date format");
    return null;
  }

  // Extract year, month, and day
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  // Return formatted date
  return `${year} / ${month} / ${day}`;
};

/**
 * Converts an ISO date string to a relative time string (e.g., "5 mins ago").
 * @param {string} isoString - ISO date string
 * @returns {string|null} Relative time string, or null if invalid
 */
const formatISOStringToTimeAgo = (isoString) => {
  const date = new Date(isoString);
  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);

  if (isNaN(date.getTime())) {
    console.error("Invalid ISO date format");
    return null;
  }

  const intervals = [
    { label: "year", seconds: 31536000 },
    { label: "month", seconds: 2592000 },
    { label: "day", seconds: 86400 },
    { label: "hour", seconds: 3600 },
    { label: "min", seconds: 60 },
    { label: "sec", seconds: 1 },
  ];

  for (const interval of intervals) {
    const count = Math.floor(diffInSeconds / interval.seconds);
    if (count >= 1) {
      return `${count} ${interval.label}${count !== 1 ? "s" : ""} ago`;
    }
  }

  return "just now";
};

/**
 * useDebounce Hook
 *
 * Delays invoking a callback until after `delay` ms since the last call.
 * Re-exported from hooks/useDebounce for backward compatibility.
 *
 * @param {Function} callback - The function to debounce
 * @param {number} delay - Debounce delay in milliseconds
 * @returns {Function} Debounced function
 */
function useDebounce(callback, delay) {
  const timeoutRef = useRef(null);

  return useCallback(
    (...args) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => {
        callback(...args);
      }, delay);
    },
    [callback, delay]
  );
}

const filterNavItemsByPermission = (navItems, roles) => {
  // If super admin, return all menu items
  if (isSuperUser()) {
    return navItems;
  }
  return navItems
    .map((item) => {
      // Check if user has permission for this menu
      const hasMenuPermission = roles?.some(
        (role) => role.menu === item.label && role.permission.includes("get")
      );

      // If it has a dropdown, filter its submenu items
      let filteredDropdownItems = item.dropdownItems?.filter((subItem) =>
        roles?.some(
          (role) =>
            role.menu === item.label &&
            role.subMenu === subItem.label &&
            role.permission.includes("get")
        )
      );

      // If the menu has dropdowns but none are permitted, remove the whole menu
      if (
        item.hasDropdown &&
        (!filteredDropdownItems || filteredDropdownItems.length === 0)
      ) {
        return null;
      }

      // Return the menu only if it has permission
      return hasMenuPermission ||
        (filteredDropdownItems && filteredDropdownItems.length > 0)
        ? { ...item, dropdownItems: filteredDropdownItems }
        : null;
    })
    .filter(Boolean); // Remove null values
};

/**
 * Checks if the current user has superuser privileges.
 * Reads from localStorage — use the Redux selector `selectIsSuperUser`
 * inside React components when possible.
 * @returns {boolean}
 */
const isSuperUser = () => {
  try {
    const userData = JSON.parse(localStorage.getItem("userData"));
    return userData?.isSuperUser;
  } catch (e) {
    return false;
  }
};

/**
 * Checks whether a user has a specific permission on a menu/submenu.
 * @param {Array} permissions - User permission array
 * @param {string} menu - Menu name
 * @param {string} subMenu - Sub-menu name (optional)
 * @param {string} requiredPermission - Required permission string (e.g., 'get', 'post')
 * @param {boolean} isSuper - Whether the user is a superuser
 * @returns {boolean}
 */
const checkPermission = (
  permissions,
  menu,
  subMenu,
  requiredPermission,
  isSuper
) => {
  if (isSuper) {
    return true;
  }
  const menuItem = permissions.find((item) => {
    const menuMatches = Array.isArray(menu)
      ? menu.includes(item.menu)
      : item.menu === menu;
    return menuMatches && (!subMenu || item.subMenu === subMenu);
  });
  return menuItem?.permission.includes(requiredPermission) || false;
};

/**
 * Checks if the user has a specific permission for a submenu.
 * Superusers always return true.
 * @param {Array} permissions - User permission array
 * @param {string} subMenu - Sub-menu name to check
 * @param {string} action - Permission action (e.g., 'get', 'post', 'delete')
 * @returns {boolean}
 */
const hasPermission = (permissions, subMenu, action) => {
  if (isSuperUser()) {
    return true;
  }
  const menuItem = permissions.find((item) => item.subMenu === subMenu);
  return menuItem?.permission.includes(action) || false;
};

/**
 * Counts the total number of days spanned by an array of dates (inclusive).
 * @param {Array<string|Date>} dates - Array of date values
 * @returns {number} Number of days between earliest and latest date, or 0
 */
function countDaysBetweenDates(dates) {
  if (!dates || dates.length === 0) return 0;

  // Convert all date strings to local Date objects to avoid timezone shift
  const parsedDates = dates.map((dateStr) =>
    typeof dateStr === "string" ? parseDateString(dateStr) : new Date(dateStr)
  );

  // Find min and max dates
  const minDate = new Date(Math.min(...parsedDates));
  const maxDate = new Date(Math.max(...parsedDates));

  // Calculate the difference in milliseconds
  const diffTime = maxDate - minDate;

  // Convert milliseconds to days and add 1 to include both start and end dates
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;

  return diffDays;
}

/**
 * Calculates elapsed time between two timestamps as "H:MM".
 * Ignores seconds and milliseconds. Returns "N/A" if inputs are invalid.
 * @param {string|Date} checkIn - Start time
 * @param {string|Date} checkOut - End time
 * @returns {string} Formatted duration or "N/A"
 */
const calculateVariation = (checkIn, checkOut) => {
  if (!checkIn || !checkOut) return "N/A";

  const start = new Date(checkIn);
  const end = new Date(checkOut);

  if (isNaN(start) || isNaN(end)) return "N/A";

  // ✅ ignore seconds & milliseconds
  start.setSeconds(0, 0);
  end.setSeconds(0, 0);

  const diffMs = Math.abs(end - start); // difference in milliseconds
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  const timeTaken = `${hours}:${minutes}`;

  return timeTaken;
};

/**
 * Converts separate hours and minutes into total hours (decimal).
 * @param {number} hours
 * @param {number} minutes
 * @returns {string} Total hours as a fixed-point string (e.g., "8.50")
 */
const calculateHours = (hours, minutes) => {
  const timeTaken = ((hours || 0) + (minutes || 0) / 60).toFixed(2);
  return timeTaken;
};

/**
 * Parses a date and time string into a combined Date object.
 * Handles "h:mm AM/PM" format and full ISO strings.
 * @param {string|Date} date - Base date
 * @param {string} timeString - Time in "h:mm AM/PM" or ISO format
 * @returns {Date} Combined date-time object
 */
const parseTime = (date, timeString) => {
  if (!timeString)
    return typeof date === "string" ? parseDateString(date) : new Date(date);

  // If timeString is already a full ISO string, return it as a Date
  if (typeof timeString === "string" && timeString.includes("T")) {
    const d = new Date(timeString);
    if (!isNaN(d.getTime())) return d;
  }

  const baseDate =
    typeof date === "string" ? parseDateString(date) : new Date(date);

  // Handle both "h:mm AM/PM" and "hh:mm AM/PM" formats
  const parts = timeString.trim().split(" ");

  // Validate inputs
  if (parts.length < 2) {
    console.warn('Invalid time format. Expected format: "h:mm AM/PM"');
    return baseDate;
  }

  const [time, modifier] = parts;
  const [hours, minutes] = time.split(":");

  if (!hours || !minutes || !modifier) {
    console.warn('Invalid time format. Expected format: "h:mm AM/PM"');
    return baseDate;
  }

  let hour = parseInt(hours, 10);
  const minute = parseInt(minutes, 10);

  // Validate parsed numbers
  if (isNaN(hour) || isNaN(minute)) {
    console.warn("Invalid time values. Hours and minutes must be numbers.");
    return baseDate;
  }
  // Convert to 24-hour format
  if (modifier.toUpperCase() === "PM" && hour !== 12) {
    hour += 12;
  } else if (modifier.toUpperCase() === "AM" && hour === 12) {
    hour = 0;
  }

  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) {
    console.warn(
      "Invalid time values. Hour must be 0-23, minutes must be 0-59."
    );
    return baseDate;
  }

  const appointmentDate = baseDate;
  appointmentDate.setHours(hour, minute, 0, 0);

  return appointmentDate;
};

/**
 * Returns the oldest (earliest) date from an array as a "YYYY-MM-DD" string.
 * Uses local time to avoid UTC offset issues.
 * @param {Array<string|Date>} dateArray - Array of date values
 * @returns {string|null} Formatted date string or null
 */
const getOldestDate = (dateArray) => {
  if (!dateArray || dateArray.length === 0) return null;

  const timestamps = dateArray.map((date) =>
    (typeof date === "string" ? parseDateString(date) : new Date(date)).getTime()
  );
  const oldestTimestamp = Math.min(...timestamps);
  const d = new Date(oldestTimestamp);

  // Manual formatting to avoid UTC shift
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

export {
  calculateHours,
  calculateVariation,
  checkPermission,
  convertToBase64,
  convertToBinaryString,
  countDaysBetweenDates,
  filterNavItemsByPermission,
  formatDate,
  formatDateTime,
  formatISOStringToCustomDate,
  formatISOStringToTimeAgo,
  formatTime,
  formatTimeFromISOString,
  getOldestDate,
  hasPermission,
  isDateToday,
  parseDateString,
  parseTime,
  timeDifference,
  useDebounce,
};
