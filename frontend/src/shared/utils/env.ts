export const env = {
  API_URL: import.meta.env.VITE_API_BASE_URL || '/api/v1',
  SOCKET_URL: import.meta.env.VITE_SOCKET_URL || 'wss://localhost:5000',
  MAX_FILE_SIZE: 5 * 1024 * 1024,
  IS_DEV: import.meta.env.DEV,
};

export default env;
