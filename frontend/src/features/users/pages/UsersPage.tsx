import { memo, useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@shared/components/Button";
import { useModal } from "@shared/hooks/useModal";
import UsersList from "@features/users/components/UsersList";
import UserFormModal from "@features/users/components/UserFormModal";
import PageHeader from "@shared/components/PageHeader";
import Card from "@shared/components/Card";

const UsersPage = memo(() => {
  const [selectedUserId, setSelectedUserId] = useState<string | undefined>();
  const createModal = useModal();
  const editModal = useModal();
  const openCreate = () => { setSelectedUserId(undefined); createModal.openModal(); };
  const openEdit = (id: string) => { setSelectedUserId(id); editModal.openModal(); };
  const handleModalClose = () => { createModal.closeModal(); editModal.closeModal(); setSelectedUserId(undefined); };
  return (
    <div className="space-y-6">
      <Card>
        <PageHeader
          label="User Management"
          title="Users"
          description="Manage all registered users, roles, and permissions."
          actions={<Button onClick={openCreate}><Plus className="h-4 w-4" />Add User</Button>}
        />
      </Card>
      <UsersList onEdit={openEdit} />
      <UserFormModal isOpen={createModal.isOpen || editModal.isOpen} onClose={handleModalClose} userId={selectedUserId} />
    </div>
  );
});
UsersPage.displayName = "UsersPage";
export default UsersPage;
