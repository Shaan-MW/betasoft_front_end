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

async function postLogin(path: string, email: string, password: string): Promise<void> {
  await ensureCsrfCookie();

  const response = await fetch(`${apiUrl}${path}`, {
    method: "POST",
    credentials: "include",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "X-XSRF-TOKEN": xsrfToken(),
    },
    body: JSON.stringify({ email, password }),
  });

  if (response.ok) {
    return;
  }

  let message = "These credentials do not match our records.";
  if (response.status === 422) {
    const body = (await response.json()) as { errors?: { email?: string[] } };
    message = body.errors?.email?.[0] ?? message;
  }

  throw new Error(message);
}

export function loginAdmin(email: string, password: string): Promise<void> {
  return postLogin("/login/admin", email, password);
}

export function loginCustomer(email: string, password: string): Promise<void> {
  return postLogin("/login", email, password);
}

export type JoinInput = {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
};

export async function joinBlms(input: JoinInput): Promise<void> {
  await ensureCsrfCookie();

  const response = await fetch(`${apiUrl}/register`, {
    method: "POST",
    credentials: "include",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "X-XSRF-TOKEN": xsrfToken(),
    },
    body: JSON.stringify(input),
  });

  if (response.ok) {
    return;
  }

  let message = "Could not create your account.";
  if (response.status === 422) {
    const body = (await response.json()) as { errors?: Record<string, string[]> };
    message =
      body.errors?.email?.[0] ??
      body.errors?.password?.[0] ??
      body.errors?.name?.[0] ??
      message;
  }

  throw new Error(message);
}

export type AuthUser = {
  id: number;
  name: string;
  email: string;
  roles: string[];
  permissions?: string[];
};

export async function currentUser(): Promise<AuthUser | null> {
  const response = await fetch(`${apiUrl}/api/user`, {
    credentials: "include",
    headers: { Accept: "application/json" },
  });

  if (!response.ok) {
    return null;
  }

  return (await response.json()) as AuthUser;
}

export type StudentAccount = {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  status: "active" | "blocked";
  joined_at: string;
};

export async function listStudents(): Promise<StudentAccount[]> {
  const response = await fetch(`${apiUrl}/api/admin/students`, {
    credentials: "include",
    headers: { Accept: "application/json" },
  });

  if (!response.ok) {
    throw new Error("Could not load students.");
  }

  return (await response.json()) as StudentAccount[];
}

export type StudentProgressCourse = {
  chapter_id: number;
  chapter_name: string | null;
  slug: string | null;
  total_videos: number;
  completed_videos: number;
  percent: number;
};

export type StudentProgressRow = {
  id: number;
  name: string;
  email: string;
  status: "active" | "blocked" | string;
  enrolled_courses: number;
  total_videos: number;
  completed_videos: number;
  percent: number;
  view_hours: number;
  last_watched_at: string | null;
  courses: StudentProgressCourse[];
};

export async function listStudentProgress(): Promise<StudentProgressRow[]> {
  const response = await fetch(`${apiUrl}/api/admin/students/progress`, {
    credentials: "include",
    headers: { Accept: "application/json" },
  });

  if (!response.ok) {
    throw new Error(await readApiError(response, "Could not load student progress."));
  }

  return (await response.json()) as StudentProgressRow[];
}

export type AdminDashboardStats = {
  students: number;
  chapters: number;
  published_chapters: number;
  pending_confirmations: number;
  completed_purchases: number;
  total_view_hours: number;
};

export type AdminViewHoursPoint = {
  date: string;
  label: string;
  hours: number;
};

export type AdminViewHoursResponse = {
  days: number;
  series: AdminViewHoursPoint[];
  total_hours: number;
};

export async function getAdminDashboardStats(): Promise<AdminDashboardStats> {
  const response = await fetch(`${apiUrl}/api/admin/dashboard/stats`, {
    credentials: "include",
    headers: { Accept: "application/json" },
  });

  if (!response.ok) {
    throw new Error(await readApiError(response, "Could not load dashboard stats."));
  }

  return (await response.json()) as AdminDashboardStats;
}

export async function getAdminViewHours(days = 14): Promise<AdminViewHoursResponse> {
  const response = await fetch(`${apiUrl}/api/admin/dashboard/view-hours?days=${days}`, {
    credentials: "include",
    headers: { Accept: "application/json" },
  });

  if (!response.ok) {
    throw new Error(await readApiError(response, "Could not load view hours."));
  }

  return (await response.json()) as AdminViewHoursResponse;
}

export type AdminTopCourse = {
  id: number;
  chapter_name: string;
  slug: string;
  grade_name: string | null;
  learners: number;
  view_hours: number;
  share_percent: number;
};

export type AdminTopCoursesResponse = {
  courses: AdminTopCourse[];
};

export async function getAdminTopCourses(limit = 5): Promise<AdminTopCoursesResponse> {
  const response = await fetch(
    `${apiUrl}/api/admin/dashboard/top-courses?limit=${limit}`,
    {
      credentials: "include",
      headers: { Accept: "application/json" },
    }
  );

  if (!response.ok) {
    throw new Error(await readApiError(response, "Could not load top courses."));
  }

  return (await response.json()) as AdminTopCoursesResponse;
}

export type Grade = {
  id: number;
  title: string;
  slug: string;
  description: string | null;
  created_at: string;
  updated_at: string;
};

export type GradeInput = {
  title: string;
  slug?: string;
  description?: string;
};

async function readApiError(response: Response, fallback: string): Promise<string> {
  if (response.status === 403) {
    return "You do not have permission to do that.";
  }

  try {
    const body = (await response.json()) as { errors?: Record<string, string[]>; message?: string };
    const first = body.errors ? Object.values(body.errors).flat()[0] : undefined;
    if (first) return first;
    if (body.message && body.message !== "Server Error") return body.message;
  } catch {
    // ignore non-JSON bodies
  }

  return fallback;
}

export async function listGrades(): Promise<Grade[]> {
  const response = await fetch(`${apiUrl}/api/admin/grades`, {
    credentials: "include",
    headers: { Accept: "application/json" },
  });

  if (!response.ok) {
    throw new Error(await readApiError(response, "Could not load grades."));
  }

  return (await response.json()) as Grade[];
}

export async function createGrade(input: GradeInput): Promise<Grade> {
  await ensureCsrfCookie();

  const response = await fetch(`${apiUrl}/api/admin/grades`, {
    method: "POST",
    credentials: "include",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "X-XSRF-TOKEN": xsrfToken(),
    },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    throw new Error(await readApiError(response, "Could not create grade."));
  }

  return (await response.json()) as Grade;
}

export async function updateGrade(id: number, input: GradeInput): Promise<Grade> {
  await ensureCsrfCookie();

  const response = await fetch(`${apiUrl}/api/admin/grades/${id}`, {
    method: "PUT",
    credentials: "include",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "X-XSRF-TOKEN": xsrfToken(),
    },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    throw new Error(await readApiError(response, "Could not update grade."));
  }

  return (await response.json()) as Grade;
}

export async function deleteGrade(id: number): Promise<void> {
  await ensureCsrfCookie();

  const response = await fetch(`${apiUrl}/api/admin/grades/${id}`, {
    method: "DELETE",
    credentials: "include",
    headers: {
      Accept: "application/json",
      "X-XSRF-TOKEN": xsrfToken(),
    },
  });

  if (!response.ok) {
    throw new Error(await readApiError(response, "Could not delete grade."));
  }
}

export type RoleRecord = {
  id: number;
  name: string;
  protected: boolean;
  permissions: string[];
  users_count: number;
};

export type RoleInput = {
  name: string;
  permissions?: string[];
};

export type PermissionRecord = {
  id: number;
  name: string;
};

export type ManagedUser = {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  status: "active" | "blocked";
  roles: string[];
  created_at: string;
};

export type ManagedUserInput = {
  name: string;
  email: string;
  password?: string;
  password_confirmation?: string;
  phone?: string;
  status: "active" | "blocked";
  roles: string[];
};

export async function listRoles(): Promise<RoleRecord[]> {
  const response = await fetch(`${apiUrl}/api/admin/roles`, {
    credentials: "include",
    headers: { Accept: "application/json" },
  });

  if (!response.ok) {
    throw new Error(await readApiError(response, "Could not load roles."));
  }

  return (await response.json()) as RoleRecord[];
}

export async function createRole(input: RoleInput): Promise<RoleRecord> {
  await ensureCsrfCookie();

  const response = await fetch(`${apiUrl}/api/admin/roles`, {
    method: "POST",
    credentials: "include",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "X-XSRF-TOKEN": xsrfToken(),
    },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    throw new Error(await readApiError(response, "Could not create role."));
  }

  return (await response.json()) as RoleRecord;
}

export async function updateRole(id: number, input: RoleInput): Promise<RoleRecord> {
  await ensureCsrfCookie();

  const response = await fetch(`${apiUrl}/api/admin/roles/${id}`, {
    method: "PUT",
    credentials: "include",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "X-XSRF-TOKEN": xsrfToken(),
    },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    throw new Error(await readApiError(response, "Could not update role."));
  }

  return (await response.json()) as RoleRecord;
}

export async function deleteRole(id: number): Promise<void> {
  await ensureCsrfCookie();

  const response = await fetch(`${apiUrl}/api/admin/roles/${id}`, {
    method: "DELETE",
    credentials: "include",
    headers: {
      Accept: "application/json",
      "X-XSRF-TOKEN": xsrfToken(),
    },
  });

  if (!response.ok) {
    throw new Error(await readApiError(response, "Could not delete role."));
  }
}

export async function assignRolePermissions(id: number, permissions: string[]): Promise<RoleRecord> {
  await ensureCsrfCookie();

  const response = await fetch(`${apiUrl}/api/admin/roles/${id}/permissions`, {
    method: "PUT",
    credentials: "include",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "X-XSRF-TOKEN": xsrfToken(),
    },
    body: JSON.stringify({ permissions }),
  });

  if (!response.ok) {
    throw new Error(await readApiError(response, "Could not assign permissions."));
  }

  return (await response.json()) as RoleRecord;
}

export async function listPermissions(): Promise<PermissionRecord[]> {
  const response = await fetch(`${apiUrl}/api/admin/permissions`, {
    credentials: "include",
    headers: { Accept: "application/json" },
  });

  if (!response.ok) {
    throw new Error(await readApiError(response, "Could not load permissions."));
  }

  return (await response.json()) as PermissionRecord[];
}

export async function listManagedUsers(): Promise<ManagedUser[]> {
  const response = await fetch(`${apiUrl}/api/admin/users`, {
    credentials: "include",
    headers: { Accept: "application/json" },
  });

  if (!response.ok) {
    throw new Error(await readApiError(response, "Could not load users."));
  }

  return (await response.json()) as ManagedUser[];
}

export async function createManagedUser(input: ManagedUserInput): Promise<ManagedUser> {
  await ensureCsrfCookie();

  const response = await fetch(`${apiUrl}/api/admin/users`, {
    method: "POST",
    credentials: "include",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "X-XSRF-TOKEN": xsrfToken(),
    },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    throw new Error(await readApiError(response, "Could not create user."));
  }

  return (await response.json()) as ManagedUser;
}

export async function updateManagedUser(id: number, input: ManagedUserInput): Promise<ManagedUser> {
  await ensureCsrfCookie();

  const response = await fetch(`${apiUrl}/api/admin/users/${id}`, {
    method: "PUT",
    credentials: "include",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "X-XSRF-TOKEN": xsrfToken(),
    },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    throw new Error(await readApiError(response, "Could not update user."));
  }

  return (await response.json()) as ManagedUser;
}

export async function deleteManagedUser(id: number): Promise<void> {
  await ensureCsrfCookie();

  const response = await fetch(`${apiUrl}/api/admin/users/${id}`, {
    method: "DELETE",
    credentials: "include",
    headers: {
      Accept: "application/json",
      "X-XSRF-TOKEN": xsrfToken(),
    },
  });

  if (!response.ok) {
    throw new Error(await readApiError(response, "Could not delete user."));
  }
}

export type Chapter = {
  id: number;
  grade_id: number;
  grade_name: string | null;
  chapter_name: string;
  slug: string;
  description: string | null;
  thumbnail_url: string | null;
  video_url: string;
  sort_order: number;
  price: string;
  is_published: boolean;
  created_at: string;
  updated_at: string;
};

export type ChapterInput = {
  grade_id: number;
  chapter_name: string;
  description?: string;
  video_url: string;
  price: string;
  is_published: boolean;
  sort_order?: number;
  thumbnail?: File | null;
};

export function chapterSlug(value: string): string {
  return value
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9_]/g, "")
    .replace(/_+/g, "_");
}

function chapterFormData(input: ChapterInput): FormData {
  const body = new FormData();
  body.append("grade_id", String(input.grade_id));
  body.append("chapter_name", input.chapter_name);
  if (input.description) {
    body.append("description", input.description);
  }
  body.append("video_url", input.video_url);
  body.append("price", input.price);
  body.append("is_published", input.is_published ? "1" : "0");
  if (input.sort_order !== undefined) {
    body.append("sort_order", String(input.sort_order));
  }
  if (input.thumbnail) {
    body.append("thumbnail", input.thumbnail);
  }
  return body;
}

export async function listChapters(): Promise<Chapter[]> {
  const response = await fetch(`${apiUrl}/api/admin/chapters`, {
    credentials: "include",
    headers: { Accept: "application/json" },
  });

  if (!response.ok) {
    throw new Error(await readApiError(response, "Could not load chapters."));
  }

  return (await response.json()) as Chapter[];
}

export async function createChapter(input: ChapterInput): Promise<Chapter> {
  await ensureCsrfCookie();

  const response = await fetch(`${apiUrl}/api/admin/chapters`, {
    method: "POST",
    credentials: "include",
    headers: {
      Accept: "application/json",
      "X-XSRF-TOKEN": xsrfToken(),
    },
    body: chapterFormData(input),
  });

  if (!response.ok) {
    throw new Error(await readApiError(response, "Could not create chapter."));
  }

  return (await response.json()) as Chapter;
}

export async function updateChapter(id: number, input: ChapterInput): Promise<Chapter> {
  await ensureCsrfCookie();

  const response = await fetch(`${apiUrl}/api/admin/chapters/${id}`, {
    method: "POST",
    credentials: "include",
    headers: {
      Accept: "application/json",
      "X-XSRF-TOKEN": xsrfToken(),
    },
    body: chapterFormData(input),
  });

  if (!response.ok) {
    throw new Error(await readApiError(response, "Could not update chapter."));
  }

  return (await response.json()) as Chapter;
}

export async function deleteChapter(id: number): Promise<void> {
  await ensureCsrfCookie();

  const response = await fetch(`${apiUrl}/api/admin/chapters/${id}`, {
    method: "DELETE",
    credentials: "include",
    headers: {
      Accept: "application/json",
      "X-XSRF-TOKEN": xsrfToken(),
    },
  });

  if (!response.ok) {
    throw new Error(await readApiError(response, "Could not delete chapter."));
  }
}

export type SubChapter = {
  id: number;
  chapter_id: number;
  chapter_name: string | null;
  title: string;
  description: string | null;
  thumbnail_url: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export type SubChapterInput = {
  chapter_id: number;
  title: string;
  description?: string;
  sort_order?: number;
  thumbnail?: File | null;
};

function subChapterFormData(input: SubChapterInput): FormData {
  const body = new FormData();
  body.append("chapter_id", String(input.chapter_id));
  body.append("title", input.title);
  if (input.description) {
    body.append("description", input.description);
  }
  if (input.sort_order !== undefined) {
    body.append("sort_order", String(input.sort_order));
  }
  if (input.thumbnail) {
    body.append("thumbnail", input.thumbnail);
  }
  return body;
}

export async function listSubChapters(chapterId?: number): Promise<SubChapter[]> {
  const query = chapterId ? `?chapter_id=${chapterId}` : "";
  const response = await fetch(`${apiUrl}/api/admin/sub-chapters${query}`, {
    credentials: "include",
    headers: { Accept: "application/json" },
  });

  if (!response.ok) {
    throw new Error(await readApiError(response, "Could not load sub chapters."));
  }

  return (await response.json()) as SubChapter[];
}

export async function createSubChapter(input: SubChapterInput): Promise<SubChapter> {
  await ensureCsrfCookie();

  const response = await fetch(`${apiUrl}/api/admin/sub-chapters`, {
    method: "POST",
    credentials: "include",
    headers: {
      Accept: "application/json",
      "X-XSRF-TOKEN": xsrfToken(),
    },
    body: subChapterFormData(input),
  });

  if (!response.ok) {
    throw new Error(await readApiError(response, "Could not create sub chapter."));
  }

  return (await response.json()) as SubChapter;
}

export async function updateSubChapter(id: number, input: SubChapterInput): Promise<SubChapter> {
  await ensureCsrfCookie();

  const response = await fetch(`${apiUrl}/api/admin/sub-chapters/${id}`, {
    method: "POST",
    credentials: "include",
    headers: {
      Accept: "application/json",
      "X-XSRF-TOKEN": xsrfToken(),
    },
    body: subChapterFormData(input),
  });

  if (!response.ok) {
    throw new Error(await readApiError(response, "Could not update sub chapter."));
  }

  return (await response.json()) as SubChapter;
}

export async function deleteSubChapter(id: number): Promise<void> {
  await ensureCsrfCookie();

  const response = await fetch(`${apiUrl}/api/admin/sub-chapters/${id}`, {
    method: "DELETE",
    credentials: "include",
    headers: {
      Accept: "application/json",
      "X-XSRF-TOKEN": xsrfToken(),
    },
  });

  if (!response.ok) {
    throw new Error(await readApiError(response, "Could not delete sub chapter."));
  }
}

export type SubChapterVideo = {
  id: number;
  sub_chapter_id: number;
  sub_chapter_title: string | null;
  title: string;
  description: string | null;
  thumbnail_url: string | null;
  video_path: string;
  duration_seconds: number | null;
  is_free_preview: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export type SubChapterVideoInput = {
  sub_chapter_id: number;
  title: string;
  description?: string;
  video_path: string;
  duration_seconds?: number | null;
  is_free_preview: boolean;
  sort_order?: number;
  thumbnail?: File | null;
};

function subChapterVideoFormData(input: SubChapterVideoInput): FormData {
  const body = new FormData();
  body.append("sub_chapter_id", String(input.sub_chapter_id));
  body.append("title", input.title);
  if (input.description) {
    body.append("description", input.description);
  }
  body.append("video_path", input.video_path);
  if (input.duration_seconds !== undefined && input.duration_seconds !== null) {
    body.append("duration_seconds", String(input.duration_seconds));
  }
  body.append("is_free_preview", input.is_free_preview ? "1" : "0");
  if (input.sort_order !== undefined) {
    body.append("sort_order", String(input.sort_order));
  }
  if (input.thumbnail) {
    body.append("thumbnail", input.thumbnail);
  }
  return body;
}

export async function listSubChapterVideos(subChapterId?: number): Promise<SubChapterVideo[]> {
  const query = subChapterId ? `?sub_chapter_id=${subChapterId}` : "";
  const response = await fetch(`${apiUrl}/api/admin/sub-chapter-videos${query}`, {
    credentials: "include",
    headers: { Accept: "application/json" },
  });

  if (!response.ok) {
    throw new Error(await readApiError(response, "Could not load videos."));
  }

  return (await response.json()) as SubChapterVideo[];
}

export async function createSubChapterVideo(input: SubChapterVideoInput): Promise<SubChapterVideo> {
  await ensureCsrfCookie();

  const response = await fetch(`${apiUrl}/api/admin/sub-chapter-videos`, {
    method: "POST",
    credentials: "include",
    headers: {
      Accept: "application/json",
      "X-XSRF-TOKEN": xsrfToken(),
    },
    body: subChapterVideoFormData(input),
  });

  if (!response.ok) {
    throw new Error(await readApiError(response, "Could not create video."));
  }

  return (await response.json()) as SubChapterVideo;
}

export async function updateSubChapterVideo(
  id: number,
  input: SubChapterVideoInput,
): Promise<SubChapterVideo> {
  await ensureCsrfCookie();

  const response = await fetch(`${apiUrl}/api/admin/sub-chapter-videos/${id}`, {
    method: "POST",
    credentials: "include",
    headers: {
      Accept: "application/json",
      "X-XSRF-TOKEN": xsrfToken(),
    },
    body: subChapterVideoFormData(input),
  });

  if (!response.ok) {
    throw new Error(await readApiError(response, "Could not update video."));
  }

  return (await response.json()) as SubChapterVideo;
}

export async function deleteSubChapterVideo(id: number): Promise<void> {
  await ensureCsrfCookie();

  const response = await fetch(`${apiUrl}/api/admin/sub-chapter-videos/${id}`, {
    method: "DELETE",
    credentials: "include",
    headers: {
      Accept: "application/json",
      "X-XSRF-TOKEN": xsrfToken(),
    },
  });

  if (!response.ok) {
    throw new Error(await readApiError(response, "Could not delete video."));
  }
}

export async function logout(): Promise<void> {
  await ensureCsrfCookie();

  await fetch(`${apiUrl}/logout`, {
    method: "POST",
    credentials: "include",
    headers: {
      Accept: "application/json",
      "X-XSRF-TOKEN": xsrfToken(),
    },
  });
}

export type AdminPayment = {
  id: number;
  voucher_number: string | null;
  status: "pending_payment" | "awaiting_confirmation" | "completed" | "rejected";
  amount: string;
  bank_name: string | null;
  bank_account_name: string | null;
  bank_account_number: string | null;
  bank_branch: string | null;
  payment_slip_url: string | null;
  slip_uploaded_at: string | null;
  purchased_at: string | null;
  confirmed_at: string | null;
  admin_note: string | null;
  created_at: string | null;
  student: { id: number; name: string; email: string } | null;
  course: {
    id: number;
    chapter_name: string;
    slug: string;
    grade_name: string | null;
  } | null;
  confirmed_by: { id: number; name: string } | null;
};

export async function listPayments(): Promise<AdminPayment[]> {
  const response = await fetch(`${apiUrl}/api/admin/payments`, {
    credentials: "include",
    headers: { Accept: "application/json" },
  });

  if (!response.ok) {
    throw new Error(await readApiError(response, "Could not load payments."));
  }

  return (await response.json()) as AdminPayment[];
}

export async function listPaymentConfirmations(): Promise<AdminPayment[]> {
  const response = await fetch(`${apiUrl}/api/admin/payments/confirmations`, {
    credentials: "include",
    headers: { Accept: "application/json" },
  });

  if (!response.ok) {
    throw new Error(await readApiError(response, "Could not load payment confirmations."));
  }

  return (await response.json()) as AdminPayment[];
}

export async function confirmPayment(id: number): Promise<AdminPayment> {
  await ensureCsrfCookie();

  const response = await fetch(`${apiUrl}/api/admin/payments/${id}/confirm`, {
    method: "POST",
    credentials: "include",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "X-XSRF-TOKEN": xsrfToken(),
    },
  });

  if (!response.ok) {
    throw new Error(await readApiError(response, "Could not confirm payment."));
  }

  return (await response.json()) as AdminPayment;
}

export async function rejectPayment(id: number, adminNote?: string): Promise<AdminPayment> {
  await ensureCsrfCookie();

  const response = await fetch(`${apiUrl}/api/admin/payments/${id}/reject`, {
    method: "POST",
    credentials: "include",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "X-XSRF-TOKEN": xsrfToken(),
    },
    body: JSON.stringify({ admin_note: adminNote ?? "" }),
  });

  if (!response.ok) {
    throw new Error(await readApiError(response, "Could not reject payment."));
  }

  return (await response.json()) as AdminPayment;
}
