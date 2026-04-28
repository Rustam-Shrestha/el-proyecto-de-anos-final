// @ts-nocheck
const toNumber = (value: unknown): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

export const formatDuration = (minutes: unknown): string => {
  const total = Math.max(0, Math.round(toNumber(minutes)));
  const hours = Math.floor(total / 60);
  const mins = total % 60;
  return `${hours}h ${String(mins).padStart(2, "0")}m`;
};

export const formatDurationFromDecimal = (hoursDecimal: unknown): string => {
  const totalMinutes = Math.round(toNumber(hoursDecimal) * 60);
  return formatDuration(totalMinutes);
};

export const formatContractedHours = (hours: unknown): string => {
  return `${toNumber(hours).toFixed(2)}h`;
};

export const getStatusInfo = (status: string) => {
  const normalized = String(status || "pending").toLowerCase();
  const palette: Record<string, { label: string; className: string }> = {
    approved: { label: "Approved", className: "text-green-700 bg-green-100" },
    rejected: { label: "Rejected", className: "text-red-700 bg-red-100" },
    submitted: { label: "Submitted", className: "text-blue-700 bg-blue-100" },
    pending: { label: "Pending", className: "text-yellow-700 bg-yellow-100" }
  };

  return palette[normalized] || palette.pending;
};

export const getStatusLabel = (status: string): string => getStatusInfo(status).label;

export const computeCorrectionDelta = (actual: unknown, expected: unknown): number => {
  return toNumber(actual) - toNumber(expected);
};

export const formatCorrectionDelta = (actual: unknown, expected: unknown): string => {
  const delta = computeCorrectionDelta(actual, expected);
  const sign = delta > 0 ? "+" : "";
  return `${sign}${delta.toFixed(2)}h`;
};

export const validateCorrection = (actual: unknown, expected: unknown) => {
  const delta = computeCorrectionDelta(actual, expected);
  return {
    isValid: Number.isFinite(delta),
    delta,
    message: Number.isFinite(delta) ? "valid" : "invalid"
  };
};
