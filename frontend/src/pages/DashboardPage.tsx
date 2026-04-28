// @ts-nocheck
import { memo, useMemo, useState, type ChangeEvent } from "react";
import { Link } from "react-router-dom";
import InputField from "@components/common/InputField";
import Modal from "@components/common/Modal";
import { PrimaryButton } from "@components/common/Button";
import TableView from "@components/common/TableView";

const DashboardPage = () => {
  const [showModal, setShowModal] = useState(false);
  const [query, setQuery] = useState<string>("");

  const rows = useMemo(
    () => [
      { id: 1, name: "Admin User", email: "admin@example.com", role: "admin" },
      { id: 2, name: "Manager User", email: "manager@example.com", role: "manager" },
      { id: 3, name: "Staff User", email: "staff@example.com", role: "staff" }
    ],
    []
  );

  const filteredRows = rows.filter((row) => {
    const text = query.toLowerCase();
    return row.name.toLowerCase().includes(text) || row.email.toLowerCase().includes(text);
  });

  return (
    <section className="panel bg-[var(--surface-color)] text-[var(--text-color)]">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-primary text-xl font-semibold">ERP Dashboard</h2>
        <div className="flex items-center gap-2">
          <Link to="/app/user-access" className="text-sm underline text-primary">
            User Access
          </Link>
          <PrimaryButton label="Add User" onClick={() => setShowModal(true)} />
        </div>
      </div>

      <div className="mb-4">
        <InputField
          name="search"
          label="Search"
          placeholder="Search by name or email"
          value={query}
          onChange={(event: ChangeEvent<HTMLInputElement>) => setQuery(event.target.value)}
        />
      </div>

      <TableView
        columns={[
          { accessor: "id", label: "#", width: 2 },
          { accessor: "name", label: "Name", width: 8 },
          { accessor: "email", label: "Email", width: 8 },
          { accessor: "role", label: "Role", width: 6 }
        ]}
        rows={filteredRows}
        totalCount={filteredRows.length}
        currentPage={1}
        pageSize={10}
        onPageChange={() => {}}
        onFilterChange={() => {}}
        loading={false}
      />

      {showModal && (
        <Modal title="Create ERP User" size="md" onClose={() => setShowModal(false)}>
          <div className="grid gap-3">
            <InputField name="name" label="Name" placeholder="Full name" value="" onChange={() => {}} />
            <InputField name="email" label="Email" placeholder="Email" value="" onChange={() => {}} />
            <div className="flex justify-end">
              <PrimaryButton label="Save" onClick={() => setShowModal(false)} />
            </div>
          </div>
        </Modal>
      )}
    </section>
  );
};

export default memo(DashboardPage);
