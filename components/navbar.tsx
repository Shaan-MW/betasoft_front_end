"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { currentUser, logout, type AuthUser } from "@/lib/admin-auth";
import { TopLoadingBar } from "@/components/top-loading-bar";

const exploreLinks = [
  { label: "A/L ICT", href: "#" },
  { label: "O/L ICT", href: "#" },
  { label: "Programming", href: "#" },
  { label: "Networking", href: "#" },
];

function SearchField({ className = "" }: { className?: string }) {
  return (
    <label className={`relative block ${className}`}>
      <span className="sr-only">Search</span>
      <svg
        className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
        viewBox="0 0 20 20"
        fill="currentColor"
        aria-hidden="true"
      >
        <path
          fillRule="evenodd"
          d="M9 3.5a5.5 5.5 0 013.98 9.32l3.6 3.6a.75.75 0 11-1.06 1.06l-3.6-3.6A5.5 5.5 0 119 3.5zM5 9a4 4 0 108 0 4 4 0 00-8 0z"
          clipRule="evenodd"
        />
      </svg>
      <input
        type="search"
        placeholder="Search courses, skills, instructors..."
        className="w-full rounded-full border border-slate-200 bg-slate-100 py-2.5 pl-10 pr-4 text-sm text-slate-800 transition-all focus:border-[#109e44] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#109e44]"
      />
    </label>
  );
}

export function Navbar() {
  const pathname = usePathname();
  const [exploreOpen, setExploreOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [user, setUser] = useState<AuthUser | null>(null);
  const exploreRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onPointerDown(event: MouseEvent) {
      if (!exploreRef.current?.contains(event.target as Node)) {
        setExploreOpen(false);
      }
    }

    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, []);

  useEffect(() => {
    currentUser().then(setUser);
  }, [pathname]);

  async function signOut() {
    await logout();
    setUser(null);
  }

  return (
    <header className="sticky top-0 z-50 border-b-[5px] border-[#f37021] bg-white shadow-sm [&_button]:cursor-pointer">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-3 lg:gap-6">
          <div className="flex shrink-0 items-center gap-4 lg:gap-6">
            <a href="/" className="flex min-w-0 items-center gap-2.5">
              <Image
                src="/main_logo.png"
                alt="Betasoft logo"
                width={40}
                height={40}
                priority
                className="h-10 w-10 shrink-0 object-contain"
              />
              <span className="whitespace-nowrap text-lg font-extrabold tracking-tight text-slate-900">
                Betasoft <span className="text-[#109e44]">LMS</span>
              </span>
            </a>

            <div ref={exploreRef} className="relative hidden sm:block">
              <button
                type="button"
                aria-expanded={exploreOpen}
                aria-controls="explore-menu"
                onClick={() => setExploreOpen((open) => !open)}
                className="flex items-center gap-1.5 py-2 text-sm font-semibold text-slate-700 transition-colors hover:text-[#109e44]"
              >
                Explore
                <svg
                  className={`h-3.5 w-3.5 transition-transform ${exploreOpen ? "rotate-180" : ""}`}
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    d="M5.23 7.21a.75.75 0 011.06.02L10 11.17l3.71-3.94a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
              {exploreOpen ? (
                <div
                  id="explore-menu"
                  className="absolute left-0 top-full z-50 mt-2 w-56 rounded-xl border border-slate-200 bg-white py-2 shadow-lg"
                >
                  <Link
                    href="/courses"
                    className="block px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-[#109e44]"
                    onClick={() => setExploreOpen(false)}
                  >
                    All courses
                  </Link>
                  {exploreLinks.map((item) => (
                    <a
                      key={item.label}
                      href={item.href}
                      className="block px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-[#109e44]"
                    >
                      {item.label}
                    </a>
                  ))}
                </div>
              ) : null}
            </div>

            <Link
              href="/courses"
              className="hidden text-sm font-semibold text-slate-700 transition-colors hover:text-[#109e44] md:inline"
            >
              Courses
            </Link>
          </div>

          <div className="hidden min-w-0 flex-1 justify-center md:flex">
            <SearchField className="w-full max-w-2xl" />
          </div>

          <div className="flex shrink-0 items-center gap-1 sm:gap-2">
            {user ? (
              <>
                {!user.roles.includes("admin") ? (
                  <Link
                    href="/my-courses"
                    className="hidden px-3 py-2 text-sm font-semibold text-slate-700 transition-colors hover:text-[#109e44] sm:inline"
                  >
                    My courses
                  </Link>
                ) : null}
                <span className="hidden max-w-40 truncate px-2 text-sm font-semibold text-slate-800 sm:inline">
                  {user.name}
                </span>
                <button
                  type="button"
                  onClick={signOut}
                  className="cursor-pointer px-3 py-2 text-sm font-semibold text-slate-700 transition-colors hover:text-[#109e44]"
                >
                  Log out
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="cursor-pointer px-3 py-2 text-sm font-semibold text-slate-700 transition-colors hover:text-[#109e44]"
                >
                  Login
                </Link>
                <Link
                  href="/join"
                  className="cursor-pointer whitespace-nowrap rounded-lg bg-[#f37021] px-3.5 py-2 text-sm font-bold text-white shadow-sm transition-colors hover:bg-[#e05f10] sm:px-4"
                >
                  Join BLMS
                </Link>
              </>
            )}
            <button
              type="button"
              className="ml-1 rounded-lg p-2 text-slate-700 hover:bg-slate-50 hover:text-[#109e44] sm:hidden"
              aria-expanded={mobileOpen}
              aria-controls="mobile-menu"
              aria-label={mobileOpen ? "Close menu" : "Open menu"}
              onClick={() => setMobileOpen((open) => !open)}
            >
              <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path
                  fillRule="evenodd"
                  d="M2 4.75A.75.75 0 012.75 4h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 4.75zM2 10a.75.75 0 01.75-.75h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 10zm0 5.25a.75.75 0 01.75-.75h14.5a.75.75 0 010 1.5H2.75a.75.75 0 01-.75-.75z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </div>
        </div>

        <div className="pb-3 md:hidden">
          <SearchField />
        </div>
      </div>

      {mobileOpen ? (
        <div id="mobile-menu" className="border-t border-slate-200 bg-white sm:hidden">
          <nav className="mx-auto max-w-7xl space-y-1 px-4 py-3">
            <Link
              href="/courses"
              className="block px-2 py-2 text-sm font-semibold text-slate-700 hover:text-[#109e44]"
              onClick={() => setMobileOpen(false)}
            >
              Courses
            </Link>
            {user && !user.roles.includes("admin") ? (
              <Link
                href="/my-courses"
                className="block px-2 py-2 text-sm font-semibold text-slate-700 hover:text-[#109e44]"
                onClick={() => setMobileOpen(false)}
              >
                My courses
              </Link>
            ) : null}
            <p className="px-2 pb-1 pt-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Explore
            </p>
            {exploreLinks.map((item) => (
              <a
                key={item.label}
                href={item.href}
                className="block px-2 py-2 text-sm font-semibold text-slate-700 hover:text-[#109e44]"
                onClick={() => setMobileOpen(false)}
              >
                {item.label}
              </a>
            ))}
          </nav>
        </div>
      ) : null}
      <TopLoadingBar />
    </header>
  );
}
