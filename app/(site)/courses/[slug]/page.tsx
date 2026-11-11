import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, BookOpen } from "lucide-react";
import { CourseBuyPanel } from "@/components/course-buy-panel";
import { getPublishedCourse } from "@/lib/courses";

function money(value: string) {
  const amount = Number(value);
  return Number.isFinite(amount) ? amount.toFixed(2) : "0.00";
}

export default async function CourseDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const course = await getPublishedCourse(slug);

  if (!course) {
    notFound();
  }

  return (
    <main className="flex-1 bg-[#F5F8F6] py-10 sm:py-14">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <Link
          href="/courses"
          className="inline-flex items-center gap-1 text-sm font-semibold text-[#109e44] hover:text-[#0c7d36]"
        >
          <ArrowLeft className="h-4 w-4" />
          All courses
        </Link>

        <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
          <div className="overflow-hidden rounded-2xl border border-[#E2E9E4] bg-white shadow-sm">
            <div className="relative aspect-[21/9] bg-[#EAF3ED]">
              {course.thumbnail_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={course.thumbnail_url} alt="" className="h-full w-full object-cover" />
              ) : (
                <span className="absolute inset-0 flex items-center justify-center text-[#109e44]">
                  <BookOpen className="h-12 w-12" />
                </span>
              )}
            </div>

            <div className="space-y-4 p-6 sm:p-8">
              <p className="text-xs font-bold uppercase tracking-wide text-[#f37021]">
                {course.grade_name ?? "Course"}
              </p>
              <h1 className="text-3xl font-extrabold tracking-tight text-[#142319] sm:text-4xl">
                {course.chapter_name}
              </h1>
              <p className="max-w-3xl text-sm leading-relaxed text-[#5C6B61] sm:text-base">
                {course.description || "This course does not have a description yet."}
              </p>

              <div className="flex flex-wrap gap-3 pt-1 text-sm font-semibold text-[#142319]">
                <span className="rounded-full bg-[#109e44]/10 px-3 py-1 text-[#109e44]">
                  LKR {money(course.price)}
                </span>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-600">
                  {course.sub_chapters_count}{" "}
                  {course.sub_chapters_count === 1 ? "lesson" : "lessons"}
                </span>
              </div>
            </div>
          </div>

          <CourseBuyPanel
            slug={course.slug}
            price={course.price}
            lessonCount={course.sub_chapters_count}
          />
        </div>

        <section className="mt-8">
          <h2 className="text-xl font-extrabold text-[#142319]">Lessons</h2>
          {course.sub_chapters.length === 0 ? (
            <div className="mt-4 rounded-2xl border border-dashed border-[#E2E9E4] bg-white px-6 py-10 text-center text-sm text-[#5C6B61]">
              No lessons have been added to this course yet.
            </div>
          ) : (
            <div className="mt-4 space-y-3">
              {course.sub_chapters.map((lesson, index) => (
                <div
                  key={lesson.id}
                  className="flex items-start gap-4 rounded-2xl border border-[#E2E9E4] bg-white p-4 shadow-sm"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#109e44]/10 text-sm font-bold text-[#109e44]">
                    {index + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-bold text-[#142319]">{lesson.title}</h3>
                    {lesson.description ? (
                      <p className="mt-1 text-sm text-[#5C6B61]">{lesson.description}</p>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
