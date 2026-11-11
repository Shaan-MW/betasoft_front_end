"use client";

import { AdminDashboardStats } from "@/components/admin-dashboard-stats";
import { AdminTopCourses } from "@/components/admin-top-courses";
import { AdminViewHoursChart } from "@/components/admin-view-hours-chart";

export default function AdminDashboardPage() {
  return (
    <div className="w-full px-4 py-4">
      <AdminDashboardStats />

      <div className="mt-6 grid grid-cols-1 gap-3 sm:gap-4 lg:grid-cols-4">
        <div className="lg:col-span-3">
          <AdminViewHoursChart />
        </div>
        <div className="lg:col-span-1">
          <AdminTopCourses />
        </div>
      </div>
    </div>
  );
}
