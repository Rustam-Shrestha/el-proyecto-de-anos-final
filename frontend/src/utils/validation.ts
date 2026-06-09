const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/;

export const validateEmail = (v: string) => {
  if (!v) return 'Email is required';
  if (!emailRegex.test(v)) return 'Invalid email address';
  return '';
};

export const validatePassword = (v: string) => {
  if (!v) return 'Password is required';
  if (v.length < 8) return 'Password must be at least 8 characters';
  if (!/[A-Z]/.test(v)) return 'Password must contain an uppercase letter';
  if (!/[a-z]/.test(v)) return 'Password must contain a lowercase letter';
  if (!/[0-9]/.test(v)) return 'Password must contain a number';
  return '';
};

export const validateUUID = (v: string) => {
  if (!v) return 'ID is required';
  if (!uuidRegex.test(v)) return 'Invalid UUID format';
  return '';
};

export const validateFile = (file?: File | null) => {
  if (!file) return 'File is required';
  const allowed = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
  if (!allowed.includes(file.type)) return 'Unsupported file type';
  if (file.size > 10 * 1024 * 1024) return 'File exceeds 10MB limit';
  return '';
};

export const validateMinLength = (v: string, min = 2) => {
  if (!v) return `Field is required`;
  if (v.trim().length < min) return `Minimum ${min} characters required`;
  return '';
};
