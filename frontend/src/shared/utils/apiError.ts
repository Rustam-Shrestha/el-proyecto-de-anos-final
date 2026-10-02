/** Extract the backend's own message so UI shows clear errors, never a generic wall. */
export const apiErrorMessage = (error: unknown, fallback: string): string => {
  if (typeof error === "object" && error !== null) {
    const data = (error as { response?: { data?: { message?: unknown; error?: unknown } }; message?: unknown }).response?.data;
    if (data && typeof data.message === "string" && data.message.trim()) return data.message;
    if (data && typeof data.error === "string" && data.error.trim()) return data.error;
    const msg = (error as { message?: unknown }).message;
    if (typeof msg === "string" && msg.trim()) return msg;
  }
  return fallback;
};
