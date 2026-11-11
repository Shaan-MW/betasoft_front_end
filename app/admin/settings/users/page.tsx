"use client";

import { FormEvent, useEffect, useState } from "react";
import {
  createManagedUser,
  currentUser,
  deleteManagedUser,
  listManagedUsers,
  listRoles,
  updateManagedUser,
  type ManagedUser,
  type RoleRecord,
} from "@/lib/admin-auth";

const fieldClass =
  "mt-1 w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2.5 text-sm font-medium focus:border-[#109e44] focus:outline-none focus:ring-2 focus:ring-[#109e44]";

export default function AdminUsersSettingsPage() {
  const [users, setUsers] = useState<ManagedUser[] | null>(null);
  const [roles, setRoles] = useState<RoleRecord[]>([]);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [selfId, setSelfId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [status, setStatus] = useState<"active" | "blocked">("active");
  const [selectedRoles, setSelectedRoles] = useState<string[]>(["admin"]);

  const canView = permissions.includes("users.view");
  const canCreate = permissions.includes("users.create");
  const canUpdate = permissions.includes("users.update");
  const canDelete = permissions.includes("users.delete");

  async function refresh() {
    const [user, nextUsers, nextRoles] = await Promise.all([
      currentUser(),
      listManagedUsers(),
      listRoles(),
    ]);
    setPermissions(user?.permissions ?? []);
    setSelfId(user?.id ?? null);
    setUsers(nextUsers);
    setRoles(nextRoles);
  }

  useEffect(() => {
    refresh()
      .then(() => setError(""))
      .catch((caught: unknown) => {
        setUsers([]);
        setError(caught instanceof Error ? caught.message : "Could not load users.");
      });
  }, []);

  function resetForm() {
    setFormOpen(false);
    setEditingId(null);
    setName("");
    setEmail("");
    setPhone("");
    setPassword("");
    setPasswordConfirmation("");
    setStatus("active");
    setSelectedRoles(["admin"]);
    setFormError("");
  }

  function openCreate() {
    resetForm();
    setFormOpen(true);
  }

  function openEdit(user: ManagedUser) {
    setEditingId(user.id);
    setName(user.name);
    setEmail(user.email);
    setPhone(user.phone ?? "");
    setPassword("");
    setPasswordConfirmation("");
    setStatus(user.status);
    setSelectedRoles(user.roles.length > 0 ? user.roles : ["student"]);
    setFormError("");
    setFormOpen(true);
  }

  function toggleRole(roleName: string) {
    setSelectedRoles((current) =>
      current.includes(roleName)
        ? current.filter((item) => item !== roleName)
        : [...current, roleName],
    );
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError("");

    if (selectedRoles.length === 0) {
      setFormError("Select at least one role.");
      return;
    }

    if (editingId === null && password.length < 8) {
      setFormError("Password must be at least 8 characters.");
      return;
    }

    if (password && password !== passwordConfirmation) {
      setFormError("Password confirmation does not match.");
      return;
    }

    setSubmitting(true);

    const input = {
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.trim() || undefined,
      status,
      roles: selectedRoles,
      ...(password
        ? {
            password,
            password_confirmation: passwordConfirmation,
          }
        : {}),
    };

    try {
      if (editingId === null) {
        await createManagedUser({
          ...input,
          password,
          password_confirmation: passwordConfirmation,
        });
      } else {
        await updateManagedUser(editingId, input);
      }
      await refresh();
      resetForm();
    } catch (caught) {
      setFormError(caught instanceof Error ? caught.message : "Save failed.");
    } finally {
      setSubmitting(false);
    }
  }

  async function onDelete(user: ManagedUser) {
    if (!canDelete || user.id === selfId) return;
    if (!window.confirm(`Delete user “${user.email}”?`)) return;

    setError("");
    try {
      await deleteManagedUser(user.id);
      if (editingId === user.id) resetForm();
      await refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not delete user.");
    }
  }

  return (
    <div className="w-full space-y-4 px-4 py-4">
      {error ? <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-[#5C6B61]">Create users and assign roles.</p>
        {canCreate ? (
          <button
            type="button"
            onClick={openCreate}
            className="cursor-pointer rounded-lg bg-[#f37021] px-4 py-2 text-sm font-bold text-white shadow-sm transition-colors hover:bg-[#e05f10]"
          >
            Add user
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
              {editingId === null ? "Create user" : "Edit user"}
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

          <div className="grid gap-4 md:grid-cols-2">
            <label className="block text-sm font-semibold text-slate-700">
              Name
              <input
                type="text"
                required
                value={name}
                onChange={(event) => setName(event.target.value)}
                className={fieldClass}
              />
            </label>
            <label className="block text-sm font-semibold text-slate-700">
              Email
              <input
                type="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className={fieldClass}
              />
            </label>
            <label className="block text-sm font-semibold text-slate-700">
              Phone
              <input
                type="text"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                className={fieldClass}
              />
            </label>
            <label className="block text-sm font-semibold text-slate-700">
              Status
              <select
                value={status}
                onChange={(event) => setStatus(event.target.value as "active" | "blocked")}
                className={fieldClass}
              >
                <option value="active">Active</option>
                <option value="blocked">Blocked</option>
              </select>
            </label>
            <label className="block text-sm font-semibold text-slate-700">
              Password {editingId !== null ? "(optional)" : ""}
              <input
                type="password"
                required={editingId === null}
                autoComplete="new-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className={fieldClass}
              />
            </label>
            <label className="block text-sm font-semibold text-slate-700">
              Confirm password
              <input
                type="password"
                required={editingId === null || password.length > 0}
                autoComplete="new-password"
                value={passwordConfirmation}
                onChange={(event) => setPasswordConfirmation(event.target.value)}
                className={fieldClass}
              />
            </label>
          </div>

          <fieldset>
            <legend className="text-sm font-semibold text-slate-700">Roles</legend>
            <div className="mt-2 flex flex-wrap gap-2">
              {roles.map((role) => {
                const checked = selectedRoles.includes(role.name);
                return (
                  <label
                    key={role.id}
                    className={`cursor-pointer rounded-lg border px-3 py-1.5 text-xs font-bold ${
                      checked
                        ? "border-[#109e44] bg-[#109e44]/10 text-[#109e44]"
                        : "border-slate-200 bg-white text-slate-600"
                    }`}
                  >
                    <input
                      type="checkbox"
                      className="sr-only"
                      checked={checked}
                      onChange={() => toggleRole(role.name)}
                    />
                    {role.name}
                  </label>
                );
              })}
            </div>
          </fieldset>

          <button
            type="submit"
            disabled={submitting || (editingId === null ? !canCreate : !canUpdate)}
            className="cursor-pointer rounded-lg bg-[#109e44] px-4 py-2.5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-[#0d8539] disabled:opacity-60"
          >
            {submitting ? "Saving..." : editingId === null ? "Create user" : "Save changes"}
          </button>
        </form>
      ) : null}

      {users === null ? (
        <p className="text-sm text-[#5C6B61]">Loading users...</p>
      ) : users.length === 0 && !error ? (
        <div className="rounded-2xl border border-dashed border-[#E2E9E4] bg-white px-6 py-12 text-center text-sm text-[#5C6B61]">
          No users yet.
        </div>
      ) : users.length > 0 && canView ? (
        <div className="overflow-x-auto rounded-2xl border border-[#E2E9E4] bg-white shadow-sm">
          <table className="admin-table w-full text-left text-sm">
            <thead>
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Roles</th>
                <th className="px-4 py-3">Status</th>
                {(canUpdate || canDelete) && <th className="px-4 py-3 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="admin-data-row">
                  <td className="px-4 py-3 font-semibold text-slate-900">{user.name}</td>
                  <td className="px-4 py-3 text-slate-600">{user.email}</td>
                  <td className="px-4 py-3 text-slate-600">{user.roles.join(", ") || "—"}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-bold uppercase ${
                        user.status === "active"
                          ? "bg-[#109e44]/10 text-[#109e44]"
                          : "bg-red-50 text-red-700"
                      }`}
                    >
                      {user.status}
                    </span>
                  </td>
                  {(canUpdate || canDelete) && (
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        {canUpdate ? (
                          <button
                            type="button"
                            onClick={() => openEdit(user)}
                            className="cursor-pointer rounded-md border border-slate-200 px-2.5 py-1 text-xs font-bold text-slate-700 hover:bg-slate-50"
                          >
                            Edit
                          </button>
                        ) : null}
                        {canDelete && user.id !== selfId ? (
                          <button
                            type="button"
                            onClick={() => onDelete(user)}
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
