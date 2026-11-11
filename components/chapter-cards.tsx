import Link from "next/link";
import { ArrowRight, BookOpen } from "lucide-react";
import { listPublishedCourses } from "@/lib/courses";

function money(value: string) {
  const amount = Number(value);
  return Number.isFinite(amount) ? amount.toFixed(2) : "0.00";
}

export async function ChapterCards() {
  const courses = await listPublishedCourses(4);

  return (
    <section id="chapters" className="bg-[#F5F8F6] py-14 sm:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-wide text-[#109e44]">Courses</p>
          <h2 className="mt-2 text-2xl font-extrabold tracking-tight text-[#142319] sm:text-3xl">
            Explore published ICT courses
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-[#5C6B61] sm:text-base">
            Browse chapters published by Betasoft LMS for exam prep and hands-on learning.
          </p>
        </div>

        {courses.length === 0 ? (
          <div className="mt-8 rounded-2xl border border-dashed border-[#E2E9E4] bg-white px-6 py-12 text-center text-sm text-[#5C6B61]">
            No published courses yet. Check back soon.
          </div>
        ) : (
          <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {courses.map((course) => (
              <Link
                key={course.id}
                href={`/courses/${course.slug}`}
                className="group flex flex-col overflow-hidden rounded-2xl border border-[#E2E9E4] bg-white shadow-[0_10px_30px_rgba(20,35,25,0.05)] transition hover:-translate-y-0.5 hover:border-[#109e44]/35 hover:shadow-[0_14px_34px_rgba(16,158,68,0.12)]"
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
                  <h3 className="mt-2 text-lg font-bold text-[#142319]">{course.chapter_name}</h3>
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

        <div className="mt-6 flex justify-center">
          <Link
            href="/courses"
            className="inline-flex items-center gap-1 text-sm font-semibold text-[#109e44] transition hover:text-[#0c7d36]"
          >
            View all
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </section>
  );
}
