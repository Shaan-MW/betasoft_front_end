"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import {
  chapterSlug,
  createChapter,
  currentUser,
  deleteChapter,
  listChapters,
  listGrades,
  updateChapter,
  type Chapter,
  type Grade,
} from "@/lib/admin-auth";

const fieldClass =
  "mt-1 w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2.5 text-sm font-medium focus:border-[#109e44] focus:outline-none focus:ring-2 focus:ring-[#109e44]";

function money(value: string) {
  const amount = Number(value);
  return Number.isFinite(amount) ? amount.toFixed(2) : "0.00";
}

export default function AdminChaptersPage() {
  const [chapters, setChapters] = useState<Chapter[] | null>(null);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const [gradeId, setGradeId] = useState("");
  const [chapterName, setChapterName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [price, setPrice] = useState("0.00");
  const [isPublished, setIsPublished] = useState(false);
  const [sortOrder, setSortOrder] = useState("1");
  const [thumbnail, setThumbnail] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);

  const canView = permissions.includes("chapters.view");
  const canCreate = permissions.includes("chapters.create");
  const canUpdate = permissions.includes("chapters.update");
  const canDelete = permissions.includes("chapters.delete");
  const canViewSub = permissions.includes("sub_chapters.view");
  const showActions = canUpdate || canDelete || canViewSub;

  async function refresh() {
    const [user, nextChapters, nextGrades] = await Promise.all([
      currentUser(),
      listChapters(),
      listGrades(),
    ]);
    setPermissions(user?.permissions ?? []);
    setChapters(nextChapters);
    setGrades(nextGrades);
  }

  useEffect(() => {
    refresh()
      .then(() => setError(""))
      .catch((caught: unknown) => {
        setChapters([]);
        setError(caught instanceof Error ? caught.message : "Could not load chapters.");
      });
  }, []);

  useEffect(() => {
    if (!thumbnail) {
      return;
    }
    const preview = URL.createObjectURL(thumbnail);
    setThumbnailPreview(preview);
    return () => URL.revokeObjectURL(preview);
  }, [thumbnail]);

  function resetForm() {
    setFormOpen(false);
    setEditingId(null);
    setGradeId(grades[0] ? String(grades[0].id) : "");
    setChapterName("");
    setSlug("");
    setDescription("");
    setVideoUrl("");
    setPrice("0.00");
    setIsPublished(false);
    setSortOrder("1");
    setThumbnail(null);
    setThumbnailPreview(null);
    setFormError("");
  }

  function openCreate() {
    setEditingId(null);
    setGradeId(grades[0] ? String(grades[0].id) : "");
    setChapterName("");
    setSlug("");
    setDescription("");
    setVideoUrl("");
    setPrice("0.00");
    setIsPublished(false);
    setSortOrder("1");
    setThumbnail(null);
    setThumbnailPreview(null);
    setFormError("");
    setFormOpen(true);
  }

  function openEdit(chapter: Chapter) {
    setEditingId(chapter.id);
    setGradeId(String(chapter.grade_id));
    setChapterName(chapter.chapter_name);
    setSlug(chapter.slug);
    setDescription(chapter.description ?? "");
    setVideoUrl(chapter.video_url);
    setPrice(money(chapter.price));
    setIsPublished(chapter.is_published);
    setSortOrder(String(chapter.sort_order));
    setThumbnail(null);
    setThumbnailPreview(chapter.thumbnail_url);
    setFormError("");
    setFormOpen(true);
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError("");

    const amount = Number(price);
    if (!Number.isFinite(amount) || amount < 0) {
      setFormError("Enter a valid price.");
      return;
    }

    if (!gradeId) {
      setFormError("Select a grade first.");
      return;
    }

    setSubmitting(true);

    const input = {
      grade_id: Number(gradeId),
      chapter_name: chapterName.trim(),
      description: description.trim() || undefined,
      video_url: videoUrl.trim(),
      price: amount.toFixed(2),
      is_published: isPublished,
      thumbnail,
      ...(editingId !== null ? { sort_order: Number(sortOrder) } : {}),
    };

    try {
      if (editingId === null) {
        await createChapter(input);
      } else {
        await updateChapter(editingId, input);
      }
      await refresh();
      resetForm();
    } catch (caught) {
      setFormError(caught instanceof Error ? caught.message : "Save failed.");
    } finally {
      setSubmitting(false);
    }
  }

  async function onDelete(chapter: Chapter) {
    if (!canDelete) return;
    if (!window.confirm(`Delete “${chapter.chapter_name}”?`)) return;

    setError("");
    try {
      await deleteChapter(chapter.id);
      if (editingId === chapter.id) resetForm();
      await refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not delete chapter.");
    }
  }

  return (
    <div className="w-full space-y-4 px-4 py-4">
      {error ? <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-[#5C6B61]">Add chapters for a grade, then reorder them from edit.</p>
        {canCreate ? (
          <button
            type="button"
            onClick={openCreate}
            className="cursor-pointer rounded-lg bg-[#f37021] px-4 py-2 text-sm font-bold text-white shadow-sm transition-colors hover:bg-[#e05f10]"
          >
            Add chapter
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
              {editingId === null ? "Create chapter" : "Edit chapter"}
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
              Grade
              <select
                required
                value={gradeId}
                onChange={(event) => setGradeId(event.target.value)}
                className={fieldClass}
              >
                <option value="" disabled>
                  Select a grade
                </option>
                {grades.map((grade) => (
                  <option key={grade.id} value={grade.id}>
                    {grade.title}
                  </option>
                ))}
              </select>
            </label>

            <label className="block text-sm font-semibold text-slate-700">
              Chapter name
              <input
                type="text"
                required
                maxLength={200}
                value={chapterName}
                onChange={(event) => {
                  const next = event.target.value;
                  setChapterName(next);
                  setSlug(chapterSlug(next));
                }}
                className={fieldClass}
              />
            </label>

            <label className="block text-sm font-semibold text-slate-700 md:col-span-2">
              Slug
              <input
                type="text"
                readOnly
                value={slug}
                placeholder="Updates as you type the name"
                className={`${fieldClass} text-slate-500`}
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

            <label className="block text-sm font-semibold text-slate-700 md:col-span-2">
              Preview video
              <input
                type="url"
                required
                value={videoUrl}
                onChange={(event) => setVideoUrl(event.target.value)}
                placeholder="https://..."
                className={fieldClass}
              />
            </label>

            <label className="block text-sm font-semibold text-slate-700">
              Price
              <input
                type="number"
                required
                min="0"
                step="0.01"
                value={price}
                onChange={(event) => setPrice(event.target.value)}
                onBlur={() => {
                  const amount = Number(price);
                  if (Number.isFinite(amount) && amount >= 0) {
                    setPrice(amount.toFixed(2));
                  }
                }}
                className={fieldClass}
              />
            </label>

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
                Sort order is set from the order this chapter is added.
              </p>
            )}
          </div>

          <label className="flex cursor-pointer items-center gap-2 text-sm font-semibold text-slate-700">
            <input
              type="checkbox"
              checked={isPublished}
              onChange={(event) => setIsPublished(event.target.checked)}
            />
            Published
          </label>

          <button
            type="submit"
            disabled={submitting || grades.length === 0 || (editingId === null ? !canCreate : !canUpdate)}
            className="cursor-pointer rounded-lg bg-[#109e44] px-4 py-2.5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-[#0d8539] disabled:opacity-60"
          >
            {submitting ? "Saving..." : editingId === null ? "Create chapter" : "Save changes"}
          </button>
        </form>
      ) : null}

      {chapters === null ? (
        <p className="text-sm text-[#5C6B61]">Loading chapters...</p>
      ) : chapters.length === 0 && !error ? (
        <div className="rounded-2xl border border-dashed border-[#E2E9E4] bg-white px-6 py-12 text-center text-sm text-[#5C6B61]">
          No chapters yet.
        </div>
      ) : chapters.length > 0 && canView ? (
        <div className="overflow-x-auto rounded-2xl border border-[#E2E9E4] bg-white shadow-sm">
          <table className="admin-table w-full text-left text-sm">
            <thead>
              <tr>
                <th className="px-4 py-3">Order</th>
                <th className="px-4 py-3">Chapter</th>
                <th className="px-4 py-3">Grade</th>
                <th className="px-4 py-3">Price</th>
                <th className="px-4 py-3">Published</th>
                {showActions && <th className="px-4 py-3 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {chapters.map((chapter) => (
                <tr key={chapter.id} className="admin-data-row">
                  <td className="px-4 py-3 font-semibold text-slate-900">{chapter.sort_order}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {chapter.thumbnail_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={chapter.thumbnail_url}
                          alt=""
                          className="h-10 w-14 rounded-md border border-slate-200 object-cover"
                        />
                      ) : null}
                      <div>
                        <p className="font-semibold text-slate-900">{chapter.chapter_name}</p>
                        <p className="text-xs text-slate-500">{chapter.slug}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{chapter.grade_name ?? "—"}</td>
                  <td className="px-4 py-3 tabular-nums text-slate-600">{money(chapter.price)}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-bold uppercase ${
                        chapter.is_published
                          ? "bg-[#109e44]/10 text-[#109e44]"
                          : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {chapter.is_published ? "Yes" : "No"}
                    </span>
                  </td>
                  {showActions && (
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        {canViewSub ? (
                          <Link
                            href={`/admin/sub-chapters?chapter=${chapter.id}`}
                            className="rounded-md border border-[#109e44]/30 px-2.5 py-1 text-xs font-bold text-[#109e44] hover:bg-[#109e44]/10"
                          >
                            Sub chapters
                          </Link>
                        ) : null}
                        {canUpdate ? (
                          <button
                            type="button"
                            onClick={() => openEdit(chapter)}
                            className="cursor-pointer rounded-md border border-slate-200 px-2.5 py-1 text-xs font-bold text-slate-700 hover:bg-slate-50"
                          >
                            Edit
                          </button>
                        ) : null}
                        {canDelete ? (
                          <button
                            type="button"
                            onClick={() => onDelete(chapter)}
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
