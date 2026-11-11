"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight } from "lucide-react";
import { getAdminTopCourses, type AdminTopCourse } from "@/lib/admin-auth";

const barTones = [
  "bg-[#109e44]",
  "bg-[#f37021]",
  "bg-[#0c7d36]",
  "bg-[#e05f10]",
  "bg-[#5C6B61]",
];

export function AdminTopCourses() {
  const [courses, setCourses] = useState<AdminTopCourse[] | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    getAdminTopCourses(5)
      .then((data) => setCourses(data.courses))
      .catch((caught: unknown) => {
        setCourses([]);
        setError(caught instanceof Error ? caught.message : "Could not load top courses.");
      });
  }, []);

  return (
    <section className="flex h-full flex-col rounded-2xl border border-[#E2E9E4] bg-white p-4 shadow-[0_10px_30px_rgba(20,35,25,0.05)] sm:p-5">
      <div className="mb-4">
        <p className="text-xs font-bold uppercase tracking-wide text-[#109e44]">Engagement</p>
        <h2 className="mt-1 text-lg font-extrabold text-[#142319]">Most watched</h2>
        <p className="mt-1 text-sm text-[#5C6B61]">Courses ranked by total student watch time.</p>
      </div>

      {error ? <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">{error}</p> : null}

      <div className="flex-1 space-y-4">
        {courses === null ? (
          <p className="text-sm text-[#5C6B61]">Loading courses…</p>
        ) : courses.length === 0 ? (
          <p className="rounded-xl border border-dashed border-[#E2E9E4] px-3 py-8 text-center text-sm text-[#5C6B61]">
            No watch activity yet.
          </p>
        ) : (
          courses.map((course, index) => (
            <div key={course.id} className="space-y-1.5">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-900">
                    {course.chapter_name}
                  </p>
                  <p className="truncate text-[11px] text-[#5C6B61]">
                    {course.grade_name ?? "Course"}
                    {" · "}
                    {course.learners} learner{course.learners === 1 ? "" : "s"}
                  </p>
                </div>
                <p className="shrink-0 text-xs font-bold tabular-nums text-[#109e44]">
                  {course.view_hours.toFixed(1)} h
                </p>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                <div
                  className={`h-full rounded-full transition-all duration-700 ease-out ${barTones[index % barTones.length]}`}
                  style={{ width: `${Math.max(course.share_percent, 6)}%` }}
                />
              </div>
            </div>
          ))
        )}
      </div>

      <Link
        href="/admin/students/progress"
        className="mt-5 inline-flex items-center justify-center gap-1.5 rounded-xl border border-[#E2E9E4] bg-[#F5F8F6] px-3 py-2.5 text-sm font-semibold text-[#109e44] transition hover:border-[#109e44]/30 hover:bg-[#109e44]/10"
      >
        View more
        <ArrowRight className="h-3.5 w-3.5" />
      </Link>
    </section>
  );
}
