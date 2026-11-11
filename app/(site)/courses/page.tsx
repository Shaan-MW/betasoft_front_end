import Link from "next/link";
import { ArrowLeft, ArrowRight, BookOpen } from "lucide-react";
import { listPublishedCourses } from "@/lib/courses";

function money(value: string) {
  const amount = Number(value);
  return Number.isFinite(amount) ? amount.toFixed(2) : "0.00";
}

export default async function CoursesPage() {
  const courses = await listPublishedCourses();

  return (
    <main className="flex-1 bg-[#F5F8F6] py-12 sm:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-sm font-semibold text-[#109e44] hover:text-[#0c7d36]"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to home
        </Link>

        <div className="mt-6 max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-wide text-[#109e44]">Courses</p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-[#142319] sm:text-4xl">
            All published courses
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-[#5C6B61] sm:text-base">
            Every course published by Betasoft LMS, ordered for learning.
          </p>
        </div>

        {courses.length === 0 ? (
          <div className="mt-10 rounded-2xl border border-dashed border-[#E2E9E4] bg-white px-6 py-12 text-center text-sm text-[#5C6B61]">
            No published courses yet.
          </div>
        ) : (
          <div className="mt-10 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {courses.map((course) => (
              <Link
                key={course.id}
                href={`/courses/${course.slug}`}
                className="group flex flex-col overflow-hidden rounded-2xl border border-[#E2E9E4] bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-[#109e44]/35 hover:shadow-[0_14px_34px_rgba(16,158,68,0.12)]"
              >
                <div className="relative aspect-[16/10] bg-[#EAF3ED]">
                  {course.thumbnail_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={course.thumbnail_url} alt="" className="h-full w-full object-cover" />
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
                  <h2 className="mt-2 text-lg font-bold text-[#142319]">{course.chapter_name}</h2>
                  <p className="mt-2 line-clamp-3 flex-1 text-sm leading-relaxed text-[#5C6B61]">
                    {course.description || "Open this course to view its lessons and details."}
                  </p>
                  <div className="mt-5 flex items-center justify-between border-t border-[#E2E9E4] pt-4">
                    <span className="text-xs font-semibold text-[#5C6B61]">
                      {course.sub_chapters_count}{" "}
                      {course.sub_chapters_count === 1 ? "lesson" : "lessons"} · LKR {money(course.price)}
                    </span>
                    <span className="inline-flex items-center gap-1 text-sm font-semibold text-[#109e44]">
                      View & buy
                      <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
