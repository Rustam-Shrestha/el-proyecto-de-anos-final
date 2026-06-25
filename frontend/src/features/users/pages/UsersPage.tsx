import { memo, useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@shared/components/Button";
import { useModal } from "@shared/hooks/useModal";
import UsersList from "@features/users/components/UsersList";
import UserFormModal from "@features/users/components/UserFormModal";

const UsersPage = memo(() => {
  const [selectedUserId, setSelectedUserId] = useState<string | undefined>();
  const createModal = useModal();
  const editModal = useModal();

  const openCreate = () => {
    setSelectedUserId(undefined);
    createModal.openModal();
  };

  const openEdit = (id: string) => {
    setSelectedUserId(id);
    editModal.openModal();
  };

  const handleModalClose = () => {
    createModal.closeModal();
    editModal.closeModal();
    setSelectedUserId(undefined);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 rounded-3xl border border-gray-200 bg-white p-6 shadow-sm   sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[var(--green-icon)]">
            User Management
          </p>
          <h2 className="mt-2 text-3xl font-semibold text-gray-900 ">
            Users
          </h2>
          <p className="mt-2 text-sm text-gray-500 ">
            Manage all registered users, roles, and permissions.
          </p>
        </div>

        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" />
          Add User
        </Button>
      </div>

      <UsersList onEdit={openEdit} />

      <UserFormModal
        isOpen={createModal.isOpen || editModal.isOpen}
        onClose={handleModalClose}
        userId={selectedUserId}
      />
    </div>
  );
});

UsersPage.displayName = "UsersPage";

export default UsersPage;
