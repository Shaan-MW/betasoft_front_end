"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  assignRolePermissions,
  currentUser,
  listPermissions,
  listRoles,
  type PermissionRecord,
  type RoleRecord,
} from "@/lib/admin-auth";

export default function AdminPermissionsPage() {
  const [roles, setRoles] = useState<RoleRecord[] | null>(null);
  const [allPermissions, setAllPermissions] = useState<PermissionRecord[]>([]);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [selectedRoleId, setSelectedRoleId] = useState<number | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");
  const [success, setSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const canView = permissions.includes("permissions.view");
  const canAssign = permissions.includes("permissions.assign");

  const selectedRole = useMemo(
    () => roles?.find((role) => role.id === selectedRoleId) ?? null,
    [roles, selectedRoleId],
  );

  const grouped = useMemo(() => {
    const groups = new Map<string, PermissionRecord[]>();
    for (const permission of allPermissions) {
      const prefix = permission.name.includes(".")
        ? permission.name.split(".")[0]
        : "other";
      const list = groups.get(prefix) ?? [];
      list.push(permission);
      groups.set(prefix, list);
    }
    return Array.from(groups.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [allPermissions]);

  async function refresh() {
    const [user, nextRoles, nextPermissions] = await Promise.all([
      currentUser(),
      listRoles(),
      listPermissions(),
    ]);
    setPermissions(user?.permissions ?? []);
    setRoles(nextRoles);
    setAllPermissions(nextPermissions);

    setSelectedRoleId((current) => {
      if (current && nextRoles.some((role) => role.id === current)) {
        return current;
      }
      return nextRoles[0]?.id ?? null;
    });
  }

  useEffect(() => {
    refresh()
      .then(() => setError(""))
      .catch((caught: unknown) => {
        setRoles([]);
        setError(caught instanceof Error ? caught.message : "Could not load permissions.");
      });
  }, []);

  useEffect(() => {
    if (!selectedRole) {
      setSelected([]);
      return;
    }
    setSelected(selectedRole.permissions);
    setFormError("");
    setSuccess("");
  }, [selectedRole]);

  function togglePermission(name: string) {
    setSelected((current) =>
      current.includes(name) ? current.filter((item) => item !== name) : [...current, name],
    );
  }

  function selectGroup(names: string[], checked: boolean) {
    setSelected((current) => {
      if (checked) {
        return Array.from(new Set([...current, ...names]));
      }
      return current.filter((item) => !names.includes(item));
    });
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedRole || !canAssign) return;

    setFormError("");
    setSuccess("");
    setSubmitting(true);

    try {
      await assignRolePermissions(selectedRole.id, selected);
      await refresh();
      setSuccess(`Permissions saved for “${selectedRole.name}”.`);
    } catch (caught) {
      setFormError(caught instanceof Error ? caught.message : "Could not assign permissions.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="w-full space-y-4 px-4 py-4">
      {error ? <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}

      <p className="text-sm text-[#5C6B61]">Choose a role and assign its permissions.</p>

      {roles === null ? (
        <p className="text-sm text-[#5C6B61]">Loading permissions...</p>
      ) : !canView ? (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          You do not have permission to view permissions.
        </p>
      ) : (
        <form
          onSubmit={onSubmit}
          className="space-y-4 rounded-2xl border border-[#E2E9E4] bg-white p-5 shadow-sm"
        >
          <label className="block text-sm font-semibold text-slate-700">
            Role
            <select
              value={selectedRoleId ?? ""}
              onChange={(event) => setSelectedRoleId(Number(event.target.value))}
              className="mt-1 w-full max-w-md rounded-lg border border-slate-300 bg-slate-50 px-3 py-2.5 text-sm font-medium focus:border-[#109e44] focus:outline-none focus:ring-2 focus:ring-[#109e44]"
            >
              {roles.map((role) => (
                <option key={role.id} value={role.id}>
                  {role.name}
                </option>
              ))}
            </select>
          </label>

          {formError ? (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{formError}</p>
          ) : null}
          {success ? (
            <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{success}</p>
          ) : null}

          <div className="space-y-4">
            {grouped.map(([group, items]) => {
              const names = items.map((item) => item.name);
              const allChecked = names.every((name) => selected.includes(name));
              return (
                <div key={group} className="rounded-xl border border-slate-200 p-4">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <h3 className="text-sm font-extrabold capitalize text-slate-900">{group}</h3>
                    <label className="flex cursor-pointer items-center gap-2 text-xs font-semibold text-slate-600">
                      <input
                        type="checkbox"
                        checked={allChecked}
                        disabled={!canAssign}
                        onChange={(event) => selectGroup(names, event.target.checked)}
                      />
                      Select all
                    </label>
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                    {items.map((permission) => (
                      <label
                        key={permission.id}
                        className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-100 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                      >
                        <input
                          type="checkbox"
                          checked={selected.includes(permission.name)}
                          disabled={!canAssign}
                          onChange={() => togglePermission(permission.name)}
                        />
                        <span className="font-medium">{permission.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {canAssign ? (
            <button
              type="submit"
              disabled={submitting || !selectedRole}
              className="cursor-pointer rounded-lg bg-[#109e44] px-4 py-2.5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-[#0d8539] disabled:opacity-60"
            >
              {submitting ? "Saving..." : "Save permissions"}
            </button>
          ) : null}
        </form>
      )}
    </div>
  );
}
