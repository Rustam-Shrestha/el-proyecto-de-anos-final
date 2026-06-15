import { Modal } from "@shared/components/Modal";
import { Button } from "@shared/components/Button";
import { useToast } from "@shared/hooks/useToast";
import { useDeleteUserMutation } from "@features/users/api/usersApi";
import { useQueryClient } from "@tanstack/react-query";
import { userKeys } from "@features/users/api/usersApi";
import type { User } from "@shared/types/common";

type DeleteUserModalProps = {
  isOpen: boolean;
  user: User | null;
  onSuccess: () => void;
  onCancel: () => void;
};

export const DeleteUserModal = ({
  isOpen,
  user,
  onSuccess,
  onCancel,
}: DeleteUserModalProps) => {
  const toast = useToast();
  const queryClient = useQueryClient();
  const deleteMutation = useDeleteUserMutation();

  const handleDelete = async () => {
    if (!user?.id) return;

    try {
      await deleteMutation.mutateAsync(user.id);
      toast.success("User deleted successfully");
      queryClient.invalidateQueries({ queryKey: userKeys.all });
      onSuccess();
    } catch (error) {
      const apiError = error as {
        response?: { status?: number; data?: { message?: string } };
      };
      if (apiError.response?.status === 403) {
        toast.error("You don't have permission to delete users");
      } else {
        toast.error(
          apiError.response?.data?.message || "Unable to delete user"
        );
      }
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onCancel} title="Delete User">
      <div className="space-y-5">
        <p className="text-sm text-gray-600 dark:text-gray-300">
          Are you sure you want to delete{" "}
          <span className="font-semibold text-gray-900 dark:text-gray-100">
            {user?.email}
          </span>
          ? This action cannot be undone.
        </p>

        <div className="flex items-center justify-end gap-3">
          <Button variant="ghost" type="button" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            variant="danger"
            type="button"
            isLoading={deleteMutation.isPending}
            onClick={handleDelete}
          >
            Delete
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default DeleteUserModal;
