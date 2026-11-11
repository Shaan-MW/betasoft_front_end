import Image from "next/image";
import Link from "next/link";
import { Award, BookOpen, PlayCircle } from "lucide-react";
import { HeroStats } from "@/components/hero-stats";

export function HeroSection() {
  return (
    <section className="relative isolate overflow-hidden py-16 lg:py-24">
      <div className="absolute inset-0 -z-10 bg-slate-100">
        <Image
          src="/hero-bg.jpg"
          alt=""
          fill
          priority
          sizes="100vw"
          className="h-full w-full object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-white via-white/70 to-white/25" />
        <div className="absolute inset-0 bg-gradient-to-b from-white/20 via-transparent to-white/40" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12 lg:gap-8">
          <div className="space-y-6 text-left lg:col-span-7">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#109e44]/25 bg-[#109e44]/10 px-3.5 py-1.5 text-xs font-semibold text-[#0c7d36] sm:text-sm">
              <span className="flex h-2 w-2 animate-pulse rounded-full bg-[#109e44]" />
              Empowering ICT & Computer Science Learners
            </div>

            <h1 className="text-4xl font-extrabold leading-[1.12] tracking-tight text-slate-900 sm:text-5xl lg:text-6xl">
              Let’s make <br className="hidden sm:inline" />
              <span className="bg-gradient-to-r from-[#109e44] to-[#22c55e] bg-clip-text text-transparent">
                computing simple.
              </span>
            </h1>

            <div className="max-w-xl space-y-3 text-base leading-relaxed text-slate-600 sm:text-lg">
              <p>Master O/L &amp; A/L ICT, Programming, and Modern Tech Skills.</p>
              <p>
                Your all-in-one interactive platform to learn ICT theory, practice code hands-on, and
                master core IT concepts for exam success and real-world tech careers.
              </p>
            </div>

            <div className="flex flex-col items-stretch gap-4 pt-2 sm:flex-row sm:items-center">
              <Link
                href="/courses"
                className="inline-flex items-center justify-center rounded-lg bg-[#f37021] px-6 py-3.5 text-center text-base font-semibold text-white shadow-md transition-all duration-200 hover:bg-[#e05f10] hover:shadow-lg"
              >
                Explore Courses
              </Link>
              <a
                href="#demo"
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-6 py-3.5 text-center text-base font-semibold text-slate-700 shadow-sm transition-all duration-200 hover:bg-slate-50"
              >
                <PlayCircle className="h-5 w-5 text-[#109e44]" />
                Watch Platform Demo
              </a>
            </div>

            <HeroStats />
          </div>

          <div className="relative lg:col-span-5">
            <div className="relative mx-auto max-w-md lg:max-w-none">
              <div className="relative rounded-2xl border border-slate-800 bg-slate-900 p-6 text-white shadow-2xl">
                <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                  <div className="flex items-center gap-2">
                    <span className="inline-block h-3 w-3 rounded-full bg-rose-500" />
                    <span className="inline-block h-3 w-3 rounded-full bg-amber-500" />
                    <span className="inline-block h-3 w-3 rounded-full bg-emerald-500" />
                  </div>
                  <span className="font-mono text-xs text-slate-400">betasoft.config.js</span>
                </div>

                <div className="space-y-2 pt-4 font-mono text-xs leading-relaxed text-slate-300 sm:text-sm">
                  <p className="text-purple-400">
                    const <span className="text-amber-300">betasoftLMS</span> = {"{"}
                  </p>
                  <p className="pl-4">
                    mission: <span className="text-emerald-400">&apos;Make Computing Simple&apos;</span>,
                  </p>
                  <p className="pl-4">skills: [</p>
                  <p className="pl-8 text-orange-300">&apos;Fullstack Dev&apos;,</p>
                  <p className="pl-8 text-orange-300">&apos;Database Admin&apos;,</p>
                  <p className="pl-8 text-orange-300">&apos;Cybersecurity&apos;</p>
                  <p className="pl-4">],</p>
                  <p className="pl-4">
                    readyToLearn: <span className="text-blue-400">true</span>
                  </p>
                  <p>{"}"};</p>
                  <p className="pt-3 text-slate-500">// Start building real projects today</p>
                </div>
              </div>

              <div className="absolute -bottom-6 -left-6 hidden items-center gap-3 rounded-xl border border-slate-100 bg-white p-4 shadow-xl sm:flex">
                <div className="rounded-lg bg-[#109e44]/15 p-2.5 text-[#109e44]">
                  <Award className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-400">Verified Certificate</p>
                  <p className="text-sm font-bold text-slate-800">Industry Ready</p>
                </div>
              </div>

              <div className="absolute -top-6 -right-6 hidden items-center gap-3 rounded-xl border border-slate-100 bg-white p-4 shadow-xl sm:flex">
                <div className="rounded-lg bg-[#f37021]/15 p-2.5 text-[#f37021]">
                  <BookOpen className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-400">Updated Curriculum</p>
                  <p className="text-sm font-bold text-slate-800">Hands-on Labs</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
