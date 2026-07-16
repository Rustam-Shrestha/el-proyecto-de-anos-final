export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export const paginate = (query: Record<string, unknown>): { skip: number; take: number; page: number; limit: number } => {
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(query.limit) || 10));
  const skip = (page - 1) * limit;

  return { skip, take: limit, page, limit };
};

export const paginationMeta = (total: number, limit: number, page: number): PaginationMeta => ({
  page,
  limit,
  total,
  pages: Math.ceil(total / limit),
});
