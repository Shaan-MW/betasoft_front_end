const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export type PublicCourse = {
  id: number;
  chapter_name: string;
  slug: string;
  description: string | null;
  thumbnail_url: string | null;
  grade_name: string | null;
  price: string;
  sub_chapters_count: number;
  sort_order: number;
};

export type PublicCourseDetail = PublicCourse & {
  video_url: string;
  sub_chapters: {
    id: number;
    title: string;
    description: string | null;
    thumbnail_url: string | null;
    sort_order: number;
  }[];
};

export async function listPublishedCourses(limit?: number): Promise<PublicCourse[]> {
  const query = limit ? `?limit=${limit}` : "";
  const response = await fetch(`${apiUrl}/api/courses${query}`, {
    next: { revalidate: 30 },
  });

  if (!response.ok) {
    return [];
  }

  return (await response.json()) as PublicCourse[];
}

export async function getPublishedCourse(slug: string): Promise<PublicCourseDetail | null> {
  const response = await fetch(`${apiUrl}/api/courses/${encodeURIComponent(slug)}`, {
    next: { revalidate: 30 },
  });

  if (!response.ok) {
    return null;
  }

  return (await response.json()) as PublicCourseDetail;
}
