const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

function xsrfToken(): string {
  const match = document.cookie.match(/(?:^|; )XSRF-TOKEN=([^;]*)/);
  return match ? decodeURIComponent(match[1]) : "";
}

async function ensureCsrfCookie(): Promise<void> {
  await fetch(`${apiUrl}/sanctum/csrf-cookie`, {
    credentials: "include",
  });
}

export type VideoProgressState = {
  watched_seconds: number;
  is_completed: boolean;
  completed_at: string | null;
  last_watched_at: string | null;
};

export type LearnVideo = {
  id: number;
  title: string;
  description: string | null;
  thumbnail_url: string | null;
  video_path: string;
  duration_seconds: number | null;
  is_free_preview: boolean;
  sort_order: number;
  progress: VideoProgressState;
};

export type LearnLesson = {
  id: number;
  title: string;
  description: string | null;
  thumbnail_url: string | null;
  sort_order: number;
  videos_count: number;
  completed_videos_count: number;
  is_completed: boolean;
  videos: LearnVideo[];
};

export type LearnCourse = {
  id: number;
  chapter_name: string;
  slug: string;
  description: string | null;
  thumbnail_url: string | null;
  grade_name: string | null;
  progress: {
    total_videos: number;
    completed_videos: number;
    percent: number;
    is_completed: boolean;
    continue_video_id: number | null;
  };
  lessons: LearnLesson[];
};

export async function getLearnCourse(slug: string): Promise<LearnCourse> {
  const response = await fetch(`${apiUrl}/api/my-courses/${encodeURIComponent(slug)}/learn`, {
    credentials: "include",
    headers: { Accept: "application/json" },
  });

  if (response.status === 403) {
    throw new Error("Purchase this course to access lessons and videos.");
  }

  if (!response.ok) {
    throw new Error("Could not load course learning content.");
  }

  return (await response.json()) as LearnCourse;
}

export async function saveVideoProgress(
  slug: string,
  videoId: number,
  input: { watched_seconds: number; is_completed?: boolean }
): Promise<VideoProgressState & { video_id: number }> {
  await ensureCsrfCookie();

  const response = await fetch(
    `${apiUrl}/api/my-courses/${encodeURIComponent(slug)}/videos/${videoId}/progress`,
    {
      method: "POST",
      credentials: "include",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        "X-XSRF-TOKEN": xsrfToken(),
      },
      body: JSON.stringify(input),
    }
  );

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as { message?: string } | null;
    throw new Error(body?.message ?? "Could not save progress.");
  }

  return (await response.json()) as VideoProgressState & { video_id: number };
}

export function youtubeEmbedUrl(url: string): string | null {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace(/^www\./, "");

    if (host === "youtu.be") {
      const id = parsed.pathname.replace("/", "");
      return id ? `https://www.youtube.com/embed/${id}` : null;
    }

    if (host === "youtube.com" || host === "m.youtube.com") {
      const id = parsed.searchParams.get("v");
      if (id) {
        return `https://www.youtube.com/embed/${id}`;
      }
      const parts = parsed.pathname.split("/").filter(Boolean);
      if (parts[0] === "embed" && parts[1]) {
        return `https://www.youtube.com/embed/${parts[1]}`;
      }
      if (parts[0] === "shorts" && parts[1]) {
        return `https://www.youtube.com/embed/${parts[1]}`;
      }
    }
  } catch {
    return null;
  }

  return null;
}
