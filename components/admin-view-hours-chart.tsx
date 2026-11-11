"use client";

import { useEffect, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  getAdminViewHours,
  type AdminViewHoursPoint,
} from "@/lib/admin-auth";

export function AdminViewHoursChart() {
  const [series, setSeries] = useState<AdminViewHoursPoint[]>([]);
  const [totalHours, setTotalHours] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    getAdminViewHours(14)
      .then((data) => {
        setSeries(data.series);
        setTotalHours(data.total_hours);
      })
      .catch((caught: unknown) => {
        setError(caught instanceof Error ? caught.message : "Could not load view hours.");
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <section className="flex h-full min-h-[28rem] flex-col rounded-2xl border border-[#E2E9E4] bg-white p-4 shadow-[0_10px_30px_rgba(20,35,25,0.05)] sm:p-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-[#109e44]">Learning activity</p>
          <h2 className="mt-1 text-lg font-extrabold text-[#142319]">View hours</h2>
          <p className="mt-1 text-sm text-[#5C6B61]">Student watch time over the last 14 days.</p>
        </div>
        <div className="rounded-xl bg-[#109e44]/10 px-3 py-2 text-right">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-[#5C6B61]">Period total</p>
          <p className="text-lg font-extrabold text-[#109e44]">
            {loading ? "—" : `${totalHours.toFixed(1)} h`}
          </p>
        </div>
      </div>

      {error ? (
        <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      ) : null}

      <div className="mt-5 h-72 w-full">
        {loading ? (
          <div className="flex h-full items-center justify-center text-sm text-[#5C6B61]">
            Loading chart…
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={series} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="viewHoursFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#109e44" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="#109e44" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E9E4" vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fill: "#5C6B61", fontSize: 11 }}
                tickLine={false}
                axisLine={{ stroke: "#E2E9E4" }}
                minTickGap={24}
              />
              <YAxis
                tick={{ fill: "#5C6B61", fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                width={36}
                tickFormatter={(value: number) => `${value}`}
              />
              <Tooltip
                contentStyle={{
                  borderRadius: 12,
                  border: "1px solid #E2E9E4",
                  boxShadow: "0 10px 30px rgba(20,35,25,0.08)",
                }}
                labelStyle={{ color: "#142319", fontWeight: 700 }}
                formatter={(value) => [`${Number(value ?? 0).toFixed(2)} h`, "View hours"]}
              />
              <Area
                type="monotone"
                dataKey="hours"
                stroke="#109e44"
                strokeWidth={2.5}
                fill="url(#viewHoursFill)"
                activeDot={{ r: 5, fill: "#f37021", stroke: "#fff", strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </section>
  );
}
