"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { Play, X } from "lucide-react";
import {
  createSubChapterVideo,
  currentUser,
  deleteSubChapterVideo,
  listSubChapters,
  listSubChapterVideos,
  updateSubChapterVideo,
  type SubChapter,
  type SubChapterVideo,
} from "@/lib/admin-auth";
import { youtubeEmbedUrl } from "@/lib/learn";

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

const fieldClass =
  "mt-1 w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2.5 text-sm font-medium focus:border-[#109e44] focus:outline-none focus:ring-2 focus:ring-[#109e44]";

function formatDuration(seconds: number | null) {
  if (seconds === null || seconds < 0) return "—";
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${String(secs).padStart(2, "0")}`;
}

function mediaUrl(path: string) {
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  return `${apiUrl}${path.startsWith("/") ? path : `/${path}`}`;
}

function previewEmbedUrl(path: string) {
  const youtube = youtubeEmbedUrl(path);
  if (!youtube) return null;
  const joiner = youtube.includes("?") ? "&" : "?";
  return `${youtube}${joiner}autoplay=1&rel=0`;
}

export function VideosManager() {
  const searchParams = useSearchParams();
  const subChapterQuery = searchParams.get("sub_chapter");
  const filterSubChapterId =
    subChapterQuery && /^\d+$/.test(subChapterQuery) ? Number(subChapterQuery) : null;

  const [rows, setRows] = useState<SubChapterVideo[] | null>(null);
  const [subChapters, setSubChapters] = useState<SubChapter[]>([]);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const [subChapterId, setSubChapterId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [videoPath, setVideoPath] = useState("");
  const [durationSeconds, setDurationSeconds] = useState("");
  const [isFreePreview, setIsFreePreview] = useState(false);
  const [sortOrder, setSortOrder] = useState("1");
  const [thumbnail, setThumbnail] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const [previewVideo, setPreviewVideo] = useState<SubChapterVideo | null>(null);

  const canView = permissions.includes("sub_chapter_videos.view");
  const canCreate = permissions.includes("sub_chapter_videos.create");
  const canUpdate = permissions.includes("sub_chapter_videos.update");
  const canDelete = permissions.includes("sub_chapter_videos.delete");
  const showActions = canUpdate || canDelete;

  const filteredSubChapter =
    subChapters.find((item) => item.id === filterSubChapterId) ?? null;

  async function refresh() {
    const [user, nextRows, nextSubChapters] = await Promise.all([
      currentUser(),
      listSubChapterVideos(filterSubChapterId ?? undefined),
      listSubChapters(),
    ]);
    setPermissions(user?.permissions ?? []);
    setRows(nextRows);
    setSubChapters(nextSubChapters);
  }

  useEffect(() => {
    refresh()
      .then(() => setError(""))
      .catch((caught: unknown) => {
        setRows([]);
        setError(caught instanceof Error ? caught.message : "Could not load videos.");
      });
  }, [filterSubChapterId]);

  useEffect(() => {
    if (!thumbnail) {
      return;
    }
    const preview = URL.createObjectURL(thumbnail);
    setThumbnailPreview(preview);
    return () => URL.revokeObjectURL(preview);
  }, [thumbnail]);

  useEffect(() => {
    if (!previewVideo) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setPreviewVideo(null);
      }
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [previewVideo]);

  function defaultSubChapterId() {
    if (filterSubChapterId) {
      return String(filterSubChapterId);
    }
    return subChapters[0] ? String(subChapters[0].id) : "";
  }

  function resetForm() {
    setFormOpen(false);
    setEditingId(null);
    setSubChapterId(defaultSubChapterId());
    setTitle("");
    setDescription("");
    setVideoPath("");
    setDurationSeconds("");
    setIsFreePreview(false);
    setSortOrder("1");
    setThumbnail(null);
    setThumbnailPreview(null);
    setFormError("");
  }

  function openCreate() {
    setEditingId(null);
    setSubChapterId(defaultSubChapterId());
    setTitle("");
    setDescription("");
    setVideoPath("");
    setDurationSeconds("");
    setIsFreePreview(false);
    setSortOrder("1");
    setThumbnail(null);
    setThumbnailPreview(null);
    setFormError("");
    setFormOpen(true);
  }

  function openEdit(row: SubChapterVideo) {
    setEditingId(row.id);
    setSubChapterId(String(row.sub_chapter_id));
    setTitle(row.title);
    setDescription(row.description ?? "");
    setVideoPath(row.video_path);
    setDurationSeconds(row.duration_seconds !== null ? String(row.duration_seconds) : "");
    setIsFreePreview(row.is_free_preview);
    setSortOrder(String(row.sort_order));
    setThumbnail(null);
    setThumbnailPreview(row.thumbnail_url);
    setFormError("");
    setFormOpen(true);
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError("");

    if (!subChapterId) {
      setFormError("Select a sub chapter first.");
      return;
    }

    const duration =
      durationSeconds.trim() === "" ? null : Number(durationSeconds.trim());
    if (duration !== null && (!Number.isFinite(duration) || duration < 0)) {
      setFormError("Enter a valid duration in seconds.");
      return;
    }

    setSubmitting(true);

    const input = {
      sub_chapter_id: Number(subChapterId),
      title: title.trim(),
      description: description.trim() || undefined,
      video_path: videoPath.trim(),
      duration_seconds: duration,
      is_free_preview: isFreePreview,
      thumbnail,
      ...(editingId !== null ? { sort_order: Number(sortOrder) } : {}),
    };

    try {
      if (editingId === null) {
        await createSubChapterVideo(input);
      } else {
        await updateSubChapterVideo(editingId, input);
      }
      await refresh();
      resetForm();
    } catch (caught) {
      setFormError(caught instanceof Error ? caught.message : "Save failed.");
    } finally {
      setSubmitting(false);
    }
  }

  async function onDelete(row: SubChapterVideo) {
    if (!canDelete) return;
    if (!window.confirm(`Delete “${row.title}”?`)) return;

    setError("");
    try {
      await deleteSubChapterVideo(row.id);
      if (editingId === row.id) resetForm();
      await refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not delete video.");
    }
  }

  return (
    <div className="w-full space-y-4 px-4 py-4">
      {error ? <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="text-sm text-[#5C6B61]">
          {filteredSubChapter ? (
            <p>
              Showing lesson videos in{" "}
              <span className="font-semibold text-slate-800">{filteredSubChapter.title}</span>.{" "}
              <Link
                href="/admin/sub-chapter-videos"
                className="font-semibold text-[#109e44] hover:underline"
              >
                Show all
              </Link>
            </p>
          ) : (
            <p>
              Add the real lesson videos for each sub chapter. The main chapter video stays as the
              course preview.
            </p>
          )}
        </div>
        {canCreate ? (
          <button
            type="button"
            onClick={openCreate}
            className="cursor-pointer rounded-lg bg-[#f37021] px-4 py-2 text-sm font-bold text-white shadow-sm transition-colors hover:bg-[#e05f10]"
          >
            Add video
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
              {editingId === null ? "Create video" : "Edit video"}
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
              Sub chapter
              <select
                required
                value={subChapterId}
                onChange={(event) => setSubChapterId(event.target.value)}
                className={fieldClass}
              >
                <option value="" disabled>
                  Select a sub chapter
                </option>
                {subChapters.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.title}
                    {item.chapter_name ? ` · ${item.chapter_name}` : ""}
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

            <label className="block text-sm font-semibold text-slate-700 md:col-span-2">
              Video link (AWS)
              <input
                type="url"
                required
                value={videoPath}
                onChange={(event) => setVideoPath(event.target.value)}
                placeholder="https://..."
                className={fieldClass}
              />
            </label>

            <label className="block text-sm font-semibold text-slate-700">
              Duration (seconds) <span className="font-medium text-slate-400">(optional)</span>
              <input
                type="number"
                min="0"
                step="1"
                value={durationSeconds}
                onChange={(event) => setDurationSeconds(event.target.value)}
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
                Sort order follows the order this video is added inside its sub chapter.
              </p>
            )}
          </div>

          <label className="flex cursor-pointer items-center gap-2 text-sm font-semibold text-slate-700">
            <input
              type="checkbox"
              checked={isFreePreview}
              onChange={(event) => setIsFreePreview(event.target.checked)}
            />
            Free preview
          </label>

          <button
            type="submit"
            disabled={
              submitting ||
              subChapters.length === 0 ||
              (editingId === null ? !canCreate : !canUpdate)
            }
            className="cursor-pointer rounded-lg bg-[#109e44] px-4 py-2.5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-[#0d8539] disabled:opacity-60"
          >
            {submitting ? "Saving..." : editingId === null ? "Create video" : "Save changes"}
          </button>
        </form>
      ) : null}

      {rows === null ? (
        <p className="text-sm text-[#5C6B61]">Loading videos...</p>
      ) : rows.length === 0 && !error ? (
        <div className="rounded-2xl border border-dashed border-[#E2E9E4] bg-white px-6 py-12 text-center text-sm text-[#5C6B61]">
          No videos yet.
        </div>
      ) : rows.length > 0 && canView ? (
        <div className="overflow-x-auto rounded-2xl border border-[#E2E9E4] bg-white shadow-sm">
          <table className="admin-table w-full text-left text-sm">
            <thead>
              <tr>
                <th className="px-4 py-3">Order</th>
                <th className="px-4 py-3">Video</th>
                <th className="px-4 py-3">Sub chapter</th>
                <th className="px-4 py-3">Duration</th>
                <th className="px-4 py-3">Preview</th>
                {showActions && <th className="px-4 py-3 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="admin-data-row">
                  <td className="px-4 py-3 font-semibold text-slate-900">{row.sort_order}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setPreviewVideo(row)}
                        className="group relative h-10 w-14 shrink-0 overflow-hidden rounded-md border border-slate-200 bg-slate-100 transition hover:border-[#109e44]/50 hover:shadow-sm"
                        aria-label={`Play ${row.title}`}
                        title="Play video"
                      >
                        {row.thumbnail_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={row.thumbnail_url}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <span className="flex h-full w-full items-center justify-center bg-slate-800" />
                        )}
                        <span className="absolute inset-0 flex items-center justify-center bg-black/35 opacity-0 transition group-hover:opacity-100">
                          <Play className="h-4 w-4 fill-white text-white" />
                        </span>
                      </button>
                      <div>
                        <p className="font-semibold text-slate-900">{row.title}</p>
                        <p className="max-w-xs truncate text-xs text-slate-500">{row.video_path}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{row.sub_chapter_title ?? "—"}</td>
                  <td className="px-4 py-3 tabular-nums text-slate-600">
                    {formatDuration(row.duration_seconds)}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-bold uppercase ${
                        row.is_free_preview
                          ? "bg-[#109e44]/10 text-[#109e44]"
                          : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {row.is_free_preview ? "Yes" : "No"}
                    </span>
                  </td>
                  {showActions && (
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-2">
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

      {previewVideo ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-[2px]"
          role="dialog"
          aria-modal="true"
          aria-label={`Playing ${previewVideo.title}`}
          onClick={() => setPreviewVideo(null)}
        >
          <div
            className="relative w-full max-w-4xl overflow-hidden rounded-2xl bg-slate-950 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-white">{previewVideo.title}</p>
                <p className="truncate text-xs text-white/55">
                  {formatDuration(previewVideo.duration_seconds)}
                  {previewVideo.sub_chapter_title ? ` · ${previewVideo.sub_chapter_title}` : ""}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPreviewVideo(null)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
                aria-label="Close video preview"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="aspect-video bg-black">
              {previewEmbedUrl(previewVideo.video_path) ? (
                <iframe
                  key={previewVideo.id}
                  title={previewVideo.title}
                  src={previewEmbedUrl(previewVideo.video_path) ?? undefined}
                  className="h-full w-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                // eslint-disable-next-line jsx-a11y/media-has-caption
                <video
                  key={previewVideo.id}
                  className="h-full w-full"
                  controls
                  autoPlay
                  playsInline
                  src={mediaUrl(previewVideo.video_path)}
                />
              )}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
