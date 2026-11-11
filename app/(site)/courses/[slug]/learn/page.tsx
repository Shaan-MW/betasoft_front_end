"use client";

import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  Circle,
  PlayCircle,
  BookOpen,
} from "lucide-react";
import { currentUser } from "@/lib/admin-auth";
import {
  getLearnCourse,
  saveVideoProgress,
  youtubeEmbedUrl,
  type LearnCourse,
  type LearnVideo,
} from "@/lib/learn";

function formatDuration(seconds: number | null) {
  if (!seconds || seconds <= 0) return null;
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${String(secs).padStart(2, "0")}`;
}

function flatVideos(course: LearnCourse): LearnVideo[] {
  return course.lessons.flatMap((lesson) => lesson.videos);
}

function cappedWatchSeconds(seconds: number, durationSeconds: number | null | undefined) {
  const value = Math.max(0, Math.floor(seconds));
  if (!durationSeconds || durationSeconds <= 0) return value;
  return Math.min(value, durationSeconds);
}

function CourseLearnContent() {
  const params = useParams<{ slug: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();
  const slug = params.slug;

  const [course, setCourse] = useState<LearnCourse | null>(null);
  const [activeVideoId, setActiveVideoId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const lastSavedRef = useRef(0);
  const watchedRef = useRef(0);
  const activeVideoRef = useRef<LearnVideo | null>(null);

  useEffect(() => {
    let active = true;

    async function load() {
      const user = await currentUser();
      if (!active) return;

      if (!user) {
        router.replace(`/login?next=${encodeURIComponent(`/courses/${slug}/learn`)}`);
        return;
      }

      if (user.roles.includes("admin")) {
        setError("Admin accounts use the admin panel. Sign in as a student to learn.");
        setLoading(false);
        return;
      }

      try {
        const data = await getLearnCourse(slug);
        if (!active) return;
        setCourse(data);

        const requested = Number(searchParams.get("video") || 0);
        const videos = flatVideos(data);
        const requestedExists = videos.some((video) => video.id === requested);
        setActiveVideoId(
          requestedExists
            ? requested
            : data.progress.continue_video_id ?? videos[0]?.id ?? null
        );
        setLoading(false);
      } catch (caught) {
        if (!active) return;
        setError(caught instanceof Error ? caught.message : "Could not load course.");
        setLoading(false);
      }
    }

    load();
    return () => {
      active = false;
    };
  }, [router, searchParams, slug]);

  const activeVideo = useMemo(() => {
    if (!course || !activeVideoId) return null;
    return flatVideos(course).find((video) => video.id === activeVideoId) ?? null;
  }, [activeVideoId, course]);

  const youtubeUrl = activeVideo ? youtubeEmbedUrl(activeVideo.video_path) : null;

  useEffect(() => {
    activeVideoRef.current = activeVideo;
    watchedRef.current = activeVideo?.progress.watched_seconds ?? 0;
    lastSavedRef.current = activeVideo?.progress.watched_seconds ?? 0;
  }, [activeVideo]);

  async function applyProgress(
    videoId: number,
    watchedSeconds: number,
    isCompleted?: boolean
  ) {
    if (!course) return;

    const video =
      activeVideoRef.current?.id === videoId
        ? activeVideoRef.current
        : flatVideos(course).find((item) => item.id === videoId) ?? null;
    const capped = cappedWatchSeconds(watchedSeconds, video?.duration_seconds);

    setSaving(true);
    try {
      const result = await saveVideoProgress(course.slug, videoId, {
        watched_seconds: capped,
        is_completed: isCompleted,
      });
      watchedRef.current = result.watched_seconds;
      lastSavedRef.current = result.watched_seconds;

      setCourse((current) => {
        if (!current) return current;

        const lessons = current.lessons.map((lesson) => {
          const videos = lesson.videos.map((video) => {
            if (video.id !== videoId) return video;
            return {
              ...video,
              progress: {
                watched_seconds: result.watched_seconds,
                is_completed: result.is_completed,
                completed_at: result.completed_at,
                last_watched_at: result.last_watched_at,
              },
            };
          });

          const completedCount = videos.filter((video) => video.progress.is_completed).length;

          return {
            ...lesson,
            videos,
            completed_videos_count: completedCount,
            is_completed: videos.length > 0 && completedCount === videos.length,
          };
        });

        const allVideos = lessons.flatMap((lesson) => lesson.videos);
        const completedVideos = allVideos.filter((video) => video.progress.is_completed).length;
        const totalVideos = allVideos.length;
        const percent =
          totalVideos > 0 ? Math.round((completedVideos / totalVideos) * 100) : 0;

        let continueVideoId: number | null = null;
        for (const video of allVideos) {
          if (!video.progress.is_completed) {
            continueVideoId = video.id;
            break;
          }
        }
        if (continueVideoId === null && allVideos[0]) {
          continueVideoId = allVideos[0].id;
        }

        return {
          ...current,
          lessons,
          progress: {
            total_videos: totalVideos,
            completed_videos: completedVideos,
            percent,
            is_completed: totalVideos > 0 && completedVideos === totalVideos,
            continue_video_id: continueVideoId,
          },
        };
      });
    } catch {
      // Keep watching even if a progress save fails temporarily.
    } finally {
      setSaving(false);
    }
  }

  function onSelectVideo(videoId: number) {
    setActiveVideoId(videoId);
    lastSavedRef.current = 0;
    watchedRef.current = 0;
    router.replace(`/courses/${slug}/learn?video=${videoId}`, { scroll: false });
  }

  async function onMarkComplete() {
    if (!activeVideo) return;
    const duration = activeVideo.duration_seconds ?? 0;
    const watched = cappedWatchSeconds(
      Math.max(
        activeVideo.progress.watched_seconds,
        duration,
        Math.floor(videoRef.current?.currentTime ?? 0)
      ),
      duration
    );
    await applyProgress(activeVideo.id, watched, true);
  }

  function onTimeUpdate() {
    const el = videoRef.current;
    if (!el || !activeVideo) return;

    const current = cappedWatchSeconds(
      Math.floor(el.currentTime),
      activeVideo.duration_seconds
    );
    if (current - lastSavedRef.current < 8 && current !== 0) {
      return;
    }

    lastSavedRef.current = current;
    watchedRef.current = current;
    void applyProgress(activeVideo.id, current);
  }

  function onVideoEnded() {
    if (!activeVideo) return;
    const duration = activeVideo.duration_seconds ?? 0;
    const watched = cappedWatchSeconds(
      Math.max(
        Math.floor(videoRef.current?.duration ?? 0),
        duration,
        activeVideo.progress.watched_seconds
      ),
      duration
    );
    void applyProgress(activeVideo.id, watched, true);
  }

  useEffect(() => {
    const el = videoRef.current;
    if (!el || !activeVideo || youtubeUrl) return;

    const startAt = cappedWatchSeconds(
      activeVideo.progress.watched_seconds,
      activeVideo.duration_seconds
    );
    if (startAt > 0 && !activeVideo.progress.is_completed) {
      const onLoaded = () => {
        const max = activeVideo.duration_seconds ?? el.duration;
        if (max && startAt < max - 2) {
          el.currentTime = startAt;
        }
      };
      el.addEventListener("loadedmetadata", onLoaded);
      return () => el.removeEventListener("loadedmetadata", onLoaded);
    }
  }, [activeVideo, youtubeUrl]);

  // YouTube embeds don't expose playback time — accumulate against duration while active.
  useEffect(() => {
    if (!activeVideo || !youtubeUrl || activeVideo.progress.is_completed) return;

    const duration = activeVideo.duration_seconds;
    if (!duration || duration <= 0) return;

    const tickMs = 8000;
    const interval = window.setInterval(() => {
      if (document.visibilityState === "hidden") return;

      const video = activeVideoRef.current;
      if (!video || video.id !== activeVideo.id || video.progress.is_completed) return;

      const next = cappedWatchSeconds(watchedRef.current + tickMs / 1000, duration);
      if (next <= watchedRef.current) return;

      watchedRef.current = next;
      lastSavedRef.current = next;
      const complete = next >= Math.ceil(duration * 0.9);
      void applyProgress(video.id, next, complete || undefined);
    }, tickMs);

    return () => window.clearInterval(interval);
  }, [activeVideo?.id, activeVideo?.progress.is_completed, activeVideo?.duration_seconds, youtubeUrl]);

  if (loading) {
    return (
      <main className="flex-1 bg-[#F5F8F6] py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <p className="text-sm text-[#5C6B61]">Loading your course…</p>
        </div>
      </main>
    );
  }

  if (!course) {
    return (
      <main className="flex-1 bg-[#F5F8F6] py-12">
        <div className="mx-auto max-w-3xl space-y-4 px-4 sm:px-6">
          <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
            {error || "Course unavailable."}
          </p>
          <Link
            href="/my-courses"
            className="inline-flex items-center gap-1 text-sm font-semibold text-[#109e44] hover:text-[#0c7d36]"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to My courses
          </Link>
          {error.includes("Purchase") ? (
            <Link
              href={`/courses/${slug}/buy`}
              className="ml-4 text-sm font-semibold text-[#f37021] hover:text-[#e05f10]"
            >
              Buy this course
            </Link>
          ) : null}
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 bg-[#F5F8F6] py-8 sm:py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Link
          href="/my-courses"
          className="inline-flex items-center gap-1 text-sm font-semibold text-[#109e44] hover:text-[#0c7d36]"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to My courses
        </Link>

        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-[#f37021]">
              {course.grade_name ?? "Course"}
            </p>
            <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-[#142319] sm:text-3xl">
              {course.chapter_name}
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-[#5C6B61]">
              Watch each lesson video and track your progress to completion.
            </p>
          </div>
          <div className="min-w-[200px] rounded-2xl border border-[#E2E9E4] bg-white px-4 py-3 shadow-sm">
            <div className="flex items-center justify-between text-xs font-semibold text-[#5C6B61]">
              <span>Progress</span>
              <span className="text-[#109e44]">{course.progress.percent}%</span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#EAF3ED]">
              <div
                className="h-full rounded-full bg-[#109e44] transition-all"
                style={{ width: `${course.progress.percent}%` }}
              />
            </div>
            <p className="mt-2 text-xs text-[#5C6B61]">
              {course.progress.completed_videos}/{course.progress.total_videos} videos complete
              {saving ? " · Saving…" : ""}
            </p>
          </div>
        </div>

        {course.progress.is_completed ? (
          <p className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#109e44]/10 px-3 py-2 text-sm font-semibold text-[#109e44]">
            <CheckCircle2 className="h-4 w-4" />
            Course completed — great work!
          </p>
        ) : null}

        <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
          <section className="overflow-hidden rounded-2xl border border-[#E2E9E4] bg-white shadow-sm">
            <div className="aspect-video bg-black">
              {activeVideo ? (
                youtubeUrl ? (
                  <iframe
                    key={activeVideo.id}
                    title={activeVideo.title}
                    src={youtubeUrl}
                    className="h-full w-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                ) : (
                  // eslint-disable-next-line jsx-a11y/media-has-caption
                  <video
                    key={activeVideo.id}
                    ref={videoRef}
                    className="h-full w-full"
                    controls
                    playsInline
                    poster={activeVideo.thumbnail_url ?? undefined}
                    src={activeVideo.video_path}
                    onTimeUpdate={onTimeUpdate}
                    onEnded={onVideoEnded}
                  />
                )
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-white/80">
                  No videos in this course yet.
                </div>
              )}
            </div>

            {activeVideo ? (
              <div className="space-y-3 p-5 sm:p-6">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="text-xl font-extrabold text-[#142319]">{activeVideo.title}</h2>
                    {activeVideo.description ? (
                      <p className="mt-2 text-sm leading-relaxed text-[#5C6B61]">
                        {activeVideo.description}
                      </p>
                    ) : null}
                    {formatDuration(activeVideo.duration_seconds) ? (
                      <p className="mt-2 text-xs font-semibold text-[#5C6B61]">
                        Duration {formatDuration(activeVideo.duration_seconds)}
                      </p>
                    ) : null}
                  </div>
                  {activeVideo.progress.is_completed ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-[#109e44]/10 px-3 py-1 text-xs font-bold text-[#109e44]">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Completed
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={onMarkComplete}
                      className="rounded-xl bg-[#f37021] px-4 py-2 text-sm font-bold text-white transition hover:bg-[#e05f10]"
                    >
                      Mark complete
                    </button>
                  )}
                </div>

                {youtubeUrl ? (
                  <p className="rounded-xl border border-[#E2E9E4] bg-[#F5F8F6] px-3 py-2 text-xs text-[#5C6B61]">
                    YouTube lessons: use <strong>Mark complete</strong> when you finish watching.
                  </p>
                ) : null}
              </div>
            ) : null}
          </section>

          <aside className="rounded-2xl border border-[#E2E9E4] bg-white p-4 shadow-sm sm:p-5">
            <h3 className="text-sm font-extrabold uppercase tracking-wide text-[#142319]">
              Course outline
            </h3>

            {course.lessons.length === 0 ? (
              <p className="mt-4 text-sm text-[#5C6B61]">No lessons published yet.</p>
            ) : (
              <div className="mt-4 space-y-4">
                {course.lessons.map((lesson, lessonIndex) => (
                  <div key={lesson.id}>
                    <div className="flex items-start gap-2">
                      <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-[#109e44]/10 text-[11px] font-bold text-[#109e44]">
                        {lessonIndex + 1}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold text-[#142319]">{lesson.title}</p>
                        <p className="text-xs text-[#5C6B61]">
                          {lesson.completed_videos_count}/{lesson.videos_count} videos
                          {lesson.is_completed ? " · Done" : ""}
                        </p>
                      </div>
                    </div>

                    <div className="mt-2 space-y-1 border-l border-[#E2E9E4] ml-3 pl-3">
                      {lesson.videos.length === 0 ? (
                        <p className="py-1 text-xs text-[#5C6B61]">No videos yet</p>
                      ) : (
                        lesson.videos.map((video) => {
                          const selected = video.id === activeVideoId;
                          return (
                            <button
                              key={video.id}
                              type="button"
                              onClick={() => onSelectVideo(video.id)}
                              className={`flex w-full items-start gap-2 rounded-xl px-2.5 py-2 text-left transition ${
                                selected
                                  ? "bg-[#109e44]/10 text-[#109e44]"
                                  : "hover:bg-[#F5F8F6] text-[#142319]"
                              }`}
                            >
                              {video.progress.is_completed ? (
                                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#109e44]" />
                              ) : selected ? (
                                <PlayCircle className="mt-0.5 h-4 w-4 shrink-0 text-[#f37021]" />
                              ) : (
                                <Circle className="mt-0.5 h-4 w-4 shrink-0 text-[#C5D0C9]" />
                              )}
                              <span className="min-w-0 flex-1">
                                <span className="block text-sm font-semibold leading-snug">
                                  {video.title}
                                </span>
                                {formatDuration(video.duration_seconds) ? (
                                  <span className="mt-0.5 block text-[11px] font-medium text-[#5C6B61]">
                                    {formatDuration(video.duration_seconds)}
                                  </span>
                                ) : null}
                              </span>
                            </button>
                          );
                        })
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </aside>
        </div>

        {!course.lessons.some((lesson) => lesson.videos.length > 0) ? (
          <div className="mt-6 flex items-center gap-2 rounded-2xl border border-dashed border-[#E2E9E4] bg-white px-4 py-6 text-sm text-[#5C6B61]">
            <BookOpen className="h-4 w-4 text-[#109e44]" />
            Videos will appear here once the admin adds lesson videos to sub chapters.
          </div>
        ) : null}
      </div>
    </main>
  );
}

export default function CourseLearnPage() {
  return (
    <Suspense
      fallback={
        <main className="flex-1 bg-[#F5F8F6] py-12">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <p className="text-sm text-[#5C6B61]">Loading your course…</p>
          </div>
        </main>
      }
    >
      <CourseLearnContent />
    </Suspense>
  );
}
