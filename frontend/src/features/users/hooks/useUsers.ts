import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createUser, listUsers } from "@features/users/api/usersApi";

export const useUsers = (page: number, limit = 10) => {
  return useQuery({
    queryKey: ["users", page, limit],
    queryFn: () => listUsers(page, limit)
  });
};

export const useCreateUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    }
  });
};
