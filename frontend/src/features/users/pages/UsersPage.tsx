import { memo, useState } from "react";
import { useCreateUser, useUsers } from "@features/users/hooks/useUsers";
import { Modal } from "@shared/components/Modal/Modal";
import { useModal } from "@shared/hooks/useModal";

const UsersPage = () => {
  const [page] = useState(1);
  const usersQuery = useUsers(page, 10);
  const createUserMutation = useCreateUser();
  const { isOpen, openModal, closeModal } = useModal();

  const handleCreate = async () => {
    await createUserMutation.mutateAsync({
      email: `user${Date.now()}@example.com`,
      role: "staff"
    });
    closeModal();
  };

  return (
    <section className="panel">
      <div className="panel-head">
        <h2>User Management</h2>
        <button data-testid="open-user-modal" onClick={openModal} type="button">
          New User
        </button>
      </div>

      {usersQuery.isLoading && <p>Loading users...</p>}
      {usersQuery.error && <p>Failed to load users.</p>}

      <ul data-testid="users-list" className="list">
        {usersQuery.data?.data.map((user) => (
          <li key={user.id} className="list-item">
            <span>{user.email}</span>
            <span>{user.role}</span>
          </li>
        ))}
      </ul>

      <Modal open={isOpen} onClose={closeModal} title="Create User">
        <p>Create a sample user record to verify CRUD baseline.</p>
        <button data-testid="submit-user-create" onClick={handleCreate} type="button">
          Save
        </button>
      </Modal>
    </section>
  );
};

export default memo(UsersPage);
