"use client";

import { useEffect, useRef, useState } from "react";
import {
  BookOpen,
  GraduationCap,
  TrendingDown,
  TrendingUp,
  Trophy,
  Users,
  type LucideIcon,
} from "lucide-react";

type Stat = {
  value: number;
  suffix: string;
  label: string;
  icon: LucideIcon;
  change: number;
  changeLabel: string;
};

const stats: Stat[] = [
  {
    value: 10,
    suffix: "k+",
    label: "Students Enrolled",
    icon: Users,
    change: 8,
    changeLabel: "VS Last Week",
  },
  {
    value: 50,
    suffix: "+",
    label: "Interactive Modules",
    icon: BookOpen,
    change: -1.8,
    changeLabel: "VS Last Week",
  },
  {
    value: 98,
    suffix: "%",
    label: "Success Rate",
    icon: Trophy,
    change: 18,
    changeLabel: "VS Last Week",
  },
  {
    value: 24,
    suffix: "/7",
    label: "Learning Access",
    icon: GraduationCap,
    change: -1.2,
    changeLabel: "VS Last Week",
  },
];

function easeOutCubic(t: number) {
  return 1 - (1 - t) ** 3;
}

function useCountUp(target: number, active: boolean, durationMs = 1400) {
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
      setValue(Math.round(target * easeOutCubic(progress)));
      if (progress < 1) {
        frame = requestAnimationFrame(tick);
      }
    }

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [active, durationMs, target]);

  return value;
}

function formatChange(change: number) {
  const abs = Math.abs(change);
  const formatted = Number.isInteger(abs) ? String(abs) : abs.toFixed(1);
  return `${change > 0 ? "+" : "-"}${formatted}%`;
}

function StatCard({
  value,
  suffix,
  label,
  icon: Icon,
  change,
  changeLabel,
  active,
  dark,
}: Stat & { active: boolean; dark?: boolean }) {
  const count = useCountUp(value, active);
  const up = change >= 0;

  return (
    <div
      className={`rounded-[1.35rem] p-5 transition duration-300 ease-out hover:-translate-y-0.5 motion-reduce:transition-none sm:p-6 ${
        dark
          ? "bg-[#062015] shadow-[0_12px_32px_rgba(6,32,21,0.35)] hover:shadow-[0_16px_40px_rgba(6,32,21,0.45)]"
          : "bg-white shadow-[0_12px_32px_rgba(15,23,42,0.06)] hover:shadow-[0_16px_40px_rgba(15,23,42,0.1)]"
      }`}
    >
      <div className="flex items-center gap-3">
        <span
          className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border ${
            dark ? "border-white/20 text-white/80" : "border-slate-200 text-slate-500"
          }`}
        >
          <Icon className="h-[18px] w-[18px]" strokeWidth={1.75} />
        </span>
        <p className={`text-sm font-medium ${dark ? "text-white/70" : "text-slate-500"}`}>{label}</p>
      </div>

      <p
        className={`mt-5 text-3xl font-bold tracking-tight sm:text-4xl ${
          dark ? "text-white" : "text-slate-900"
        }`}
      >
        {count}
        {suffix}
      </p>

      <div className="mt-5 flex flex-wrap items-center gap-2">
        <span
          className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold ${
            up
              ? dark
                ? "bg-[#109e44]/25 text-[#7ddea3]"
                : "bg-emerald-50 text-emerald-600"
              : dark
                ? "bg-rose-500/20 text-rose-300"
                : "bg-rose-50 text-rose-500"
          }`}
        >
          {up ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
          {formatChange(change)}
        </span>
        <span
          className={`text-xs font-medium uppercase tracking-wide ${
            dark ? "text-white/45" : "text-slate-400"
          }`}
        >
          {changeLabel}
        </span>
      </div>
    </div>
  );
}

export function HeroStats() {
  const ref = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setActive(true);
          observer.disconnect();
        }
      },
      { threshold: 0.35 },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className="grid grid-cols-2 gap-3 border-t border-slate-200/80 pt-8 sm:gap-4 lg:grid-cols-4">
      {stats.map((stat, index) => (
        <StatCard key={stat.label} {...stat} active={active} dark={index === 0} />
      ))}
    </div>
  );
}
