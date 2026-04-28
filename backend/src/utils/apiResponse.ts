export type PaginatedMeta = {
  page: number;
  limit: number;
  total: number;
};

export const ok = <T>(data: T, meta?: PaginatedMeta) => ({
  success: true,
  data,
  meta
});

export const fail = (message: string, details?: unknown) => ({
  success: false,
  message,
  details
});
