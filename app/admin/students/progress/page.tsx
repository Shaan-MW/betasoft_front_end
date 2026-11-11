"use client";

import { Fragment, useEffect, useState } from "react";
import { listStudentProgress, type StudentProgressRow } from "@/lib/admin-auth";

function formatDate(value: string | null) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-LK", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export default function AdminStudentProgressPage() {
  const [rows, setRows] = useState<StudentProgressRow[] | null>(null);
  const [error, setError] = useState("");
  const [expandedId, setExpandedId] = useState<number | null>(null);

  useEffect(() => {
    listStudentProgress()
      .then(setRows)
      .catch((caught: unknown) => {
        setRows([]);
        setError(caught instanceof Error ? caught.message : "Could not load student progress.");
      });
  }, []);

  return (
    <div className="w-full px-4 py-4">
      {error ? <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}

      {rows === null ? (
        <p className="text-sm text-[#5C6B61]">Loading student progress...</p>
      ) : rows.length === 0 && !error ? (
        <div className="rounded-2xl border border-dashed border-[#E2E9E4] bg-white px-6 py-12 text-center text-sm text-[#5C6B61]">
          No students yet.
        </div>
      ) : rows.length > 0 ? (
        <div className="overflow-x-auto rounded-2xl border border-[#E2E9E4] bg-white shadow-sm">
          <table className="admin-table w-full min-w-[980px] text-left text-sm">
            <thead>
              <tr>
                <th className="px-4 py-3">Student</th>
                <th className="px-4 py-3">Courses</th>
                <th className="px-4 py-3">Videos</th>
                <th className="px-4 py-3">Progress</th>
                <th className="px-4 py-3">View hours</th>
                <th className="px-4 py-3">Last watched</th>
                <th className="px-4 py-3">Details</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const open = expandedId === row.id;
                return (
                  <Fragment key={row.id}>
                    <tr className="admin-data-row">
                      <td className="px-4 py-3">
                        <p className="font-semibold text-slate-900">{row.name}</p>
                        <p className="text-xs text-slate-500">{row.email}</p>
                      </td>
                      <td className="px-4 py-3 font-semibold text-slate-900">
                        {row.enrolled_courses}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {row.completed_videos}/{row.total_videos}
                      </td>
                      <td className="px-4 py-3">
                        <div className="min-w-[120px]">
                          <div className="mb-1 flex items-center justify-between text-xs font-semibold text-[#5C6B61]">
                            <span>{row.percent}%</span>
                          </div>
                          <div className="h-2 overflow-hidden rounded-full bg-[#EAF3ED]">
                            <div
                              className="h-full rounded-full bg-[#109e44]"
                              style={{ width: `${row.percent}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 font-semibold text-slate-900">
                        {row.view_hours.toFixed(2)} h
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {formatDate(row.last_watched_at)}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          onClick={() => setExpandedId(open ? null : row.id)}
                          className="rounded-lg border border-[#E2E9E4] px-3 py-1.5 text-xs font-bold text-[#109e44] transition hover:border-[#109e44]/40"
                        >
                          {open ? "Hide" : "View"}
                        </button>
                      </td>
                    </tr>
                    {open ? (
                      <tr className="border-b border-slate-100 bg-[#F5F8F6]/70">
                        <td colSpan={7} className="px-4 py-4">
                          {row.courses.length === 0 ? (
                            <p className="text-sm text-[#5C6B61]">No enrolled courses yet.</p>
                          ) : (
                            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                              {row.courses.map((course) => (
                                <div
                                  key={`${row.id}-${course.chapter_id}`}
                                  className="rounded-xl border border-[#E2E9E4] bg-white p-3"
                                >
                                  <p className="font-semibold text-[#142319]">
                                    {course.chapter_name ?? "Course"}
                                  </p>
                                  <p className="mt-1 text-xs text-[#5C6B61]">
                                    {course.completed_videos}/{course.total_videos} videos ·{" "}
                                    {course.percent}%
                                  </p>
                                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#EAF3ED]">
                                    <div
                                      className="h-full rounded-full bg-[#f37021]"
                                      style={{ width: `${course.percent}%` }}
                                    />
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </td>
                      </tr>
                    ) : null}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  );
}
