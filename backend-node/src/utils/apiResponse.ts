export const apiResponse = {
  success: <T,>(message: string, data?: T, statusCode?: number) => ({
    success: true,
    message,
    data,
    statusCode: statusCode || 200,
  }),

  error: (message: string, statusCode: number = 500, details?: unknown) => ({
    success: false,
    message,
    statusCode,
    ...(details !== undefined ? { details } : {}),
  }),

  paginated: <T,>(
    message: string,
    items: T[],
    page: number,
    limit: number,
    total: number
  ) => ({
    success: true,
    message,
    data: items,
    meta: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  }),
};
