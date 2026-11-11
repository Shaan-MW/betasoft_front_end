"use client";

import { FormEvent, useEffect, useState } from "react";
import {
  createRole,
  currentUser,
  deleteRole,
  listRoles,
  updateRole,
  type RoleRecord,
} from "@/lib/admin-auth";

const fieldClass =
  "mt-1 w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2.5 text-sm font-medium focus:border-[#109e44] focus:outline-none focus:ring-2 focus:ring-[#109e44]";

export default function AdminRolesPage() {
  const [roles, setRoles] = useState<RoleRecord[] | null>(null);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [name, setName] = useState("");
  const [nameLocked, setNameLocked] = useState(false);

  const canView = permissions.includes("roles.view");
  const canCreate = permissions.includes("roles.create");
  const canUpdate = permissions.includes("roles.update");
  const canDelete = permissions.includes("roles.delete");

  async function refresh() {
    const [user, nextRoles] = await Promise.all([currentUser(), listRoles()]);
    setPermissions(user?.permissions ?? []);
    setRoles(nextRoles);
  }

  useEffect(() => {
    refresh()
      .then(() => setError(""))
      .catch((caught: unknown) => {
        setRoles([]);
        setError(caught instanceof Error ? caught.message : "Could not load roles.");
      });
  }, []);

  function resetForm() {
    setFormOpen(false);
    setEditingId(null);
    setName("");
    setNameLocked(false);
    setFormError("");
  }

  function openCreate() {
    setEditingId(null);
    setName("");
    setNameLocked(false);
    setFormError("");
    setFormOpen(true);
  }

  function openEdit(role: RoleRecord) {
    setEditingId(role.id);
    setName(role.name);
    setNameLocked(role.protected);
    setFormError("");
    setFormOpen(true);
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError("");
    setSubmitting(true);

    try {
      if (editingId === null) {
        await createRole({ name: name.trim().toLowerCase() });
      } else {
        await updateRole(editingId, { name: name.trim().toLowerCase() });
      }
      await refresh();
      resetForm();
    } catch (caught) {
      setFormError(caught instanceof Error ? caught.message : "Save failed.");
    } finally {
      setSubmitting(false);
    }
  }

  async function onDelete(role: RoleRecord) {
    if (!canDelete || role.protected) return;
    if (!window.confirm(`Delete role “${role.name}”?`)) return;

    setError("");
    try {
      await deleteRole(role.id);
      if (editingId === role.id) resetForm();
      await refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not delete role.");
    }
  }

  return (
    <div className="w-full space-y-4 px-4 py-4">
      {error ? <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-[#5C6B61]">Create roles used for access control.</p>
        {canCreate ? (
          <button
            type="button"
            onClick={openCreate}
            className="cursor-pointer rounded-lg bg-[#f37021] px-4 py-2 text-sm font-bold text-white shadow-sm transition-colors hover:bg-[#e05f10]"
          >
            Add role
          </button>
        ) : null}
      </div>

      {formOpen ? (
        <form
          onSubmit={onSubmit}
          className="space-y-4 rounded-2xl border border-[#E2E9E4] bg-white p-5 shadow-sm"
        >
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-sm font-extrabold text-slate-900">
              {editingId === null ? "Create role" : "Edit role"}
            </h2>
            <button
              type="button"
              onClick={resetForm}
              className="cursor-pointer text-xs font-semibold text-slate-500 hover:text-slate-800"
            >
              Cancel
            </button>
          </div>

          {formError ? (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{formError}</p>
          ) : null}

          <label className="block text-sm font-semibold text-slate-700">
            Name
            <input
              type="text"
              required
              maxLength={125}
              value={name}
              disabled={nameLocked}
              onChange={(event) => setName(event.target.value)}
              placeholder="e.g. editor"
              className={`${fieldClass} disabled:cursor-not-allowed disabled:opacity-70`}
            />
          </label>

          <button
            type="submit"
            disabled={submitting || (editingId === null ? !canCreate : !canUpdate)}
            className="cursor-pointer rounded-lg bg-[#109e44] px-4 py-2.5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-[#0d8539] disabled:opacity-60"
          >
            {submitting ? "Saving..." : editingId === null ? "Create role" : "Save changes"}
          </button>
        </form>
      ) : null}

      {roles === null ? (
        <p className="text-sm text-[#5C6B61]">Loading roles...</p>
      ) : roles.length === 0 && !error ? (
        <div className="rounded-2xl border border-dashed border-[#E2E9E4] bg-white px-6 py-12 text-center text-sm text-[#5C6B61]">
          No roles yet.
        </div>
      ) : roles.length > 0 && canView ? (
        <div className="overflow-x-auto rounded-2xl border border-[#E2E9E4] bg-white shadow-sm">
          <table className="admin-table w-full text-left text-sm">
            <thead>
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Permissions</th>
                <th className="px-4 py-3">Users</th>
                {(canUpdate || canDelete) && <th className="px-4 py-3 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {roles.map((role) => (
                <tr key={role.id} className="admin-data-row">
                  <td className="px-4 py-3 font-semibold text-slate-900">
                    {role.name}
                    {role.protected ? (
                      <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase text-slate-500">
                        System
                      </span>
                    ) : null}
                  </td>
                  <td className="px-4 py-3 text-slate-600">{role.permissions.length}</td>
                  <td className="px-4 py-3 text-slate-600">{role.users_count}</td>
                  {(canUpdate || canDelete) && (
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        {canUpdate ? (
                          <button
                            type="button"
                            onClick={() => openEdit(role)}
                            className="cursor-pointer rounded-md border border-slate-200 px-2.5 py-1 text-xs font-bold text-slate-700 hover:bg-slate-50"
                          >
                            Edit
                          </button>
                        ) : null}
                        {canDelete && !role.protected ? (
                          <button
                            type="button"
                            onClick={() => onDelete(role)}
                            className="cursor-pointer rounded-md border border-red-200 px-2.5 py-1 text-xs font-bold text-red-700 hover:bg-red-50"
                          >
                            Delete
                          </button>
                        ) : null}
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  );
}
