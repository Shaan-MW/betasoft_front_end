"use client";

import { useEffect, useState } from "react";
import { listStudents, type StudentAccount } from "@/lib/admin-auth";

function joinedOn(value: string) {
  return new Intl.DateTimeFormat("en-LK", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

export default function AdminStudentsPage() {
  const [students, setStudents] = useState<StudentAccount[] | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    listStudents()
      .then(setStudents)
      .catch((caught: unknown) => {
        setStudents([]);
        setError(caught instanceof Error ? caught.message : "Could not load students.");
      });
  }, []);

  return (
    <div className="w-full px-4 py-4">
      {error ? <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}

      {students === null ? (
        <p className="text-sm text-[#5C6B61]">Loading students...</p>
      ) : students.length === 0 && !error ? (
        <div className="rounded-2xl border border-dashed border-[#E2E9E4] bg-white px-6 py-12 text-center text-sm text-[#5C6B61]">
          No students yet.
        </div>
      ) : students.length > 0 ? (
        <div className="overflow-x-auto rounded-2xl border border-[#E2E9E4] bg-white shadow-sm">
          <table className="admin-table w-full text-left text-sm">
            <thead>
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Joined</th>
              </tr>
            </thead>
            <tbody>
              {students.map((student) => (
                <tr key={student.id} className="admin-data-row">
                  <td className="px-4 py-3 font-semibold text-slate-900">{student.name}</td>
                  <td className="px-4 py-3 text-slate-600">{student.email}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-bold uppercase ${
                        student.status === "active"
                          ? "bg-[#109e44]/10 text-[#109e44]"
                          : "bg-red-50 text-red-700"
                      }`}
                    >
                      {student.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{joinedOn(student.joined_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  );
}
