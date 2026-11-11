"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, BookOpen } from "lucide-react";
import { currentUser } from "@/lib/admin-auth";
import { listMyCourses, type PurchasedCourse } from "@/lib/purchases";

function formatDate(value: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function MyCoursesPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<PurchasedCourse[]>([]);

  useEffect(() => {
    let active = true;

    async function load() {
      const user = await currentUser();
      if (!active) return;

      if (!user) {
        router.replace(`/login?next=${encodeURIComponent("/my-courses")}`);
        return;
      }

      if (user.roles.includes("admin")) {
        router.replace("/admin");
        return;
      }

      const courses = await listMyCourses();
      if (!active) return;
      setItems(courses);
      setLoading(false);
    }

    load();
    return () => {
      active = false;
    };
  }, [router]);

  return (
    <main className="flex-1 bg-[#F5F8F6] py-12 sm:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Link
          href="/courses"
          className="inline-flex items-center gap-1 text-sm font-semibold text-[#109e44] hover:text-[#0c7d36]"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to courses
        </Link>

        <div className="mt-6 max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-wide text-[#109e44]">Library</p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-[#142319] sm:text-4xl">
            My courses
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-[#5C6B61] sm:text-base">
            Courses you have purchased stay here for easy access.
          </p>
        </div>

        {loading ? (
          <p className="mt-10 text-sm text-[#5C6B61]">Loading your courses…</p>
        ) : items.length === 0 ? (
          <div className="mt-10 rounded-2xl border border-dashed border-[#E2E9E4] bg-white px-6 py-12 text-center">
            <p className="text-sm text-[#5C6B61]">You have not purchased any courses yet.</p>
            <Link
              href="/courses"
              className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-[#109e44] hover:text-[#0c7d36]"
            >
              Browse courses
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        ) : (
          <div className="mt-10 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {items.map((item) => {
              const course = item.course;
              if (!course) return null;

              return (
                <Link
                  key={item.id}
                  href={`/courses/${course.slug}/learn`}
                  className="group flex flex-col overflow-hidden rounded-2xl border border-[#E2E9E4] bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-[#109e44]/35 hover:shadow-[0_14px_34px_rgba(16,158,68,0.12)]"
                >
                  <div className="relative aspect-[16/10] bg-[#EAF3ED]">
                    {course.thumbnail_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={course.thumbnail_url}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span className="absolute inset-0 flex items-center justify-center text-[#109e44]">
                        <BookOpen className="h-8 w-8" />
                      </span>
                    )}
                  </div>
                  <div className="flex flex-1 flex-col p-5">
                    <p className="text-xs font-bold uppercase tracking-wide text-[#f37021]">
                      {course.grade_name ?? "Course"}
                    </p>
                    <h2 className="mt-2 text-lg font-bold text-[#142319]">
                      {course.chapter_name}
                    </h2>
                    <p className="mt-2 line-clamp-2 flex-1 text-sm leading-relaxed text-[#5C6B61]">
                      {course.description || "Continue watching lessons and track your progress."}
                    </p>
                    <div className="mt-5 flex items-center justify-between border-t border-[#E2E9E4] pt-4 text-xs font-semibold text-[#5C6B61]">
                      <span>Bought {formatDate(item.purchased_at)}</span>
                      <span className="inline-flex items-center gap-1 text-[#109e44]">
                        Continue
                        <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
