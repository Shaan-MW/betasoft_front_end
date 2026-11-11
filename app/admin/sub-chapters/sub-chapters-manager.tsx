"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import {
  createSubChapter,
  currentUser,
  deleteSubChapter,
  listChapters,
  listSubChapters,
  updateSubChapter,
  type Chapter,
  type SubChapter,
} from "@/lib/admin-auth";

const fieldClass =
  "mt-1 w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2.5 text-sm font-medium focus:border-[#109e44] focus:outline-none focus:ring-2 focus:ring-[#109e44]";

export function SubChaptersManager() {
  const searchParams = useSearchParams();
  const chapterQuery = searchParams.get("chapter");
  const filterChapterId = chapterQuery && /^\d+$/.test(chapterQuery) ? Number(chapterQuery) : null;

  const [rows, setRows] = useState<SubChapter[] | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const [chapterId, setChapterId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [sortOrder, setSortOrder] = useState("1");
  const [thumbnail, setThumbnail] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);

  const canView = permissions.includes("sub_chapters.view");
  const canCreate = permissions.includes("sub_chapters.create");
  const canUpdate = permissions.includes("sub_chapters.update");
  const canDelete = permissions.includes("sub_chapters.delete");
  const canViewVideos = permissions.includes("sub_chapter_videos.view");
  const showActions = canUpdate || canDelete || canViewVideos;

  const filteredChapter = chapters.find((chapter) => chapter.id === filterChapterId) ?? null;

  async function refresh() {
    const [user, nextRows, nextChapters] = await Promise.all([
      currentUser(),
      listSubChapters(filterChapterId ?? undefined),
      listChapters(),
    ]);
    setPermissions(user?.permissions ?? []);
    setRows(nextRows);
    setChapters(nextChapters);
  }

  useEffect(() => {
    refresh()
      .then(() => setError(""))
      .catch((caught: unknown) => {
        setRows([]);
        setError(caught instanceof Error ? caught.message : "Could not load sub chapters.");
      });
  }, [filterChapterId]);

  useEffect(() => {
    if (!thumbnail) {
      return;
    }
    const preview = URL.createObjectURL(thumbnail);
    setThumbnailPreview(preview);
    return () => URL.revokeObjectURL(preview);
  }, [thumbnail]);

  function defaultChapterId() {
    if (filterChapterId) {
      return String(filterChapterId);
    }
    return chapters[0] ? String(chapters[0].id) : "";
  }

  function resetForm() {
    setFormOpen(false);
    setEditingId(null);
    setChapterId(defaultChapterId());
    setTitle("");
    setDescription("");
    setSortOrder("1");
    setThumbnail(null);
    setThumbnailPreview(null);
    setFormError("");
  }

  function openCreate() {
    setEditingId(null);
    setChapterId(defaultChapterId());
    setTitle("");
    setDescription("");
    setSortOrder("1");
    setThumbnail(null);
    setThumbnailPreview(null);
    setFormError("");
    setFormOpen(true);
  }

  function openEdit(row: SubChapter) {
    setEditingId(row.id);
    setChapterId(String(row.chapter_id));
    setTitle(row.title);
    setDescription(row.description ?? "");
    setSortOrder(String(row.sort_order));
    setThumbnail(null);
    setThumbnailPreview(row.thumbnail_url);
    setFormError("");
    setFormOpen(true);
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError("");

    if (!chapterId) {
      setFormError("Select a main chapter first.");
      return;
    }

    setSubmitting(true);

    const input = {
      chapter_id: Number(chapterId),
      title: title.trim(),
      description: description.trim() || undefined,
      thumbnail,
      ...(editingId !== null ? { sort_order: Number(sortOrder) } : {}),
    };

    try {
      if (editingId === null) {
        await createSubChapter(input);
      } else {
        await updateSubChapter(editingId, input);
      }
      await refresh();
      resetForm();
    } catch (caught) {
      setFormError(caught instanceof Error ? caught.message : "Save failed.");
    } finally {
      setSubmitting(false);
    }
  }

  async function onDelete(row: SubChapter) {
    if (!canDelete) return;
    if (!window.confirm(`Delete “${row.title}”?`)) return;

    setError("");
    try {
      await deleteSubChapter(row.id);
      if (editingId === row.id) resetForm();
      await refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not delete sub chapter.");
    }
  }

  return (
    <div className="w-full space-y-4 px-4 py-4">
      {error ? <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="text-sm text-[#5C6B61]">
          {filteredChapter ? (
            <p>
              Showing sub chapters in{" "}
              <span className="font-semibold text-slate-800">{filteredChapter.chapter_name}</span>.{" "}
              <Link href="/admin/sub-chapters" className="font-semibold text-[#109e44] hover:underline">
                Show all
              </Link>
            </p>
          ) : (
            <p>Add sections inside a main chapter. Sort order is set when you add one, and can be changed in edit.</p>
          )}
        </div>
        {canCreate ? (
          <button
            type="button"
            onClick={openCreate}
            className="cursor-pointer rounded-lg bg-[#f37021] px-4 py-2 text-sm font-bold text-white shadow-sm transition-colors hover:bg-[#e05f10]"
          >
            Add sub chapter
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
              {editingId === null ? "Create sub chapter" : "Edit sub chapter"}
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
            <label className="block text-sm font-semibold text-slate-700 md:col-span-2">
              Main chapter
              <select
                required
                value={chapterId}
                onChange={(event) => setChapterId(event.target.value)}
                className={fieldClass}
              >
                <option value="" disabled>
                  Select a chapter
                </option>
                {chapters.map((chapter) => (
                  <option key={chapter.id} value={chapter.id}>
                    {chapter.chapter_name}
                  </option>
                ))}
              </select>
            </label>

            <label className="block text-sm font-semibold text-slate-700 md:col-span-2">
              Title
              <input
                type="text"
                required
                maxLength={200}
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                className={fieldClass}
              />
            </label>

            <label className="block text-sm font-semibold text-slate-700 md:col-span-2">
              Description <span className="font-medium text-slate-400">(optional)</span>
              <textarea
                rows={3}
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                className={fieldClass}
              />
            </label>

            <label className="block text-sm font-semibold text-slate-700">
              Thumbnail <span className="font-medium text-slate-400">(optional)</span>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={(event) => setThumbnail(event.target.files?.[0] ?? null)}
                className={`${fieldClass} file:mr-3 file:rounded-md file:border-0 file:bg-[#109e44]/10 file:px-2 file:py-1 file:text-xs file:font-bold file:text-[#109e44]`}
              />
            </label>

            <div className="flex items-end">
              {thumbnailPreview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={thumbnailPreview}
                  alt=""
                  className="h-16 w-24 rounded-lg border border-slate-200 object-cover"
                />
              ) : (
                <p className="pb-2 text-xs text-slate-400">No thumbnail selected.</p>
              )}
            </div>

            {editingId !== null ? (
              <label className="block text-sm font-semibold text-slate-700">
                Sort order
                <input
                  type="number"
                  required
                  min="0"
                  step="1"
                  value={sortOrder}
                  onChange={(event) => setSortOrder(event.target.value)}
                  className={fieldClass}
                />
              </label>
            ) : (
              <p className="self-end text-sm text-[#5C6B61]">
                Sort order follows the order this sub chapter is added inside its chapter.
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={submitting || chapters.length === 0 || (editingId === null ? !canCreate : !canUpdate)}
            className="cursor-pointer rounded-lg bg-[#109e44] px-4 py-2.5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-[#0d8539] disabled:opacity-60"
          >
            {submitting ? "Saving..." : editingId === null ? "Create sub chapter" : "Save changes"}
          </button>
        </form>
      ) : null}

      {rows === null ? (
        <p className="text-sm text-[#5C6B61]">Loading sub chapters...</p>
      ) : rows.length === 0 && !error ? (
        <div className="rounded-2xl border border-dashed border-[#E2E9E4] bg-white px-6 py-12 text-center text-sm text-[#5C6B61]">
          No sub chapters yet.
        </div>
      ) : rows.length > 0 && canView ? (
        <div className="overflow-x-auto rounded-2xl border border-[#E2E9E4] bg-white shadow-sm">
          <table className="admin-table w-full text-left text-sm">
            <thead>
              <tr>
                <th className="px-4 py-3">Order</th>
                <th className="px-4 py-3">Title</th>
                <th className="px-4 py-3">Main chapter</th>
                {showActions && <th className="px-4 py-3 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="admin-data-row">
                  <td className="px-4 py-3 font-semibold text-slate-900">{row.sort_order}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {row.thumbnail_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={row.thumbnail_url}
                          alt=""
                          className="h-10 w-14 rounded-md border border-slate-200 object-cover"
                        />
                      ) : null}
                      <div>
                        <p className="font-semibold text-slate-900">{row.title}</p>
                        {row.description ? (
                          <p className="max-w-xs truncate text-xs text-slate-500">{row.description}</p>
                        ) : null}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{row.chapter_name ?? "—"}</td>
                  {showActions && (
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        {canViewVideos ? (
                          <Link
                            href={`/admin/sub-chapter-videos?sub_chapter=${row.id}`}
                            className="rounded-md border border-[#109e44]/30 px-2.5 py-1 text-xs font-bold text-[#109e44] hover:bg-[#109e44]/10"
                          >
                            Videos
                          </Link>
                        ) : null}
                        {canUpdate ? (
                          <button
                            type="button"
                            onClick={() => openEdit(row)}
                            className="cursor-pointer rounded-md border border-slate-200 px-2.5 py-1 text-xs font-bold text-slate-700 hover:bg-slate-50"
                          >
                            Edit
                          </button>
                        ) : null}
                        {canDelete ? (
                          <button
                            type="button"
                            onClick={() => onDelete(row)}
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
