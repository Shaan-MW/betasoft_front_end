"use client";

import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import {
  ArrowRight,
  BadgeCheck,
  BookMarked,
  Clock3,
  Users,
  type LucideIcon,
} from "lucide-react";
import {
  getAdminDashboardStats,
  getAdminViewHours,
  type AdminDashboardStats,
} from "@/lib/admin-auth";

type HoursRange = "daily" | "weekly" | "monthly";

const RANGE_DAYS: Record<HoursRange, number> = {
  daily: 1,
  weekly: 7,
  monthly: 30,
};

function easeOutCubic(t: number) {
  return 1 - (1 - t) ** 3;
}

function useCountUp(target: number, active: boolean, decimals = 0, durationMs = 1100) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!active) {
      setValue(0);
      return;
    }

    let frame = 0;
    const startedAt = performance.now();

    function tick(now: number) {
      const progress = Math.min(1, (now - startedAt) / durationMs);
      const next = target * easeOutCubic(progress);
      setValue(decimals > 0 ? Number(next.toFixed(decimals)) : Math.round(next));
      if (progress < 1) {
        frame = requestAnimationFrame(tick);
      }
    }

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [active, decimals, durationMs, target]);

  return value;
}

function CardShell({
  href,
  dark = false,
  accentClass,
  children,
}: {
  href: string;
  dark?: boolean;
  accentClass: string;
  children: ReactNode;
}) {
  return (
    <div
      className={`group relative overflow-hidden rounded-2xl p-4 transition duration-300 ease-out hover:-translate-y-0.5 motion-reduce:transition-none sm:p-5 ${
        dark
          ? "bg-[#062015] text-white shadow-[0_12px_28px_rgba(6,32,21,0.35)] hover:shadow-[0_16px_34px_rgba(6,32,21,0.45)]"
          : "border border-[#E2E9E4]/90 bg-white/95 text-slate-900 shadow-[0_10px_28px_rgba(15,23,42,0.05)] hover:shadow-[0_14px_34px_rgba(16,158,68,0.1)]"
      }`}
    >
      <Link
        href={href}
        className="absolute inset-0 z-0 rounded-2xl"
        aria-label="Open details"
      />
      <div
        className={`pointer-events-none absolute -top-8 -right-8 h-20 w-20 rounded-full blur-2xl transition duration-500 group-hover:scale-110 ${accentClass}`}
      />
      <div className="relative z-10">{children}</div>
      <span
        className={`pointer-events-none absolute right-4 bottom-3 z-10 inline-flex items-center gap-1 text-xs font-semibold opacity-0 transition duration-300 ease-out group-hover:opacity-100 group-focus-within:opacity-100 motion-reduce:transition-none sm:right-5 ${
          dark ? "text-[#7ddea3]" : "text-[#109e44]"
        }`}
      >
        View
        <ArrowRight className="h-3 w-3 transition duration-300 group-hover:translate-x-0.5" />
      </span>
    </div>
  );
}

function IconBadge({
  icon: Icon,
  dark = false,
  tone = "green",
}: {
  icon: LucideIcon;
  dark?: boolean;
  tone?: "green" | "orange" | "amber";
}) {
  const tones = {
    green: dark
      ? "border-white/15 bg-white/5 text-[#7ddea3]"
      : "border-[#109e44]/15 bg-[#109e44]/10 text-[#109e44]",
    orange: "border-[#f37021]/20 bg-[#f37021]/10 text-[#f37021]",
    amber: "border-amber-200 bg-amber-50 text-amber-700",
  };

  return (
    <span
      className={`inline-flex h-9 w-9 items-center justify-center rounded-xl border transition duration-300 group-hover:scale-105 ${tones[tone]}`}
    >
      <Icon className="h-4 w-4" strokeWidth={1.85} />
    </span>
  );
}

function StatusPill({
  children,
  tone = "green",
  dark = false,
}: {
  children: ReactNode;
  tone?: "green" | "amber" | "orange";
  dark?: boolean;
}) {
  const tones = {
    green: dark
      ? "border-[#109e44]/30 bg-[#109e44]/20 text-[#7ddea3]"
      : "border-emerald-200/80 bg-emerald-50 text-emerald-700",
    amber: "border-amber-200 bg-amber-50 text-amber-700",
    orange: "border-[#f37021]/25 bg-[#f37021]/10 text-[#e05f10]",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold ${tones[tone]}`}
    >
      {children}
    </span>
  );
}

export function AdminDashboardStats() {
  const [stats, setStats] = useState<AdminDashboardStats | null>(null);
  const [hoursTotal, setHoursTotal] = useState(0);
  const [hoursRange, setHoursRange] = useState<HoursRange>("weekly");
  const [hoursReady, setHoursReady] = useState(false);
  const [error, setError] = useState("");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    getAdminDashboardStats()
      .then((data) => {
        setStats(data);
        setReady(true);
      })
      .catch((caught: unknown) => {
        setError(caught instanceof Error ? caught.message : "Could not load dashboard stats.");
      });
  }, []);

  useEffect(() => {
    const days = RANGE_DAYS[hoursRange];
    setHoursReady(false);
    getAdminViewHours(Math.max(days, 7))
      .then((data) => {
        const sliced = data.series.slice(-days);
        setHoursTotal(Number(sliced.reduce((sum, point) => sum + point.hours, 0).toFixed(1)));
        setHoursReady(true);
      })
      .catch(() => {
        setHoursTotal(0);
        setHoursReady(true);
      });
  }, [hoursRange]);

  const students = stats?.students ?? 0;
  const chapters = stats?.chapters ?? 0;
  const published = stats?.published_chapters ?? 0;
  const pending = stats?.pending_confirmations ?? 0;
  const completedPurchases = stats?.completed_purchases ?? 0;
  const studentsCount = useCountUp(students, ready);
  const chaptersCount = useCountUp(chapters, ready);
  const pendingCount = useCountUp(pending, ready);
  const hoursCount = useCountUp(hoursTotal, hoursReady, 1);

  return (
    <div className="space-y-4">
      {error ? <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-4">
        <CardShell href="/admin/students" dark accentClass="bg-[#109e44]/25">
          <div className="flex items-center justify-between gap-3">
            <IconBadge icon={Users} dark tone="green" />
            <StatusPill dark tone="green">
              {completedPurchases} purchases
            </StatusPill>
          </div>
          <p className="mt-3 text-[11px] font-semibold tracking-wider text-white/50 uppercase">
            Students Enrolled
          </p>
          <p className="mt-1 pb-4 text-3xl font-extrabold tracking-tight">
            {stats === null ? "—" : studentsCount}
          </p>
        </CardShell>

        <CardShell href="/admin/chapters" accentClass="bg-[#f37021]/15">
          <div className="flex items-center justify-between gap-3">
            <IconBadge icon={BookMarked} tone="orange" />
            <StatusPill tone="orange">{published} published</StatusPill>
          </div>
          <p className="mt-3 text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
            Course Chapters
          </p>
          <p className="mt-1 pb-4 text-3xl font-extrabold tracking-tight text-slate-900">
            {stats === null ? "—" : chaptersCount}
          </p>
        </CardShell>

        <CardShell href="/admin/payments/confirmations" accentClass="bg-amber-400/15">
          <div className="flex items-center justify-between gap-3">
            <IconBadge icon={BadgeCheck} tone="amber" />
            <StatusPill tone={pending > 0 ? "amber" : "green"}>
              {pending > 0 ? "Needs review" : "Clear"}
            </StatusPill>
          </div>
          <p className="mt-3 text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
            Pending Confirmations
          </p>
          <p className="mt-1 pb-4 text-3xl font-extrabold tracking-tight text-slate-900">
            {stats === null ? "—" : pendingCount}
          </p>
        </CardShell>

        <CardShell href="/admin/students/progress" accentClass="bg-[#109e44]/12">
          <div className="flex items-center justify-between gap-3">
            <IconBadge icon={Clock3} tone="green" />
            <div className="relative z-20 flex rounded-lg border border-slate-200 bg-slate-100 p-0.5 text-[11px] font-semibold">
              {(
                [
                  ["daily", "D"],
                  ["weekly", "W"],
                  ["monthly", "M"],
                ] as const
              ).map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setHoursRange(key)}
                  className={`rounded-md px-2 py-0.5 transition ${
                    hoursRange === key
                      ? "bg-white text-slate-800 shadow-sm"
                      : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          <p className="mt-3 text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
            Study Time
          </p>
          <p className="mt-1 pb-4 text-3xl font-extrabold tracking-tight text-slate-900">
            {hoursCount}
            <span className="ml-1 text-base font-semibold text-slate-400">hrs</span>
          </p>
        </CardShell>
      </div>
    </div>
  );
}
