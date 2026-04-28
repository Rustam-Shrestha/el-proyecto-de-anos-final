// @ts-nocheck
/**
 * useApiQuery Hook
 * 
 * Wraps TanStack Query (React Query) around the existing apiService.
 * Replaces the HOC pattern `withApiCall` for data fetching with a hook-based approach.
 * 
 * Benefits:
 * - Automatic caching and deduplication of requests
 * - Built-in loading/error states
 * - Automatic refetch on window focus (configurable)
 * - No more prop drilling of `executeApiCall`, `loading`, `error`, `data`
 * 
 * Usage (GET):
 *   const { data, isLoading, error, refetch } = useApiQuery(
 *     ['todos', filters],
 *     '/todos',
 *     { enabled: !!userId }
 *   );
 * 
 * Usage (Mutation — POST/PUT/DELETE):
 *   const { mutate, isPending } = useApiMutation('/todos', 'post');
 *   mutate({ payload: formData }, { onSuccess: () => ... });
 * 
 * Usage (Dynamic URL — for delete actions, comment replies, etc.):
 *   const { mutate, isPending } = useApiMutation();
 *   mutate({ url: '/comment/123', method: 'delete' });
 */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiService } from "../services/apiService";

/**
 * Hook for GET requests with caching via TanStack Query.
 * 
 * @param {string|Array} queryKey - Unique key for cache (string or array)
 * @param {string} url - API endpoint
 * @param {object} options - TanStack Query options (enabled, staleTime, etc.)
 */
export const useApiQuery = (queryKey, url, options = {}) => {
  return useQuery({
    queryKey: Array.isArray(queryKey) ? queryKey : [queryKey],
    queryFn: async () => {
      const response = await apiService.get(url);
      // The API wraps every response body in { data: { ... } }.
      // Unwrap that outer envelope so callers can access .results, .count, etc. directly.
      // Fall back to response.data itself for endpoints that don't use the wrapper.
      return response?.data?.data ?? response?.data;
    },
    // Default: keep data fresh for 30 seconds
    staleTime: 30 * 1000,
    ...options,
  });
};

/**
 * Hook for mutations (POST, PUT, PATCH, DELETE) via TanStack Query.
 * 
 * Supports both fixed and dynamic URL/method patterns:
 *   Fixed:   useApiMutation('/todos', 'post')  → mutate({ payload })
 *   Dynamic: useApiMutation()                  → mutate({ url, method, payload, headers })
 * 
 * @param {string} [defaultUrl] - Default API endpoint (can be overridden per call)
 * @param {string} [defaultMethod='post'] - Default HTTP method
 * @param {object} [options] - TanStack Query mutation options + invalidateKeys
 */
export const useApiMutation = (defaultUrl, defaultMethod = "post", options = {}) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (callConfig = {}) => {
      const {
        url = defaultUrl,
        method = defaultMethod,
        payload,
        headers,
      } = callConfig;

      const config = headers ? { headers } : {};
      let response;

      if (method === "delete" || method === "get") {
        // delete & get: apiService[method](url, config) — only 2 args
        // If a payload is needed (rare for DELETE), pass it via config.data
        if (payload) config.data = payload;
        response = await apiService[method](url, config);
      } else {
        // post, put, patch: apiService[method](url, data, config) — 3 args
        response = await apiService[method](url, payload, config);
      }

      return response?.data?.data ?? response?.data;
    },
    // Invalidate relevant queries on success if specified
    onSuccess: (data, variables, context) => {
      if (options.invalidateKeys) {
        options.invalidateKeys.forEach((key) => {
          queryClient.invalidateQueries({ queryKey: Array.isArray(key) ? key : [key] });
        });
      }
      options.onSuccess?.(data, variables, context);
    },
    onError: options.onError,
    ...options,
  });
};
