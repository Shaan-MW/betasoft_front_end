"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, useSyncExternalStore } from "react";
import {
  ArrowLeft,
  BadgeCheck,
  BookMarked,
  BookOpen,
  ChartColumnIncreasing,
  ChevronDown,
  KeyRound,
  LayoutDashboard,
  LayoutGrid,
  ListTree,
  LogOut,
  Video,
  Maximize,
  Minimize,
  GraduationCap,
  PanelLeftClose,
  PanelLeftOpen,
  Settings,
  Shield,
  UserCog,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { currentUser, logout, type AuthUser } from "@/lib/admin-auth";
import { TopLoadingBar } from "@/components/top-loading-bar";

const overviewTabs: { href: string; label: string; icon: LucideIcon }[] = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
];

const settingsTabs: { href: string; label: string; icon: LucideIcon }[] = [
  { href: "/admin/settings/grade", label: "Grade", icon: GraduationCap },
  { href: "/admin/settings/roles", label: "Roles", icon: Shield },
  { href: "/admin/settings/users", label: "Users", icon: UserCog },
  { href: "/admin/settings/permissions", label: "Permissions", icon: KeyRound },
];

const studentTabs: { href: string; label: string; icon: LucideIcon }[] = [
  { href: "/admin/students", label: "All students", icon: Users },
  { href: "/admin/students/progress", label: "Student progress", icon: ChartColumnIncreasing },
];

const chapterTabs: { href: string; label: string; icon: LucideIcon }[] = [
  { href: "/admin/chapters", label: "Main chapters", icon: BookMarked },
  { href: "/admin/sub-chapters", label: "Sub chapters", icon: ListTree },
  { href: "/admin/sub-chapter-videos", label: "Videos", icon: Video },
];

const paymentTabs: { href: string; label: string; icon: LucideIcon }[] = [
  { href: "/admin/payments", label: "Overall payments", icon: Wallet },
  { href: "/admin/payments/confirmations", label: "Payment confirmations", icon: BadgeCheck },
];

const pageMeta: { match: (pathname: string) => boolean; title: string; description: string }[] = [
  {
    match: (pathname) => pathname === "/admin/settings/grade" || pathname.startsWith("/admin/settings/grade/"),
    title: "Grade",
    description: "Manage grades used across chapters and students.",
  },
  {
    match: (pathname) => pathname === "/admin/settings/roles" || pathname.startsWith("/admin/settings/roles/"),
    title: "Roles",
    description: "Create and manage access roles.",
  },
  {
    match: (pathname) => pathname === "/admin/settings/users" || pathname.startsWith("/admin/settings/users/"),
    title: "Users",
    description: "Create users and assign roles.",
  },
  {
    match: (pathname) =>
      pathname === "/admin/settings/permissions" || pathname.startsWith("/admin/settings/permissions/"),
    title: "Permissions",
    description: "Assign permissions to roles.",
  },
  {
    match: (pathname) =>
      pathname === "/admin/sub-chapter-videos" || pathname.startsWith("/admin/sub-chapter-videos/"),
    title: "Videos",
    description: "Lesson videos inside each sub chapter.",
  },
  {
    match: (pathname) => pathname === "/admin/sub-chapters" || pathname.startsWith("/admin/sub-chapters/"),
    title: "Sub chapters",
    description: "Sections inside a main chapter.",
  },
  {
    match: (pathname) => pathname === "/admin/chapters",
    title: "Main chapters",
    description: "Chapters published for each grade.",
  },
  {
    match: (pathname) =>
      pathname === "/admin/students/progress" || pathname.startsWith("/admin/students/progress/"),
    title: "Student progress",
    description: "Track course completion and view hours for each student.",
  },
  {
    match: (pathname) => pathname === "/admin/students" || pathname.startsWith("/admin/students/"),
    title: "All students",
    description: "Student accounts that joined Betasoft LMS.",
  },
  {
    match: (pathname) =>
      pathname === "/admin/payments/confirmations" ||
      pathname.startsWith("/admin/payments/confirmations/"),
    title: "Payment confirmations",
    description: "Review uploaded slips and confirm bank payments.",
  },
  {
    match: (pathname) => pathname === "/admin/payments" || pathname.startsWith("/admin/payments/"),
    title: "Overall payments",
    description: "All course payment vouchers and statuses.",
  },
  {
    match: (pathname) => pathname === "/admin",
    title: "Dashboard",
    description: "Overview of students and chapters.",
  },
];
const iconButtonClass =
  "cursor-pointer rounded-xl p-2 text-[#5C6B61] transition hover:bg-white/70 hover:text-[#142319]";

function pageHeading(pathname: string) {
  return pageMeta.find((page) => page.match(pathname)) ?? {
    title: "Admin",
    description: "Betasoft LMS",
  };
}

function isActive(pathname: string, href: string) {
  if (href === "/admin") {
    return pathname === "/admin";
  }
  if (href === "/admin/payments") {
    return pathname === "/admin/payments";
  }
  if (href === "/admin/students") {
    return pathname === "/admin/students";
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

function adminBackHref(pathname: string): string | null {
  if (pathname === "/admin") {
    return null;
  }
  if (pathname.startsWith("/admin/payments/confirmations")) {
    return "/admin/payments";
  }
  if (pathname.startsWith("/admin/students/progress")) {
    return "/admin/students";
  }
  if (pathname.startsWith("/admin/payments")) {
    return "/admin";
  }
  if (pathname.startsWith("/admin/settings/")) {
    return "/admin";
  }
  if (
    pathname.startsWith("/admin/chapters") ||
    pathname.startsWith("/admin/sub-chapters") ||
    pathname.startsWith("/admin/sub-chapter-videos") ||
    pathname.startsWith("/admin/students")
  ) {
    return "/admin";
  }
  return "/admin";
}

function NavLink({
  href,
  label,
  icon: Icon,
  active,
  nested = false,
  collapsed = false,
}: {
  href: string;
  label: string;
  icon: LucideIcon;
  active: boolean;
  nested?: boolean;
  collapsed?: boolean;
}) {
  return (
    <Link
      href={href}
      title={label}
      aria-current={active ? "page" : undefined}
      className={`group flex items-center rounded-xl text-sm font-semibold transition ${
        collapsed ? "justify-center px-2 py-1.5" : `gap-2.5 px-2.5 py-1.5 ${nested ? "ml-1" : ""}`
      } ${
        active
          ? "bg-[#109e44] text-white"
          : "text-white/75 hover:bg-white/10 hover:text-white"
      }`}
    >
      <span
        className={`flex h-6 w-6 items-center justify-center rounded-lg transition ${
          active ? "bg-white/20 text-white" : "bg-white/10 text-white/70 group-hover:text-white"
        }`}
      >
        <Icon className="h-3.5 w-3.5" />
      </span>
      {collapsed ? <span className="sr-only">{label}</span> : label}
    </Link>
  );
}

function CollapsibleSection({
  pathname,
  collapsed,
  label,
  icon: SectionIcon,
  items,
  open,
  onToggle,
}: {
  pathname: string;
  collapsed: boolean;
  label: string;
  icon: LucideIcon;
  items: { href: string; label: string; icon: LucideIcon }[];
  open: boolean;
  onToggle: () => void;
}) {
  const childActive = items.some((tab) => isActive(pathname, tab.href));

  if (collapsed) {
    return (
      <div className="space-y-1">
        {items.map((tab) => (
          <NavLink
            key={tab.href}
            href={tab.href}
            label={tab.label}
            icon={tab.icon}
            active={isActive(pathname, tab.href)}
            collapsed
          />
        ))}
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-1.5 shadow-inner">
      <button
        type="button"
        aria-expanded={open}
        onClick={onToggle}
        className={`group flex w-full cursor-pointer items-center gap-2.5 rounded-xl px-2.5 py-1.5 text-sm font-semibold transition hover:bg-white/10 ${
          childActive ? "text-white" : "text-white/75 hover:text-white"
        }`}
      >
        <span
          className={`flex h-6 w-6 items-center justify-center rounded-lg transition ${
            childActive ? "bg-white/15 text-white" : "bg-white/10 text-white/70 group-hover:text-white"
          }`}
        >
          <SectionIcon className="h-3.5 w-3.5" />
        </span>
        {label}
        <ChevronDown
          className={`ml-auto h-3.5 w-3.5 transition-transform duration-300 ease-out motion-reduce:transition-none ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>
      <div
        className={`grid transition-[grid-template-rows] duration-300 ease-out motion-reduce:transition-none ${
          open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        }`}
      >
        <div className="overflow-hidden" inert={open ? undefined : true}>
          <div
            className={`space-y-1 pt-1 transition-opacity duration-300 ease-out motion-reduce:transition-none ${
              open ? "opacity-100" : "opacity-0"
            }`}
          >
            {items.map((tab) => (
              <NavLink
                key={tab.href}
                href={tab.href}
                label={tab.label}
                icon={tab.icon}
                active={isActive(pathname, tab.href)}
                nested
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) {
    return "A";
  }
  return parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function subscribeFullscreen(onChange: () => void) {
  document.addEventListener("fullscreenchange", onChange);
  return () => document.removeEventListener("fullscreenchange", onChange);
}

function subscribeClock(onChange: () => void) {
  const id = window.setInterval(onChange, 1000);
  return () => window.clearInterval(id);
}

function formatClock() {
  return new Date().toLocaleTimeString("en-LK", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
  });
}

function AdminFooter() {
  const time = useSyncExternalStore(subscribeClock, formatClock, () => "");

  return (
    <footer className="grid grid-cols-[6.5rem_1fr_6.5rem] items-center border-t border-[#E2E9E4] px-4 py-2 text-[11px] text-[#5C6B61]">
      <span />
      <p className="text-center">
        Designed and developed by <span className="font-semibold text-[#f37021]">Shan M</span>
      </p>
      <time className="text-right tabular-nums">{time}</time>
    </footer>
  );
}

function SidebarBrand({ collapsed }: { collapsed: boolean }) {
  return (
    <Link
      href="/admin"
      title="BetasoftLMS"
      className={`flex items-center px-1 text-left ${collapsed ? "justify-center" : "gap-3"}`}
    >
      <span className="flex shrink-0 rounded-full bg-white p-1">
        <Image
          src="/main_logo.png"
          alt="Betasoft logo"
          width={40}
          height={40}
          className="h-10 w-10 rounded-full object-cover"
        />
      </span>
      {collapsed ? (
        <span className="sr-only">BetasoftLMS</span>
      ) : (
        <span className="min-w-0 text-lg font-extrabold leading-none tracking-tight text-white">
          Betasoft<span className="text-[#109e44]">LMS</span>
        </span>
      )}
    </Link>
  );
}

function Brand() {
  return (
    <Link href="/admin" className="flex min-w-0 items-center gap-2.5">
      <span className="flex shrink-0 rounded-full bg-white p-0.5 shadow-sm ring-1 ring-[#E2E9E4]">
        <Image
          src="/main_logo.png"
          alt="Betasoft logo"
          width={36}
          height={36}
          className="h-9 w-9 rounded-full object-cover"
        />
      </span>
      <span className="truncate text-base font-extrabold tracking-tight text-[#142319]">
        Betasoft<span className="text-[#109e44]">LMS</span>
      </span>
    </Link>
  );
}

function FullscreenButton() {
  const isFullscreen = useSyncExternalStore(
    subscribeFullscreen,
    () => document.fullscreenElement !== null,
    () => false,
  );
  const label = isFullscreen ? "Exit full screen" : "Full screen";

  function toggle() {
    if (document.fullscreenElement) {
      void document.exitFullscreen();
      return;
    }
    void document.documentElement.requestFullscreen().catch(() => {});
  }

  return (
    <button type="button" onClick={toggle} aria-label={label} title={label} className={iconButtonClass}>
      {isFullscreen ? <Minimize className="h-5 w-5" /> : <Maximize className="h-5 w-5" />}
    </button>
  );
}

const sidebarSections = [
  { id: "Overview", label: "Overview", icon: LayoutGrid, items: overviewTabs },
  { id: "Students", label: "Students", icon: Users, items: studentTabs },
  { id: "Chapters", label: "Chapters", icon: BookOpen, items: chapterTabs },
  { id: "Payments", label: "Payments", icon: Wallet, items: paymentTabs },
  { id: "Settings", label: "Settings", icon: Settings, items: settingsTabs },
] as const;

function activeSidebarSection(pathname: string): string | null {
  for (const section of sidebarSections) {
    if (section.items.some((tab) => isActive(pathname, tab.href))) {
      return section.id;
    }
  }
  return null;
}

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [openSection, setOpenSection] = useState<string | null>(() => activeSidebarSection(pathname));
  const heading = pageHeading(pathname);
  const backHref = adminBackHref(pathname);

  useEffect(() => {
    currentUser().then((signedIn) => {
      if (!signedIn || !signedIn.roles.includes("admin")) {
        router.replace("/login/admin");
        return;
      }
      setUser(signedIn);
    });
  }, [router]);

  useEffect(() => {
    const active = activeSidebarSection(pathname);
    if (active) {
      setOpenSection(active);
    }
  }, [pathname]);

  async function signOut() {
    await logout();
    router.replace("/login/admin");
  }

  function toggleSection(id: string) {
    setOpenSection((current) => (current === id ? null : id));
  }

  if (!user) {
    return (
      <div className="admin-mesh-bg flex min-h-screen items-center justify-center text-sm text-[#5C6B61]">
        Checking admin session...
      </div>
    );
  }

  return (
    <div className="admin-mesh-bg flex min-h-screen">
      <aside
        className={`sticky top-0 hidden h-screen shrink-0 flex-col border-r border-[#03150d] bg-[#062015] p-4 transition-[width] duration-300 ease-out motion-reduce:transition-none lg:flex ${
          sidebarCollapsed ? "w-[4.75rem]" : "w-64"
        }`}
      >
        <div className={`flex px-1 ${sidebarCollapsed ? "justify-center" : "justify-center"}`}>
          <SidebarBrand collapsed={sidebarCollapsed} />
        </div>
        <div className="my-4 h-0.5 w-full rounded-full bg-[#109e44]" aria-hidden="true" />
        <nav aria-label="Admin sections" className="space-y-2">
          {sidebarSections.map((section) => (
            <CollapsibleSection
              key={section.id}
              pathname={pathname}
              collapsed={sidebarCollapsed}
              label={section.label}
              icon={section.icon}
              items={[...section.items]}
              open={openSection === section.id}
              onToggle={() => toggleSection(section.id)}
            />
          ))}
        </nav>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-40 border-b border-[#E2E9E4]/80 bg-white/70 backdrop-blur-md">
          <div className="flex h-16 items-center justify-between gap-3 px-4 sm:px-6">
            <div className="flex min-w-0 items-center gap-2 sm:gap-3">
              <button
                type="button"
                className={`${iconButtonClass} hidden lg:inline-flex`}
                aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
                title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
                onClick={() => setSidebarCollapsed((current) => !current)}
              >
                {sidebarCollapsed ? <PanelLeftOpen className="h-5 w-5" /> : <PanelLeftClose className="h-5 w-5" />}
              </button>

              <div className="lg:hidden">
                <Brand />
              </div>

              {backHref ? (
                <Link
                  href={backHref}
                  className="inline-flex shrink-0 items-center gap-1 rounded-xl px-2 py-1.5 text-sm font-semibold text-[#109e44] transition hover:bg-[#109e44]/10 hover:text-[#0c7d36]"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span className="hidden sm:inline">Back</span>
                </Link>
              ) : null}

              <div className="hidden min-w-0 lg:block">
                <h1 className="truncate text-base font-bold text-[#142319]">{heading.title}</h1>
                <p className="truncate text-xs text-[#5C6B61]">{heading.description}</p>
              </div>
            </div>

            <div className="ml-auto flex items-center gap-2 sm:gap-3">
              <FullscreenButton />
              <span className="flex items-center gap-2.5">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#109e44] text-xs font-bold text-white shadow-[0_8px_20px_rgba(16,158,68,0.35)]">
                  {initials(user.name)}
                </span>
                <span className="hidden flex-col leading-tight md:flex">
                  <span className="text-sm font-semibold text-[#142319]">{user.name}</span>
                  <span className="text-xs font-medium text-[#5C6B61]">Admin</span>
                </span>
              </span>
              <button type="button" aria-label="Log out" title="Log out" className={iconButtonClass} onClick={signOut}>
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          </div>

          <div className="border-t border-[#E2E9E4] px-4 py-2 lg:hidden sm:px-6">
            <h1 className="text-base font-bold text-[#142319]">{heading.title}</h1>
            <p className="text-xs text-[#5C6B61]">{heading.description}</p>
          </div>

          <div className="border-t border-[#E2E9E4] lg:hidden">
            <nav aria-label="Admin sections" className="flex gap-1 overflow-x-auto px-4 py-2 sm:px-6">
              {[...overviewTabs, ...studentTabs, ...chapterTabs, ...paymentTabs, ...settingsTabs].map((tab) => {
                const active = isActive(pathname, tab.href);
                const Icon = tab.icon;
                return (
                  <Link
                    key={tab.href}
                    href={tab.href}
                    aria-current={active ? "page" : undefined}
                    className={`flex shrink-0 items-center gap-2 rounded-xl px-3 py-1.5 text-sm font-semibold transition ${
                      active
                        ? "bg-[#109e44] text-white"
                        : "text-[#5C6B61] hover:bg-white hover:text-[#142319]"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {tab.label}
                  </Link>
                );
              })}
            </nav>
          </div>
          <TopLoadingBar />
        </header>

        <main className="min-w-0 flex-1">{children}</main>
        <AdminFooter />
      </div>
    </div>
  );
}
