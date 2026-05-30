import { memo, useMemo, useState } from "react";
import { AlertCircle, ChevronLeft, ChevronRight, PencilLine, RefreshCcw, Trash2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { SkeletonLoader } from "@shared/components/SkeletonLoader";
import { useUsersList } from "@features/users/hooks/useUsersList";
import { Modal } from "@shared/components/Modal";
import { Button } from "@components/Button";
import { useToast } from "@hooks/useToast";
import { UserFormModal } from "@features/users/components/UserFormModal";
import { useDeleteUserMutation, type User } from "@features/users/api/usersApi";
import useAuth from "@hooks/useAuth";

const formatCreatedDate = (value?: string) => {
  if (!value) {
    return "--";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "--";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
};

const UsersList = () => {
  const { users, isLoading, error, pagination, refetch } = useUsersList();
  const { userData, isSuperUser } = useAuth();
  const toast = useToast();
  const queryClient = useQueryClient();
  const deleteMutation = useDeleteUserMutation();
  const [selectedUser, setSelectedUser] = useState<User | undefined>();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);

  const canManageUsers = useMemo(
    () => Boolean(isSuperUser || userData?.role === "admin"),
    [isSuperUser, userData?.role]
  );

  const openCreateModal = () => {
    setSelectedUser(undefined);
    setIsFormOpen(true);
  };

  const openEditModal = (user: User) => {
    setSelectedUser(user);
    setIsFormOpen(true);
  };

  const closeFormModal = () => {
    setIsFormOpen(false);
    setSelectedUser(undefined);
  };

  const handleFormSuccess = async () => {
    await queryClient.invalidateQueries({ queryKey: ["users"] });
    await refetch();
  };

  const handleDelete = async () => {
    if (!userToDelete?.id) {
      return;
    }

    try {
      await deleteMutation.mutateAsync(userToDelete.id);
      toast.success("User deleted successfully");
      setUserToDelete(null);
      await queryClient.invalidateQueries({ queryKey: ["users"] });
      await refetch();
    } catch (mutationError) {
      const apiError = mutationError as { response?: { status?: number; data?: { message?: string } } };
      if (apiError.response?.status === 403) {
        toast.error("You don't have permission");
      } else {
        toast.error(apiError.response?.data?.message || "Unable to delete user");
      }
    }
  };

  if (isLoading) {
    return <SkeletonLoader count={6} type="table" />;
  }

  if (error) {
    return (
      <div className="rounded-3xl border border-red-200 bg-red-50 p-6 text-red-800 dark:border-red-900/40 dark:bg-red-950/40 dark:text-red-200">
        <div className="flex items-start gap-3">
          <AlertCircle className="mt-0.5 h-5 w-5" />
          <div className="flex-1">
            <h3 className="text-sm font-semibold">Failed to load users</h3>
            <p className="mt-1 text-sm opacity-90">Please try again.</p>
            <button
              type="button"
              onClick={() => refetch()}
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700"
            >
              <RefreshCcw className="h-4 w-4" />
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!users.length) {
    return (
      <div className="rounded-3xl border border-dashed border-gray-300 bg-white p-10 text-center text-gray-500 shadow-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-400">
        <p className="text-base font-medium text-gray-900 dark:text-gray-100">No users found</p>
        <p className="mt-2 text-sm">Try a different page or refresh later.</p>
        {canManageUsers ? (
          <div className="mt-6">
            <Button onClick={openCreateModal}>Create User</Button>
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
      <div className="flex flex-col gap-3 border-b border-gray-200 px-4 py-4 sm:flex-row sm:items-center sm:justify-between dark:border-gray-800">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[var(--green-icon)]">Users</p>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Browse and manage the user directory.</p>
        </div>
        {canManageUsers ? (
          <Button onClick={openCreateModal}>Create User</Button>
        ) : null}
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
          <thead className="bg-gray-50 dark:bg-gray-950/60">
            <tr>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-200">Email</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-200">Role</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-200">Created Date</th>
              {canManageUsers ? (
                <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700 dark:text-gray-200">Actions</th>
              ) : null}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {users.map((user) => (
              <tr key={user.id} className="transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/60">
                <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100">{user.email}</td>
                <td className="px-6 py-4 text-sm capitalize text-gray-600 dark:text-gray-300">{user.role}</td>
                <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                  {formatCreatedDate(user.createdAt ?? user.created_at)}
                </td>
                {canManageUsers ? (
                  <td className="px-6 py-4">
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => openEditModal(user)}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-blue-200 text-blue-600 transition-colors hover:bg-blue-50 dark:border-blue-900/40 dark:text-blue-300 dark:hover:bg-blue-950/40"
                        aria-label={`Edit ${user.email}`}
                      >
                        <PencilLine className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setUserToDelete(user)}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-red-200 text-red-600 transition-colors hover:bg-red-50 dark:border-red-900/40 dark:text-red-300 dark:hover:bg-red-950/40"
                        aria-label={`Delete ${user.email}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                ) : null}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col gap-3 border-t border-gray-200 px-4 py-4 sm:flex-row sm:items-center sm:justify-between dark:border-gray-800">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Page {pagination.page} of {pagination.totalPages}
        </p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={pagination.goToPreviousPage}
            disabled={!pagination.canGoPrevious}
            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </button>
          <button
            type="button"
            onClick={pagination.goToNextPage}
            disabled={!pagination.canGoNext}
            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <UserFormModal
        isOpen={isFormOpen}
        onClose={closeFormModal}
        user={selectedUser}
        onSuccess={handleFormSuccess}
      />

      <Modal
        isOpen={Boolean(userToDelete)}
        onClose={() => setUserToDelete(null)}
        title="Delete User"
      >
        <div className="space-y-5">
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Are you sure you want to delete {userToDelete?.email}? This action cannot be undone.
          </p>

          <div className="flex items-center justify-end gap-3">
            <Button variant="ghost" type="button" onClick={() => setUserToDelete(null)}>
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
    </div>
  );
};

export default memo(UsersList);