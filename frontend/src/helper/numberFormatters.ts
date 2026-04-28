// @ts-nocheck
export const toSafeNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export const roundToDecimals = (value, decimals = 2) => {
  const factor = 10 ** decimals;
  return Math.round((toSafeNumber(value, 0) + Number.EPSILON) * factor) / factor;
};

export const formatDisplayNumber = (value, decimals = 2) => {
  if (value === null || value === undefined || value === "") {
    return "";
  }

  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) {
    return "";
  }

  const roundedValue = roundToDecimals(numericValue, decimals);
  if (Number.isInteger(roundedValue)) {
    return String(roundedValue);
  }

  return roundedValue.toFixed(decimals);
};