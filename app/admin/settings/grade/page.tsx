"use client";

import { FormEvent, useEffect, useState } from "react";
import {
  createGrade,
  currentUser,
  deleteGrade,
  listGrades,
  updateGrade,
  type Grade,
} from "@/lib/admin-auth";

type FormMode = "create" | "edit";

const fieldClass =
  "mt-1 w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2.5 text-sm font-medium focus:border-[#109e44] focus:outline-none focus:ring-2 focus:ring-[#109e44]";

export default function AdminGradePage() {
  const [grades, setGrades] = useState<Grade[] | null>(null);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [mode, setMode] = useState<FormMode>("create");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [formOpen, setFormOpen] = useState(false);

  const canView = permissions.includes("grades.view");
  const canCreate = permissions.includes("grades.create");
  const canUpdate = permissions.includes("grades.update");
  const canDelete = permissions.includes("grades.delete");

  async function refresh() {
    const [user, nextGrades] = await Promise.all([currentUser(), listGrades()]);
    setPermissions(user?.permissions ?? []);
    setGrades(nextGrades);
  }

  useEffect(() => {
    refresh()
      .then(() => setError(""))
      .catch((caught: unknown) => {
        setGrades([]);
        setError(caught instanceof Error ? caught.message : "Could not load grades.");
      });
  }, []);

  function resetForm() {
    setMode("create");
    setEditingId(null);
    setTitle("");
    setSlug("");
    setDescription("");
    setFormError("");
    setFormOpen(false);
  }

  function openCreate() {
    setMode("create");
    setEditingId(null);
    setTitle("");
    setSlug("");
    setDescription("");
    setFormError("");
    setFormOpen(true);
  }

  function openEdit(grade: Grade) {
    setMode("edit");
    setEditingId(grade.id);
    setTitle(grade.title);
    setSlug(grade.slug);
    setDescription(grade.description ?? "");
    setFormError("");
    setFormOpen(true);
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError("");
    setSubmitting(true);

    const input = {
      title: title.trim(),
      slug: slug.trim() || undefined,
      description: description.trim() || undefined,
    };

    try {
      if (mode === "create") {
        await createGrade(input);
      } else if (editingId !== null) {
        await updateGrade(editingId, input);
      }
      await refresh();
      resetForm();
    } catch (caught) {
      setFormError(caught instanceof Error ? caught.message : "Save failed.");
    } finally {
      setSubmitting(false);
    }
  }

  async function onDelete(grade: Grade) {
    if (!canDelete) return;
    if (!window.confirm(`Delete “${grade.title}”? This cannot be undone.`)) return;

    setError("");
    try {
      await deleteGrade(grade.id);
      if (editingId === grade.id) resetForm();
      await refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not delete grade.");
    }
  }

  return (
    <div className="w-full space-y-4 px-4 py-4">
      {error ? <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-[#5C6B61]">Manage grade levels for chapters and courses.</p>
        {canCreate ? (
          <button
            type="button"
            onClick={openCreate}
            className="cursor-pointer rounded-lg bg-[#f37021] px-4 py-2 text-sm font-bold text-white shadow-sm transition-colors hover:bg-[#e05f10]"
          >
            Add grade
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
              {mode === "create" ? "Create grade" : "Edit grade"}
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
            Title
            <input
              type="text"
              required
              maxLength={150}
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              className={fieldClass}
            />
          </label>

          <label className="block text-sm font-semibold text-slate-700">
            Slug
            <input
              type="text"
              maxLength={160}
              value={slug}
              onChange={(event) => setSlug(event.target.value)}
              placeholder="Auto from title if left blank"
              className={fieldClass}
            />
          </label>

          <label className="block text-sm font-semibold text-slate-700">
            Description
            <textarea
              rows={3}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              className={fieldClass}
            />
          </label>

          <button
            type="submit"
            disabled={submitting || (mode === "create" ? !canCreate : !canUpdate)}
            className="cursor-pointer rounded-lg bg-[#109e44] px-4 py-2.5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-[#0d8539] disabled:opacity-60"
          >
            {submitting ? "Saving..." : mode === "create" ? "Create grade" : "Save changes"}
          </button>
        </form>
      ) : null}

      {grades === null ? (
        <p className="text-sm text-[#5C6B61]">Loading grades...</p>
      ) : !canView && grades.length === 0 && error ? null : grades.length === 0 && !error ? (
        <div className="rounded-2xl border border-dashed border-[#E2E9E4] bg-white px-6 py-12 text-center text-sm text-[#5C6B61]">
          No grades yet.
        </div>
      ) : grades.length > 0 ? (
        <div className="overflow-x-auto rounded-2xl border border-[#E2E9E4] bg-white shadow-sm">
          <table className="admin-table w-full text-left text-sm">
            <thead>
              <tr>
                <th className="px-4 py-3">Title</th>
                <th className="px-4 py-3">Slug</th>
                <th className="px-4 py-3">Description</th>
                {(canUpdate || canDelete) && <th className="px-4 py-3 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {grades.map((grade) => (
                <tr key={grade.id} className="admin-data-row">
                  <td className="px-4 py-3 font-semibold text-slate-900">{grade.title}</td>
                  <td className="px-4 py-3 text-slate-600">{grade.slug}</td>
                  <td className="max-w-xs truncate px-4 py-3 text-slate-600">
                    {grade.description || "—"}
                  </td>
                  {(canUpdate || canDelete) && (
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        {canUpdate ? (
                          <button
                            type="button"
                            onClick={() => openEdit(grade)}
                            className="cursor-pointer rounded-md border border-slate-200 px-2.5 py-1 text-xs font-bold text-slate-700 hover:bg-slate-50"
                          >
                            Edit
                          </button>
                        ) : null}
                        {canDelete ? (
                          <button
                            type="button"
                            onClick={() => onDelete(grade)}
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
